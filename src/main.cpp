#include <Arduino.h>

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>

#include "Button.h"
#include "Timer.h"

// screen define
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

// pin define
#define button_1 D1
#define button_2 D2
#define button_3 D3

File myFile;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);


// refresh rate
const int refresh_intvl = 20;
unsigned long refresh_prev = 0;

// save setting
const int save_intvl = 10000;
unsigned long save_prev = 0;

// button var setup
const int numButtons = 3;
const byte buttonPins[numButtons] = {button_1, button_2, button_3};
Button* buttons[numButtons];

// timer var setup
const int numTimer = 3;
String timer_name[numTimer] = {"XP", "AP", "RP"};
Timer* timers[numTimer];

// update text on oled
void updateText();
// separate lable and data
void parseLine(String line);
// exclusive timer
void exCheck(int index);

void setup() {
  Serial.begin(19200);
  
  for(int i=0; i<numButtons; i++){
    buttons[i] = new Button(buttonPins[i]);
    buttons[i]->init();
  }

  for(int i=0; i<numTimer; i++){
    timers[i] = new Timer(timer_name[i]);
  }

  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    while(1);
  }
  display.clearDisplay();

  // initialize sd card
  if (!SD.begin(A7)) {
    Serial.println("initialization failed!");
    while(1);
  }
  
  // check if save.txt exists
  if (SD.exists("save.txt")) {
    Serial.println("save.txt exists.");
    myFile = SD.open("save.txt");
    // read save line by line
    if (myFile) {
      Serial.println("save.txt opened.");
      while (myFile.available()) {
        String line = myFile.readStringUntil('\n');
        parseLine(line);
      }
      myFile.close();
    } else {
        Serial.println("Error: Failed to open save.txt.");
    }
    myFile.close();
  }else{
    Serial.println("save.txt doesn't exist.");
    myFile = SD.open("save.txt", O_CREAT);
    // create save.txt
    if(myFile){
      Serial.print("Writing to save.txt...");
      for(int index=0; index<numTimer; index++){
        myFile.print(timer_name[index]);
        myFile.print(":");
        myFile.println(0);
      }
    }else {
      Serial.println("error opening save.txt");
    }
  myFile.close();
  }
  delay(50);
}

void loop() {
  unsigned long refresh_temp = millis();
  if(refresh_temp-refresh_prev >= refresh_intvl){
    for(int i=0; i<numButtons; i++){
      if(buttons[i]->pressed()){
        timers[i]->changeState();
        exCheck(i);
        Serial.print("Button: ");
        Serial.println(i);
      }
    }
    for(int i=0; i<numTimer; i++){
      timers[i]->time();
    }
    updateText();
    refresh_prev = refresh_temp;
  }

  unsigned long save_temp = millis();
  if(save_temp-save_prev >= save_intvl){
    for(int index=0; index<numTimer; index++){
      myFile = SD.open("save.txt", FILE_WRITE | O_TRUNC);
      if(myFile){
        for(int index=0; index<numTimer; index++){
          myFile.print(timer_name[index]);
          myFile.print(":");
          myFile.println(timers[index]->time());
        }
      }else {
          Serial.println("error opening save.txt");
      }
      myFile.close();
    }
    save_prev = save_temp;
  }
    
}

void updateText(){
  display.clearDisplay();

  display.setTextSize(1.5);             // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE);        // Draw white text
  display.setCursor(0,0);             // Start at top-left corner
  for(int index=0; index<numTimer; index++){
    display.print(timers[index]->name);
    display.print(": ");
    display.print(timers[index]->toHours());
    display.print("h ");
    display.print(timers[index]->toMinutes());
    display.print("min ");
    display.print(timers[index]->toSeconds());
    display.println("s ");
  }

  display.display();
  // testdrawstyles();
}

void parseLine(String line) {
  int separatorIndex = line.indexOf(':');
  if(separatorIndex != -1) {
    // data separate
    String label = line.substring(0, separatorIndex); // lable
    String valueStr = line.substring(separatorIndex + 1); // data
    long value = atol(valueStr.c_str()); // to long
    // load data to var
    for(int i=0; i<numTimer; i++){
      if(label == timers[i]->name) {
        timers[i]->loadSave(value);
      }else{
        Serial.print("Unknown label: ");
        Serial.print(label);
        Serial.print(": ");
        Serial.println(value);
      }
    }
  }else{
    Serial.println("Error: Invalid line format.");
  }
}

void exCheck(int index){
  for(int i=0; i<numTimer; i++){
    if(i != index){
      timers[i]->is_started = false;
    }
  }
}