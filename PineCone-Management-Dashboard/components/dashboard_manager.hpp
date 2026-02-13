#pragma once

#include "wifi_handler.hpp"
#include "extentions/log.hpp"
#include "components/pins_manager.hpp"
// Manages dashboard communication and state
class DashboardManager {
 public:
  DashboardManager(WIFIHandler& wlan_handler, PinsManager& pinsManager, const char* server_ip,
                   uint16_t server_port, float update_interval_sec);

  void setDebugEnabled(bool enabled) {
      debug_enabled = enabled;

  }

  bool update(float delta_time_sec);
  bool isConnected() const { return connected; }
  bool shouldBlink() const;

 private:
    WIFIHandler& wlan;
    PinsManager& _pinsManager;
  const char* server_ip;
  uint16_t server_port;
  float update_interval_sec;
  float time_accumulator;
  bool connected;
  bool debug_enabled = true;

  template <typename... Args>
  void log(const char* fmt, Args... args) const {
      if (debug_enabled) {
          Log::println(fmt, args...);
      }
  }

  void sendDataToDashboard();
  void logDashboardInfo();
};
