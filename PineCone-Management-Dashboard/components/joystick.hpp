#ifndef JOYSTICK_HPP
#define JOYSTICK_HPP

extern "C" {
#include <stdint.h>
}

struct AxisCalibration {
    uint16_t center;   
    uint16_t deadzone; 
    bool inverted;    
};

class Joystick {
public:
    Joystick(uint8_t pinX, uint8_t pinY, uint8_t pinBtn = 255);

    void update();
   
    int8_t getX() const;
    int8_t getY() const;
    bool isPressed() const;

    void setCalibrationX(uint16_t center, uint16_t deadzone, bool inverted);
    void setCalibrationY(uint16_t center, uint16_t deadzone, bool inverted);

private:
    uint8_t _pinX;
    uint8_t _pinY;
    uint8_t _pinBtn;

    AxisCalibration _calX;
    AxisCalibration _calY;

    int8_t _valX;
    int8_t _valY;
    bool _btnState;

    int8_t mapAxis(uint16_t raw, const AxisCalibration& cal);
};

#endif