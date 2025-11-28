#pragma once

extern "C" {
    #include <stdio.h>
    #include <stdint.h>
    #include <stdbool.h>
}

// With template it is not possible to use cpp 
// I don't know why 

class Printer {
public:
    Printer(const char* separator = " ") : sep(separator) {};

    // Print only Variables out 
    template <typename T>
    void print(T t) {
        printOne(t);
    }

    template<typename T, typename... Args>
    void print(T t, Args... args) {
        printOne(t);
        printf("%s", sep);
        print(args...);
    }

    // print out line
    template <typename T>
    void printl(T t) {
        printOne(t);
        printf("\r\n");
    }

    template<typename T, typename... Args>
    void printl(T t, Args... args) {
        printOne(t);
        printf("%s", sep);
        printl(args...);
    }

private:
    private:
    const char* sep;

    // Overload the printOne function to support different types to print out
    void printOne(const char* val) { printf("%s", val); }
    void printOne(char* val)       { printf("%s", val); }
    void printOne(double val)      { printf("%f", val); }
    void printOne(float val)       { printf("%f", (double)val); }
    void printOne(bool val)        { printf("%s", val ? "true" : "false"); }
    
    // Integers
    void printOne(int8_t val)      { printf("%d", (int)val); }
    void printOne(int16_t val)     { printf("%d", (int)val); }
    void printOne(int32_t val)     { printf("%d", (int)val); }
    void printOne(int64_t val)     { printf("%lld", (long long)val); }
    
    void printOne(int val)         { printf("%d", val); }
    
    // Unsigned integers
    void printOne(uint8_t val)     { printf("%u", (unsigned int)val); }
    void printOne(uint16_t val)    { printf("%u", (unsigned int)val); }
    void printOne(uint32_t val)    { printf("%u", (unsigned int)val); }
    void printOne(uint64_t val)    { printf("%llu", (unsigned long long)val); }
    
    void printOne(unsigned int val){ printf("%u", val); }

    // if type is not listed
    template <typename T>
    void printOne(T t) { printf("[type not supported]"); }
};