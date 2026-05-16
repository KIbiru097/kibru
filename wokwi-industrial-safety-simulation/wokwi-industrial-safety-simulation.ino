/*
 * =============================================================
 *  INDUSTRIAL SAFETY & EMPLOYEE VERIFICATION SYSTEM
 *  Full Wokwi Simulation - ESP32
 * =============================================================
 *
 *  EMPLOYEE VERIFICATION MODULE:
 *    - RFID (MFRC522 / RC522) via SPI
 *    - 4x4 Membrane Keypad
 *    - Fingerprint sensor simulated via push-button
 *
 *  INDUSTRIAL MONITORING MODULE:
 *    - Gas sensor       (MQ-2 analog)
 *    - Flame sensor     (digital + analog)
 *    - Temperature/Humidity (DHT22)
 *    - Vibration sensor (SW-420 simulated via push-button)
 *    - Water leakage    (analog moisture sensor via potentiometer)
 *
 *  OUTPUT:
 *    - 20x4 I2C LCD display
 *    - Buzzer alarm
 *    - RGB status LEDs (Red / Yellow / Green)
 *    - Servo door lock
 *    - Serial Monitor logging
 *
 *  PIN ASSIGNMENTS (ESP32):
 *  --------------------------------------------------------
 *  RFID RC522:
 *    SDA/SS  -> GPIO 5
 *    SCK     -> GPIO 18
 *    MOSI    -> GPIO 23
 *    MISO    -> GPIO 19
 *    RST     -> GPIO 4
 *
 *  Keypad 4x4:
 *    Rows    -> GPIO 32, 33, 25, 26
 *    Cols    -> GPIO 27, 14, 12, 13
 *
 *  Fingerprint Button -> GPIO 15
 *
 *  DHT22:
 *    DATA    -> GPIO 2
 *
 *  MQ-2 Gas Sensor:
 *    AOUT    -> GPIO 34 (ADC)
 *
 *  Flame Sensor:
 *    DOUT    -> GPIO 35 (digital read)
 *
 *  Vibration Sensor (SW-420 button):
 *    DOUT    -> GPIO 36 (input only)
 *
 *  Water Leakage (potentiometer):
 *    SIG     -> GPIO 39 (ADC, input only)
 *
 *  Buzzer:
 *    SIG     -> GPIO 16
 *
 *  LEDs:
 *    Green   -> GPIO 17
 *    Yellow  -> GPIO 0
 *    Red     -> GPIO 22 (note: avoid boot-strapping pins)
 *
 *  Servo (Door Lock):
 *    SIG     -> GPIO 21
 *
 *  I2C LCD (20x4):
 *    SDA     -> GPIO 8  (custom I2C)
 *    SCL     -> GPIO 9  (custom I2C)
 *    Address -> 0x27
 * ============================================================
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <DHTesp.h>
#include <ESP32Servo.h>

/* ===================== PIN DEFINITIONS ===================== */

// RFID RC522 (SPI)
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

// Keypad 4x4
#define KP_R1  32
#define KP_R2  33
#define KP_R3  25
#define KP_R4  26
#define KP_C1  27
#define KP_C2  14
#define KP_C3  12
#define KP_C4  13

// Fingerprint button
#define FINGERPRINT_BTN  15

// DHT22
#define DHT_PIN  2

// MQ-2 Gas Sensor (analog)
#define GAS_PIN  34

// Flame Sensor (digital)
#define FLAME_PIN  35

// Vibration Sensor (button)
#define VIBRATION_PIN  36

// Water Leakage (potentiometer analog)
#define WATER_PIN  39

// Buzzer
#define BUZZER_PIN  16

// LEDs
#define GREEN_LED   17
#define YELLOW_LED  0
#define RED_LED     22

// Servo Door Lock
#define SERVO_PIN  21

// I2C LCD
#define LCD_SDA  8
#define LCD_SCL  9
#define LCD_ADDR 0x27

/* ===================== OBJECTS ===================== */

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_ADDR, 20, 4);
DHTesp dht;
Servo doorServo;

// Keypad setup
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {KP_R1, KP_R2, KP_R3, KP_R4};
byte colPins[COLS] = {KP_C1, KP_C2, KP_C3, KP_C4};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

/* ===================== CONSTANTS ===================== */

// Authorized credentials
const String AUTHORIZED_UID    = "AABBCCDD";
const String AUTHORIZED_PIN    = "1234";

