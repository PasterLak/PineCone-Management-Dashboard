#include "WLANHandler.hpp"

#include <stdio.h>
#include <string.h>

extern "C" {
    #include <FreeRTOS.h>
    #include <task.h>
    #include <wifi_mgmr_ext.h>
    #include <lwip/sockets.h>
    #include <lwip/inet.h>
    #include <lwip/netdb.h>
    #include <easyflash.h>
    #include <vfs.h>
    #include <libfdt.h>
    #include <hal_board.h>
    #include <hal_button.h>
    #include <hal_gpio.h>
    #include <hal_sys.h>
    #include <hal_uart.h>
    #include <hal_wifi.h>
    #include <event_device.h>
}

#include <etl/array.h>
#include <etl/string.h>

WLANHandler::WLANHandler(const char* mySsid, const char* myPassword) {
    this->ssid = mySsid;
    this->password = myPassword;
}

char* WLANHandler::get_password(){
    return (char*)this->password;
}

void WLANHandler::start() {
     if (!wifi_initialized) {

        static wifi_conf_t conf{
            .country_code = "EU",
            .channel_nums = {}
        };

        easyflash_init();

        vfs_init();
        vfs_device_init();

        hal_wifi_start_firmware_task();

        vTaskDelay(pdMS_TO_TICKS(500));

        wifi_mgmr_start_background(&conf);

        wifi_initialized = true;
        
    }
    
    auto wifi_interface = wifi_mgmr_sta_enable();

    wifi_mgmr_sta_connect(&wifi_interface, 
                            (char*)this->ssid,
                            (char*)this->password, 
                            nullptr, 0, 0, 0);
    printf("[WIFI] Connected to a network\r\n");

    wifi_mgmr_sta_autoconnect_enable();
}

bool WLANHandler::isConnected() {
    int state;
    wifi_mgmr_state_get(&state);
    
    printf("Code number %u with Code: %s",state,wifi_mgmr_status_code_str(state));
    return true;
}

char* WLANHandler::get_ip_address() {
    uint32_t ip;
    uint32_t mask;
    wifi_mgmr_ap_ip_get(&ip,nullptr,&mask);

    struct in_addr ip_addr;
    ip_addr.s_addr = ip;

    return inet_ntoa(ip_addr);
}

// Sendet Daten
void WLANHandler::sendData(const char* ip_address) {
    int sock;
    struct sockaddr_in server_addr;
    const char* payload = "{\"device\":\"PineCone\",\"status\":\"ok\"}";
    char request[256];

    // Socket erstellen
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        printf("[NET] Error: Socket creation failed.\r\n");
        return;
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(80);
    server_addr.sin_addr.s_addr = inet_addr(ip_address);

    printf("[NET] Connecting to Server %s...\r\n", ip_address);
    if (connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        printf("[NET] Error: Server connection failed.\r\n");
        close(sock);
        return;
    }

    snprintf(request, sizeof(request),
        "POST /api/data HTTP/1.1\r\n"
        "Host: %s\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: %d\r\n\r\n"
        "%s",
        ip_address, strlen(payload), payload);

    if (write(sock, request, strlen(request)) < 0) {
        printf("[NET] Error: Sending failed.\r\n");
    } else {
        printf("[NET] Data sent successfully!\r\n");
    }

    close(sock);
}
