#include "Timer.h"

Timer::Timer(String _name){
    name = _name;
  }

  long Timer::time(){
    if(is_started){
      time_now += millis() - time_prev;
      time_prev = millis();
    }
    return time_now;
  }