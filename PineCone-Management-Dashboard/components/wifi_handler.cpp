#include "wifi_handler.hpp"

extern "C" {
#include <easyflash.h>
#include <event_device.h>
#include <hal_wifi.h>
#include <stdio.h>
#include <vfs.h>
}

WIFIHandler::WIFIHandler(const char* mySsid, const char* myPassword)
    : ssid(mySsid), password(myPassword) {}

void WIFIHandler::initNodeIdFromMac() {
  uint8_t mac[6];
  wifi_mgmr_sta_mac_get(mac);

  snprintf(node_id, sizeof(node_id), "mac-%02x%02x%02x%02x%02x%02x", mac[0],
           mac[1], mac[2], mac[3], mac[4], mac[5]);
}

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
  wifi_mgmr_sta_connect(&wifi_interface, (char*)ssid, (char*)password, nullptr,
                        0, 0, 0);
  wifi_mgmr_sta_autoconnect_enable();
}

bool WIFIHandler::isConnected() {
  int state;
  wifi_mgmr_state_get(&state);
  return (state == 4);
}

char* WIFIHandler::get_ip_address() {
  uint32_t ip, mask;
  wifi_mgmr_ap_ip_get(&ip, nullptr, &mask);

  struct in_addr ip_addr;
  ip_addr.s_addr = ip;

  return inet_ntoa(ip_addr);
}

bool WIFIHandler::sendData(const char* server_ip, uint16_t port,
                           const char* pins_json) {
  if (!pins_json) {
      return false;
  }

  const bool sending_full_sync = force_full_sync_next;
  if (sending_full_sync) {
    force_full_sync_next = false;
  }

  const bool desc_changed = (strcmp(description, last_sent_description) != 0);
  const bool pins_changed = (strcmp(pins_json, last_sent_pins_json) != 0);
  const bool send_only_node_id = (!startup_handshake_done && !sending_full_sync);

  const bool send_desc = !send_only_node_id && (sending_full_sync || desc_changed);
  const bool send_pins = !send_only_node_id && (sending_full_sync || pins_changed);

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

  if (!http_client.post(server_ip, port, "/api/data", payload)) {
    last_request_successful = false;
    return false;
  }

  const char* response_body = http_client.getResponseBody();
  if (!response_body) {
    last_request_successful = false;
    return false;
  }

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

void WIFIHandler::parseServerResponse(const char* json) {
  if (!JSONParser::isStatusOk(json)) {
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
  }
}