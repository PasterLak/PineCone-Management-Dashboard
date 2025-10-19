#include "Button.h"

#include "../pins.h"



Button::Button(int8_t pin)
{
    this->_pin = pin;
    pinMode(pin, INPUT_PULLUP);
}

void Button::update()
{
    lastState = state;
    state = digitalRead(_pin);
}

bool Button::isPressed()
{
    return state;
}

bool Button::isDown()
{
    return (lastState == false && state != lastState);
}

bool Button::isUp()
{
   return (lastState == true && state != lastState);
}

bool Button::getState()
{
    return state;
}

bool Button::getLastState()
{
    return lastState;
}
