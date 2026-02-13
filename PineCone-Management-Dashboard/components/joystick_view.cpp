#include "joystick_view.hpp"

extern "C" {
}
#include "pins.hpp"

JoystickView::JoystickView(Joystick& joystick, PinsManager& pinsManager)
    : _joystick(joystick), _pinsManager(pinsManager) {}

void JoystickView::init() {

  _pinsManager.registerPin(_joystick.getPinX(), "X Axis");
  _pinsManager.registerPin(_joystick.getPinY(), "Y Axis");


  if (_joystick.getPinBtn() != 255) {
    _pinsManager.registerPin(_joystick.getPinBtn(), "Joystick Button");
  }
}

void JoystickView::setStringFromInt(uint8_t pin, int8_t val) {
  if (val > 0)
    _pinsManager.setValueString(pin, "1");
  else if (val < 0)
    _pinsManager.setValueString(pin, "-1");
  else
    _pinsManager.setValueString(pin, "0");
}

void JoystickView::update() {
  _joystick.update();

  setStringFromInt(_joystick.getPinX(), _joystick.getX());

  setStringFromInt(_joystick.getPinY(), _joystick.getY());

  uint8_t btnPin = _joystick.getPinBtn();
  if (btnPin != 255) {
    if (_joystick.isPressed())
      _pinsManager.setValueString(btnPin, "PRESSED");
    else
      _pinsManager.setValueString(btnPin, "RELEASED");
  }
}