// Sensor thresholds
const int    GAS_THRESHOLD     = 1800;     // ADC value (~44% of 4095)
const int    FLAME_DETECTED    = LOW;      // Flame sensor: LOW = fire detected
const float  TEMP_WARNING      = 40.0;     // Celsius
const float  TEMP_DANGER       = 55.0;     // Celsius
const float  HUMIDITY_LOW      = 20.0;     // % RH
const float  HUMIDITY_HIGH     = 85.0;     // % RH
const int    WATER_THRESHOLD   = 2000;     // ADC value for water detected
const int    VIBRATION_ACTIVE  = HIGH;     // SW-420: HIGH = vibration

// Timing
const unsigned long SENSOR_READ_INTERVAL = 2000;  // ms
const unsigned long LCD_PAGE_INTERVAL    = 3000;   // ms
const unsigned long DOOR_OPEN_TIME       = 5000;   // ms
const unsigned long ALARM_BEEP_ON        = 200;    // ms
const unsigned long ALARM_BEEP_OFF       = 200;    // ms

/* ===================== STATE VARIABLES ===================== */

// System states
enum SystemState {
  STATE_LOCKED,
  STATE_ENTER_PIN,
  STATE_VERIFIED,
  STATE_MONITORING
};
SystemState systemState = STATE_LOCKED;

// Employee verification
bool employeeVerified = false;
String enteredPin = "";
unsigned long doorOpenTime = 0;

// Sensor data
float temperature = 0.0;
float humidity = 0.0;
int   gasLevel = 0;
bool  flameDetected = false;
bool  vibrationDetected = false;
int   waterLevel = 0;

// Alarm state
enum AlarmLevel { ALARM_SAFE, ALARM_WARNING, ALARM_DANGER };
AlarmLevel currentAlarm = ALARM_SAFE;
String alarmMessage = "All Clear";

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastLCDPage = 0;
unsigned long lastAlarmBeep = 0;
bool alarmBeepState = false;
int lcdPage = 0;

/* ===================== CUSTOM TONE ===================== */

void playTone(int pin, int freq, int duration) {
  int delayTime = 500000 / freq;
  int cycles = (long)freq * duration / 1000;
  for (int i = 0; i < cycles; i++) {
    digitalWrite(pin, HIGH);
    delayMicroseconds(delayTime);
    digitalWrite(pin, LOW);
    delayMicroseconds(delayTime);
  }
}

/* ===================== LED CONTROL ===================== */

void setStatusLEDs(AlarmLevel level) {
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);

  switch (level) {
    case ALARM_SAFE:
      digitalWrite(GREEN_LED, HIGH);
      break;
    case ALARM_WARNING:
      digitalWrite(YELLOW_LED, HIGH);
      break;
    case ALARM_DANGER:
      digitalWrite(RED_LED, HIGH);
      break;
  }
}

/* ===================== BUZZER CONTROL ===================== */

void handleAlarmBuzzer() {
  if (currentAlarm == ALARM_SAFE) {
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }

  unsigned long now = millis();
  unsigned long interval = (currentAlarm == ALARM_DANGER) ? 100 : 500;

  if (now - lastAlarmBeep >= interval) {
    lastAlarmBeep = now;
    alarmBeepState = !alarmBeepState;
    if (alarmBeepState) {
      int freq = (currentAlarm == ALARM_DANGER) ? 2500 : 1200;
      playTone(BUZZER_PIN, freq, interval / 2);
    }
  }
}

/* ===================== RFID CHECK ===================== */

