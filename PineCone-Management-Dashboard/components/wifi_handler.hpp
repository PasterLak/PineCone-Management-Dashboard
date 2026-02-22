#pragma once

#include <stdio.h>
#include <string.h>

extern "C" {
#include <FreeRTOS.h>
#include <task.h>
#include <wifi_mgmr_ext.h>
}

#include "http_client.hpp"
#include "extentions/log.hpp"

class WIFIHandler {
 public:
  WIFIHandler(const char* mySsid, const char* myPassword);

  void start();
  bool isConnected();
  char* get_ip_address();
  HTTPClient& get_http_client() { return http_client; }
  
  bool sendData(const char* server_ip, uint16_t port, const char* pins_json);

  void setDebugEnabled(bool enabled) {
    debug_enabled = enabled;
    http_client.setDebugEnabled(enabled);
  }

  const char* get_node_id() const { return node_id; }
  const char* get_description() const { return description; }
  bool is_blinking() const { return should_blink; }
  bool is_dashboard_connected() const { return last_request_successful; }

 private:
  const char* ssid;
  const char* password;
  bool wifi_initialized = false;

  HTTPClient http_client;

  // device info from server
  char node_id[64] = "";
  char description[128] = "";
  char last_sent_description[128] = "";
  char last_sent_pins_json[768] = "{}";
  bool should_blink = false;
  bool force_full_sync_next = false;
  bool startup_handshake_done = false;
  bool last_request_successful = false;
  bool debug_enabled = true;

  void initNodeIdFromMac();
  void parseServerResponse(const char* json);

  void log(const char* message) const {
    if (debug_enabled) {
      Log::println(message);
    }
  }
};