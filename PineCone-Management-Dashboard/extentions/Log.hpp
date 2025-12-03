#pragma once

extern "C" {
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include "bl_uart.h"
}

//##### SIMPLE FORMATTING LOGGER #####

// USAGE:
//  Log::println("Hello {}!", name); -> "Hello Mike!"
//  Log::println("Money: ", 5); -> Money: 5

class Log {
public:
    static void setSeparatorEnabled(bool enabled) { separator_enabled = enabled; }

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

    // putchar safe alternative
    static void writeChar(char c) {
        bl_uart_data_send(0, (uint8_t)c); 
    }

    // Print a single value
    static void printValue(const char* v)          { while (*v) writeChar(*v++); }
    static void printValue(char* v)                { while (*v) writeChar(*v++); }
    static void printValue(char v)                 { writeChar(v); }
    static void printValue(bool v)                 { printValue(v ? "true" : "false"); }
    static void printValue(int v)                  { printNumber(v); }
    static void printValue(unsigned v)             { printNumber(v); }
    static void printValue(long v)                 { printNumber(v); }
    static void printValue(unsigned long v)        { printNumber(v); }
    static void printValue(long long v)            { printNumber(v); }
    static void printValue(unsigned long long v)   { printNumber(v); }
    static void printValue(float v)                { printFloat(v); }
    static void printValue(double v)               { printFloat(v); }
    template <typename T>
    static void printValue(const T&)               { printValue("[unsupported]"); }

    // --------------------
    // Format implementation
    // --------------------
    template <typename T, typename... Rest>
    static void format(const char* fmt, T value, Rest... rest) {
        while (*fmt) {
            if (*fmt == '\\') {
                ++fmt;
                if (*fmt == '{') writeChar('{');
                else if (*fmt == '\\') writeChar('\\');
                else writeChar('\\');
                ++fmt;
            }
            else if (*fmt == '{' && *(fmt+1) == '}') {
                fmt += 2;
                printValue(value);
                format(fmt, rest...);
                return;
            }
            else writeChar(*fmt++);
        }
        // leftover arguments
        appendRemaining(value, rest...);
    }

    static void format(const char* fmt) {
        while (*fmt) {
            if (*fmt == '\\') {
                ++fmt; if (*fmt) writeChar(*fmt++);
            } else writeChar(*fmt++);
        }
    }

    // Print remaining arguments after placeholders
    template <typename T, typename... Rest>
    static void appendRemaining(T value, Rest... rest) {
        if (separator_enabled) writeChar(' ');
        printValue(value);
        appendRemaining(rest...);
    }
    static void appendRemaining() {}

    // --------------------
    // Helpers
    // --------------------
    template <typename T>
    static void printNumber(T n) {
        char buf[32];
        int len = snprintf(buf, sizeof(buf), "%lld", (long long)n);
        for (int i = 0; i < len; i++) writeChar(buf[i]);
    }

    static void printFloat(double v) {
        char buf[32];
        int len = snprintf(buf, sizeof(buf), "%f", v);
        for (int i = 0; i < len; i++) writeChar(buf[i]);
    }
};
