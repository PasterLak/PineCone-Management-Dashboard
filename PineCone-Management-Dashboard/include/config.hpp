#pragma once

#include <stdint.h>

namespace Config {

// Build Information
constexpr uint8_t BUILD_VERSION = 7;

// Pin Definitions
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

// Network Configuration
/*
Raspberry Pi
WiFi SSID: AccessPi
WiFi Password: PineCone1234
Dashboard Server IP: 10.42.0.1

Marcs Pc
WiFi SSID: Marmor
WiFi Password:
Dashboard Server IP: 192.168.178.75
*/

constexpr const char* WIFI_SSID = "AccessPi"; // SSID
constexpr const char* WIFI_PASSWORD = "PineCone1234"; // pw
constexpr const char* DASHBOARD_SERVER_IP = "10.42.0.1";  // ip e.g. 10.42.0.1
constexpr uint16_t DASHBOARD_SERVER_PORT = 80;


}  // namespace Config
