#include <Arduino.h>
#include <ArduinoBLE.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include "Button.h"
#include "Timer.h"
#include "SDSave.h"

// BLE UUID
#define SERVICE_UUID "19b10000-e8f2-537e-4f6c-d104768a1214"
#define SAVE_STRT_CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"
#define LED_CHARACTERISTIC_UUID "19b10002-e8f2-537e-4f6c-d104768a1214"

// BLE Characteristic
BLEService bleService(SERVICE_UUID);
BLEStringCharacteristic saveStrtCharacteristic(SAVE_STRT_CHARACTERISTIC_UUID, BLERead | BLENotify, 256);
BLEByteCharacteristic ledCharacteristic(LED_CHARACTERISTIC_UUID, BLEWrite);
const int ledPin = D7;

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

int displaySlector = 1;
bool countDown_start = false;

// refresh rate
const int refresh_intvl = 20;
unsigned long refresh_prev = 0;

// save setting
const int save_intvl = 10000;

// button var setup
const int numButtons = 3;
const byte buttonPins[numButtons] = {button_1, button_2, button_3};
Button* buttons[numButtons];

bool is_locked = false;
bool showLock = false;
const int action_intvl = 300;
const int runTimeLog_intvl = 300000;
// const int runTimeLog_intvl = 60000;
unsigned long runTime = 0;

const int numModes = 6;
const int menuDelay = 500;
int modeSlector = 2;
bool showMenu = false;
unsigned long op_prev = 0;
String modeName[numModes + 2] = {"   |", "CLER", "SHOW", "TIME", "CONT", "RAND", "BULE", "|   "};

// timer var setup
const int numTimer = 3;
String timer_name[numTimer] = {"T-X", "T-Y", "T-Z"};
Timer* timers[numTimer];

// multi press config
const int countDownTime = 3000;
bool is_multPress = false;

const int numCounter = 3;
int counterSlect = 0;
int counters[numCounter] = {0, 0, 0};
String counterName[numCounter] = {"C-X", "C-Y", "C-Z"};

// save structure
const int dictSize_0 = 4;
const int dictSize_1 = 3;
const int dictSize_2 = 3;
const int dictSize_3 = 4;
const int dictSize_4 = 4;
keyValuePair saveStrt_0[dictSize_0] = {
  {"mode", 0}, {"runtime", 0}, {"t_clears", 0}, {"c_clears", 0}
};
keyValuePair saveStrt_1[dictSize_1] = {
  {"t_x", 0}, {"t_y", 0}, {"t_z", 0}
};
keyValuePair saveStrt_2[dictSize_2] = {
  {"c_x", 0}, {"c_y", 0}, {"c_z", 0}
};
keyValuePair saveStrt_3[dictSize_3] = {
  {"t_x", 0}, {"t_", 0}, {"t_z", 0}, {"runtime", 0}
};
keyValuePair saveStrt_4[dictSize_4] = {
  {"c_x", 0}, {"c_y", 0}, {"c_z", 0}, {"runtime", 0}
};
// init sd save
SDSave configSave(D0, "/config.txt", dictSize_0, saveStrt_0);
SDSave timerSave(D0, "/save_t.txt", dictSize_1, saveStrt_1);
SDSave counterSave(D0, "/save_c.txt", dictSize_2, saveStrt_2);
SDSave pastTimerData(D0, "/past_t.txt", dictSize_3, saveStrt_3);
SDSave pastCounterData(D0, "/past_c.txt", dictSize_4, saveStrt_4);



// update text on oled
void updateText(int _displaySlector = 0);
// update animate
void updateAni();
void drawBar(int value, int index, bool isSelected);
void barMapMod(int value);
// exclusive timer
void exCheck(int index);
// display error massage on oled
void displayMassage(String _text, bool _isFlash = false, int _textSize = 1);
// Key combination function
int fnPresseCheck();
void lockPresseCheck();
// multi Press Fn time2score countdown
bool countDown(int _countMs, String _massage = "");
// normalize time to int 0-5
int* time2score(long _time[], int _numValues);

bool opSafe();
void counterMode();

void logRunTime(bool _logNow = false);
void timerMode();
void showMode();
void clearMode();
void randMod();
void bleMod();
String generateRandomString();
String save2Json();
String getSaveStrtAsJson();

