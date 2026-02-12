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

        static wifi_conf_t conf = {
            .country_code = "EU",
            .channel_nums = {},
        };

        easyflash_init();
        vfs_init();
        vfs_device_init();

        hal_wifi_start_firmware_task();
        vTaskDelay(pdMS_TO_TICKS(300));

        wifi_mgmr_start_background(&conf);
        vTaskDelay(pdMS_TO_TICKS(300));

        wifi_initialized = true;
    }

    auto wifi_interface = wifi_mgmr_sta_enable();

    vTaskDelay(pdMS_TO_TICKS(200));

    wifi_mgmr_sta_connect(
        &wifi_interface,
        (char*)ssid,
        (char*)password,
        NULL, 0, 0, 0
    );

    printf("[WIFI] Connecting...\r\n");
}

bool WLANHandler::isConnected() {
    int state;
    wifi_mgmr_state_get(&state);
    return state == WIFI_STATE_CONNECTED_IP_GOT;
}

char* WLANHandler::getStatusCode(){
    int status;
    wifi_mgmr_status_code_get(&status);
    return (char*)wifi_mgmr_status_code_str(status);
}

char* WLANHandler::get_ip_address() {
    uint32_t ip;
    uint32_t mask;
    uint32_t gw;

    wifi_mgmr_sta_ip_get(&ip, &gw, &mask);

    struct in_addr ip_addr; 
    ip_addr.s_addr = ip; 
    
    return inet_ntoa(ip_addr);
}

char* WLANHandler::get_mac_address(){
    uint8_t mac[6];
    static char macStr[18];
    wifi_mgmr_ap_mac_get(mac);

    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    return macStr;
}