#include "led_view.hpp"

extern "C" {
#include <stdio.h>
#include "../pins.hpp"
}


LEDView::LEDView(uint8_t pin, float blink_interval_sec,
                 PinsManager& pinsManager)
    : led(pin),
      pin(pin),
      blink_interval_sec(blink_interval_sec),
      blink_time(0.0f),
      _pinsManager(pinsManager) {}

void LEDView::initialize() {
  led.off();
  _pinsManager.registerPin(pin, "LED", OUTPUT);
  _pinsManager.setValueString(pin, "Off");
}

void LEDView::update(bool is_connected, bool should_blink,
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

void LEDView::setOff() {
  led.off();
  _pinsManager.setValueString(pin, "Off");
  blink_time = 0.0f;
}

void LEDView::setSteadyOn() {
  led.on();
  _pinsManager.setValueString(pin, "On");
  blink_time = 0.0f;
}

void LEDView::updateBlinking() {
  blink_time = 0.0f;
  led.toggle();
  // LED is inverted: LOW (0) = On, HIGH (1) = Off
  _pinsManager.setValueString(pin, _pinsManager.getValue(pin) ? "Off" : "On");
  printf("[LED] Toggle\r\n");
}
