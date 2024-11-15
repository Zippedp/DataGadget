#ifndef TIMER_H
#define TIMER_H

#include <Arduino.h>

class Timer
{
private:
    long time_prev = 0;
    bool toggle = false;

public:
    String name;
    long time_now = 0;
    bool is_started = false;

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

    inline int crtMinutes(){
        return time_now/(1000UL*60);
    }

    inline int crtSeconds(){
        return time_now/(1000UL);
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

    void changeState();
    void clear();
};

#endif