#ifndef SDSAVE_H
#define SDSAVE_H

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <SD.h>

// define pair
struct keyValuePair{
    String key;
    long value;
};

class SDSave
{
private:
    File myFile; // init sd file
    int dictSize; // save pair number
    int dataPin; // SD card data pin

    void readSaveLine(String line , bool is_reading_keys); // read save.txt line

public:
    String saveName; //save file name
    keyValuePair* saveDict; // save format

    SDSave(){}
    SDSave(int _dataPin, String _saveName, int _dictSize, keyValuePair _saveDict[]); // init sd save

    bool loadSDSave(); // frist time load and read sd save
    void readSave(bool is_reading_keys = false); // read save
    void saveSD(); // save all
    void checkExist(); // for append save only, create if not exist
    void logSD(); // append all
};

#endif