#pragma once

#include <stdio.h>
#include <string.h>

extern "C" {
#include <FreeRTOS.h>
#include <task.h>
#include <wifi_mgmr_ext.h>
}

#include "HTTPClient.hpp"
#include "JSONParser.hpp"

class WLANHandler {
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

  void initNodeIdFromMac();
  void buildPinsJson(char* buffer, size_t buffer_size);
  void parseServerResponse(const char* json);

 public:
  WLANHandler(const char* mySsid, const char* myPassword);

  void start();
  bool isConnected();
  char* get_ip_address();

  bool sendData(const char* server_ip, uint16_t port = 5000);

  // Getters for device info
  const char* get_node_id() const { return node_id; }
  const char* get_description() const { return description; }
  bool is_blinking() const { return should_blink; }
  bool is_dashboard_connected() const { return last_request_successful; }
};
