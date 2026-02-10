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
#include "playground.hpp"
#include "components/dashboard_manager.hpp"
#include "components/led_controller.hpp"
#include "components/pins_manager.hpp"
#include "components/wifi_handler.hpp"
#include "components/delta_time.hpp"
#include "extentions/log.hpp"
#include "include/config.hpp"

// ============================================================================
// Application Components
// ============================================================================

DeltaTime deltaTime;
PinsManager pinsManager;  // Global pin state manager
WIFIHandler wifi(Config::WIFI_SSID, Config::WIFI_PASSWORD);
LEDController ledController(Config::LED_PIN, Config::LED_BLINK_INTERVAL_SEC);
DashboardManager dashboardManager(wifi, Config::DASHBOARD_SERVER_IP,
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

  runPlayground(deltaTime, true);
  start();

  while (1) {
    loop();
  }
}

void start() {
  Log::println("====== PINECONE BL602 STARTED! ======");
  Log::println("====== BUILD:", Config::BUILD_VERSION, "======");

  ledController.initialize();
  dashboardManager.setDebugEnabled(false);
  wifi.setDebugEnabled(false);
  wifi.start();
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
