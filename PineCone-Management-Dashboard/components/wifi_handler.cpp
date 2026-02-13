#include "wifi_handler.hpp"

extern "C" {
#include <easyflash.h>
#include <event_device.h>
#include <hal_wifi.h>
#include <stdio.h>
#include <vfs.h>

#include "pins.hpp"
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

void WIFIHandler::buildPinsJson(PinsManager& pinsManager, char* buffer, size_t buffer_size) {
    if (!buffer || buffer_size == 0) {
        return;
    }

    int pos = 0;
    pos += snprintf(buffer + pos, buffer_size - pos, "{");

    bool first_pin = true;
    for (uint8_t pin = 0; pin < MAX_PINS; pin++) {
        if (!pinsManager.isConfigured(pin)) {
            continue;
        }

        const char* value_str = pinsManager.getValueString(pin);
        const char* mode = pinsManager.getModeString(pin);
        const char* name = pinsManager.getName(pin);

        if (!first_pin) {
            pos += snprintf(buffer + pos, buffer_size - pos, ",");
        }
        first_pin = false;

        pos += snprintf(buffer + pos, buffer_size - pos,
                        "\"GPIO%d\":{\"name\":\"%s\",\"mode\":\"%s\",\"value\":\"%s\"}",
                        pin, name, mode, value_str);

        if (pos >= (int)buffer_size - 100) {
            char warn[128];
            snprintf(warn, sizeof(warn), "[NET] Pins JSON buffer nearly full, stopping at pin %d", pin);
            log(warn);
            break;
        }
    }

    snprintf(buffer + pos, buffer_size - pos, "}");
}

// ===== PUBLIC: Send data to server via HTTP =====
bool WIFIHandler::sendData(const char* server_ip, uint16_t port,  PinsManager& pinsManager) {
    if (debug_enabled) {
        char msg[128];
        snprintf(msg, sizeof(msg), "[NET] sendData() called for %s:%d", server_ip, port);
        log(msg);
    }

    const bool sending_full_sync = force_full_sync_next;
    if (sending_full_sync) {
        force_full_sync_next = false;
    }

    char pins_json[768];
    buildPinsJson(pinsManager, pins_json, sizeof(pins_json));

    const bool desc_changed = (strcmp(description, last_sent_description) != 0);
    const bool pins_changed = (strcmp(pins_json, last_sent_pins_json) != 0);
    const bool send_only_node_id = (!startup_handshake_done && !sending_full_sync);

    const bool send_desc = !send_only_node_id && (sending_full_sync || desc_changed);
    const bool send_pins = !send_only_node_id && (sending_full_sync || pins_changed);

    char delta_msg[160];
    snprintf(delta_msg, sizeof(delta_msg),
             "[NET] delta full_sync=%d desc_changed=%d pins_changed=%d send_desc=%d send_pins=%d",
             sending_full_sync ? 1 : 0,
             desc_changed ? 1 : 0,
             pins_changed ? 1 : 0,
             send_desc ? 1 : 0,
             send_pins ? 1 : 0);
    printf("%s\r\n", delta_msg);

    char payload[1200];
    int pos = 0;

    pos += snprintf(payload + pos, sizeof(payload) - pos, "{\"node_id\":\"%s\"", node_id);

    if (sending_full_sync) {
        pos += snprintf(payload + pos, sizeof(payload) - pos, ",\"full_sync\":true");
    }

    if (send_desc) {
        pos += snprintf(payload + pos, sizeof(payload) - pos, ",\"description\":\"%s\"", description);
    }

    if (send_pins) {
        pos += snprintf(payload + pos, sizeof(payload) - pos, ",\"pins\":%s", pins_json);
    }

    pos += snprintf(payload + pos, sizeof(payload) - pos, "}");

    printf("[NET] POST /api/data payload:\r\n");
    printf("%s\r\n", payload);
    printf("[NET] Payload prepared, calling http_client.post()...\r\n");

    if (!http_client.post(server_ip, port, "/api/data", payload)) {
        printf("[NET] http_client.post() returned false\r\n");
        last_request_successful = false;
        return false;
    }

    printf("[NET] http_client.post() succeeded, getting response body...\r\n");

    const char* response_body = http_client.getResponseBody();
    if (!response_body) {
        printf("[NET] ERROR: No response body\r\n");
        last_request_successful = false;
        return false;
    }

    printf("[NET] /api/data response:\r\n");
    printf("%s\r\n", response_body);

    parseServerResponse(response_body);
    last_request_successful = true;

    if (!startup_handshake_done) {
        startup_handshake_done = true;
        snprintf(last_sent_description, sizeof(last_sent_description), "%s", description);
        snprintf(last_sent_pins_json, sizeof(last_sent_pins_json), "%s", pins_json);
        return true;
    }

    if (send_desc) {
        snprintf(last_sent_description, sizeof(last_sent_description), "%s", description);
    }

    if (send_pins) {
        snprintf(last_sent_pins_json, sizeof(last_sent_pins_json), "%s", pins_json);
    }

    return true;
}

// ===== PRIVATE: Parse server JSON response =====
void WIFIHandler::parseServerResponse(const char* json) {
    if (!JSONParser::isStatusOk(json)) {
        log("[NET] ERROR: Status not OK");
        return;
    }

    char parsed_node_id[64];
    if (JSONParser::getString(json, "node_id", parsed_node_id, sizeof(parsed_node_id))) {
        snprintf(node_id, sizeof(node_id), "%s", parsed_node_id);
    }

    char parsed_description[128];
    if (JSONParser::getString(json, "description", parsed_description, sizeof(parsed_description))) {
        snprintf(description, sizeof(description), "%s", parsed_description);
    }
    JSONParser::getBool(json, "blink", should_blink);

    bool force_full_sync = false;
    JSONParser::getBool(json, "force_full_sync", force_full_sync);
    if (force_full_sync) {
        force_full_sync_next = true;
        printf("[NET] Server requested full sync.\r\n");
    }

    if (debug_enabled) {
        if (node_id[0] != '\0') log("[NET] Node ID updated.");
        if (description[0] != '\0') log("[NET] Description updated.");
        if (should_blink) log("[NET] *** BLINK MODE ACTIVE ***");
    }
}