bool checkRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return false;
  if (!rfid.PICC_ReadCardSerial()) return false;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.print("[RFID] Card UID: ");
  Serial.println(uid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (uid == AUTHORIZED_UID) {
    Serial.println("[RFID] Authorized card detected!");
    return true;
  } else {
    Serial.println("[RFID] Unauthorized card!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("!! ACCESS DENIED !!");
    lcd.setCursor(0, 1);
    lcd.print("Unknown Card");
    lcd.setCursor(0, 2);
    lcd.print("UID: ");
    lcd.print(uid);
    playTone(BUZZER_PIN, 400, 500);
    delay(2000);
    return false;
  }
}

/* ===================== KEYPAD CHECK ===================== */

bool checkKeypad() {
  char key = keypad.getKey();
  if (key == 0) return false;

  Serial.print("[KEYPAD] Key pressed: ");
  Serial.println(key);

  if (key == '#') {
    // Submit PIN
    Serial.print("[KEYPAD] PIN entered: ");
    Serial.println(enteredPin);
    if (enteredPin == AUTHORIZED_PIN) {
      Serial.println("[KEYPAD] Correct PIN!");
      enteredPin = "";
      return true;
    } else {
      Serial.println("[KEYPAD] Wrong PIN!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("!! WRONG PIN !!");
      lcd.setCursor(0, 1);
      lcd.print("Try again...");
      playTone(BUZZER_PIN, 300, 500);
      delay(1500);
      enteredPin = "";
      return false;
    }
  } else if (key == '*') {
    // Clear PIN
    enteredPin = "";
    Serial.println("[KEYPAD] PIN cleared");
  } else if (key >= '0' && key <= '9') {
    if (enteredPin.length() < 8) {
      enteredPin += key;
    }
  }

  // Update LCD PIN display
  lcd.setCursor(0, 2);
  lcd.print("PIN: ");
  for (unsigned int i = 0; i < enteredPin.length(); i++) {
    lcd.print('*');
  }
  lcd.print("        ");  // Clear remaining

  return false;
}

/* ===================== FINGERPRINT CHECK ===================== */

bool checkFingerprint() {
  if (digitalRead(FINGERPRINT_BTN) == LOW) {
    delay(50);  // debounce
    if (digitalRead(FINGERPRINT_BTN) == LOW) {
      Serial.println("[FINGERPRINT] Valid fingerprint detected!");
      return true;
    }
  }
  return false;
}

/* ===================== SENSOR READING ===================== */

void readSensors() {
  unsigned long now = millis();
  if (now - lastSensorRead < SENSOR_READ_INTERVAL) return;
  lastSensorRead = now;

  // DHT22 Temperature & Humidity
  TempAndHumidity data = dht.getTempAndHumidity();
  if (!isnan(data.temperature) && !isnan(data.humidity)) {
    temperature = data.temperature;
    humidity = data.humidity;
  }

  // MQ-2 Gas Sensor
  gasLevel = analogRead(GAS_PIN);

  // Flame Sensor
  flameDetected = (digitalRead(FLAME_PIN) == FLAME_DETECTED);

  // Vibration Sensor
  vibrationDetected = (digitalRead(VIBRATION_PIN) == VIBRATION_ACTIVE);

  // Water Leakage
  waterLevel = analogRead(WATER_PIN);

  // Serial logging
  Serial.println("========== SENSOR DATA ==========");
  Serial.printf("  Temp: %.1f C | Humidity: %.1f %%\n", temperature, humidity);
  Serial.printf("  Gas Level: %d / 4095 (Threshold: %d)\n", gasLevel, GAS_THRESHOLD);
  Serial.printf("  Flame: %s\n", flameDetected ? "FIRE DETECTED!" : "No fire");
  Serial.printf("  Vibration: %s\n", vibrationDetected ? "VIBRATION!" : "Stable");
  Serial.printf("  Water Level: %d / 4095 (Threshold: %d)\n", waterLevel, WATER_THRESHOLD);
  Serial.println("=================================");
}

/* ===================== ALARM EVALUATION ===================== */

void evaluateAlarms() {
  AlarmLevel newAlarm = ALARM_SAFE;
  String newMessage = "All Systems Normal";

  // DANGER conditions
  if (flameDetected) {
    newAlarm = ALARM_DANGER;
    newMessage = "FIRE DETECTED!";
  } else if (gasLevel > GAS_THRESHOLD + 500) {
    newAlarm = ALARM_DANGER;
    newMessage = "HIGH GAS LEVEL!";
  } else if (temperature > TEMP_DANGER) {
    newAlarm = ALARM_DANGER;
    newMessage = "EXTREME TEMP!";
  }
  // WARNING conditions
  else if (gasLevel > GAS_THRESHOLD) {
    newAlarm = ALARM_WARNING;
    newMessage = "Gas Warning!";
  } else if (temperature > TEMP_WARNING) {
    newAlarm = ALARM_WARNING;
    newMessage = "High Temp Warning!";
  } else if (vibrationDetected) {
    newAlarm = ALARM_WARNING;
    newMessage = "Vibration Alert!";
  } else if (waterLevel > WATER_THRESHOLD) {
    newAlarm = ALARM_WARNING;
    newMessage = "Water Leak Alert!";
  } else if (humidity > HUMIDITY_HIGH) {
    newAlarm = ALARM_WARNING;
    newMessage = "High Humidity!";
  } else if (humidity < HUMIDITY_LOW) {
    newAlarm = ALARM_WARNING;
    newMessage = "Low Humidity!";
  }

  if (newAlarm != currentAlarm) {
    Serial.print("[ALARM] Level changed to: ");
    Serial.println(newAlarm == ALARM_SAFE ? "SAFE" :
                   newAlarm == ALARM_WARNING ? "WARNING" : "DANGER");
    Serial.print("[ALARM] Message: ");
    Serial.println(newMessage);
  }

  currentAlarm = newAlarm;
  alarmMessage = newMessage;
  setStatusLEDs(currentAlarm);
}

/* ===================== LCD DISPLAY ===================== */

void updateLCDLocked() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("== FACTORY SECURE ==");
  lcd.setCursor(0, 1);
  lcd.print("Scan RFID / Enter");
  lcd.setCursor(0, 2);
  lcd.print("PIN: ");
  lcd.setCursor(0, 3);
  lcd.print("Or Press Fingerprint");
}

void updateLCDVerified() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("** ACCESS GRANTED **");
  lcd.setCursor(0, 1);
  lcd.print("Employee Verified!");
  lcd.setCursor(0, 2);
  lcd.print("Door: OPEN");
  lcd.setCursor(0, 3);
  lcd.print("Loading monitors...");
}

