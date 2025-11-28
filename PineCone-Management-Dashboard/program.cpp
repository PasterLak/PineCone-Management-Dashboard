#include "program.hpp"

extern "C" {
#include <FreeRTOS.h>
#include <bl_timer.h>
#include <lwip/tcpip.h>
#include <stdio.h>
#include <task.h>

#include "pins.h"
}

#include <etl/string.h>

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

DeltaTime deltaTime;
static char deltaStr[64];

Button button1(BUTTON_PIN);
int pressedCount = 0;

Printer printer;
WLANHandler wlan("Marc",
                 "test1234");  // Replace with your SSID and Password

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

  button1.setDebounceDelayMS(20);

  wlan.start();
}

void loop() {
  deltaTime.update();
  button1.update();
  time += deltaTime.getSec();

  if (button1.isDown()) {
    pressedCount++;
    printf("Button was Pressed! Presses: %d\r\n", pressedCount);
  }

  if (time > timeIntervalSec) {
    time = 0.0f;

    counter++;

    deltaTime.getAsString(deltaStr, sizeof(deltaStr));

    printer.printl(wlan.isConnected());

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
