#include "wifi_handler.hpp"

extern "C" {
#include <easyflash.h>
#include <event_device.h>
#include <hal_wifi.h>
#include <vfs.h>

#include "pins.h"
}

// Constructor: store SSID and password
WIFIHandler::WIFIHandler(const char* mySsid, const char* myPassword)
    : ssid(mySsid), password(myPassword) {}

// ===== PRIVATE: Initialize node_id from MAC =====
void WIFIHandler::initNodeIdFromMac() {
    uint8_t mac[6];
    wifi_mgmr_sta_mac_get(mac);

    snprintf(node_id, sizeof(node_id), "mac-%02x%02x%02x%02x%02x%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    log("[WIFI] Initial Node ID from MAC set.");
}

// ===== PUBLIC: Start WiFi =====
void WIFIHandler::start() {
    if (!wifi_initialized) {
        static wifi_conf_t conf{.country_code = "EU", .channel_nums = {}};

        easyflash_init();
        vfs_init();
        vfs_device_init();

        hal_wifi_start_firmware_task();
        vTaskDelay(pdMS_TO_TICKS(500));
        wifi_mgmr_start_background(&conf);

        wifi_initialized = true;

        if (node_id[0] == '\0') {
            initNodeIdFromMac();
        }
    }

    auto wifi_interface = wifi_mgmr_sta_enable();
    wifi_mgmr_sta_connect(&wifi_interface, (char*)ssid, (char*)password, nullptr, 0, 0, 0);
    wifi_mgmr_sta_autoconnect_enable();

    log("[WIFI] WiFi start completed.");
}

// ===== PUBLIC: Check if WiFi is connected =====
bool WIFIHandler::isConnected() {
    int state;
    wifi_mgmr_state_get(&state);
    bool connected = (state == 4);

    if (debug_enabled) {
        char msg[128];
        snprintf(msg, sizeof(msg), "[WIFI] State: %d (%s) - %s",
                 state, wifi_mgmr_status_code_str(state),
                 connected ? "Connected" : "Not Connected");
        log(msg);
    }

    return connected;
}

// ===== PUBLIC: Get device IP address =====
char* WIFIHandler::get_ip_address() {
    uint32_t ip, mask;
    wifi_mgmr_ap_ip_get(&ip, nullptr, &mask);

    struct in_addr ip_addr;
    ip_addr.s_addr = ip;

    return inet_ntoa(ip_addr);
}

// ===== PUBLIC: Send data to server via HTTP =====
bool WIFIHandler::sendData(const char* server_ip, uint16_t port) {
    if (debug_enabled) {
        char msg[128];
        snprintf(msg, sizeof(msg), "[NET] sendData() called for %s:%d", server_ip, port);
        log(msg);
    }

    char payload[1024];
    int pos = 0;

    pos += snprintf(payload + pos, sizeof(payload) - pos,
                    "{\"node_id\":\"%s\",\"description\":\"%s\",\"pins\":{",
                    node_id, description);

    bool first_pin = true;
    for (uint8_t pin = 0; pin < MAX_PINS; pin++) {
        if (isPinConfigured(pin)) {
            const char* value_str = getPinValueString(pin);
            const char* mode = getPinModeString(pin);
            const char* name = getPinName(pin);

            if (!first_pin) pos += snprintf(payload + pos, sizeof(payload) - pos, ",");
            first_pin = false;

            pos += snprintf(payload + pos, sizeof(payload) - pos,
                            "\"GPIO%d\":{\"name\":\"%s\",\"mode\":\"%s\",\"value\":\"%s\"}",
                            pin, name, mode, value_str);

            if (pos >= (int)sizeof(payload) - 100) {
                char warn[128];
                snprintf(warn, sizeof(warn), "[NET] Payload buffer nearly full, stopping at pin %d", pin);
                log(warn);
                break;
            }
        }
    }

    pos += snprintf(payload + pos, sizeof(payload) - pos, "}}");

    log("[NET] Payload prepared, calling http_client.post()...");

    if (!http_client.post(server_ip, port, "/api/data", payload)) {
        log("[NET] http_client.post() returned false");
        last_request_successful = false;
        return false;
    }

    log("[NET] http_client.post() succeeded, getting response body...");

    const char* response_body = http_client.getResponseBody();
    if (!response_body) {
        log("[NET] ERROR: No response body");
        last_request_successful = false;
        return false;
    }

    parseServerResponse(response_body);
    last_request_successful = true;
    return true;
}

// ===== PRIVATE: Parse server JSON response =====
void WIFIHandler::parseServerResponse(const char* json) {
    if (!JSONParser::isStatusOk(json)) {
        log("[NET] ERROR: Status not OK");
        return;
    }

    JSONParser::getString(json, "node_id", node_id, sizeof(node_id));
    JSONParser::getString(json, "description", description, sizeof(description));
    JSONParser::getBool(json, "blink", should_blink);

    if (debug_enabled) {
        if (node_id[0] != '\0') log("[NET] Node ID updated.");
        if (description[0] != '\0') log("[NET] Description updated.");
        if (should_blink) log("[NET] *** BLINK MODE ACTIVE ***");
    }
}
