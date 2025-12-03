#pragma once

extern "C" {
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
}

//##### SIMPLE FORMATTING LOGGER #####

// USAGE:
//  Log::println("Hello {}!", name); -> "Hello Mike!"


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
        putchar('\n');
    }

private:
    inline static bool separator_enabled = true;

    // Print a single value
    static void printValue(const char* v)          { printf("%s", v); }
    static void printValue(char* v)                { printf("%s", v); }
    static void printValue(char v)                 { putchar(v); }
    static void printValue(bool v)                 { printf("%s", v ? "true" : "false"); }
    static void printValue(int v)                  { printf("%d", v); }
    static void printValue(unsigned v)             { printf("%u", v); }
    static void printValue(long v)                 { printf("%ld", v); }
    static void printValue(unsigned long v)        { printf("%lu", v); }
    static void printValue(long long v)            { printf("%lld", v); }
    static void printValue(unsigned long long v)   { printf("%llu", v); }
    static void printValue(float v)                { printf("%f", (double)v); }
    static void printValue(double v)               { printf("%f", v); }
    template <typename T>
    static void printValue(const T&)               { printf("[unsupported]"); }

    // --------------------
    // Format implementation
    // --------------------
    template <typename T, typename... Rest>
    static void format(const char* fmt, T value, Rest... rest) {
        while (*fmt) {
            if (*fmt == '\\') {
                ++fmt;
                if (*fmt == '{') putchar('{');
                else if (*fmt == '\\') putchar('\\');
                else putchar('\\');
                ++fmt;
            }
            else if (*fmt == '{' && *(fmt+1) == '}') {
                fmt += 2;
                printValue(value);
                format(fmt, rest...);
                return;
            }
            else putchar(*fmt++);
        }
        // leftover arguments
        appendRemaining(value, rest...);
    }

    static void format(const char* fmt) {
        while (*fmt) {
            if (*fmt == '\\') {
                ++fmt; if (*fmt) putchar(*fmt++);
            } else putchar(*fmt++);
        }
    }

    // Print remaining arguments after placeholders
    template <typename T, typename... Rest>
    static void appendRemaining(T value, Rest... rest) {
        if (separator_enabled) putchar(' ');
        printValue(value);
        appendRemaining(rest...);
    }
    static void appendRemaining() {}
};