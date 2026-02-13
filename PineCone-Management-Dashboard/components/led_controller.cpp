#include "led_controller.hpp"

extern "C" {
#include <stdio.h>

#include "../pins.h"
}

LEDController::LEDController(uint8_t pin, float blink_interval_sec)
    : led(pin),
      pin(pin),
      blink_interval_sec(blink_interval_sec),
      blink_time(0.0f) {}

void LEDController::initialize() {
  led.off();
  setPinName(pin, "LED");
  setPinValueString(pin, "Off");

 
}

void LEDController::update(bool is_connected, bool should_blink,
                           float delta_time_sec) {
  if (!is_connected) {
    setOff();
    return;
  }

  if (should_blink) {
    blink_time += delta_time_sec;
    if (blink_time >= blink_interval_sec) {
      updateBlinking();
    }
  } else {
    setSteadyOn();
  }
}

void LEDController::setOff() {
  led.off();
  setPinValueString(pin, "Off");
  blink_time = 0.0f;
}

void LEDController::setSteadyOn() {
  led.on();
  setPinValueString(pin, "On");
  blink_time = 0.0f;
}

void LEDController::updateBlinking() {
  blink_time = 0.0f;
  led.toggle();
  // LED is inverted: LOW (0) = On, HIGH (1) = Off
  setPinValueString(pin, getPinValue(pin) ? "Off" : "On");
  printf("[LED] Toggle\r\n");
}
