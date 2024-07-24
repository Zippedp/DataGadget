#ifndef BUTTON_H
#define BUTTON_H

#include <Arduino.h>

class Button
{
private:
  byte pin;
  bool state = false;
  bool last_state = false;
  bool is_pullup = false;
  bool valid_interaction = false;
  
  unsigned int last_check = 0;
  unsigned int deBounce_intvl = 5;

public:
  Button(){}
  Button(byte _pin){}
  Button(byte _pin, int _deBounce_intvl){
    // pin config
    // debounce interval config
  }

  void init(){
    // Default using external pullup resistor
  }
  void init(bool _is_pullup){
    // true to config using internal pullup resistor
  }

  void dbRead(){} //debounce digital read

  bool pressed(){} //press detect trigger
  bool released(){} //release detect trigger
  bool toggle(){} // on & off toggle
};

#endif