void updateLCDMonitoring() {
  unsigned long now = millis();
  if (now - lastLCDPage < LCD_PAGE_INTERVAL) return;
  lastLCDPage = now;

  lcd.clear();

  switch (lcdPage) {
    case 0:  // Temperature & Humidity
      lcd.setCursor(0, 0);
      lcd.print("--- ENVIRONMENT ---");
      lcd.setCursor(0, 1);
      lcd.print("Temp: ");
      lcd.print(temperature, 1);
      lcd.print(" C");
      lcd.setCursor(0, 2);
      lcd.print("Humidity: ");
      lcd.print(humidity, 1);
      lcd.print(" %");
      lcd.setCursor(0, 3);
      lcd.print("Status: ");
      lcd.print(temperature > TEMP_WARNING ? "WARN" : "OK");
      break;

    case 1:  // Gas & Flame
      lcd.setCursor(0, 0);
      lcd.print("--- GAS & FIRE ---");
      lcd.setCursor(0, 1);
      lcd.print("Gas: ");
      lcd.print(gasLevel);
      lcd.print("/4095");
      lcd.setCursor(0, 2);
      lcd.print("Flame: ");
      lcd.print(flameDetected ? "FIRE!!" : "None");
      lcd.setCursor(0, 3);
      lcd.print("Status: ");
      lcd.print((flameDetected || gasLevel > GAS_THRESHOLD) ? "ALERT!" : "OK");
      break;

    case 2:  // Vibration & Water
      lcd.setCursor(0, 0);
      lcd.print("--- MECHANICAL ---");
      lcd.setCursor(0, 1);
      lcd.print("Vibration: ");
      lcd.print(vibrationDetected ? "YES!" : "None");
      lcd.setCursor(0, 2);
      lcd.print("Water Leak: ");
      lcd.print(waterLevel);
      lcd.setCursor(0, 3);
      lcd.print("Status: ");
      lcd.print((vibrationDetected || waterLevel > WATER_THRESHOLD) ? "ALERT!" : "OK");
      break;

    case 3:  // Overall Status
      lcd.setCursor(0, 0);
      lcd.print("=== SYSTEM STATUS ==");
      lcd.setCursor(0, 1);
      lcd.print("Alarm: ");
      lcd.print(currentAlarm == ALARM_SAFE ? "SAFE" :
                currentAlarm == ALARM_WARNING ? "WARNING" : "DANGER!");
      lcd.setCursor(0, 2);
      lcd.print(alarmMessage);
      lcd.setCursor(0, 3);
      lcd.print("Employee: Verified");
      break;
  }

  lcdPage = (lcdPage + 1) % 4;
}

/* ===================== DOOR CONTROL ===================== */

void openDoor() {
  doorServo.write(90);
  Serial.println("[DOOR] Door OPENED");
}

