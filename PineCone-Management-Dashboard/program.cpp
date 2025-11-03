#include "program.hpp"

extern "C" {
#include <stdio.h>
#include <bl_timer.h>
#include "pins.h"
}

#include "components/delta_time.hpp"
#include "components/button.hpp"

#define BUILD_VERSION 7


static long counter = 0;
#define LED_PIN 11
#define BUTTON_PIN 4

static float time = 0.0f;
const float timeIntervalSec = 2.0f; 

DeltaTime deltaTime;
static char deltaStr[64];

Button button1(BUTTON_PIN);
int pressedCount = 0;

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");
    printf("====== BUILD: %d ======\r\n", BUILD_VERSION);

   button1.setDebounceDelayMS(20); 
}

void loop() {
    
    deltaTime.update();
    button1.update();
    time += deltaTime.getSec();

    if(button1.isDown()) {
         pressedCount++;
        printf("Button was Pressed! Presses: %d\r\n", pressedCount);

    }


    if(time > timeIntervalSec) {
        time = 0.0f;
       
        counter++;
        
        
        deltaTime.getAsString(deltaStr, sizeof(deltaStr));
        
        printf("Counter: %ld\r\n", counter);
        printf("Pin button: %d\r\n", digitalRead(BUTTON_PIN));
        printf("%s\r\n", deltaStr);
        printf("Current: %luus (%.3fms) FPS: %.1f\r\n", 
               deltaTime.getUs(), deltaTime.getMs(), deltaTime.getFps());
        printf("Stats - Avg: %.1fus Min: %luus Max: %luus\r\n",
               deltaTime.getAverageUs(), deltaTime.getMinUs(), deltaTime.getMaxUs());
    }
}