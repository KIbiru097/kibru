# Industrial Safety & Employee Verification System - Wokwi Simulation

A full ESP32-based Wokwi simulation combining **Employee Verification** and **Industrial Monitoring** into a single integrated system.

## System Overview

### Employee Verification Module
Employees must authenticate using **any one** of three methods before the monitoring dashboard activates:

| Method | Component | How it Works |
|--------|-----------|-------------|
| RFID | MFRC522 (RC522) | Scan an authorized RFID card |
| Keypad | 4x4 Membrane Keypad | Enter PIN `1234` then press `#` (`*` to clear) |
| Fingerprint | Keypad key 'A' (simulated) | Press 'A' on the keypad |

### Industrial Monitoring Module
After verification, the system continuously monitors:

| Sensor | Component in Wokwi | What it Monitors |
|--------|-------------------|-----------------|
| Gas Sensor (MQ-2) | Potentiometer (analog) | Combustible gas levels - turn knob to simulate gas |
| Flame Sensor | Slide Switch (digital) | Fire detection - toggle switch to simulate fire |
| Temperature & Humidity (DHT22) | DHT22 sensor | Click sensor to adjust temp/humidity sliders |
| Vibration Sensor (SW-420) | Push Button (simulated) | Vibration detection - press red button |
| Water Leakage | Potentiometer (analog) | Water level detection - turn knob to simulate leak |

### Output Devices
| Device | Function |
|--------|----------|
| 20x4 I2C LCD | Rotating display pages showing all sensor data and status |
| Buzzer | Alarm sound - fast beep for DANGER, slow beep for WARNING |
| Green LED | SAFE status indicator |
| Yellow LED | WARNING status indicator |
| Red LED | DANGER status indicator |
| Servo Motor | Door lock - opens on verification, closes after 5 seconds |

## Alarm Thresholds

| Condition | Level | Trigger |
|-----------|-------|---------|
| Fire Detected | DANGER | Flame sensor activated |
| High Gas | DANGER | Gas ADC > 2300 |
| Extreme Temp | DANGER | Temperature > 55 C |
| Gas Warning | WARNING | Gas ADC > 1800 |
| High Temp | WARNING | Temperature > 40 C |
| Vibration | WARNING | Vibration button pressed |
| Water Leak | WARNING | Water ADC > 2000 |
| High Humidity | WARNING | Humidity > 85% |
| Low Humidity | WARNING | Humidity < 20% |

## How to Run in Wokwi

1. Go to [https://wokwi.com](https://wokwi.com)
2. Create a new ESP32 project
3. Copy `wokwi-industrial-safety-simulation.ino` into the code editor
4. Replace the `diagram.json` with the provided file (click the diagram.json tab)
5. Add the libraries listed in `libraries.txt` via Library Manager
6. Press the **Play** button to start the simulation

## How to Use

### Step 1: Employee Verification
When the simulation starts, you'll see "FACTORY SECURE" on the LCD. Authenticate using any method:
- **RFID**: Click the RFID card icon to scan (default authorized UID: `AABBCCDD`)
- **Keypad**: Type `1234` then press `#`
- **Fingerprint**: Press `A` on the keypad

### Step 2: Monitor Dashboard
After verification, the door servo opens and the LCD cycles through 4 pages:
1. **Environment** - Temperature and humidity readings
2. **Gas & Fire** - Gas level and flame detection status
3. **Mechanical** - Vibration and water leakage status
4. **System Status** - Overall alarm level and message

### Step 3: Trigger Alerts
Interact with sensors to test alarms:
- Turn the **Gas potentiometer** clockwise to increase gas level
- Toggle the **Flame slide switch** to simulate fire
- Click the DHT22 sensor to adjust **temperature/humidity** sliders
- Press the **red Vibration button** to trigger vibration
- Turn the **Water potentiometer** clockwise to simulate water leak

### Step 4: Lock System
Press `D` on the keypad to manually lock the system and return to verification screen.

## ESP32 Pin Assignments

| Component | ESP32 Pin(s) |
|-----------|-------------|
| RFID SDA | GPIO 5 |
| RFID SCK | GPIO 18 |
| RFID MOSI | GPIO 23 |
| RFID MISO | GPIO 19 |
| RFID RST | GPIO 4 |
| Keypad Rows | GPIO 32, 33, 25, 26 |
| Keypad Cols | GPIO 27, 14, 12, 13 |
| Fingerprint | Keypad 'A' key (no extra pin) |
| DHT22 Data | GPIO 2 |
| Gas (MQ-2) | GPIO 34 |
| Flame Sensor | GPIO 35 |
| Vibration Btn | GPIO 36 |
| Water Leak | GPIO 39 |
| Buzzer | GPIO 16 |
| Green LED | GPIO 17 |
| Yellow LED | GPIO 0 |
| Red LED | GPIO 3 |
| Servo | GPIO 15 |
| LCD SDA | GPIO 21 |
| LCD SCL | GPIO 22 |

## Libraries Required
- `MFRC522` - RFID reader
- `LiquidCrystal I2C` - I2C LCD display
- `Keypad` - 4x4 membrane keypad
- `DHT sensor library for ESPx` - DHT22 temperature/humidity
- `ESP32Servo` - Servo motor control
