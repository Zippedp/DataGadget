#include "Timer.h"

Timer::Timer(String _name){
    name = _name;
}

long Timer::time(){
  if(is_started){
    unsigned long time_temp = millis();
    time_now += time_temp - time_prev;
    time_prev = time_temp;
  }
  return time_now;
}

void Timer::changeState(){
  toggle = ! toggle;
  if(toggle){
    start();
  }else{
    stop();
  }
}

void Timer::clear(){
  time_prev = 0;
  time_now = 0;
  is_started = false;
}