#pragma once

#include <stdint.h>

namespace Config {

// Build Information
constexpr uint8_t BUILD_VERSION = 7;

// Pin Definitions
constexpr uint8_t LED_PIN = 11;

// Timing Configuration
constexpr float DASHBOARD_UPDATE_INTERVAL_SEC = 1.0f;
constexpr float LED_BLINK_INTERVAL_SEC = 2.5f;

// Network Configuration
constexpr const char* WIFI_SSID = "SSID_PI_AP";
constexpr const char* WIFI_PASSWORD = "PASSWORD_PI_AP";
constexpr const char* DASHBOARD_SERVER_IP = "IP_PI";  // e.g. 192.168.178.75
constexpr uint16_t DASHBOARD_SERVER_PORT = 5000;

}  // namespace Config
