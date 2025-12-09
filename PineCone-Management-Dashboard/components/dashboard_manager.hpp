#pragma once

#include "wifi_handler.hpp"

// Manages dashboard communication and state
class DashboardManager {
 public:
  DashboardManager(WIFIHandler& wlan_handler, const char* server_ip,
                   uint16_t server_port, float update_interval_sec);

  bool update(float delta_time_sec);
  bool isConnected() const { return connected; }
  bool shouldBlink() const;

 private:
    WIFIHandler& wlan;
  const char* server_ip;
  uint16_t server_port;
  float update_interval_sec;
  float time_accumulator;
  bool connected;

  void sendDataToDashboard();
  void logDashboardInfo();
};
