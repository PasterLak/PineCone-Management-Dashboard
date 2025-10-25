#pragma once

extern "C" {
#include <bl_timer.h>

}

extern int deltaTime;

extern unsigned long oldTime;


static void updateDelta()
{

    //deltaTime = static_cast<uint8_t>(Arduino_h::millis() - oldTime);
   // oldTime = Arduino_h::millis();

    deltaTime = static_cast<int>(bl_timer_now_us64() - oldTime); 
    oldTime = bl_timer_now_us64();
}

/*
static unsigned int fps()
{
    if(deltaTime > 0)
    return 1000 / deltaTime ;
    else return 0;
}

static float getSeconds()
{
   return deltaTime / 1000.0f;
}

static float getFrameTime()
{
   return deltaTime;
}
*/