void closeDoor() {
  doorServo.write(0);
  Serial.println("[DOOR] Door CLOSED");
}

/* ===================== SETUP ===================== */

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("=============================================");
  Serial.println(" INDUSTRIAL SAFETY & EMPLOYEE VERIFICATION");
  Serial.println(" System Initializing...");
  Serial.println("=============================================");

  // Initialize I2C on custom pins
  Wire.begin(LCD_SDA, LCD_SCL);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("  INDUSTRIAL SAFETY");
  lcd.setCursor(0, 1);
  lcd.print("  MONITORING SYSTEM");
  lcd.setCursor(0, 2);
  lcd.print("  Initializing...");

  // Initialize SPI and RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[INIT] RFID RC522 initialized");

  byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("[INIT] MFRC522 firmware version: 0x");
  Serial.println(version, HEX);

  // Initialize DHT22
  dht.setup(DHT_PIN, DHTesp::DHT22);
  Serial.println("[INIT] DHT22 initialized");

  // Initialize pins
  pinMode(FINGERPRINT_BTN, INPUT_PULLUP);
  pinMode(GAS_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(WATER_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  // Initialize Servo
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);  // Door locked
  Serial.println("[INIT] Servo door lock initialized");

  // Initial LED state
  setStatusLEDs(ALARM_SAFE);

  Serial.println("[INIT] All systems ready!");
  Serial.println("[SYSTEM] Waiting for employee verification...");
  Serial.println("  - Scan RFID card");
  Serial.println("  - Enter PIN on keypad (# to submit, * to clear)");
  Serial.println("  - Press fingerprint button");

  delay(2000);

  // Show locked screen
  updateLCDLocked();
  systemState = STATE_LOCKED;
}

/* ===================== MAIN LOOP ===================== */

void loop() {
  switch (systemState) {

    case STATE_LOCKED:
    case STATE_ENTER_PIN: {
      // Check all three verification methods
      bool verified = false;

      // Method 1: RFID
      if (checkRFID()) {
        verified = true;
        Serial.println("[AUTH] Verified via RFID");
      }

      // Method 2: Keypad PIN
      if (!verified && checkKeypad()) {
        verified = true;
        Serial.println("[AUTH] Verified via Keypad PIN");
      }

      // Method 3: Fingerprint button
      if (!verified && checkFingerprint()) {
        verified = true;
        Serial.println("[AUTH] Verified via Fingerprint");
      }

      if (verified) {
        employeeVerified = true;
        systemState = STATE_VERIFIED;

        // Grant access
        playTone(BUZZER_PIN, 1000, 100);
        delay(100);
        playTone(BUZZER_PIN, 1500, 100);
        delay(100);
        playTone(BUZZER_PIN, 2000, 200);

        updateLCDVerified();
        openDoor();
        doorOpenTime = millis();

        Serial.println("[SYSTEM] Access GRANTED - Transitioning to monitoring mode");
      }

      // Re-display locked screen periodically
      if (!verified && systemState == STATE_LOCKED) {
        unsigned long now = millis();
        if (now - lastLCDPage > 10000) {
          lastLCDPage = now;
          updateLCDLocked();
        }
      }
      break;
    }

    case STATE_VERIFIED: {
      // Wait for door to close, then transition to monitoring
      if (millis() - doorOpenTime >= DOOR_OPEN_TIME) {
        closeDoor();
        systemState = STATE_MONITORING;
        Serial.println("[SYSTEM] Door closed - Monitoring mode active");
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Monitoring Active...");
        delay(1000);
        lastLCDPage = 0;
        lcdPage = 0;
      }
      break;
    }

    case STATE_MONITORING: {
      // Read all sensors
      readSensors();

      // Evaluate alarm conditions
      evaluateAlarms();

      // Update LCD with rotating pages
      updateLCDMonitoring();

      // Handle alarm buzzer
      handleAlarmBuzzer();

      // Check for 'D' key to lock system again
      char key = keypad.getKey();
      if (key == 'D') {
        Serial.println("[SYSTEM] Manual lock triggered - returning to locked state");
        employeeVerified = false;
        systemState = STATE_LOCKED;
        currentAlarm = ALARM_SAFE;
        setStatusLEDs(ALARM_SAFE);
        digitalWrite(BUZZER_PIN, LOW);
        closeDoor();
        updateLCDLocked();
      }
      break;
    }
  }

  delay(50);  // Small delay for stability
}
