#include "program.hpp"
#include "DeltaTime.hpp"

extern "C" {
#include <stdio.h>
#include <bl_timer.h>
}

#define BUILD_VERSION 4

static long counter = 0;
static long counter2 = 0;
#define LED_PIN 11

DeltaTime deltaTime;

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");
    printf("====== BUILD: %d ======\r\n", BUILD_VERSION);
}

void loop() {
    counter++;
    deltaTime.update();

    if(counter > 1000000) {
        counter = 0;
        counter2++;
        
        char deltaStr[64];
        deltaTime.getAsString(deltaStr, sizeof(deltaStr));
        
        printf("Counter: %ld\r\n", counter2);
        printf("%s\r\n", deltaStr);
        printf("Current: %luus (%.3fms) FPS: %.1f\r\n", 
               deltaTime.getUs(), deltaTime.getMs(), deltaTime.getFps());
        printf("Stats - Avg: %.1fus Min: %luus Max: %luus\r\n",
               deltaTime.getAverageUs(), deltaTime.getMinUs(), deltaTime.getMaxUs());
    }
}