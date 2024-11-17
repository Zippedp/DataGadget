#include <Arduino.h>
#include <Adafruit_SSD1306.h>
#include "Button.h"
#include "Timer.h"
#include "SDSave.h"

// screen define
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

// pin define
#define button_1 D1
#define button_2 D2
#define button_3 D3
// #define button_4 D7

// File myFile;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Bar setting
const int MAX_BAR_LENGTH = 128;
const int BAR_START_X = 0;
const int BAR_START_Y = 17;
const int BAR_HEIGHT = 15; 
const int BAR_SPACING = 11; 
int BAR_MOD = 15;
int bar_base = 60;
int SELECTED_BAR = 0; 
bool is_activated = 0; 

// animate setting
unsigned long previousMillis1 = 0;
const long interval = 200;
const int shiftStep = 1;
const int maxShift = 4;
const int line_angle = 8;

// refresh rate
const int refresh_intvl = 20;
unsigned long refresh_prev = 0;

// save setting
const int save_intvl = 10000;

// button var setup
const int numButtons = 3;
const byte buttonPins[numButtons] = {button_1, button_2, button_3};
Button* buttons[numButtons];

bool hotkey_is_pressed = false;
const int action_intvl = 200;

int test1 = 0;
int test2 = 1;
int test3 = 2;

const int numModes = 3;
const int menuDelay = 500;
int modeSlector = 1;
bool showMenu = false;
unsigned long menu_prev = 0;
String modeName[numModes + 2] = {"X", "TIME", "CONT", "RAND","X"};

// timer var setup
const int numTimer = 3;
String timer_name[numTimer] = {"X", "Y", "Z"};
Timer* timers[numTimer];

// multi press config
// const unsigned int countDownTime = 3000;
const int countDownTime = 3000;
bool is_multPress = false;

const int numCounter = 3;
int counterSlect = 0;
int counters[numCounter] = {0, 0, 0};
String counterName[numCounter] = {"X", "Y", "Z"};

// save structure
const int dictSize = 9;
keyValuePair saveStrt[dictSize] = {
  {"t_x", 0}, {"t_y", 0}, {"t_z", 0},
  {"accum_0", 0}, {"accum_1", 0}, {"accum_2", 0},
  {"parm_0", 0}, {"parm_1", 0}, {"parm_2", 0}
};

// save structure
const int dictSize_1 = 3;
keyValuePair saveStrt_1[dictSize_1] = {
  {"c_x", 0}, {"c_y", 0}, {"c_z", 0}
};
// init sd save
SDSave timerSave(D0, "/save.txt", dictSize, saveStrt);
SDSave counterSave(D0, "/save_c.txt", dictSize_1, saveStrt_1);


// update text on oled
void updateText();
// update animate
void updateAni();
void drawBar(int value, int index, bool isSelected);
void barMapMod(int value);
// exclusive timer
void exCheck(int index);
// display error massage on oled
void displayMassage(String _text, bool _isFlash);
// check all multi Press Fn
void multiplPressFn();
// Key combination function
int multiplPresseCheck();
// multi Press Fn time2score countdown
bool countDown(int _countMs);
// normalize time to int 0-5
int* time2score(long _time[], int _numValues);

bool menuSafe();
void counterMode();
void timerMode();
String generateRandomString();

void setup() {
  Serial.begin(19200);
  pinMode(D6,OUTPUT); // for temp vibration drive

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
  if(counterSave.loadSDSave()){
    displayMassage("* SD CARD ERROR*", false);
    while(1); // trap here
  }
  timerSave.readSave();
  

  // load save to timers
  for(int i=0; i<numTimer; i++){
    timers[i]->time_now = timerSave.saveDict[i].value;
  }

  // load save to counters
  for(int i=0; i<numCounter; i++){
    counters[i] = counterSave.saveDict[i].value;
  }
  delay(100);
}

void loop() {
  // all multi press function check
  // multiplPressFn(); // if number of buttons changed multiplPress check might overflow list due to previous define
  if(buttons[1]->longPress()){
      showMenu = true;
  }

  if(!showMenu && menu_prev == 0){
    menu_prev = millis();
  }
  
  if(showMenu){
    menu_prev = 0;
    int mode_temp = multiplPresseCheck();
    modeSlector += mode_temp;

    if(modeSlector >= numModes){
      modeSlector = numModes - 1;
    }else if(modeSlector < 0){
      modeSlector = 0;
    }
    displayMassage("<--" + modeName[modeSlector + 2] + " | " + modeName[modeSlector] + "-->", false);
  }else{
    unsigned long refresh_temp = millis();
    if(refresh_temp-refresh_prev >= refresh_intvl){

      refresh_prev = refresh_temp;
      digitalWrite(D6,LOW);

      switch (modeSlector){
        case 0:
          timerMode();
          break;

        case 1:
          counterMode();
          break;

        case 2:
          displayMassage(generateRandomString(),false);
          break;
      }
    }
  }
}

void updateText(){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);

  display.print(timers[SELECTED_BAR]->name);
  display.print(": ");
  display.print(timers[SELECTED_BAR]->toHours());
  display.print("h ");
  display.print(timers[SELECTED_BAR]->toMinutes());
  display.print("min ");
  display.print(timers[SELECTED_BAR]->toSeconds());
  display.println("s ");
  display.println(" ");
}

void updateAni(){
  drawBar(timers[SELECTED_BAR]->crtSeconds(), SELECTED_BAR, is_activated);
}

