#pragma once

#include <stdint.h>

extern "C" {
#include "../pins.h"
}

class PinsManager {
 public:
  PinsManager();

  // Pin mode management
  void setMode(uint8_t pin, uint8_t mode);
  uint8_t getMode(uint8_t pin) const;
  bool isConfigured(uint8_t pin) const;
  const char* getModeString(uint8_t pin) const;

  // Pin value management (stores digital value 0/1 for all modes)
  void setValue(uint8_t pin, uint8_t value);
  uint8_t getValue(uint8_t pin) const;

  // Pin naming
  void setName(uint8_t pin, const char* name);
  const char* getName(uint8_t pin) const;

  // Custom value strings (for sensors, formatted display like "23.5°C")
  void setValueString(uint8_t pin, const char* value);
  const char* getValueString(uint8_t pin) const;

 private:
  struct PinState {
    uint8_t mode;
    uint8_t value;
    char name[16];
    char value_string[32];
  };

  PinState pins_[MAX_PINS];

  bool isValidPin(uint8_t pin) const { return pin < MAX_PINS; }
};
