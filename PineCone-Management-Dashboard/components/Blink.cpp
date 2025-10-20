#include "Blink.hpp"
#include "../pins.h"

Blink::Blink(uint8_t pin) : _pin(pin) {
    pinMode(_pin, OUTPUT);
    off();
}

void Blink::on() {
    digitalWrite(_pin, HIGH);
}

void Blink::off() {
    digitalWrite(_pin, LOW);
}

void Blink::toggle() {
    togglePin(_pin);
}

void Blink::blink(uint32_t interval_ms, uint8_t times) {
    blinkPin(_pin, interval_ms, times);
}
