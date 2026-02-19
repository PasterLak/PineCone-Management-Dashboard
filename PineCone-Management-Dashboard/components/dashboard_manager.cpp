#include "dashboard_manager.hpp"

#include "../extentions/log.hpp"
#include "components/json_pins_formatter.hpp"
#include "components/pins_serializer.hpp"

extern "C" {
#include <stdio.h>
}

DashboardManager::DashboardManager(WIFIHandler& wlan_handler,
                                   PinsManager& pinsManager,
                                   const char* server_ip, uint16_t server_port,
                                   float update_interval_sec)
    : wlan(wlan_handler),
      _pinsManager(pinsManager),
      server_ip(server_ip),
      server_port(server_port),
      update_interval_sec(update_interval_sec),
      time_accumulator(0.0f),
      connected(false) {}

bool DashboardManager::update(float delta_time_sec) {
  if (delta_time_sec <= 0.0f) {
    return connected;
  }

  time_accumulator += delta_time_sec;
  if (time_accumulator < update_interval_sec) {
    return connected;
  }

  time_accumulator -= update_interval_sec;

  const bool wifi_connected = wlan.isConnected();

  if (!wifi_connected) {
    connected = false;
    return false;
  }

  sendDataToDashboard();

  connected = wlan.is_dashboard_connected();

  if (connected) {
    logDashboardInfo();
  }

  return connected;
}

bool DashboardManager::shouldBlink() const {
  return connected && wlan.is_blinking();
}

void DashboardManager::sendDataToDashboard() {
  if (!server_ip || server_ip[0] == '\0' || server_port == 0) {
    return;
  }

  JsonPinsFormatter jsonFormatter;
  PinsSerializer serializer(jsonFormatter);

  char pins_json[768];
  serializer.serialize(_pinsManager, pins_json, sizeof(pins_json));

  wlan.sendData(server_ip, server_port, pins_json);
}

void DashboardManager::logDashboardInfo() {
  const char* node_id = wlan.get_node_id();
  if (!node_id || node_id[0] == '\0') {
    return;
  }

  const char* desc = wlan.get_description();
  if (desc && desc[0] != '\0') {
    (void)desc; 
  }
}