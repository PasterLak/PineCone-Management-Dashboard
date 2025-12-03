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
        process(fmt, args...);
    }

    template <typename... Args>
    static void println(const char* fmt, Args... args) {
        process(fmt, args...);
        putchar('\n');
    }

private:
    inline static bool separator_enabled = true;

    // --------------------
    // Print single value
    // --------------------
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


    template <typename... Args>
    static void process(const char* fmt, Args... args) {
        void* arg_ptrs[sizeof...(Args)] = { (void*)&args... };
        char arg_types[sizeof...(Args)] = { getTypeCode(args)... };
        size_t total_args = sizeof...(Args);
        size_t arg_index = 0;

        while (*fmt) {
            if (*fmt == '\\') {
                ++fmt;
                if (*fmt == '{') { putchar('{'); ++fmt; }
                else if (*fmt == '\\') { putchar('\\'); ++fmt; }
                else putchar('\\');
            }
            else if (*fmt == '{' && *(fmt+1) == '}') {
                fmt += 2;
                if (arg_index < total_args) {
                    printGeneric(arg_ptrs[arg_index], arg_types[arg_index]);
                    ++arg_index;
                } else {
                    putchar('{'); putchar('}');
                }
            }
            else {
                putchar(*fmt++);
            }
        }

        // Print remaining arguments after all placeholders
        for (size_t i = arg_index; i < total_args; ++i) {
            if (separator_enabled) putchar(' ');
            printGeneric(arg_ptrs[i], arg_types[i]);
        }
    }

    // --------------------
    // Type detection
    // --------------------
    static constexpr char getTypeCode(int) { return 'i'; }
    static constexpr char getTypeCode(unsigned) { return 'i'; }
    static constexpr char getTypeCode(long) { return 'i'; }
    static constexpr char getTypeCode(unsigned long) { return 'i'; }
    static constexpr char getTypeCode(long long) { return 'i'; }
    static constexpr char getTypeCode(unsigned long long) { return 'i'; }
    static constexpr char getTypeCode(char) { return 'c'; }
    static constexpr char getTypeCode(const char*) { return 's'; }
    static constexpr char getTypeCode(char*) { return 's'; }
    static constexpr char getTypeCode(bool) { return 'b'; }
    static constexpr char getTypeCode(float) { return 'f'; }
    static constexpr char getTypeCode(double) { return 'f'; }
    template <typename T>
    static constexpr char getTypeCode(T) { return 'o'; }

    // --------------------
    // Generic print
    // --------------------
    static void printGeneric(void* ptr, char type) {
        switch(type) {
            case 'i': printf("%d", *(int*)ptr); break;
            case 'c': putchar(*(char*)ptr); break;
            case 's': printf("%s", *(const char**)ptr); break;
            case 'b': printf("%s", *(bool*)ptr ? "true" : "false"); break;
            case 'f': printf("%f", *(double*)ptr); break;
            default: printf("[unsupported]"); break;
        }
    }
};
