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
    // print without newline
    template <typename... Args>
    static void print(const char* fmt, const Args&... args) {
        format_impl(fmt, args...);
    }

    // print with newline
    template <typename... Args>
    static void println(const char* fmt, const Args&... args) {
        format_impl(fmt, args...);
        putchar('\n');
    }

    // compile-time checked version (fmt must be string literal)
    template <size_t N, typename... Args>
    static void println_ct(const char (&fmt)[N], const Args&... args) {
        static_assert(count_placeholders(fmt) <= sizeof...(Args),
                      "Not enough arguments for format string");
        format_impl(fmt, args...);
        putchar('\n');
    }

private:
    // print one value — basic supported types
    static void printValue(const char* v)            { printf("%s", v); }
    static void printValue(char* v)                  { printf("%s", v); }
    static void printValue(bool v)                   { printf("%s", v ? "true" : "false"); }
    static void printValue(int v)                    { printf("%d", v); }
    static void printValue(unsigned v)               { printf("%u", v); }
    static void printValue(long v)                   { printf("%ld", v); }
    static void printValue(unsigned long v)          { printf("%lu", v); }
    static void printValue(long long v)              { printf("%lld", v); }
    static void printValue(unsigned long long v)     { printf("%llu", v); }
    static void printValue(float v)                  { printf("%f", (double)v); }
    static void printValue(double v)                 { printf("%f", v); }

    template <typename T>
    static void printValue(const T&)                 { printf("[unsupported]"); }

    // ------------------------------------------------
    // Format implementation
    // ------------------------------------------------
    template <typename T, typename... Rest>
    static void format_impl(const char* fmt, T value, Rest... rest) {
        const char* p = fmt;
        while (*p) {
            if (*p == '\\') {
                ++p;
                if (*p == '{') { putchar('{'); ++p; }
                else if (*p == '\\') { putchar('\\'); ++p; }
                else { putchar('\\'); }
            }
            else if (*p == '{' && p[1] == '}') {
                p += 2;
                printValue(value);
                format_impl(p, rest...);
                return;
            }
            else {
                putchar(*p);
                ++p;
            }
        }
    }

    // Base case: no more arguments
    static void format_impl(const char* fmt) {
        const char* p = fmt;
        while (*p) {
            if (*p == '\\') {
                ++p;
                if (*p == '{') { putchar('{'); ++p; }
                else if (*p == '\\') { putchar('\\'); ++p; }
                else { putchar('\\'); }
            }
            else { putchar(*p); ++p; }
        }
    }

    // ------------------------------------------------
    // compile-time count "{}" placeholders
    // ------------------------------------------------
    template <size_t N>
    static constexpr size_t count_placeholders(const char (&fmt)[N]) {
        size_t count = 0;
        for (size_t i = 0; i + 1 < N; ++i) {
            if (fmt[i] == '\\') { ++i; continue; }
            if (fmt[i] == '{' && fmt[i+1] == '}') { ++count; ++i; }
        }
        return count;
    }
};