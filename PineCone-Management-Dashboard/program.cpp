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

#include "components/blink.hpp"
#include "components/button.hpp"
#include "components/delta_time.hpp"

// extentions
#include "extentions/Print.hpp"

// Wifi
#include "components/WLANHandler.hpp"

#define BUILD_VERSION 7

static long counter = 0;
#define LED_PIN 11
#define BUTTON_PIN 4

static float time = 0.0f;
const float timeIntervalSec = 2.0f;

static float blinkTime = 0.0f;
const float blinkIntervalSec = 2.5f;  // Blink every 2500ms

static bool dashboardConnected = false;

DeltaTime deltaTime;
static char deltaStr[64];

Button button1(BUTTON_PIN);
int pressedCount = 0;

Blink statusLED(LED_PIN);

Printer printer;
WLANHandler wlan("ssid",
                 "password");  // Replace with your SSID and Password

void task_app_wrapper(void* pvParameters) {
  (void)pvParameters;
  vTaskDelay(pdMS_TO_TICKS(100));

  start();

  while (1) {
    loop();
  }
}

void start() {
  printer.printl("====== PINECONE BL602 STARTED! ======");
  printer.printl("====== BUILD:", BUILD_VERSION, "======");

  statusLED.off();  // Start with LED off

  button1.setDebounceDelayMS(20);

  // Set custom pin names for dashboard
  setPinName(LED_PIN, "LED");
  setPinName(BUTTON_PIN, "Button");

  wlan.start();
}

void loop() {
  deltaTime.update();
  button1.update();
  time += deltaTime.getSec();
  blinkTime += deltaTime.getSec();

  if (button1.isDown()) {
    pressedCount++;
    printf("Button was Pressed! Presses: %d\r\n", pressedCount);
  }

  // LED Logic based on Dashboard connection:
  // - Not connected to dashboard: LED OFF
  // - Connected + blink mode: LED BLINKING (toggle every 500ms)
  // - Connected + no blink: LED ON (steady)
  if (!dashboardConnected) {
    statusLED.off();
    blinkTime = 0.0f;
  } else if (wlan.is_blinking()) {
    // Blink mode: toggle LED every 2500ms
    if (blinkTime >= blinkIntervalSec) {
      blinkTime = 0.0f;
      statusLED.toggle();
      printf("[LED] Toggle\r\n");
    }
  } else {
    // Connected but not blinking: LED steady ON
    statusLED.on();
    blinkTime = 0.0f;
  }

  if (time > timeIntervalSec) {
    time = 0.0f;

    counter++;

    deltaTime.getAsString(deltaStr, sizeof(deltaStr));

    // Check connection state
    bool wifiConnected = wlan.isConnected();
    printer.printl("WiFi Connected:", wifiConnected);

    // Send data to dashboard when connected
    if (wifiConnected) {
      printer.printl("Sending data to dashboard...");
      wlan.sendData("192.168.178.75", 5000);  // Flask server IP and port

      // Update dashboard connection state
      dashboardConnected = wlan.is_dashboard_connected();
      printer.printl("Dashboard Connected:", dashboardConnected);

      // Show device info
      if (wlan.get_node_id()[0] != '\0') {
        printer.printl("Node ID:", wlan.get_node_id());
        printer.printl("Description:", wlan.get_description());
        if (wlan.is_blinking()) {
          printer.printl("Blink Mode: ACTIVE");
        }
      }
    } else {
      dashboardConnected = false;
    }

    // printer.printl(wlan.get_ip_address());
    // printer.printl("=================",wlan.get_password(),"===============");

    // printer.printl(wlan.get_ip_address());

    /*
    printer.printl("Counter:", counter);
    printer.printl("Pin button:", digitalRead(BUTTON_PIN));
    printer.printl(deltaStr);
    printer.printl("Current:", deltaTime.getUs(), "us (",
                   deltaTime.getMs(), "ms) FPS:",
                   deltaTime.getFps());
    printer.printl("Stats - Avg:", deltaTime.getAverageUs(), "us Min:",
                   deltaTime.getMinUs(), "us Max:",
                   deltaTime.getMaxUs());
    */
  }
}
