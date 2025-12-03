#include "pins.h"

#include <FreeRTOS.h>
#include <bl_gpio.h>
#include <stdio.h>
#include <string.h>
#include <task.h>

// Forward declaration - PinsManager is created in program.cpp
typedef struct PinsManager PinsManager;
extern PinsManager* getPinsManager(void);

// C wrapper functions to call C++ PinsManager
extern void pinsManager_setMode(PinsManager* mgr, uint8_t pin, uint8_t mode);
extern uint8_t pinsManager_getMode(PinsManager* mgr, uint8_t pin);
extern void pinsManager_setValue(PinsManager* mgr, uint8_t pin, uint8_t value);
extern uint8_t pinsManager_getValue(PinsManager* mgr, uint8_t pin);
extern void pinsManager_setName(PinsManager* mgr, uint8_t pin,
                                const char* name);
extern const char* pinsManager_getName(PinsManager* mgr, uint8_t pin);
extern void pinsManager_setValueString(PinsManager* mgr, uint8_t pin,
                                       const char* value);
extern const char* pinsManager_getValueString(PinsManager* mgr, uint8_t pin);
extern bool pinsManager_isConfigured(PinsManager* mgr, uint8_t pin);
extern const char* pinsManager_getModeString(PinsManager* mgr, uint8_t pin);

void pinMode(uint8_t pin, uint8_t mode) {
  if (pin >= MAX_PINS)
    return;

  PinsManager* mgr = getPinsManager();
  pinsManager_setMode(mgr, pin, mode);

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
  if (pin < MAX_PINS) {
    PinsManager* mgr = getPinsManager();
    pinsManager_setValue(mgr, pin, value);
  }
  bl_gpio_output_set(pin, value);
}

int digitalRead(uint8_t pin) { return bl_gpio_input_get_value(pin); }

void delay(unsigned long ms) { vTaskDelay(pdMS_TO_TICKS(ms)); }

uint8_t getPinMode(uint8_t pin) {
  if (pin >= MAX_PINS)
    return PIN_MODE_UNCONFIGURED;
  PinsManager* mgr = getPinsManager();
  return pinsManager_getMode(mgr, pin);
}

bool isPinConfigured(uint8_t pin) {
  PinsManager* mgr = getPinsManager();
  return pinsManager_isConfigured(mgr, pin);
}

const char* getPinModeString(uint8_t pin) {
  PinsManager* mgr = getPinsManager();
  return pinsManager_getModeString(mgr, pin);
}

int getPinValue(uint8_t pin) {
  if (pin >= MAX_PINS)
    return 0;

  uint8_t mode = getPinMode(pin);

  // For OUTPUT pins, return the value we wrote
  if (mode == OUTPUT) {
    PinsManager* mgr = getPinsManager();
    return pinsManager_getValue(mgr, pin);
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
  PinsManager* mgr = getPinsManager();
  pinsManager_setName(mgr, pin, name);
}

const char* getPinName(uint8_t pin) {
  PinsManager* mgr = getPinsManager();
  return pinsManager_getName(mgr, pin);
}

void setPinValueString(uint8_t pin, const char* value) {
  PinsManager* mgr = getPinsManager();
  pinsManager_setValueString(mgr, pin, value);
}

const char* getPinValueString(uint8_t pin) {
  PinsManager* mgr = getPinsManager();
  return pinsManager_getValueString(mgr, pin);
}