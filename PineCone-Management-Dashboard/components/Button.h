#pragma once
#include <cstdint>

class Button
{
private:
    int8_t _pin;
    bool state = 0;
    bool lastState = 0;

public:
    Button(int8_t pin);
    void update();
    bool isPressed();
    bool isDown();
    bool isUp();
    bool getState();
    bool getLastState();
};
