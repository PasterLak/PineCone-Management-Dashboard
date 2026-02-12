#include "program.hpp"

extern "C" {
#include <stdio.h>
#include <bl_timer.h>
#include "pins.h"
#include <FreeRTOS.h>
#include <lwip/tcpip.h>
#include <task.h>
}

#include "components/delta_time.hpp"
//#include <etl/string.h>

//extentions
#include "extentions/Print.hpp"

// Wifi
#include "components/WLANHandler.hpp"

// MQTT
#include "components/mqtt.hpp"

// JSON
#include "components/JSON.hpp"

#define BUILD_VERSION 7


static long counter = 0;
#define LED_PIN 11
#define BUTTON_PIN 4

static float time = 0.0f;
const float timeIntervalSec = 1.0f; // 60 frames per second

DeltaTime* deltaTime = nullptr;
//static char deltaStr[64];

Printer* printer = nullptr;
WLANHandler* wlan = nullptr;

MQTT* mqtt = nullptr;

SimpleJSON* json = nullptr;

const char* lastMessage = "";

void task_app_wrapper(void* pvParameters) {
    (void)pvParameters;
    vTaskDelay(pdMS_TO_TICKS(100));

    printer = new Printer();
    deltaTime = new DeltaTime();

    wlan = new WLANHandler("WIFI_SSID", "WIFI_PW");

    mqtt = new MQTT("suas", "J4auBDJYzcrL8s9TEZJt", "pinecone/receive");
    json = new SimpleJSON();

    start();

    while (1) {
        loop();
    }
}

void start() {
    printer->printl("====== PINECONE BL602 STARTED! ======");
    printer->printl("====== BUILD:",BUILD_VERSION,"======");

   wlan->start();
}

bool mqttStarted = false;

// Status-Variable: Versuchen wir gerade zu verbinden?
bool isConnecting = false; 
// Timeout-Zähler
float connectionTimer = 0.0f;

void loop() {
    deltaTime->update();
    time += deltaTime->getSec();

    if (mqtt->isConnected()) {
        isConnecting = false; 
        
        if (mqtt->hasNewMessage()) {
            lastMessage = mqtt->getNextMessage();
            printer->printl("New Message:", lastMessage);
        }
    }

    if (time > timeIntervalSec) {
        time = 0.0f;
        counter++;
        
        if (wlan->isConnected()) {
            if (!mqtt->isConnected()) {
                if (!isConnecting) {
                    printer->printl("MQTT Disconnected. Starting TLS Handshake...");
                    mqtt->connectToIP("192.168.2.30");
                    isConnecting = true;
                    connectionTimer = 0.0f;
                } 
                else {
                    connectionTimer += timeIntervalSec;
                    printer->printl("... connecting (please wait) ...");
                    
                    if (connectionTimer > 15.0f) {
                        printer->printl("Timeout! Force Disconnect and Retry.");
                        mqtt->disconnect(); 
                        
                        isConnecting = false;
                    }
                }
            } 
            else {
                json->add("Counter", counter);
                json->add("Status", "Online");
                
                mqtt->publish("pinecone/heartbeat", json->getString());
                printer->printl("Heartbeat sent.");
            }
        } 
        else {
            printer->printl("WLAN lost! Waiting for Wifi...");
        }
    }
}
