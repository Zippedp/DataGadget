#ifndef TIMER_H
#define TIMER_H

#include <Arduino.h>

class Timer
{
private:
    long time_now = 0;
    long time_prev = 0;
    bool is_started = false;

public:
    String name = "TimerName";

    Timer(){}
    Timer(String _name); // create with a name

    long time(); //update value & return time_now

    // time convert founction
    inline int toSeconds(){
        return (time_now/1000)%60;
    }

    inline int toMinutes(){
        return (time_now/(1000UL*60))%60;
    }

    inline int toHours(){
        return time_now/(1000UL*60*60);
    }

    // utility function
    void loadSave(long _time){
        time_now = _time;
    }

    inline void start(){
        is_started = true;
        time_prev = millis();
    }

    inline void stop(){
        is_started = false;
    }
};

#endif