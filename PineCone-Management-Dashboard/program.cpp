#include "program.hpp"

extern "C" {
#include <FreeRTOS.h>
#include <bl_timer.h>
#include <lwip/tcpip.h>
#include <stdio.h>
#include <task.h>

#include "pins.h"

// Fix for missing __dso_handle symbol with global C++ objects
void* __dso_handle = nullptr;
}

#include <etl/string.h>

#include "components/DashboardManager.hpp"
#include "components/LEDController.hpp"
#include "components/PinsManager.hpp"
#include "components/WLANHandler.hpp"
#include "components/delta_time.hpp"
#include "extentions/Log.hpp"
#include "include/Config.hpp"

// ============================================================================
// Application Components
// ============================================================================

DeltaTime deltaTime;
PinsManager pinsManager;  // Global pin state manager
WLANHandler wlan(Config::WIFI_SSID, Config::WIFI_PASSWORD);
LEDController ledController(Config::LED_PIN, Config::LED_BLINK_INTERVAL_SEC);
DashboardManager dashboardManager(wlan, Config::DASHBOARD_SERVER_IP,
                                  Config::DASHBOARD_SERVER_PORT,
                                  Config::DASHBOARD_UPDATE_INTERVAL_SEC);

// Expose PinsManager to C code
extern "C" {
PinsManager* getPinsManager() { return &pinsManager; }
}

// ============================================================================
// Application Lifecycle
// ============================================================================

void task_app_wrapper(void* pvParameters) {
  (void)pvParameters;
  vTaskDelay(pdMS_TO_TICKS(100));

  start();
 
  while (1) {
    loop();
  }
}

void start() {
 
  Log::println("====== PINECONE BL602 STARTED! ======");
  Log::println("====== BUILD:", Config::BUILD_VERSION, "======");

  ledController.initialize();
  wlan.start();
}

void loop() {
  deltaTime.update();
  float delta_sec = deltaTime.getSec();

  // Update dashboard communication
  bool is_connected = dashboardManager.update(delta_sec);
  bool should_blink = dashboardManager.shouldBlink();

  // Update LED based on connection state
  ledController.update(is_connected, should_blink, delta_sec);
}
