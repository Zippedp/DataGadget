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
#define button_1 D0
#define button_2 D1
#define button_3 D2
#define button_4 D3

// File myFile;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Bar setting
const int NUM_BARS = 4;
const int MAX_BAR_LENGTH = 110;
const int BAR_START_X = 10;
const int BAR_START_Y = 9;
const int BAR_HEIGHT = 5; 
const int BAR_SPACING = 11; 
int BAR_MOD = 5;
int SELECTED_BAR = 0; 

// animate setting
unsigned long previousMillis = 0;
unsigned long previousMillis1 = 0;
const long interval = 200;
int shiftOffset = 0;
const int shiftStep = 1;
const int maxShift = 4;
bool is_blink = false;

// refresh rate
const int refresh_intvl = 20;
unsigned long refresh_prev = 0;

// save setting
const int save_intvl = 10000;
unsigned long save_prev = 0;

// button var setup
const int numButtons = 4;
const byte buttonPins[numButtons] = {button_1, button_2, button_3, button_4};
Button* buttons[numButtons];

// timer var setup
const int numTimer = 4;
String timer_name[numTimer] = {"STY", "WOK", "EXP", "ENT"};
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
const int dictSize = 12;
keyValuePair saveStrt[dictSize] = {
  {"t_study", 0}, {"t_work", 0}, {"t_explore", 0}, {"t_entertain", 0},
  {"accum_0", 0}, {"accum_1", 0}, {"accum_2", 0}, {"accum_3", 0},
  {"parm_0", 0}, {"parm_1", 0}, {"parm_2", 0}, {"parm_3", 0}
};
// init sd save
SDSave timerSave(7, "save.txt", dictSize, saveStrt);


// update text on oled
void updateText();
// update animate
void updateAni();
void drawBar(int value, int index, bool isSelected);
void animateSelectedBar(int selectedIndex, int shift);
void barMapMod(int value);
// exclusive timer
void exCheck(int index);
// display error massage on oled
void displayMassage(String _text, bool _isFlash);
// check all multi Press Fn
void multiplPressFn();
// Key combination function
bool multiplPresseCheck(int _button1, int _button2);
// multi Press Fn time2score countdown
bool countDown(int _countMs);
// normalize time to int 0-5
int* time2score(long _time[], int _numValues);

void setup() {
  Serial.begin(19200);
  pinMode(D6,OUTPUT); //

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
    displayMassage("* SD CARD ERROR *", false);
    while(1); // trap here
  }

  // load save to timers
  for(int i=0; i<numTimer; i++){
    timers[i]->time_now = timerSave.saveDict[i].value;
  }
  delay(100);
}

void loop() {
  // all multi press function check
  multiplPressFn();

  // timer ops
  bool all_timer_stopped = true;
  SELECTED_BAR = -1;
  if(!is_multPress){
    // if no multi press, timer update
    unsigned long refresh_temp = millis();
    if(refresh_temp-refresh_prev >= refresh_intvl){
      digitalWrite(D6,LOW);
      for(int i=0; i<numButtons; i++){
        if(buttons[i]->pressed()){
          timers[i]->changeState();
          exCheck(i);
          Serial.print("Button: ");
          Serial.println(i);
          digitalWrite(D6,HIGH);
        }

        timers[i]->time();
        if(timers[i]->is_started){
          all_timer_stopped = false;
          SELECTED_BAR = i;
        }
      }
      updateText(); // display oled text
      updateAni();
      display.display();
      refresh_prev = refresh_temp;
    }
  }else{
    // if multi press stop all timers
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
  // if timer start save every 10s
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
    display.println(" ");
  }
}

void updateAni(){
  for(int i = 0; i < NUM_BARS; i++) {
    drawBar(timers[i]->crtMinutes(), i, i == SELECTED_BAR);
  }
  if(SELECTED_BAR != -1){
    unsigned long currentMillis = millis();
    if(currentMillis - previousMillis >= interval){
      previousMillis = currentMillis;
      shiftOffset += shiftStep;
      if(shiftOffset >= maxShift) {
        shiftOffset = 0;
      }
    }
    animateSelectedBar(SELECTED_BAR, shiftOffset);
  }
}

void drawBar(int value, int index, bool isSelected) {
  barMapMod(value);
  int barLength = map(value, 0, 60*BAR_MOD, 0, MAX_BAR_LENGTH);
  if(barLength > MAX_BAR_LENGTH) barLength = MAX_BAR_LENGTH;

  int y = BAR_START_Y + index * (BAR_HEIGHT + BAR_SPACING);
  display.drawRect(BAR_START_X, y, MAX_BAR_LENGTH, BAR_HEIGHT, SSD1306_WHITE);
  
  if(!isSelected) {
    for(int i = 0; i < barLength; i += maxShift) {
      display.drawLine(BAR_START_X + i, y, BAR_START_X + i + 4, y + BAR_HEIGHT - 1, SSD1306_WHITE);
    }
  }
}

