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
    unsigned long currentTime = millis();
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

bool Button::longPress(){
    dbRead();

    if(state){
        if(!lp_is_start){
            lp_start = millis();
            lp_is_start = true;
        }

        if(lp_is_start && (millis() - lp_start >= lp_intvl)){
            lp_is_start = false;
            return true;
        }
    }else{
        lp_is_start = false;
    }

    return false;
}

bool Button::doublePress(){
    if(pressed()){
        unsigned long double_temp = millis();

        if(wait_double){
            if (double_temp - double_check <= double_intvl) {
                wait_double = false;
                return true;
            }
        }

        double_check = double_temp;
        wait_double = true;
    }

    if(wait_double && (millis() - double_check > double_intvl)){
        wait_double = false;
    }

    return false;
}

bool Button::toggle(){

    if(pressed()){
        toggle_is_on = !toggle_is_on;
    }

    return toggle_is_on;
}

bool Button::readNow(){
    dbRead();
    return state;
}