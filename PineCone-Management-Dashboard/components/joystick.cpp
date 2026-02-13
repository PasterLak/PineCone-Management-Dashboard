#include "joystick.hpp"

extern "C" {
}
#include "pins.hpp"

Joystick::Joystick(uint8_t pinX, uint8_t pinY, uint8_t pinBtn)
    : _pinX(pinX),
      _pinY(pinY),
      _pinBtn(pinBtn),
      _valX(0),
      _valY(0),
      _btnState(false) {
  _calX = {1500, 100, false};
  _calY = {1500, 100, false};

  pinMode(pinX, INPUT);
  pinMode(pinY, INPUT);

  if (_pinBtn != 255) {
    pinMode(_pinBtn, INPUT_PULLUP);
  }
}

int8_t Joystick::mapAxis(uint16_t raw, const AxisCalibration& cal) {
  if (raw < (cal.center - cal.deadzone))
    return cal.inverted ? 1 : -1;
  if (raw > (cal.center + cal.deadzone))
    return cal.inverted ? -1 : 1;
  return 0;
}

void Joystick::update() {
  uint16_t rawX = (uint16_t)analogRead(_pinX);
  uint16_t rawY = (uint16_t)analogRead(_pinY);

  _valX = mapAxis(rawX, _calX);
  _valY = mapAxis(rawY, _calY);

  if (_pinBtn != 255) {
    _btnState = (digitalRead(_pinBtn) == LOW);
  }
}

int8_t Joystick::getX() const { return _valX; }
int8_t Joystick::getY() const { return _valY; }
bool Joystick::isPressed() const { return _btnState; }