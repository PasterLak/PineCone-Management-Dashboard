#include "json_parser.hpp"

#include <stdio.h>
#include <string.h>

const char* JSONParser::skipWhitespace(const char* ptr) {
  if (!ptr) return nullptr;
  while (*ptr == ' ' || *ptr == '\t' || *ptr == '\n' || *ptr == '\r') {
    ++ptr;
  }
  return ptr;
}

const char* JSONParser::findValue(const char* json, const char* key) {
  if (!json || !key || !*key) {
    return nullptr;
  }

  const size_t key_len = strlen(key);
  const char* p = json;

  while ((p = strchr(p, '"')) != nullptr) {
    ++p;

    if (strncmp(p, key, key_len) == 0 && p[key_len] == '"') {
      const char* colon = strchr(p + key_len + 1, ':');
      if (!colon) {
        return nullptr;
      }
      return skipWhitespace(colon + 1);
    }
  }

  return nullptr;
}

bool JSONParser::getString(const char* json, const char* key, char* out_buffer,
                           size_t buffer_size) {
  if (!out_buffer || buffer_size == 0) {
    return false;
  }

  out_buffer[0] = '\0';

  const char* value_ptr = findValue(json, key);
  if (!value_ptr || *value_ptr != '"') {
    return false;
  }

  ++value_ptr;
  const char* end_ptr = strchr(value_ptr, '"');
  if (!end_ptr) {
    return false;
  }

  size_t len = (size_t)(end_ptr - value_ptr);
  if (len + 1 > buffer_size) {
    printf("[JSON] WARNING: Value for '%s' too long (%d >= %d)\r\n", key,
           (int)len, (int)buffer_size);
    return false;
  }

  memcpy(out_buffer, value_ptr, len);
  out_buffer[len] = '\0';
  return true;
}

bool JSONParser::getBool(const char* json, const char* key, bool& out_value) {
  out_value = false;

  const char* value_ptr = findValue(json, key);
  if (!value_ptr) {
    return false;
  }

  if (strncmp(value_ptr, "true", 4) == 0 &&
      (value_ptr[4] == ',' || value_ptr[4] == '}' ||
       value_ptr[4] == ' ' || value_ptr[4] == '\n')) {
    out_value = true;
    return true;
  }

  if (strncmp(value_ptr, "false", 5) == 0 &&
      (value_ptr[5] == ',' || value_ptr[5] == '}' ||
       value_ptr[5] == ' ' || value_ptr[5] == '\n')) {
    out_value = false;
    return true;
  }

  return false;
}

bool JSONParser::isStatusOk(const char* json) {
  char status[16];
  if (getString(json, "status", status, sizeof(status))) {
    return strcmp(status, "ok") == 0;
  }
  return false;
}
