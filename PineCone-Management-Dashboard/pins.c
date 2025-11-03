
#include <FreeRTOS.h>
#include <task.h>
#include "pins.h"

void pinMode(uint8_t pin, uint8_t mode)
{
    switch(mode) {
        case OUTPUT:
            bl_gpio_enable_output(pin, 0, 0);
            break;
        case INPUT:
            bl_gpio_enable_input(pin, 0, 0);
            break;
        case INPUT_PULLUP:
            bl_gpio_enable_input(pin, 1, 0);
            break;
        case INPUT_PULLDOWN:
            bl_gpio_enable_input(pin, 0, 1);
            break;
    }
}

void digitalWrite(uint8_t pin, uint8_t value)
{
    bl_gpio_output_set(pin, value);
}

int digitalRead(uint8_t pin)
{
    return bl_gpio_input_get_value(pin);
}

void delay(unsigned long ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}


void togglePin(uint8_t pin)
{
    int current = digitalRead(pin);
    digitalWrite(pin, !current);
}

void blinkPin(uint8_t pin, unsigned long delay_ms, uint8_t times)
{
    for(uint8_t i = 0; i < times; i++) {
        digitalWrite(pin, HIGH);
        delay(delay_ms);
        digitalWrite(pin, LOW);
        if(i < times - 1) {
            delay(delay_ms);
        }
    }
}