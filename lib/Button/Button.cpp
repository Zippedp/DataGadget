#include "Button.h"

Button::Button(byte _pin){
    pin = _pin;
}
Button::Button(byte _pin, int _deBounce_intvl){
    pin = _pin;
    deBounce_intvl = _deBounce_intvl;
}

void Button::init(){
    pinMode(pin, INPUT);
}

void Button::init(bool _is_pullup){
    is_pullup = _is_pullup;
    if(is_pullup){
        pinMode(pin, INPUT_PULLUP);
    }else{
        init();
    }
}

void Button::dbRead(){
    unsigned int currentTime = millis();
    if(currentTime - last_check >= deBounce_intvl){
        state = digitalRead(pin);
        if(is_pullup){
            state = !state;
        }
        last_check = currentTime;
    }
}

bool Button::pressed(){
dbRead();

valid_interaction = false;
if(state == false){
    last_state = state;
}else{
    if(last_state == false){
        valid_interaction = true;
        last_state = state;
    }
}

return valid_interaction;
}

bool Button::released(){
dbRead();

valid_interaction = false;
if(state == true){
    last_state = state;
}else{
    if(last_state == true){
        valid_interaction = true;
        last_state = state;
    }
}

return valid_interaction;
}

bool Button::toggle(){
dbRead();

if(state == last_state){
    last_state = state;
}else{
    valid_interaction = !valid_interaction;
    last_state = state;
}

return valid_interaction;
}