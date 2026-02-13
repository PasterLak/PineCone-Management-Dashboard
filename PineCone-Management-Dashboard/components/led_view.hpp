#pragma once

#include "blink.hpp"

// controls LED behavior based on connection state
class LEDView {
 public:
  LEDView(uint8_t pin, float blink_interval_sec);

  void initialize();

  void update(bool is_connected, bool should_blink, float delta_time_sec);

 private:
  Blink led;
  uint8_t pin;
  float blink_interval_sec;
  float blink_time;

  void setOff();
  void setSteadyOn();
  void updateBlinking();
};