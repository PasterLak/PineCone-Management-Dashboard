
extern "C" {
#include <stdio.h>
}
#include "dashboard_manager.hpp"
#include "../extentions/log.hpp"

DashboardManager::DashboardManager(WIFIHandler& wlan_handler,
                                   const char* server_ip, uint16_t server_port,
                                   float update_interval_sec)
    : wlan(wlan_handler),
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
  log("[DashboardManager] WiFi Connected:", wifi_connected);

  if (!wifi_connected) {
    connected = false;
    return false;
  }

  sendDataToDashboard();

  connected = wlan.is_dashboard_connected();
  log("[DashboardManager] Dashboard Connected:", connected);

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

  log("[DashboardManager] Sending data to dashboard...");
  wlan.sendData(server_ip, server_port);
}

void DashboardManager::logDashboardInfo() {
  const char* node_id = wlan.get_node_id();
  if (!node_id || node_id[0] == '\0') {
    return;
  }

  log("[DashboardManager] Node ID:", node_id);

  const char* desc = wlan.get_description();
  if (desc && desc[0] != '\0') {
    log("[DashboardManager] Description:", desc);
  }

  if (wlan.is_blinking()) {
    log("[DashboardManager] Blinking: true");
  }
}