void setup() {
  Serial.begin(19200);
  pinMode(D6,OUTPUT); // for temp vibration drive

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

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
  if(configSave.loadSDSave()){
    displayMassage("* SD CARD ERROR *");
    while(1); // trap here
  }
  timerSave.readSave();
  counterSave.readSave();
  pastTimerData.checkExist();
  pastCounterData.checkExist();

  // load config
  for(int i=0; i<numTimer; i++){
    if(i==0){
      modeSlector = configSave.saveDict[i].value;
    }else if(i==1){
      runTime = configSave.saveDict[i].value;
    }
  }

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
  unsigned long refresh_temp = millis();
  if(refresh_temp-refresh_prev >= refresh_intvl){
    refresh_prev = refresh_temp;
    digitalWrite(D6,LOW);

    logRunTime();

    if(buttons[1]->longPress()){
      showMenu = true;
    }
    if(!showMenu){
      if(buttons[0]->longPress() && buttons[2]->longPress()){
        showLock = true;
      }
    }

    if(!showMenu && op_prev == 0 || !showLock && op_prev == 0){
      op_prev = millis();
    }

    switch (is_locked)
    {
      case true:{
        op_prev = 0;
        lockPresseCheck();
        if(showLock){
          displayMassage("UNLOCK?");
        }else{
          display.clearDisplay();
          display.display();
        }
        break;
      }
        
      case false:{
        if(showLock){
          op_prev = 0;
          lockPresseCheck();
          if(is_locked){
            break;
          }
          fnPresseCheck();
          displayMassage("LOCK?");
          display.display();
        }else if(showMenu){
          op_prev = 0;
          lockPresseCheck();
          if(is_locked){
            break;
          }
          int mode_temp = fnPresseCheck();
          int config_temp = modeSlector;
          modeSlector += mode_temp;

          if(modeSlector >= numModes){
            modeSlector = numModes - 1;
          }else if(modeSlector < 0){
            modeSlector = 0;
          }
          if(modeSlector != config_temp){
            configSave.saveDict[0].value = modeSlector;
            configSave.saveSD();
          }
          displayMassage(modeName[modeSlector] + " <- " + modeName[modeSlector+1]+ " -> " +modeName[modeSlector+2]);
        }else{
          switch(modeSlector){
            case 0:
              clearMode();
              break;

            case 1:
              showMode();
              break;

            case 2:
              timerMode();
              break;

            case 3:
              counterMode();
              break;

            case 4:
              randMod();
              break;

            case 5:
              bleMod();
              break;
          }
        }
        break;
      }

          // if(BLE_is_on && modeSlector !=5){
    //   unsigned long ble_cur = millis();
    //   if(ble_cur-ble_onTime >= 3000){
    //     ble_onTime = ble_cur;
    //     if(BLE_is_on){
    //       BLE.stopAdvertise();
    //       BLE.end();
    //       BLE_is_on = false;
    //     }
    //   }
    // }
    }
  }
}

