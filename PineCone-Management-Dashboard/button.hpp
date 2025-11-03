#pragma once
#include <stdint.h>

#include "pins.h"
class Button
{
private:
    uint8_t _pin;
    bool state = 0;
    bool lastState = 0;

public:
    Button(uint8_t pin);
    void update();
    bool isPressed();
    bool isDown();
    bool isUp();
    bool getState();
    bool getLastState();
};
