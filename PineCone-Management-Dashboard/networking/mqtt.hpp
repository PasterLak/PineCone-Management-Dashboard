#pragma once

#include <etl/string.h>
#include <etl/string_view.h>

extern "C" {
#include <lwip/apps/mqtt.h>
#include <lwip/apps/mqtt_opts.h>
#include <lwip/apps/mqtt_priv.h>
}

#define ENABLE_MQTTS 1

class MQTT {
public:
    MQTT(const char* user = nullptr, const char* password = nullptr, const char* subscribeTopic = "");

    void connectToIP(const char* brokerIP);
    void disconnect();
    void publish(const char* topic, const char* payload);
    bool hasNewMessage() const { return newMessageReceived; }
    const char* getNextMessage();
    bool isConnected() const { return mqttConnected; }

private:
    mqtt_client_t mqttClient;
    struct mqtt_connect_client_info_t client_info;

    ip_addr_t mqttBrokerIp;
    char brokerIpString[32];
    
    etl::string<32> clientIdStr;
    etl::string<64> subscribedTopic;
    etl::string<128> lastMessage;
    
    const char* user;
    const char* password;
    
    bool mqttConnected;
    bool newMessageReceived;
    uint8_t topicNr;

    static void connected_cb(mqtt_client_t* client, void* arg, mqtt_connection_status_t status);
    static void incoming_topic_cb(void *arg, const char *topic, u32_t total_len);
    static void incoming_payload_cb(void *arg, const u8_t *data, u16_t len, u8_t flags);
    static void sub_request_cb(void *arg, err_t result);
    static void publish_cb(void *arg, err_t result);

    #if defined(ENABLE_MQTTS) && (ENABLE_MQTTS == 1)
        struct altcp_tls_config *tls_config;
    #endif
};