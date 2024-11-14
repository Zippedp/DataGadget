
#include "ButtonManager.h"

ButtonManager::ButtonManager(Button* buttonArray[], int numOfButtons) {
    buttons = buttonArray;
    this->numButtons = numOfButtons;
}

bool ButtonManager::isMultiPressed(int buttonIndices[], int count) {
    int pressedCount = 0;
    for (int i = 0; i < count; i++) {
        int idx = buttonIndices[i];
        if (idx < numButtons && buttons[idx]->pressed()) {
            pressedCount++;
        }
    }
    return (pressedCount == count); // True if all specified buttons are pressed
}
