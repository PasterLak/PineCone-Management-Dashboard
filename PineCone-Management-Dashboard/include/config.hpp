#pragma once

#include <stdint.h>

#if __has_include("private_config.hpp")
#include "private_config.hpp"
#endif

namespace Config {

// Build Information
constexpr uint8_t BUILD_VERSION = 7;

/*
LED Pin	BL602 Pin	Remap Pin Function
LED Blue	IO 11	JTAG → PWM
LED Green	IO 14	JTAG → PWM
LED Red	IO 17	JTAG → PWM
*/
constexpr uint8_t LED_PIN = 11;  // Blue

// Timing Configuration
constexpr float DASHBOARD_UPDATE_INTERVAL_SEC = 0.025f;
constexpr float LED_BLINK_INTERVAL_SEC = 0.5f;



#ifdef PRIVATE_WIFI_SSID
constexpr const char* WIFI_SSID = PRIVATE_WIFI_SSID;
#else
constexpr const char* WIFI_SSID = "wifi_name";
#endif

#ifdef PRIVATE_WIFI_PASSWORD
constexpr const char* WIFI_PASSWORD = PRIVATE_WIFI_PASSWORD;
#else
constexpr const char* WIFI_PASSWORD = "wifi_password";
#endif

#ifdef PRIVATE_DASHBOARD_SERVER_IP
constexpr const char* DASHBOARD_SERVER_IP = PRIVATE_DASHBOARD_SERVER_IP;
#else
constexpr const char* DASHBOARD_SERVER_IP = "192.168.0.1";
#endif


constexpr uint16_t DASHBOARD_SERVER_PORT = 80;

} 