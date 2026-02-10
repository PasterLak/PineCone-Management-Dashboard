#include "joystick.hpp"

extern "C" {
#include "pins.h"
}

Joystick::Joystick(uint8_t pinX, uint8_t pinY, uint8_t pinBtn) 
    : _pinX(pinX), _pinY(pinY), _pinBtn(pinBtn), _valX(0), _valY(0), _btnState(false) 
{
  
    _calX = {1600, 600, false};
    _calY = {1600, 600, false};

    if (_pinBtn != 255) {
        pinMode(_pinBtn, INPUT_PULLUP);
    }
}

void Joystick::setCalibrationX(uint16_t center, uint16_t deadzone, bool inverted) {
    _calX = {center, deadzone, inverted};
}

void Joystick::setCalibrationY(uint16_t center, uint16_t deadzone, bool inverted) {
    _calY = {center, deadzone, inverted};
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

int8_t Joystick::getX() const {
    return _valX;
}

int8_t Joystick::getY() const {
    return _valY;
}

bool Joystick::isPressed() const {
    return _btnState;
}

int8_t Joystick::mapAxis(uint16_t raw, const AxisCalibration& cal) {
    int8_t val = 0;

  
    if (raw < (cal.center - cal.deadzone)) {
        val = -1;
    }
   
    else if (raw > (cal.center + cal.deadzone)) {
        val = 1;
    }
   
    else {
        val = 0;
    }

    if (cal.inverted) {
        val = -val;
    }

    return val;
}