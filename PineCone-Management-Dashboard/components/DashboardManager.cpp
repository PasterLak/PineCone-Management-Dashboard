#include "DashboardManager.hpp"

extern "C" {
#include <stdio.h>
}

#include "../extentions/Print.hpp"

DashboardManager::DashboardManager(WLANHandler& wlan_handler,
                                   const char* server_ip, uint16_t server_port,
                                   float update_interval_sec)
    : wlan(wlan_handler),
      server_ip(server_ip),
      server_port(server_port),
      update_interval_sec(update_interval_sec),
      time_accumulator(0.0f),
      connected(false) {}

bool DashboardManager::update(float delta_time_sec) {
  time_accumulator += delta_time_sec;

  if (time_accumulator < update_interval_sec) {
    return connected;
  }

  time_accumulator = 0.0f;

  Printer printer;
  bool wifi_connected = wlan.isConnected();
  printer.printl("WiFi Connected:", wifi_connected);

  if (!wifi_connected) {
    connected = false;
    return false;
  }

  sendDataToDashboard();
  connected = wlan.is_dashboard_connected();

  printer.printl("Dashboard Connected:", connected);

  if (connected) {
    logDashboardInfo();
  }

  return connected;
}

bool DashboardManager::shouldBlink() const {
  return connected && wlan.is_blinking();
}

void DashboardManager::sendDataToDashboard() {
  Printer printer;
  printer.printl("Sending data to dashboard...");
  wlan.sendData(server_ip, server_port);
}

void DashboardManager::logDashboardInfo() {
  if (wlan.get_node_id()[0] == '\0') {
    return;
  }

  Printer printer;
  printer.printl("Node ID:", wlan.get_node_id());
  printer.printl("Description:", wlan.get_description());

  if (wlan.is_blinking()) {
    printer.printl("Blinking: true");
  }
}
