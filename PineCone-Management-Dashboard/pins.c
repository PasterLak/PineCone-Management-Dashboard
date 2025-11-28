#include "pins.h"

#include <FreeRTOS.h>
#include <bl_gpio.h>
#include <stdio.h>
#include <string.h>
#include <task.h>

// Track pin modes (initialized to unconfigured)
static uint8_t pin_modes[MAX_PINS];
static uint8_t pin_values[MAX_PINS];  // Track OUTPUT pin values
static char pin_names[MAX_PINS][16];  // 16 chars max per name
static bool pin_tracking_initialized = false;

static void initPinTracking() {
  if (!pin_tracking_initialized) {
    memset(pin_modes, PIN_MODE_UNCONFIGURED, sizeof(pin_modes));
    memset(pin_values, 0, sizeof(pin_values));
    memset(pin_names, 0, sizeof(pin_names));
    pin_tracking_initialized = true;
  }
}

void pinMode(uint8_t pin, uint8_t mode) {
  initPinTracking();

  if (pin >= MAX_PINS)
    return;

  pin_modes[pin] = mode;

  switch (mode) {
    case OUTPUT:
      bl_gpio_enable_output(pin, 0, 0);
      break;
    case INPUT:
      bl_gpio_enable_input(pin, 0, 0);
      break;
    case INPUT_PULLUP:
      bl_gpio_enable_input(pin, 1, 0);
      break;
    case INPUT_PULLDOWN:
      bl_gpio_enable_input(pin, 0, 1);
      break;
  }
}

void digitalWrite(uint8_t pin, uint8_t value) {
  initPinTracking();
  if (pin < MAX_PINS) {
    pin_values[pin] = value;  // Remember the value we wrote
  }
  bl_gpio_output_set(pin, value);
}

int digitalRead(uint8_t pin) { return bl_gpio_input_get_value(pin); }

void delay(unsigned long ms) { vTaskDelay(pdMS_TO_TICKS(ms)); }

uint8_t getPinMode(uint8_t pin) {
  initPinTracking();
  if (pin >= MAX_PINS)
    return PIN_MODE_UNCONFIGURED;
  return pin_modes[pin];
}

bool isPinConfigured(uint8_t pin) {
  return getPinMode(pin) != PIN_MODE_UNCONFIGURED;
}

const char* getPinModeString(uint8_t pin) {
  uint8_t mode = getPinMode(pin);
  switch (mode) {
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

int getPinValue(uint8_t pin) {
  initPinTracking();
  if (pin >= MAX_PINS)
    return 0;

  uint8_t mode = getPinMode(pin);

  // For OUTPUT pins, return the value we wrote (not the physical pin state)
  if (mode == OUTPUT) {
    return pin_values[pin];
  }

  // For INPUT pins, read the actual pin state
  return digitalRead(pin);
}

void togglePin(uint8_t pin) {
  int current = digitalRead(pin);
  digitalWrite(pin, !current);
}

void blinkPin(uint8_t pin, unsigned long delay_ms, uint8_t times) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delay_ms);
    digitalWrite(pin, LOW);
    if (i < times - 1) {
      delay(delay_ms);
    }
  }
}

void setPinName(uint8_t pin, const char* name) {
  initPinTracking();
  if (pin >= MAX_PINS || !name)
    return;

  strncpy(pin_names[pin], name, sizeof(pin_names[pin]) - 1);
  pin_names[pin][sizeof(pin_names[pin]) - 1] = '\0';
}

const char* getPinName(uint8_t pin) {
  initPinTracking();
  if (pin >= MAX_PINS)
    return "";

  // Return custom name if set, otherwise default "gpioN"
  if (pin_names[pin][0] != '\0') {
    return pin_names[pin];
  }

  // Fallback: return default name (static buffer, not thread-safe but OK for
  // our use)
  static char default_name[16];
  snprintf(default_name, sizeof(default_name), "gpio%d", pin);
  return default_name;
}