#pragma once

#include <stdio.h>
#include <string.h>

extern "C" {
    #include <FreeRTOS.h>
    #include <task.h>
    #include <wifi_mgmr_ext.h>
    #include <lwip/sockets.h>
    #include <lwip/inet.h>
    #include <lwip/netdb.h>
}

class WLANHandler {
private:
    const char* ssid;
    const char* password;
    bool wifi_initialized = false;
public:
    WLANHandler(const char* mySsid, const char* myPassword);

    void start();

    // KORRIGIERT: Nur ein "bool"
    bool isConnected();

    void sendData(const char* ip_address, const int port, const char* custom_endpoint);

    char* get_password();

    char* get_ip_address();

    char* getStatusCode();
};
