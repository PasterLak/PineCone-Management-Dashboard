#pragma once
#include "components/pins_manager.hpp"
#include "joystick.hpp"

class JoystickView {
 public:
  JoystickView(Joystick& joystick, PinsManager& pinsManager);

  void init();
  void update();

 private:
  Joystick& _joystick;
  PinsManager& _pinsManager;

  void setStringFromInt(uint8_t pin, int8_t val);
};