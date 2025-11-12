#pragma once

extern "C" {
    #include <stdint.h>
  
}

class Blink {
public:
    Blink(uint8_t pin);
    void on();
    void off();
    void toggle();
    void blink(uint32_t interval_ms, uint8_t times);

private:
    uint8_t _pin;
    
};

