#include "SDSave.h"

SDSave::SDSave(int _dataPin, String _saveName, int _dictSize, keyValuePair _saveDict[]){
  dataPin = _dataPin;
  saveName = _saveName;
  dictSize = _dictSize;
  saveDict = _saveDict;
}

bool SDSave::loadSDSave(){
  // initialize sd card
  if (!SD.begin(dataPin)) {
    Serial.println("SD CARD FAILED");
    return true;
  }
  readSave();
  return false;
}

void SDSave::readSave(bool is_reading_keys){
  // check if save.txt exists
  if (SD.exists(saveName)) {
    myFile = SD.open(saveName);
    // read save line by line
    if (myFile) {
      while (myFile.available()) {
        String line = myFile.readStringUntil('\n');
        readSaveLine(line, is_reading_keys);
      }
    } else {
        Serial.println("OPPEN ERROR");
    }
  }else{
    // create save.txt
    Serial.println(saveName + " doesn't exist.");
    myFile = SD.open(saveName, FILE_WRITE);
    if(myFile){
      for(int index=0; index<dictSize; index++){
        myFile.print(saveDict[index].key);
        myFile.print(":");
        myFile.println(0);
      }
    }else {
      Serial.println("CREATE ERROR");
    }
  }
  myFile.close();
}

void SDSave::saveSD(){
  // myFile = SD.open(saveName, FILE_WRITE | O_TRUNC);  //for seeed_xiao
  myFile = SD.open(saveName, FILE_WRITE);  //for seeed_esp32c3
    if(myFile){
      for(int index=0; index<dictSize; index++){
        myFile.print(saveDict[index].key);
        myFile.print(":");
        myFile.println(saveDict[index].value);
      }
    }else{
        Serial.println("SAVE ERROR");
    }
  myFile.close();
}

void SDSave::checkExist(){
  // check if save.txt exists
  if (!SD.exists(saveName)) {
    Serial.println(saveName + " doesn't exist.");
    myFile = SD.open(saveName, FILE_WRITE);
    if(!myFile){
      Serial.println("CREATE ERROR");
    }
  }
  myFile.close();
}

void SDSave::logSD(){
  // myFile = SD.open(saveName, FILE_WRITE | O_TRUNC);  //for seeed_xiao
  myFile = SD.open(saveName, FILE_APPEND);  //for seeed_esp32c3
    if(myFile){
      for(int index=0; index<dictSize; index++){
        myFile.print(saveDict[index].key);
        myFile.print(":");
        myFile.println(saveDict[index].value);
      }
    }else{
        Serial.println("SAVE ERROR");
    }
  myFile.close();
}

void SDSave::readSaveLine(String line, bool is_reading_keys){
  static int lineCounter = 0;
  int separatorIndex = line.indexOf(':');
  if(separatorIndex != -1) {
    // data separate
    String label = line.substring(0, separatorIndex); // lable
    String valueStr = line.substring(separatorIndex + 1); // data
    long value = atol(valueStr.c_str()); // to long
    // load data to var
    if(is_reading_keys){
      if(lineCounter>=dictSize){
        lineCounter = 0;
      }
      saveDict[lineCounter].key = label;
      lineCounter += 1;
    }else{
      for(int i=0; i<dictSize; i++){
        if(label == saveDict[i].key) {
          saveDict[i].value = value;
          break;
        }
      }
    }
  }else{
    Serial.println("FORMAT ERROR");
  }
}