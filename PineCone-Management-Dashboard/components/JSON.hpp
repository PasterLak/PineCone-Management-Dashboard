#ifndef SIMPLEJSON_HPP
#define SIMPLEJSON_HPP

extern "C" {
#include <cJSON.h>
#include <stdlib.h>
#include <stdbool.h>
}

class SimpleJSON {
   private:
    cJSON* root;
    char* stringBuffer;

   public:
    SimpleJSON();
    ~SimpleJSON();

    void add(const char* key, const char* value);
    void add(const char* key, int value);
    void add(const char* key, long value);
    void add(const char* key, float value);
    void add(const char* key, bool value);

    const char* getString();
    void clean();
};

#endif