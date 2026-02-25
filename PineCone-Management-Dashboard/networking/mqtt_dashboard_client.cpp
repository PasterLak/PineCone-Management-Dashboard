#include "mqtt_dashboard_client.hpp"

extern "C" {
#include <cJSON.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <FreeRTOS.h>
#include <task.h>
}

MqttDashboardClient::MqttDashboardClient(const char* user, const char* password,
                                         const char* pub_topic,
                                         const char* sub_topic)
    : mqtt(user, password, pub_topic),
      debug_enabled(false),
      sublish_topic(sub_topic) {}

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
    if (!isConnecting) {
      printf("Starting MQTT connection...\n");
      mqtt.connectToIP(server_ip);
      isConnecting = true;
    }
    return false;
  }

  isConnecting = false;

  cJSON* root = cJSON_CreateObject();
  if (root) {
    if (state.node_id != nullptr) {
      cJSON_AddStringToObject(root, "node_id", state.node_id);
    }

    if (state.send_full_sync) {
      cJSON_AddTrueToObject(root, "full_sync");
    }

    if (state.send_desc && state.description != nullptr) {
      cJSON_AddStringToObject(root, "description", state.description);
    }

    if (state.send_pins && state.pins_json != nullptr) {
      cJSON* pins_obj = cJSON_Parse(state.pins_json);
      if (pins_obj) {
        cJSON_AddItemToObject(root, "pins", pins_obj);
      }
    }

    static char payload_buffer[1024]; 
    if (cJSON_PrintPreallocated(root, payload_buffer, sizeof(payload_buffer), 0)) {
      mqtt.publish(sublish_topic, payload_buffer);
    }
    
    cJSON_Delete(root);
  }

  if (mqtt.hasNewMessage()) {
    const char* msg = mqtt.getNextMessage();
    if (msg != nullptr && strlen(msg) > 0) {
      parseServerResponse(msg, response);
      return response.status_ok;
    }
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