void animateSelectedBar(int selectedIndex, int shift) {
  int value = timers[selectedIndex]->crtMinutes();
  barMapMod(value);
  int barLength = map(value, 0, 60*BAR_MOD, 0, MAX_BAR_LENGTH);
  if(barLength > MAX_BAR_LENGTH) barLength = MAX_BAR_LENGTH;
  // Serial.println("fuck");
  
  int y = BAR_START_Y + selectedIndex * (BAR_HEIGHT + BAR_SPACING);
  display.fillRect(BAR_START_X + 1, y + 1, MAX_BAR_LENGTH - 2, BAR_HEIGHT - 2, SSD1306_BLACK);
  display.drawRect(BAR_START_X, y, MAX_BAR_LENGTH, BAR_HEIGHT, SSD1306_WHITE);
  unsigned long currentMillis = millis();
  if(currentMillis - previousMillis1 > 1000){
    previousMillis1 = currentMillis;
    is_blink = !is_blink;
  }
  if(is_blink){
    display.fillCircle(BAR_START_X-5, y+2, 2, SSD1306_WHITE);
  }else{
    display.drawCircle(BAR_START_X-5, y+2, 2, SSD1306_WHITE);
  }

  for(int i = 0; i < barLength; i += maxShift) {
    int startX = BAR_START_X + i + shift;
    if(startX >= BAR_START_X + barLength){
      continue;
    }
    int endX = startX + 4;
    if(endX > BAR_START_X + barLength) {
      endX = BAR_START_X + barLength;
    }
    display.drawLine(startX, y, endX, y + BAR_HEIGHT - 1, SSD1306_WHITE);
  }
}

void barMapMod(int value){
  while (value >= 60*BAR_MOD)
  {
    BAR_MOD = BAR_MOD * 1.5;
  }
  
}

void exCheck(int index){
  for(int i=0; i<numTimer; i++){
    if(i != index){
      timers[i]->is_started = false;
    }
  }
}

void displayMassage(String _text, bool _isFlash){
  int16_t x1, y1;
  uint16_t textWidth, textHeight;
  display.getTextBounds(_text, 0, 0, &x1, &y1, &textWidth, &textHeight);
  
  int16_t x = (SCREEN_WIDTH - textWidth) / 2;
  int16_t y = (SCREEN_HEIGHT - textHeight) / 2;
  display.clearDisplay();
  display.setCursor(x,y);
  display.setTextSize(1.5);

  if(_isFlash){
    display.fillScreen(WHITE);
    display.setTextColor(BLACK);
    display.print(_text);
    display.display();
    display.clearDisplay();
    display.setTextColor(WHITE);
  }else{
    display.setTextColor(WHITE);
  }

  display.print(_text);
  display.display();
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
    displayMassage(String(countMs/1000), true);
  }

  if(countMs <= 0){
    countDown_start = false;
    displayMassage("countDown end", false);
    delay(2000);
    return true;
  }else if(countDown_temp-countDown_prev >= 1000){
    countMs -= 1000;
    Serial.println(countMs);
    displayMassage(String(countMs/1000), true);
    countDown_prev = countDown_temp;
  }

  
  return false;
}

int* time2score(long _times[], int _numValues){
  int maxScore = 0;
  long totalTime = 0;
  double tempScore[numTimer];
  static int normalizedscore[numTimer];

  double minTime = 36000000.0;    // 10h
  double maxTime = 180000000.0;   // 50h
  double coefficient = 0; // for min-max normalization

  // calculate totalTime
  for(int i=0; i<_numValues; i++){
    totalTime += _times[i];
  }
  // calculate score based on percentage
  for(int i=0; i<_numValues; i++){
    tempScore[i] = ((double)_times[i]/totalTime)*_times[i];
  }
  // find max score
  for(int i=0; i<_numValues; i++){
    if(_times[i] > maxScore){
      maxScore = _times[i];
    }
  }
  // calculate coefficient based on totalTime
  coefficient = 1.0 + ((double)(totalTime - minTime) / (maxTime - minTime)) * 4.0;
  Serial.println(maxScore);
  Serial.println(coefficient);
  // normalize score to 0-5
  for(int i=0; i<_numValues; i++){
    normalizedscore[i] = (tempScore[i]/maxScore)*coefficient;
    Serial.print(_times[i]);
    Serial.print(" - ");
    Serial.print(tempScore[i]);
    Serial.print(" - ");
    Serial.println(normalizedscore[i]);
  }
  return normalizedscore;
}

void multiplPressFn(){
  // fn1 score check
  if(multiplPresseCheck(0, 1)){
    is_multPress = true;

    display.clearDisplay();
    display.setTextSize(1.5);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    for(int index=0; index<numTimer; index++){
      display.print(timers[index]->name);
      display.print(": ");
      display.println(timerSave.saveDict[index+numTimer].value);
    }
    display.display();
  }
  // fn2 calculate score
  else if(multiplPresseCheck(0, 3)){
    is_multPress = true;
    if(countDown(countDownTime)){
      long tempInput[numTimer];
      for(int i=0; i<numTimer; i++){
        tempInput[i] = timers[i]->time_now;
      }
      int* score = time2score(tempInput, numTimer);
      for(int i=0; i<dictSize; i++){
        if(i<numTimer){
          timers[i]->clear();
          timerSave.saveDict[i].value = 0;
          Serial.println(timerSave.saveDict[i].value);
        }else if(i>=numTimer && i<numTimer*2){
          timerSave.saveDict[i].value += score[i-numTimer];
          Serial.println(timerSave.saveDict[i].value);
        }
      }
      timerSave.saveSD();
      delay(2000);
    }
  }else{
    is_multPress = false;
    countDown_start = false;
  }
}

// long findMax(long _inputs[]){
//   long maxValue = 0;
//   for(int i=0; i<sizeof(_inputs); i++){
//     if(_inputs[i] > maxValue){
//       maxValue = _inputs[i];
//     }
//   }
//   return maxValue;
// }