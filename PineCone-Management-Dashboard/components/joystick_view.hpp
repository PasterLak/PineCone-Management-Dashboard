#pragma once
#include "joystick.hpp"

class JoystickView {
 public:
  JoystickView(Joystick& joystick);

  void init();
  void update();

 private:
  Joystick& _joystick;

  void setStringFromInt(uint8_t pin, int8_t val);
};