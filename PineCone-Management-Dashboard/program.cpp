#include "program.hpp"

extern "C" {
#include <stdio.h>
}

static long counter = 0;
static long counter2 = 0;

void start() {
    printf("====== PINECONE BL602 STARTED! ======\r\n");


}

void loop() {

    counter++;

    if(counter > 1000000) {
        counter = 0;
        counter2++;
        printf("Counter: %ld\r\n", counter2);
    }

}
