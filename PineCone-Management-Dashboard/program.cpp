

extern "C" {
#include <stdio.h>
#include <bl_timer.h>
}
#include "program.hpp"
#include "components/delta_time.hpp"
//#include "button.hpp"
//#include <iostream> // For std::cout, std::endl

#define BUILD_VERSION 6


static long counter = 0;
#define LED_PIN 11

static float time = 0.0f;
const float timeIntervalSec = 2.0f; 

DeltaTime deltaTime;
static char deltaStr[64];

//Button button1(LED_PIN);

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");
    printf("====== BUILD: %d ======\r\n", BUILD_VERSION);
}

void loop() {
    
    deltaTime.update();

    time += deltaTime.getSec();


    if(time > timeIntervalSec) {
        time = 0.0f;
       
        counter++;
        
        
        deltaTime.getAsString(deltaStr, sizeof(deltaStr));
        
        printf("Counter: %ld\r\n", counter);
        printf("%s\r\n", deltaStr);
        printf("Current: %luus (%.3fms) FPS: %.1f\r\n", 
               deltaTime.getUs(), deltaTime.getMs(), deltaTime.getFps());
        printf("Stats - Avg: %.1fus Min: %luus Max: %luus\r\n",
               deltaTime.getAverageUs(), deltaTime.getMinUs(), deltaTime.getMaxUs());
    }
}