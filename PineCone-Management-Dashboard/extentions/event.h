/*
Observer
EXAMPLES

--------------------------------------|

void onLog(const char* text) {}

Event<const char*> messageEvent;

void app() {
    messageEvent += onLog;
    messageEvent.invoke("Hello");
    messageEvent -= onLog;
}

--------------------------------------|

void onBalance(int amount) {}

Event<int> moneyEvent;

void app() {
    moneyEvent += onBalance;
    moneyEvent.invoke(100);
    moneyEvent -= onBalance;
}

*/

#pragma once

#include "etl/vector.h"
#include "etl/algorithm.h"

template <typename... Args>
class Event {
 public:
  using HandlerType = void (*)(Args...);
  
  static constexpr size_t MAX_LISTENERS = 8;

  // add a handler
  void operator+=(HandlerType handler) {
    if (!handlers.full()) {
      handlers.push_back(handler);
    }
  }

  // remove a handler
  void operator-=(HandlerType handler) {
    auto it = etl::find(handlers.begin(), handlers.end(), handler);
    if (it != handlers.end()) {
      handlers.erase(it);
    }
  }

  // invoke all handlers
  void invoke(Args... args) {
    for (auto handler : handlers) {
      handler(args...);
    }
  }

  void clear() {
    handlers.clear();
  }

 private:
  etl::vector<HandlerType, MAX_LISTENERS> handlers;
};