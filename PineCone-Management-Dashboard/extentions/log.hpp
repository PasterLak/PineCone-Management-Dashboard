#pragma once

extern "C" {
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

#include "bl_uart.h"
}

// ##### SIMPLE FORMATTING LOGGER #####
//
//   Log::println("Hello {}!", name);
//   Log::println("Money: {}", 5);  // prints: Money: 5
//
//   Use setSeparatorEnabled(bool) to enable/disable space between args
//

class Log {
 public:
  static void setSeparatorEnabled(bool enabled) { separator_enabled = enabled; }

  template <typename T>
  void print(T t) {
    printValue(t);
  }

  template <typename... Args>
  static void print(const char* fmt, Args... args) {
    format(fmt, args...);
  }

  template <typename... Args>
  static void println(const char* fmt, Args... args) {
    format(fmt, args...);
    writeChar('\r');
    writeChar('\n');
  }

 private:
  inline static bool separator_enabled = true;

  static void writeChar(char c) {
    bl_uart_data_send(0, static_cast<uint8_t>(c));
  }

  static void printValue(const char* v) { printf("%s", v); }
  static void printValue(char* v) { printf("%s", v); }

  static void printValue(char v) { writeChar(v); }

  static void printValue(bool v) { printf("%s", v ? "true" : "false"); }

  static void printValue(int v) { printf("%d", v); }
  static void printValue(unsigned int v) { printf("%u", v); }

  static void printValue(int8_t v) { printf("%d", static_cast<int>(v)); }
  static void printValue(uint8_t v) {
    printf("%u", static_cast<unsigned int>(v));
  }

  static void printValue(int16_t v) { printf("%d", static_cast<int>(v)); }
  static void printValue(uint16_t v) {
    printf("%u", static_cast<unsigned int>(v));
  }

  static void printValue(int32_t v) { printf("%d", static_cast<int>(v)); }
  static void printValue(uint32_t v) {
    printf("%u", static_cast<unsigned int>(v));
  }

  static void printValue(float v) {
    printf("%s", doubleToString(static_cast<double>(v)));
  }
  static void printValue(double v) { printf("%s", doubleToString(v)); }

  // Fallback
  template <typename T>
  static void printValue(const T&) {
    printf("%s", "[unsupported]");
  }

  static char* doubleToString(double v) {
    int int_part = static_cast<int>(v);
    int frac_part = static_cast<int>((v - int_part) * 1000 + 0.5);

    static char buffer[16];

    snprintf(buffer, sizeof(buffer), "%d.%03d", int_part, frac_part);
    return buffer;
  }
  // --------------------------------------------------
  // Replacing "{}" with arguments
  // --------------------------------------------------
  template <typename T, typename... Rest>
  static void format(const char* fmt, T value, Rest... rest) {
    while (*fmt) {
      if (*fmt == '\\') {
        fmt++;
        if (*fmt == '{') {
          writeChar('{');
          fmt++;
          continue;
        }
        if (*fmt == '\\') {
          writeChar('\\');
          fmt++;
          continue;
        }
        writeChar('\\');
        continue;
      }

      if (*fmt == '{' && *(fmt + 1) == '}') {
        printValue(value);
        fmt += 2;
        format(fmt, rest...);
        return;
      }

      writeChar(*fmt++);
    }

    appendRemaining(value, rest...);
  }

  // no args
  static void format(const char* fmt) {
    while (*fmt) {
      if (*fmt == '\\') {
        fmt++;
        if (*fmt)
          writeChar(*fmt++);
      } else {
        writeChar(*fmt++);
      }
    }
  }

  // leftover args after no more {}
  template <typename T, typename... Rest>
  static void appendRemaining(T value, Rest... rest) {
    if (separator_enabled)
      writeChar(' ');
    printValue(value);
    appendRemaining(rest...);
  }

  static void appendRemaining() {}
};