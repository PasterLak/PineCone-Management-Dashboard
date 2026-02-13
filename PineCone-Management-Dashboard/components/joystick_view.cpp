#include "joystick_view.hpp"

extern "C" {
#include "pins.h"
}

JoystickView::JoystickView(Joystick& joystick) : _joystick(joystick) {}

void JoystickView::init() {
  setPinName(_joystick.getPinX(), "X Axis");
  setPinName(_joystick.getPinY(), "Y Axis");

  if (_joystick.getPinBtn() != 255) {
    setPinName(_joystick.getPinBtn(), "Button");
  }
}

void JoystickView::setStringFromInt(uint8_t pin, int8_t val) {
  if (val > 0)
    setPinValueString(pin, "1");
  else if (val < 0)
    setPinValueString(pin, "-1");
  else
    setPinValueString(pin, "0");
}

void JoystickView::update() {
  _joystick.update();

  setStringFromInt(_joystick.getPinX(), _joystick.getX());

  setStringFromInt(_joystick.getPinY(), _joystick.getY());

  uint8_t btnPin = _joystick.getPinBtn();
  if (btnPin != 255) {
    if (_joystick.isPressed())
      setPinValueString(btnPin, "PRESSED");
    else
      setPinValueString(btnPin, "RELEASED");
  }
}