void drawBar(int value, int index, bool isActivated) {
  static unsigned long previousMillis = 0;
  static int shiftOffset = 0;
  // input data preprocess
  barMapMod(value);
  int barLength = map(value, 0, bar_base*BAR_MOD, 0, MAX_BAR_LENGTH);
  int y = BAR_START_Y;

  // darw moving/static lines
  if(isActivated) {
    // calculate line shift
    unsigned long currentMillis = millis();
    if(currentMillis - previousMillis >= interval){
      previousMillis = currentMillis;
      shiftOffset += shiftStep;
      if(shiftOffset >= maxShift) {
        shiftOffset = 0;
      }
    }
    // clear prev frame
    display.fillRect(BAR_START_X + 1, y + 1, MAX_BAR_LENGTH - 2, BAR_HEIGHT - 2, SSD1306_BLACK);
    display.drawRect(BAR_START_X, y, MAX_BAR_LENGTH, BAR_HEIGHT, SSD1306_WHITE);
    // draw shift lines
    for(int i = 0; i < barLength + line_angle + 1; i += maxShift) {
      int startX = BAR_START_X + i - line_angle + shiftOffset;
      if(startX > BAR_START_X + barLength + 1){
        continue;
      }
      int endX = BAR_START_X + i + shiftOffset;
      if(endX > BAR_START_X + barLength + 1) {
        endX = BAR_START_X + barLength + 1;
      }
      display.drawLine(startX, y, endX, y + BAR_HEIGHT - 1, SSD1306_WHITE);
    }
  }else{
    // draw static lines
    for(int i = 0; i < barLength + line_angle; i += maxShift) {
      display.drawLine(BAR_START_X + i - line_angle, y, BAR_START_X + i, y + BAR_HEIGHT - 1, SSD1306_WHITE);
    }
     display.fillRect(barLength, y + 1, barLength + line_angle, BAR_HEIGHT - 2, SSD1306_BLACK);
     display.drawLine(barLength, y, barLength, y + BAR_HEIGHT - 1, SSD1306_WHITE);
  }

  // draw outer rect
  display.drawRect(BAR_START_X, y, MAX_BAR_LENGTH, BAR_HEIGHT, SSD1306_WHITE);
}

void barMapMod(int value){
  while (value >= bar_base*BAR_MOD)
  {
    BAR_MOD = BAR_MOD * 1.5;
    Serial.println(BAR_MOD);
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

int multiplPresseCheck(){
  static bool hotkey_is_pressed = false;
  static bool action_triggered = false;
  static unsigned long last_action_time = 0;

  bool bh_is_pressed = buttons[1]->readNow();
  bool b1_is_pressed = buttons[0]->readNow();
  bool b2_is_pressed = buttons[2]->readNow();
  if(bh_is_pressed && !b1_is_pressed && !b2_is_pressed){
    hotkey_is_pressed = true;
  }
  
  if(hotkey_is_pressed){
    unsigned long current_time = millis();
    if(!bh_is_pressed){
      hotkey_is_pressed = false;
      action_triggered = false;
      showMenu = false;
    }else if(!action_triggered || current_time - last_action_time >= action_intvl){
      if(b1_is_pressed){
        // Serial.println("fn1")
        last_action_time = current_time;
        action_triggered = true;
        return 1;
      }else if(b2_is_pressed){
        // Serial.println("fn2");
        last_action_time = current_time;
        action_triggered = true;
        return -1;
      }
    }
    
  }
  return 0;
}

bool countDown(int _countMs){
  static int countMs = 0;
  static unsigned long countDown_prev = 0;
  static bool countDown_start = false;

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

void counterMode(){
  bool is_flash = false;
  bool menuSafe_temp = menuSafe();
  for(int i=0; i<numButtons; i++){
    if(buttons[i]->released() && menuSafe_temp){
      exCheck(i);
      // is_flash = true;
      counters[i] += 1;
      counterSlect = i;
      counterSave.saveDict[i].value = counters[i];
      counterSave.saveSD();
      Serial.print("Button: ");
      Serial.println(i);
      digitalWrite(D6,HIGH);
    }
  }
    
  displayMassage(counterName[counterSlect] + ": " + counters[counterSlect], is_flash);
}

void timerMode(){
  static unsigned long save_prev = 0;
  // if no multi press, timer update
  bool all_timer_stopped = true;
  bool menuSafe_temp = menuSafe();
  for(int i=0; i<numButtons; i++){
    if(buttons[i]->doublePress() && menuSafe_temp){
      timers[i]->changeState();
      exCheck(i);
      SELECTED_BAR = i;
      is_activated = true;
      Serial.print("Button: ");
      Serial.println(i);
      digitalWrite(D6,HIGH);
    }

    timers[i]->time();
    if(timers[i]->is_started){
      all_timer_stopped = false;
    }
    updateText(); // display oled text
    updateAni();
    display.display();
  }

  if(all_timer_stopped){
    is_activated = false;
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

bool menuSafe(){
  if(menu_prev != 0 && (millis() - menu_prev < menuDelay)){
    return false;
  }
  return true;
}

String generateRandomString() {
  const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                         "abcdefghijklmnopqrstuvwxyz"
                         "0123456789"
                         "!@#$%^&*()-_=+[]{}|;:',.<>?/";
  const int charsetSize = sizeof(charset) - 1;
  String randomString = "";

  for(int i = 0; i < 20; i++){
    int randomIndex = random(0, charsetSize);
    randomString += charset[randomIndex];
  }

  return randomString;
}