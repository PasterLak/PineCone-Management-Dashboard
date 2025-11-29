#include "PinsManager.hpp"

#include <stdio.h>
#include <string.h>

PinsManager::PinsManager() {
  // Initialize all pins as unconfigured
  for (int i = 0; i < MAX_PINS; i++) {
    pins_[i].mode = PIN_MODE_UNCONFIGURED;
    pins_[i].value = 0;
    pins_[i].name[0] = '\0';
    pins_[i].value_string[0] = '\0';
  }
}

// ============================================================================
// Pin Mode Management
// ============================================================================

void PinsManager::setMode(uint8_t pin, uint8_t mode) {
  if (!isValidPin(pin))
    return;
  pins_[pin].mode = mode;
}

uint8_t PinsManager::getMode(uint8_t pin) const {
  if (!isValidPin(pin))
    return PIN_MODE_UNCONFIGURED;
  return pins_[pin].mode;
}

bool PinsManager::isConfigured(uint8_t pin) const {
  return getMode(pin) != PIN_MODE_UNCONFIGURED;
}

const char* PinsManager::getModeString(uint8_t pin) const {
  switch (getMode(pin)) {
    case INPUT:
      return "input";
    case OUTPUT:
      return "output";
    case INPUT_PULLUP:
      return "pullup";
    case INPUT_PULLDOWN:
      return "pulldown";
    default:
      return "unconfigured";
  }
}

// ============================================================================
// Pin Value Management
// ============================================================================

void PinsManager::setValue(uint8_t pin, uint8_t value) {
  if (!isValidPin(pin))
    return;
  pins_[pin].value = value;
}

uint8_t PinsManager::getValue(uint8_t pin) const {
  if (!isValidPin(pin))
    return 0;
  return pins_[pin].value;
}

// ============================================================================
// Pin Naming
// ============================================================================

void PinsManager::setName(uint8_t pin, const char* name) {
  if (!isValidPin(pin) || !name)
    return;

  strncpy(pins_[pin].name, name, sizeof(pins_[pin].name) - 1);
  pins_[pin].name[sizeof(pins_[pin].name) - 1] = '\0';
}

const char* PinsManager::getName(uint8_t pin) const {
  if (!isValidPin(pin))
    return "";

  // Return custom name if set
  if (pins_[pin].name[0] != '\0') {
    return pins_[pin].name;
  }

  // Return default name "gpioN" - use member buffer to avoid static issues -
  // safer causer single-threaded in FreeRTOS
  static char buffer[16];
  snprintf(buffer, sizeof(buffer), "gpio%d", pin);
  return buffer;
}

// ============================================================================
// Custom Value Strings
// ============================================================================

void PinsManager::setValueString(uint8_t pin, const char* value) {
  if (!isValidPin(pin) || !value)
    return;

  strncpy(pins_[pin].value_string, value, sizeof(pins_[pin].value_string) - 1);
  pins_[pin].value_string[sizeof(pins_[pin].value_string) - 1] = '\0';
}

const char* PinsManager::getValueString(uint8_t pin) const {
  if (!isValidPin(pin))
    return "0";

  // Return custom value string if set
  if (pins_[pin].value_string[0] != '\0') {
    return pins_[pin].value_string;
  }

  // Return digital value as string
  static char buffer[16];
  snprintf(buffer, sizeof(buffer), "%d", getValue(pin));
  return buffer;
}
