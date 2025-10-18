
#include <stdio.h>
#include <string.h>
#include <FreeRTOS.h>
#include <task.h>
#include <bl_uart.h>
#include "logger.h"

long counter = 0;
long counter2 = 0;
long lastPrinted = 999;


void bfl_main(void)
{
   
    /*
     * Init UART using pins 16+7 (TX+RX)
     * and baudrate of 2M
     */
    bl_uart_init(0, 16, 7, 255, 255, 2 * 1000 * 1000);


     log_msg("##### BL602 started! #####");

     while(true)
    {
    counter++;
    if(counter > 1000000)
    {
        counter = 0;
        counter2++;
    }
    if(counter2 != lastPrinted)
    {
        lastPrinted = counter2;
        log_long("Counter", counter2);
    }
 

    } 

}

