#include "logger.h"

void log_msg(const char *message)
{
    printf("%s\r\n", message);
}

void log_int(const char *text, int value)
{
    printf("%s%d\r\n", text, value);
}

void log_long(const char *text, long value)
{
    printf("%s%d\r\n", text, value);
}

void log_str(const char *text, const char *value)
{
    printf("%s%s\r\n", text, value);
}

void log_float(const char *text, float value)
{
    printf("%s%.2f\r\n", text, value);
}

void log_hex(const char *text, unsigned int value)
{
    printf("%s0x%X\r\n", text, value);
}

void log_if(int condition, const char *text, int value)
{
    if (condition) {
        printf("%s%d\r\n", text, value);
    }
}