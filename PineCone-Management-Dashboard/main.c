#include <stdio.h>
#include <string.h>
#include <FreeRTOS.h>
#include <task.h>
#include <bl_uart.h>
#include <bl_sys.h>
#include "logger.h"
#include "pins.h"


static long counter = 0;
static long counter2 = 0;


#define LED_PIN 11

#define SCB_AIRCR (*(volatile uint32_t *)0xE000ED0C)

void start(void);
void loop(void);
void update_counters(void);
void stop_pinecone(void);

void bfl_main(void)
{
    // Init UART using pins 16+7 (TX+RX) and baudrate of 2M
    bl_uart_init(0, 16, 7, 255, 255, 2 * 1000 * 1000);

    start();
    loop();
}

void start(void)
{
   
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW); 
    
    log_msg("====== BL602 started! ======");
}

void update_counters(void)
{
    counter++;
    if(counter > 1000000)
    {
        counter = 0;
        counter2++;
    }
}

void loop(void)
{
    static long last_printed = -1;
    static int led_state = 0;
    
    while(true)
    {
        update_counters();
        
        if(counter2 != last_printed)
        {
            last_printed = counter2;
          
            led_state = !led_state;
            digitalWrite(LED_PIN, led_state);
            
            log_long("Counter = ", counter2);
            if(counter2 >= 10) {
               
                stop_pinecone();
            } 
        }
    }
}

void stop_pinecone(void) {
    log_msg("====== PINECONE STOPPED ======");
    log_msg("Press RESET to restart the program");
    //vTaskDelay(pdMS_TO_TICKS(500));  // Wait for message to send
   // bl_sys_reset_por();  // Perform reset
   // bl_sys_reset();
    //NVIC_SystemReset();
     SCB_AIRCR = (0x5FA << 16) | (1 << 2);
}
