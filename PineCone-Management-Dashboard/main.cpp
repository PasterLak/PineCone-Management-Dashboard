extern "C" {
#include <stdio.h>     
#include <FreeRTOS.h>
#include <task.h>
#include <bl_uart.h>

}

#include "program.hpp"

long counter = 0;


extern "C" void bfl_main(void)
{
    // Initialize the default UART for communication.
    // Pins 16 (TX) and 7 (RX), Baudrate 2,000,000
    bl_uart_init(0, 16, 7, 255, 255, 2 * 1000 * 1000);

    // runs on startup
    start();

    // runs repeatedly
    while (1){ loop();}


}

