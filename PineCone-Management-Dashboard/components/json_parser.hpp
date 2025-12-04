#pragma once

#include <stdbool.h>
#include <stddef.h>

class JSONParser {
 public:
  // Parse a string value from JSON
  // Returns true if key found and value extracted
  static bool getString(const char* json, const char* key, char* out_buffer,
                        size_t buffer_size);

  // Parse a boolean value from JSON
  // Returns true if key found, sets out_value accordingly
  // If key not found, returns false and sets out_value to false
  static bool getBool(const char* json, const char* key, bool& out_value);

  // Check if status field equals "ok"
  static bool isStatusOk(const char* json);

 private:
  // Helper: find key and return pointer to value start (after ':')
  static const char* findValue(const char* json, const char* key);

  // Helper: skip whitespace characters
  static const char* skipWhitespace(const char* ptr);
};
