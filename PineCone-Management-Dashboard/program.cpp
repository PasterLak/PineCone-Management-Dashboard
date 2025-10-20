#include "program.hpp"

extern "C" {
#include <stdio.h>

}

#define BUILD_VERSION 1

static long counter = 0;
static long counter2 = 0;

//#include "components/Blink.hpp"
#define LED_PIN 11
//Blink ledBlink(LED_PIN);

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");
    printf("====== BUILD: %d ======\r\n", BUILD_VERSION);

   // ledBlink.blink(200, 5);
}

void loop() {

    counter++;

    if(counter > 10000000) {
        counter = 0;
        counter2++;
        printf("Counter: %ld\r\n", counter2);
    }

}
