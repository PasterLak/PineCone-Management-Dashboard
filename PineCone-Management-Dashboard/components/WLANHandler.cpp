#include "WLANHandler.hpp"

extern "C" {
#include <easyflash.h>
#include <event_device.h>
#include <hal_wifi.h>
#include <vfs.h>
}

// ============================================================================
// Constructor
// ============================================================================

WLANHandler::WLANHandler(const char* mySsid, const char* myPassword)
    : ssid(mySsid), password(myPassword) {}

// ============================================================================
// WiFi Management
// ============================================================================

void WLANHandler::initNodeIdFromMac() {
  uint8_t mac[6];
  wifi_mgmr_sta_mac_get(mac);

  // Format MAC as: "mac-AABBCCDDEEFF"
  snprintf(node_id, sizeof(node_id), "mac-%02x%02x%02x%02x%02x%02x", mac[0],
           mac[1], mac[2], mac[3], mac[4], mac[5]);

  printf("[WIFI] Initial Node ID from MAC: '%s'\r\n", node_id);
}

void WLANHandler::start() {
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

  wifi_mgmr_sta_connect(&wifi_interface, (char*)ssid, (char*)password, nullptr,
                        0, 0, 0);

  wifi_mgmr_sta_autoconnect_enable();
}

bool WLANHandler::isConnected() {
  int state;
  wifi_mgmr_state_get(&state);

  // Only return true when State 4 = Connected with IP (IPOK)
  // State 3 = Still obtaining IP, not ready for network traffic
  bool connected = (state == 4);

  printf("[WIFI] State: %d (%s) - %s\r\n", state,
         wifi_mgmr_status_code_str(state),
         connected ? "Connected" : "Not Connected");

  return connected;
}

char* WLANHandler::get_ip_address() {
  uint32_t ip, mask;
  wifi_mgmr_ap_ip_get(&ip, nullptr, &mask);

  struct in_addr ip_addr;
  ip_addr.s_addr = ip;

  return inet_ntoa(ip_addr);
}

// ============================================================================
// HTTP Communication
// ============================================================================

bool WLANHandler::sendData(const char* server_ip, uint16_t port) {
  printf("[NET] sendData() called for %s:%d\r\n", server_ip, port);

  // TODO: Hier später die Pin-Werte hinzufügen
  char payload[512];
  snprintf(payload, sizeof(payload),
           "{\"node_id\":\"%s\",\"description\":\"%s\",\"pins\":{}}", node_id,
           description);

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

  printf("[NET] Response body received, parsing...\r\n");
  parseServerResponse(response_body);
  last_request_successful = true;
  return true;
}

// ============================================================================
// Private Helper Methods
// ============================================================================

void WLANHandler::parseServerResponse(const char* json) {
  // Parse status
  if (!JSONParser::isStatusOk(json)) {
    printf("[NET] ERROR: Status not OK\r\n");
    return;
  }

  // Parse device info
  JSONParser::getString(json, "node_id", node_id, sizeof(node_id));
  JSONParser::getString(json, "description", description, sizeof(description));
  JSONParser::getBool(json, "blink", should_blink);

  // Debug output
  if (node_id[0] != '\0') {
    printf("[NET] Node ID: '%s'\r\n", node_id);
  }
  if (description[0] != '\0') {
    printf("[NET] Description: '%s'\r\n", description);
  }
  if (should_blink) {
    printf("[NET] *** BLINK MODE ACTIVE ***\r\n");
  }
}