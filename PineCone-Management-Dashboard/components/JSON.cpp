#include "JSON.hpp"

SimpleJSON::SimpleJSON() {
    this->root = cJSON_CreateObject();
    this->stringBuffer = NULL;
}

SimpleJSON::~SimpleJSON() {
    if (this->root != NULL) {
        cJSON_Delete(this->root);
    }
    if (this->stringBuffer != NULL) {
        free(this->stringBuffer);
    }
}

void SimpleJSON::add(const char* key, const char* value) {
    cJSON_DeleteItemFromObject(this->root, key);
    cJSON_AddStringToObject(this->root, key, value);
}

void SimpleJSON::add(const char* key, int value) {
    cJSON_DeleteItemFromObject(this->root, key);
    cJSON_AddNumberToObject(this->root, key, value);
}

void SimpleJSON::add(const char* key, long value) {
    cJSON_DeleteItemFromObject(this->root, key);
    cJSON_AddNumberToObject(this->root, key, (double)value);
}

void SimpleJSON::add(const char* key, float value) {
    cJSON_DeleteItemFromObject(this->root, key);
    cJSON_AddNumberToObject(this->root, key, value);
}

void SimpleJSON::add(const char* key, bool value) {
    cJSON_DeleteItemFromObject(this->root, key);
    cJSON_AddBoolToObject(this->root, key, value);
}

const char* SimpleJSON::getString() {
    if (this->stringBuffer != NULL) {
        free(this->stringBuffer);
        this->stringBuffer = NULL;
    }
    this->stringBuffer = cJSON_PrintUnformatted(this->root);
    return this->stringBuffer;
}

void SimpleJSON::clean() {
    if (this->stringBuffer != NULL) {
        free(this->stringBuffer);
        this->stringBuffer = NULL;
    }
    if (this->root != NULL) {
        cJSON_Delete(this->root);
    }
    this->root = cJSON_CreateObject();
}