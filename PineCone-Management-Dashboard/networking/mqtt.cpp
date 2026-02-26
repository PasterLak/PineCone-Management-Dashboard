#include "mqtt.hpp"

extern "C" {
#include <bl_sec.h>
#include <lwip/ip_addr.h>
#include <stdio.h>
#include <string.h>
#include <lwip/apps/mqtt.h>
#include <lwip/apps/mqtt_opts.h>
#include <lwip/apps/mqtt_priv.h>

#if defined(ENABLE_MQTTS) && (ENABLE_MQTTS == 1)
#include <lwip/altcp_tls.h>
#endif
}

#if defined(ENABLE_MQTTS) && (ENABLE_MQTTS == 1)
#include "keys.hpp"
#endif

MQTT::MQTT(const char* u, const char* p, const char* subscribeTopic) {
    user = u;
    password = p;
    mqttConnected = false;
    topicNr = 0;
    subscribedTopic = subscribeTopic;
    memset(&mqttClient,0,sizeof(mqttClient));
    memset(&mqttClient, 0, sizeof(mqttClient));
    memset(brokerIpString, 0, sizeof(brokerIpString));
    #if defined(ENABLE_MQTTS) && (ENABLE_MQTTS == 1)
        tls_config = nullptr;
    #endif
}

void MQTT::disconnect() {
    mqtt_unsubscribe(&mqttClient, subscribedTopic.data(), nullptr, 0);
    mqtt_disconnect(&mqttClient);
    mqttConnected = false;
    printf("[%s] Done\r\n", "disconnect");
}

const char* MQTT::getNextMessage() {
    newMessageReceived = false;
    return lastMessage.c_str();
}

void MQTT::publish_cb(void *arg, err_t result) {
    (void)arg;
    if (result == ERR_OK) {
        printf("[%s] Published message\r\n", "publish_cb");
    } else {
        printf("[%s] Could not publish message: %d\r\n", "publish_cb", result);
    }
}

void MQTT::publish(const char* topic, const char* payloadStr) {
    if (!mqttConnected) {
        printf("[%s] Not connected\r\n", "publish");
    } else {
        auto payload = etl::string_view(payloadStr);

        u8_t qos = 0; 
        u8_t retain = 0;

        auto err = mqtt_publish(&mqttClient, topic, payload.data(),
                                payload.length(), qos, retain,
                                MQTT::publish_cb, 0);

        if (err != ERR_OK) {
            printf("[%s] Error: %d\r\n", "publish", err);

            // Disconnect immediately so the main loop can trigger a clean reconnect.
            if (err == -3 || err == -4) { 
            printf("[%s] Fatal network error, forcing disconnect...\r\n", "publish");
            this->disconnect();
        }
        }
    }
}

void MQTT::incoming_topic_cb(void *arg, const char *topic, u32_t total_len) {
    (void) total_len;

    MQTT* self = static_cast<MQTT*>(arg);
    auto messageTopic = etl::string_view(topic);

    if (messageTopic == etl::string_view(self->subscribedTopic)) {
        self->topicNr = 0;
    } else {
        self->topicNr = 1;
    }
}

void MQTT::incoming_payload_cb(void *arg, const u8_t *data, u16_t len, u8_t flags) {
    MQTT* self = static_cast<MQTT*>(arg);
    if (flags & MQTT_DATA_FLAG_LAST && self->topicNr == 0) {
        self->lastMessage.assign(reinterpret_cast<const char*>(data), len);
        self->newMessageReceived = true;
    }
}

void MQTT::sub_request_cb(void *arg, err_t result) {
    (void)arg;
    if (result == ERR_OK) {
        printf("[%s] Subscribed\r\n", "sub_request_cb");
    } else {
        printf("[%s] Error: %d\r\n", "sub_request_cb", result);
    }
}

void MQTT::connected_cb(mqtt_client_t *client, void *arg, mqtt_connection_status_t status) {
    (void)client;
    MQTT* self = static_cast<MQTT*>(arg);

    if (status == MQTT_CONNECT_ACCEPTED) {
        printf("[%s] Connected\r\n", "connected_cb");
        self->mqttConnected = true;

        mqtt_set_inpub_callback(&self->mqttClient, MQTT::incoming_topic_cb,
                                MQTT::incoming_payload_cb, self);

        mqtt_subscribe(&self->mqttClient, self->subscribedTopic.data(), 1, MQTT::sub_request_cb, self);
    } else {
        self->mqttConnected = false;
        printf("[%s] Disconnected/Error\r\n", "connected_cb");
    }
}

void MQTT::connectToIP(const char* brokerIP) {
    if (brokerIP != nullptr) {
        strncpy(this->brokerIpString, brokerIP, sizeof(this->brokerIpString) - 1);
    }

    int ip1, ip2, ip3, ip4;
    sscanf(this->brokerIpString, "%d.%d.%d.%d", &ip1, &ip2, &ip3, &ip4);
    IP_ADDR4(&this->mqttBrokerIp, ip1, ip2, ip3, ip4);

    int randomId = (int)bl_rand();
    clientIdStr.resize(16);
    snprintf(clientIdStr.data(), clientIdStr.size() + 1, "%02x", randomId);

    memset(&client_info, 0, sizeof(client_info));
    client_info.client_id = clientIdStr.data();
    client_info.client_user = user;
    client_info.client_pass = password;
    client_info.keep_alive = 60;

#if defined(ENABLE_MQTTS) && (ENABLE_MQTTS == 1)
    if (this->tls_config != nullptr) {
        altcp_tls_free_config(this->tls_config); 
    }
    
    this->tls_config = altcp_tls_create_config_client_2wayauth(
        (const u8_t*)CA_CERT.data(), CA_CERT_LEN, 
        (const u8_t*)PRIV_KEY.data(), PRIV_KEY_LEN, 
        nullptr, 0,
        (const u8_t*)CERT.data(), CERT_LEN);
        
    this->client_info.tls_config = this->tls_config;
    
    mqtt_client_connect(&mqttClient, &mqttBrokerIp, 8883, MQTT::connected_cb, this, &this->client_info);
#else
    mqtt_client_connect(&mqttClient, &mqttBrokerIp, 1883, MQTT::connected_cb, this, &this->client_info);
#endif
}