#include "json_parser.hpp"

#include <stdio.h>
#include <string.h>

const char* JSONParser::skipWhitespace(const char* ptr) {
  while (*ptr == ' ' || *ptr == '\t' || *ptr == '\n' || *ptr == '\r') {
    ptr++;
  }
  return ptr;
}

const char* JSONParser::findValue(const char* json, const char* key) {
  // Build search pattern: "key"
  char search_key[64];
  snprintf(search_key, sizeof(search_key), "\"%s\"", key);

  // Find key
  const char* key_ptr = strstr(json, search_key);
  if (!key_ptr) {
    return nullptr;
  }

  // Find colon after key
  const char* colon = strchr(key_ptr, ':');
  if (!colon) {
    return nullptr;
  }

  // Skip colon and whitespace
  return skipWhitespace(colon + 1);
}

bool JSONParser::getString(const char* json, const char* key, char* out_buffer,
                           size_t buffer_size) {
  const char* value_ptr = findValue(json, key);
  if (!value_ptr) {
    return false;
  }

  // Check for opening quote
  if (*value_ptr != '"') {
    return false;
  }
  value_ptr++;

  // Find closing quote
  const char* end_ptr = strchr(value_ptr, '"');
  if (!end_ptr) {
    return false;
  }

  // Copy value
  size_t len = end_ptr - value_ptr;
  if (len >= buffer_size) {
    printf("[JSON] WARNING: Value for '%s' too long (%d >= %d)\r\n", key,
           (int)len, (int)buffer_size);
    return false;
  }

  strncpy(out_buffer, value_ptr, len);
  out_buffer[len] = '\0';
  return true;
}

bool JSONParser::getBool(const char* json, const char* key, bool& out_value) {
  const char* value_ptr = findValue(json, key);
  if (!value_ptr) {
    out_value = false;
    return false;
  }

  // Check for "true" or "false"
  if (strncmp(value_ptr, "true", 4) == 0) {
    out_value = true;
    return true;
  } else if (strncmp(value_ptr, "false", 5) == 0) {
    out_value = false;
    return true;
  }

  out_value = false;
  return false;
}

bool JSONParser::isStatusOk(const char* json) {
  char status[16];
  if (getString(json, "status", status, sizeof(status))) {
    return strcmp(status, "ok") == 0;
  }
  return false;
}
