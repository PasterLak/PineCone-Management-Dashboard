#include "PinsManager.hpp"

// C wrapper functions for PinsManager
extern "C" {

void pinsManager_setMode(PinsManager* mgr, uint8_t pin, uint8_t mode) {
  mgr->setMode(pin, mode);
}

uint8_t pinsManager_getMode(PinsManager* mgr, uint8_t pin) {
  return mgr->getMode(pin);
}

void pinsManager_setValue(PinsManager* mgr, uint8_t pin, uint8_t value) {
  mgr->setValue(pin, value);
}

uint8_t pinsManager_getValue(PinsManager* mgr, uint8_t pin) {
  return mgr->getValue(pin);
}

void pinsManager_setName(PinsManager* mgr, uint8_t pin, const char* name) {
  mgr->setName(pin, name);
}

const char* pinsManager_getName(PinsManager* mgr, uint8_t pin) {
  return mgr->getName(pin);
}

void pinsManager_setValueString(PinsManager* mgr, uint8_t pin,
                                const char* value) {
  mgr->setValueString(pin, value);
}

const char* pinsManager_getValueString(PinsManager* mgr, uint8_t pin) {
  return mgr->getValueString(pin);
}

bool pinsManager_isConfigured(PinsManager* mgr, uint8_t pin) {
  return mgr->isConfigured(pin);
}

const char* pinsManager_getModeString(PinsManager* mgr, uint8_t pin) {
  return mgr->getModeString(pin);
}
}
