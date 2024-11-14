
#ifndef BUTTON_MANAGER_H
#define BUTTON_MANAGER_H

#include <Arduino.h>
#include "Button.h"

class ButtonManager {
private:
    Button** buttons;
    int numButtons;

public:
    ButtonManager(Button* buttonArray[], int numOfButtons);
    bool isMultiPressed(int buttonIndices[], int count); // Check if multiple specific buttons are pressed
};

#endif // BUTTON_MANAGER_H
