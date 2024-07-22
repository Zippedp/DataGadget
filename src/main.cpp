#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>
File myFile;

// screen define
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// pin define
#define button_1 D1
#define button_2 D2
#define button_3 D3

// serial delay
const int serial_intvl = 20;
int serial_prev = 0;

// save delay
const int save_intvl = 10000;
int save_prev = 0;

// button var setup
const byte buttonPins[] = {button_1, button_2, button_3};
const int button_deBounce_intvl = 5;
int button_prevDe[] = {0, 0, 0};
byte button_state[] = {0, 0, 0};
byte button_passState[] = {0, 0, 0};
byte temp[] = {0, 0, 0};

// timer var setup
String timer_name[] = {"Game", "Study", "Video"};
long time_add[] = {0, 0, 0};
long time_last[] = {0, 0, 0};
long timer[] = {0, 0, 0};
bool button_is_pressed[] = {false, false, false};
bool timer_is_start[] = {false, false, false};

// for debounce switch readings
void button_deBounce(){
  for(unsigned int index=0; index<sizeof(buttonPins); index++){
    if(millis()-button_state[index] >= button_deBounce_intvl){
      button_state[index] = digitalRead(buttonPins[index]);
      button_prevDe[index] = millis();
    }
  }
}

void buttonReleaseCheck(){
  for(unsigned int index=0; index<sizeof(buttonPins); index++){
    button_passState[index] = 0;
    if(button_state[index] == 1){
      temp[index] = 1;
    }else{
      if(temp[index] == 1){
        button_passState[index] = 1;
        temp[index] = 0;
      }
    }
  }
}

void updateText(long time_last[]){
  display.clearDisplay();

  display.setTextSize(1.5);             // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE);        // Draw white text
  display.setCursor(0,0);             // Start at top-left corner
  for(unsigned int index=0; index<sizeof(buttonPins); index++){
    display.print(timer_name[index]);
    display.print(": ");
    display.print(int(time_last[index]/(1000UL*60*60)));
    display.print("h ");
    display.print(int((time_last[index]/(1000UL*60))%60));
    display.print("min ");
    display.print(int((time_last[index]/1000)%60));
    display.println("s ");
  }

  display.display();
  // testdrawstyles();
}

// separate lable and data
void parseLine(String line) {
  int separatorIndex = line.indexOf(':');
  if (separatorIndex != -1) {
    // data separate
    String label = line.substring(0, separatorIndex); // lable
    String valueStr = line.substring(separatorIndex + 1); // data
    long value = atol(valueStr.c_str()); // to long
    // load data to var
    if(label == timer_name[0]) {
      timer[0] = value;
    }else if(label == timer_name[1]) {
      timer[1] = value;
    }else if(label == timer_name[2]) {
      timer[2] = value;
    }else{
      Serial.print("Unknown label: ");
    }
    Serial.print(label);
    Serial.print(": ");
    Serial.println(value);
  }else{
    Serial.println("Error: Invalid line format.");
  }
}

void setup() {
  Serial.begin(19200);
  //pin config
  pinMode(button_1, INPUT);
  pinMode(button_2, INPUT);
  pinMode(button_3, INPUT);

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
      for(unsigned int index=0; index<sizeof(buttonPins); index++){
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
  // process reading
  button_deBounce();
  buttonReleaseCheck();

  // print to serial
  if(millis()-serial_prev >= serial_intvl){
    for(unsigned int index=0; index<sizeof(buttonPins); index++){
      // button_passState[index] = button_state[index];
      Serial.print(button_passState[index]);
      Serial.print(" ");

      if(button_passState[index] > 0){
        if(timer_is_start[index]){
          timer_is_start[index] = false;
        }else{
          timer_is_start[index] = true;
          time_last[index] = millis();
        }
      }

      if(timer_is_start[index]){
        for(unsigned int p=0; p<sizeof(buttonPins); p++){
          if(p != index){
            timer_is_start[p] = false;
          }
        }
        time_add[index] = millis() - time_last[index];
        timer[index] = timer[index] + time_add[index];
        time_last[index] = millis();
        }
      
        if(millis()-save_prev >= save_intvl){
        myFile = SD.open("save.txt", FILE_WRITE | O_TRUNC);
        if(myFile){
            for(unsigned int index=0; index<sizeof(buttonPins); index++){
              myFile.print(timer_name[index]);
              myFile.print(":");
              myFile.println(timer[index]);
            }
          }else {
            Serial.println("error opening save.txt");
          }
        myFile.close();
        save_prev = millis();
        }
    }
    Serial.println("");
    serial_prev = millis();
  }

  updateText(timer);
}