void updateText(int _displaySlector){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  
  switch (_displaySlector)
  {
  case 0:
    display.print(timers[SELECTED_BAR]->name);
    display.print(": ");
    display.print(timers[SELECTED_BAR]->toHours());
    display.print("h ");
    display.print(timers[SELECTED_BAR]->toMinutes());
    display.print("min ");
    display.print(timers[SELECTED_BAR]->toSeconds());
    display.println("s ");
    break;
  
  case 1:
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
    break;
    
  case 2:
    for(int index=0; index<numCounter; index++){
        display.print(counterName[index]);
        display.print(": ");
        display.println(counters[index]);
    }
    break;
  }
  
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

void displayMassage(String _text, bool _isFlash, int _textSize){
  int16_t x1, y1;
  uint16_t textWidth, textHeight;
  display.getTextBounds(_text, 0, 0, &x1, &y1, &textWidth, &textHeight);
  
  int16_t x = (SCREEN_WIDTH - textWidth) / 2;
  int16_t y = (SCREEN_HEIGHT - textHeight) / 2;
  display.clearDisplay();
  display.setCursor(x,y);
  display.setTextSize(_textSize);

  if(_isFlash){
    display.fillScreen(WHITE);
    display.setTextColor(BLACK);
    // display.print(_text);
    // display.display();
    // display.clearDisplay();
    // display.setTextColor(WHITE);
  }else{
    display.setTextColor(WHITE);
  }

  display.print(_text);
  display.display();
}

int fnPresseCheck(){
  static bool hotkey_is_pressed = false;
  static bool action_triggered = false;
  static unsigned long last_action_time = 0;

  bool bh_is_pressed = buttons[1]->readNow();
  bool b1_is_pressed = buttons[0]->readNow();
  bool b2_is_pressed = buttons[2]->readNow();
  
  if(bh_is_pressed && !b1_is_pressed && !b2_is_pressed){
    hotkey_is_pressed = true;
  }else if(!bh_is_pressed){
    hotkey_is_pressed = false;
    action_triggered = false;
    showMenu = false;
  }

  if(hotkey_is_pressed){
    unsigned long current_time = millis();
    if(!action_triggered || current_time - last_action_time >= action_intvl){
      if(b1_is_pressed){
        last_action_time = current_time;
        action_triggered = true;
        // digitalWrite(D6,HIGH);
        return 1;
      }else if(b2_is_pressed){
        last_action_time = current_time;
        action_triggered = true;
        // digitalWrite(D6,HIGH);
        return -1;
      }
    }
  }
  return 0;
}

void lockPresseCheck(){
  static bool lockKey_is_pressed = false;
  static bool lock_triggered = false;
  static unsigned long last_action_time = 0;

  bool bh_is_pressed = buttons[1]->readNow();
  bool b1_is_pressed = buttons[0]->readNow();
  bool b2_is_pressed = buttons[2]->readNow();
  
  if(b1_is_pressed && b2_is_pressed && !bh_is_pressed){
    showMenu = false;
    lockKey_is_pressed = true;
  }else if(!b1_is_pressed && !b2_is_pressed){
    lockKey_is_pressed = false;
    lock_triggered = false;
    showLock = false;
  }

  if(lockKey_is_pressed){
    unsigned long current_time = millis();
    if(!lock_triggered || current_time - last_action_time >= action_intvl){
      if(bh_is_pressed){
        is_locked = !is_locked;
        last_action_time = current_time;
        lock_triggered = true;
        digitalWrite(D6,HIGH);
      }
    }
  }
}

bool countDown(int _countMs, String _massage){
  static int countMs = 0;
  static unsigned long countDown_prev = 0;
  unsigned long countDown_temp = millis();

  if(!countDown_start){
    countDown_start = true;
    countDown_prev = countDown_temp;
    countMs = _countMs;
    Serial.println(countMs);
    displayMassage(_massage + String(countMs/1000), true, 1);
  }

  if(countMs <= 0){
    countDown_start = false;
    return true;
  }else if(countDown_temp-countDown_prev >= 1000){
    countMs -= 1000;
    Serial.println(countMs);
    displayMassage(_massage + String(countMs/1000), true, 1);
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

void logRunTime(bool _logNow){
  static unsigned long runTimeLog_prev = 0;
  unsigned long runTimeLog_cur = millis();
  unsigned long runTimeLog_gap = runTimeLog_cur - runTimeLog_prev;
  if(runTimeLog_gap >= runTimeLog_intvl || _logNow){
    runTimeLog_prev = runTimeLog_cur;
    runTime += runTimeLog_gap;
    configSave.saveDict[1].value = runTime;
    configSave.saveSD();
  }
}

void counterMode(){
  bool is_flash = false;
  bool opSafe_temp = opSafe();
  for(int i=0; i<numButtons; i++){
    if(buttons[i]->released() && opSafe_temp){
      exCheck(i);
      is_flash = true;
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
  bool opSafe_temp = opSafe();
  for(int i=0; i<numButtons; i++){
    if(buttons[i]->doublePress() && opSafe_temp){
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

void randMod(){
  static bool keep_gen = true;
  bool opSafe_temp = opSafe();

  if(!opSafe()){
    keep_gen = true;
  }

  for(int i=0; i<numButtons; i++){
    if(buttons[i]->pressed() && opSafe_temp){
      keep_gen = !keep_gen;
    }
  }

  if(keep_gen){
    displayMassage(generateRandomString());
  }
}

void showMode(){
  if(buttons[0]->pressed() && opSafe()){
    displaySlector = 1;
  }else if(buttons[2]->pressed() && opSafe()){
    displaySlector = 2;
  }
  updateText(displaySlector);
  display.display();
}

bool opSafe(){
  if(op_prev != 0 && (millis() - op_prev < menuDelay)){
    return false;
  }
  return true;
}

void clearMode(){
  static bool is_countdown = false;
  static bool passOnec = false;
  static int clearTarget = 0;
  static String text = "ClearTIME | ClearCONT";

  if(buttons[2]->released() && opSafe()){
    if(passOnec){
      passOnec = false;
    }else{
      clearTarget = 1;
      text = "LP to clear TIME";
    }
  }else if(buttons[0]->released() && opSafe()){
    if(passOnec){
      passOnec = false;
    }else{
      clearTarget = 2;
      text = "LP to clear CONT";
    }
    
  }else if(clearTarget == 0 || !opSafe()){
    text = "ClearTIME | ClearCONT";
  }

  if(!is_countdown){
    displayMassage(text);
  }

  switch (clearTarget){
    case 1:{
      if(buttons[2]->longPress()){
        is_countdown = true;
      }

      if(is_countdown && buttons[2]->readNow()){
        if(countDown(countDownTime, "TIME clear in ")){
          for(int i=0; i<numTimer; i++){
            pastTimerData.saveDict[i].value = timers[i]->time_now;
            timerSave.saveDict[i].value = 0;
            timers[i]->clear();
          }
          pastTimerData.saveDict[3].value = configSave.saveDict[1].value;
          configSave.saveDict[2].value += 1;

          pastTimerData.logSD();
          timerSave.saveSD();
          logRunTime(true);

          is_countdown = false;
          clearTarget == 0;
          passOnec = true;

          displayMassage("TIME Cleared & Logged");
          delay(2000);
          displayMassage(" ");
          delay(500);
          op_prev = millis();
        }
      }else{
        countDown_start = false;
        is_countdown = false;
      }
      break;
    }
    case 2:{
      if(buttons[0]->longPress()){
        is_countdown = true;
      }

      if(is_countdown && buttons[0]->readNow()){
        if(countDown(countDownTime, "CONT clear in ")){
          for(int i=0; i<numCounter; i++){
            pastCounterData.saveDict[i].value = counters[i];
            counterSave.saveDict[i].value = 0;
            counters[i] = 0;
          }
          pastCounterData.saveDict[3].value = configSave.saveDict[1].value;
          configSave.saveDict[3].value += 1;

          pastCounterData.logSD();
          counterSave.saveSD();      
          logRunTime(true);

          is_countdown = false;
          clearTarget == 0;
          passOnec = true;

          displayMassage("CONT Cleared & Logged");
          delay(2000);
          displayMassage(" ");
          delay(500);
          op_prev = millis();
        }
      }else{
        countDown_start = false;
        is_countdown = false;
      }
      break;
    }
  }
}

void bleMod(){
  static bool need_init = true;
  static bool BLE_is_on = false;
  static unsigned long BLE_onTime = 0;

  bool opSafe_temp = opSafe();

  for(int i=0; i<numButtons; i++){
    if(buttons[i]->released() && opSafe_temp){
      if(i == 0){
        BLE_is_on = true;
      }else if(i == 2){
        BLE_is_on = false;
      }
    }
  }

  if(BLE_is_on){
    if(need_init){
      if (!BLE.begin()) {
        Serial.println("BLE INIT FAILL");
        displayMassage("* BLE INIT FAILL *");
        while (1);
      }

      need_init = false;
      displayMassage("PREP BLE...", true);
      delay(1000);

      // BLE init
      BLE.setLocalName("ESP32");
      BLE.setAdvertisedService(bleService);
      bleService.addCharacteristic(saveStrtCharacteristic);
      bleService.addCharacteristic(ledCharacteristic);
      BLE.addService(bleService);
      BLE.advertise();
      
      delay(1000);
    }

    BLEDevice central = BLE.central();
    BLE_onTime = millis();
    displayMassage("BLE is ON", true);

    if (central) {
      Serial.print("connected to: ");
      Serial.println(central.address());

      if (central.connected() && ledCharacteristic.written()) {
        int ledState = ledCharacteristic.value();
        digitalWrite(ledPin, ledState);
        Serial.print("LED: ");
        Serial.println(ledState);
      }
      saveStrtCharacteristic.writeValue(save2Json());
    }
  }else{
    displayMassage("BLE is OFF");
    unsigned long ble_cur = millis();
    if(ble_cur-BLE_onTime >= 3000){
      BLE_onTime = ble_cur;
      if(!need_init){
        BLE.stopAdvertise();
        BLE.end();
      }
      BLE_is_on = false;
      need_init = true;
    }
  }

  
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

String save2Json() {
  JsonDocument jsonDoc;
  for (int i = 0; i < dictSize_4; i++) {
    jsonDoc[pastCounterData.saveDict[i].key] = pastCounterData.saveDict[i].value;
  }
  String jsonStr;
  serializeJson(jsonDoc, jsonStr);
  return jsonStr;
}