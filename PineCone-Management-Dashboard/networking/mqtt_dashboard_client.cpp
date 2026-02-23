#include "mqtt_dashboard_client.hpp"

extern "C" {
#include <cJSON.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
}

MqttDashboardClient::MqttDashboardClient(const char* user, const char* password,
                                         const char* pub_topic,
                                         const char* sub_topic)
    : mqtt(user, password, sub_topic),
      debug_enabled(false),
      publish_topic(pub_topic) {}

void MqttDashboardClient::setDebugEnabled(bool enabled) {
  debug_enabled = enabled;
}

bool MqttDashboardClient::sync(const char* server_ip, uint16_t port,
                               const DeviceSyncState& state,
                               ServerCommand& response) {
  (void)port;

  response.status_ok = false;
  response.new_node_id[0] = '\0';
  response.new_description[0] = '\0';
  response.should_blink = false;
  response.force_full_sync = false;

  if (!mqtt.isConnected()) {
    mqtt.connectToIP(server_ip);
    return false;
  }

  cJSON* root = cJSON_CreateObject();
  if (!root) {
    return false;
  }

  cJSON_AddStringToObject(root, "node_id", state.node_id);

  if (state.send_full_sync) {
    cJSON_AddTrueToObject(root, "full_sync");
  }

  if (state.send_desc) {
    cJSON_AddStringToObject(root, "description", state.description);
  }

  if (state.send_pins && state.pins_json) {
    cJSON* pins_obj = cJSON_Parse(state.pins_json);
    if (pins_obj) {
      cJSON_AddItemToObject(root, "pins", pins_obj);
    }
  }

  char* payload = cJSON_PrintUnformatted(root);
  cJSON_Delete(root);

  if (!payload) {
    return false;
  }

  mqtt.publish(publish_topic, payload);
  cJSON_free(payload);

  if (mqtt.hasNewMessage()) {
    const char* msg = mqtt.getNextMessage();
    parseServerResponse(msg, response);
    return response.status_ok;
  }

  return true;
}

void MqttDashboardClient::parseServerResponse(const char* json,
                                              ServerCommand& response) {
  cJSON* root = cJSON_Parse(json);
  if (!root) {
    return;
  }

  cJSON* status = cJSON_GetObjectItem(root, "status");
  if (status && status->type == cJSON_String &&
      strcmp(status->valuestring, "ok") == 0) {
    response.status_ok = true;
  } else {
    cJSON_Delete(root);
    return;
  }

  cJSON* parsed_node_id = cJSON_GetObjectItem(root, "node_id");
  if (parsed_node_id && parsed_node_id->type == cJSON_String) {
    snprintf(response.new_node_id, sizeof(response.new_node_id), "%s",
             parsed_node_id->valuestring);
  }

  cJSON* parsed_description = cJSON_GetObjectItem(root, "description");
  if (parsed_description && parsed_description->type == cJSON_String) {
    snprintf(response.new_description, sizeof(response.new_description), "%s",
             parsed_description->valuestring);
  }

  cJSON* blink = cJSON_GetObjectItem(root, "blink");
  response.should_blink = (blink && blink->type == cJSON_True);

  cJSON* force_full_sync = cJSON_GetObjectItem(root, "force_full_sync");
  response.force_full_sync =
      (force_full_sync && force_full_sync->type == cJSON_True);

  cJSON_Delete(root);
}