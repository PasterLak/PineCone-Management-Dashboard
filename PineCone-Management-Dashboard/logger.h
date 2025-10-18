#ifndef LOGGER_H
#define LOGGER_H

#include <stdio.h>

// Simple log functions
void log_msg(const char *message);
void log_int(const char *text, int value);
void log_long(const char *text, long value);
void log_str(const char *text, const char *value);
void log_float(const char *text, float value);
void log_hex(const char *text, unsigned int value);

// Conditional logging
void log_if(int condition, const char *text, int value);

#endif