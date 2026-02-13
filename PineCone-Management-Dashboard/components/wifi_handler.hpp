#pragma once

#include <stdio.h>
#include <string.h>

extern "C" {
#include <FreeRTOS.h>
#include <task.h>
#include <wifi_mgmr_ext.h>
}

#include "components/pins_manager.hpp"
#include "http_client.hpp"
#include "json_parser.hpp"
#include "extentions/log.hpp"

class WIFIHandler {
private:
    const char* ssid;
    const char* password;
    bool wifi_initialized = false;

    HTTPClient http_client;

    // Device info from server
    char node_id[64] = "";
    char description[128] = "";
    bool should_blink = false;
    bool last_request_successful = false;
    bool debug_enabled = true;

    void initNodeIdFromMac();
    void buildPinsJson(char* buffer, size_t buffer_size);
    void parseServerResponse(const char* json);

    void log(const char* message) const {
            if (debug_enabled) {
                Log::println(message);
            }
        }

public:
    WIFIHandler(const char* mySsid, const char* myPassword);

    void start();
    bool isConnected();
    char* get_ip_address();
    HTTPClient& get_http_client() { return http_client; }
    bool sendData(const char* server_ip, uint16_t port,  PinsManager& pinsManager);

    void setDebugEnabled(bool enabled) {
        debug_enabled = enabled;
        http_client.setDebugEnabled(enabled);
    }

    // Getters for device info
    const char* get_node_id() const { return node_id; }
    const char* get_description() const { return description; }
    bool is_blinking() const { return should_blink; }
    bool is_dashboard_connected() const { return last_request_successful; }
};
