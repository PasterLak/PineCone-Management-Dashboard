#ifndef PINS_H
#define PINS_H

#include <stdbool.h>
#include <stdint.h>

// Arduino-like api for pin manipulation

#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#define INPUT_PULLDOWN 3
#define PIN_MODE_UNCONFIGURED 255

#define HIGH 1
#define LOW 0

#define MAX_PINS 23

void pinMode(uint8_t pin, uint8_t mode);
void digitalWrite(uint8_t pin, uint8_t value);
int digitalRead(uint8_t pin);
void delay(unsigned long ms);

// Pin state tracking
uint8_t getPinMode(uint8_t pin);
bool isPinConfigured(uint8_t pin);
const char* getPinModeString(uint8_t pin);
int getPinValue(uint8_t pin);  // Get pin value (considers OUTPUT vs INPUT)

// Pin naming
void setPinName(uint8_t pin, const char* name);
const char* getPinName(uint8_t pin);

// Extra utility functions
void togglePin(uint8_t pin);
void blinkPin(uint8_t pin, unsigned long delay_ms, uint8_t times);

#endif