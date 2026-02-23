#pragma once

#include "i_dashboard_client.hpp"
#include "mqtt.hpp"

class MqttDashboardClient : public IDashboardClient {
 public:
  MqttDashboardClient(const char* user, const char* password,
                      const char* pub_topic, const char* sub_topic);

  bool sync(const char* server_ip, uint16_t port, const DeviceSyncState& state,
            ServerCommand& response) override;

  void setDebugEnabled(bool enabled) override;

 private:
  MQTT mqtt;
  bool debug_enabled;
  const char* publish_topic;

  void parseServerResponse(const char* json, ServerCommand& response);
};