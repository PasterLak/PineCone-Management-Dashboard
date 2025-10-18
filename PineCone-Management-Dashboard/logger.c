#include "logger.h"

void log_msg(const char *message)
{
    printf("[LOG] %s\r\n", message);
}

void log_int(const char *text, int value)
{
    printf("[LOG] %s: %d\r\n", text, value);
}

void log_long(const char *text, long value)
{
    printf("[LOG] %s: %d\r\n", text, value);
}

void log_str(const char *text, const char *value)
{
    printf("[LOG] %s: %s\r\n", text, value);
}

void log_float(const char *text, float value)
{
    printf("[LOG] %s: %.2f\r\n", text, value);
}

void log_hex(const char *text, unsigned int value)
{
    printf("[LOG] %s: 0x%X\r\n", text, value);
}

void log_if(int condition, const char *text, int value)
{
    if (condition) {
        printf("[LOG] %s: %d\r\n", text, value);
    }
}