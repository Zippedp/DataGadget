#include <Arduino.h>
#include <Adafruit_SSD1306.h>
#include "Button.h"
#include "Timer.h"
#include "SDSave.h"

// screen define
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

// pin define
#define button_1 D1
#define button_2 D2
#define button_3 D3

// File myFile;
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
String timer_name[numTimer] = {"WOK", "EXP", "ENT"};
Timer* timers[numTimer];

// multi press config
// const unsigned int countDownTime = 3000;
int countMs = 0;
const int countDownTime = 3000;
unsigned long countDown_prev = 0;
unsigned long multPress_prev = 0;
bool is_multPress = false;
bool countDown_start = false;

// save structure
const int dictSize = 9;
keyValuePair saveStrt[dictSize] = {
  {"t_work", 0}, {"t_explore", 0}, {"t_entertain", 0},
  {"accum_1", 0}, {"accum_2", 0}, {"accum_3", 0},
  {"parm_1", 0}, {"parm_2", 0}, {"parm_3", 0}
};
// init sd save
SDSave timerSave(A7, "save.txt", dictSize, saveStrt);


// update text on oled
void updateText();
// exclusive timer
void exCheck(int index);
// display error massage on oled
void displayMassage(String _text);
// find top 1 timer
void countTimer();
// Key combination function
bool multiplPresseCheck(int _button1, int _button2);

bool countDown(int _countMs);

void setup() {
  Serial.begin(19200);

  // wait for serial ready
  delay(1000); 
  Serial.println("Serial Ready");

  // create buttons
  for(int i=0; i<numButtons; i++){
    buttons[i] = new Button(buttonPins[i]);
    buttons[i]->init(true);
  }
  // create timers
  for(int i=0; i<numTimer; i++){
    timers[i] = new Timer(timer_name[i]);
  }

  // init display
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 FAILED"));
    while(1);
  }
  display.clearDisplay();
  
  // load save from sd card
  if(timerSave.loadSDSave()){
    displayMassage("* SD CARD ERROR *");
    while(1); // trap here
  }
  for(int i=0; i<numTimer; i++){
    timers[i]->time_now = timerSave.saveDict[i].value;
  }
  delay(100);
}

void loop() {
  // multi press function
  if(multiplPresseCheck(0, 2)){
    is_multPress = true;
    if(countDown(countDownTime)){
      countTimer();
      delay(2000);
    }
  }else{
    is_multPress = false;
    countDown_start = false;
  }

  bool all_timer_stopped = true;
  if(!is_multPress){
    // timer update
    unsigned long refresh_temp = millis();
    if(refresh_temp-refresh_prev >= refresh_intvl){
      for(int i=0; i<numButtons; i++){
        if(buttons[i]->pressed()){
          timers[i]->changeState();
          exCheck(i);
          Serial.print("Button: ");
          Serial.println(i);
        }

        timers[i]->time();
        if(timers[i]->is_started){
          all_timer_stopped = false;
        }
      }
      // display oled text
      updateText();
      refresh_prev = refresh_temp;
    }
  }else{
    unsigned long refresh_temp = millis();
    if(refresh_temp-refresh_prev >= refresh_intvl){
      for(int i=0; i<numButtons; i++){
        timers[i]->stop();
      }
    }
    refresh_prev = refresh_temp;
  }

  // save to sd card
  unsigned long save_temp = millis();
  if(save_temp-save_prev >= save_intvl && !all_timer_stopped){
    for(int i=0; i<numButtons; i++){
      timerSave.saveDict[i].value = timers[i]->time_now;
    }
    timerSave.saveSD();
    save_prev = save_temp;
  }
}

void updateText(){
  display.clearDisplay();
  display.setTextSize(1.5);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);

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
}

void exCheck(int index){
  for(int i=0; i<numTimer; i++){
    if(i != index){
      timers[i]->is_started = false;
    }
  }
}

void displayMassage(String _text){
  display.clearDisplay();
  display.setTextSize(1.5);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10,28);
  display.print(_text);
  display.display();
}

void countTimer(){
  long top1 = 0;
  String top1Name = "name";
  for(int i=0; i<numTimer; i++){
    if(timers[i]->time_now > top1){
      top1 = timers[i]->time_now;
      top1Name = timers[i]->name;
    }
  }
  displayMassage(top1Name);
}

bool multiplPresseCheck(int _button1, int _button2){
  if(buttons[_button1]->readNow() && buttons[_button2]->readNow()){
    return true;
  }
  return false;
}

bool countDown(int _countMs){
  unsigned long countDown_temp = millis();

  if(!countDown_start){
    countDown_start = true;
    countDown_prev = countDown_temp;
    countMs = _countMs;
    Serial.println(countMs);
    displayMassage(String(countMs/1000));
  }

  if(countMs <= 0){
    countDown_start = false;
    displayMassage("countDown end");
    delay(2000);
    return true;
  }else if(countDown_temp-countDown_prev >= 1000){
    countMs -= 1000;
    Serial.println(countMs);
    displayMassage(String(countMs/1000));
    countDown_prev = countDown_temp;
  }

  
  return false;
}