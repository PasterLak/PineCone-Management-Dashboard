#include "program.hpp"


extern "C" {
#include <stdio.h>
#include <bl_timer.h>

}

#define BUILD_VERSION 2

static long counter = 0;
static long counter2 = 0;

//#include "components/Blink.hpp"
#define LED_PIN 11
//Blink ledBlink(LED_PIN);

int deltaTime = 0; 
unsigned long oldTime = 0;

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");
    printf("====== BUILD: %d ======\r\n", BUILD_VERSION);

   

   // ledBlink.blink(200, 5);
}

static void updateDelta()
{

    //deltaTime = static_cast<uint8_t>(Arduino_h::millis() - oldTime);
   // oldTime = Arduino_h::millis();

    //deltaTime = static_cast<int>((long)bl_timer_now_us64() - oldTime); 
    //oldTime = (long)bl_timer_now_us64();
}
void loop() {

    counter++;

    updateDelta();

    if(counter > 10000000) {
        counter = 0;
        counter2++;
        printf("Counter: %ld\r\n", counter2);
        
       // printf("System delta time0: %d ms\r\n", deltaTime);
    }

}
