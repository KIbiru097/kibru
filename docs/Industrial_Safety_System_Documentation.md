# Industrial Safety Monitoring System — Full Project Documentation

**Author:** Nebyu Samuel  
**Platform:** ESP32 (Wokwi Simulation)  
**Editor:** Wokwi Online Simulator  
**Course:** Real-Time Embedded Systems  
**Version:** 2.0

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Overview](#2-project-overview)
3. [System Objectives](#3-system-objectives)
4. [Relation to Course Material (Chapters 1–3)](#4-relation-to-course-material-chapters-13)
5. [System Architecture](#5-system-architecture)
6. [Hardware Components](#6-hardware-components)
7. [Wokwi Circuit Diagram](#7-wokwi-circuit-diagram)
8. [Pin Configuration](#8-pin-configuration)
9. [Software Architecture](#9-software-architecture)
10. [Real-Time Task Model](#10-real-time-task-model)
11. [Sensor Subsystem](#11-sensor-subsystem)
12. [RFID Access Control Subsystem](#12-rfid-access-control-subsystem)
13. [Alert and Risk Management](#13-alert-and-risk-management)
14. [Communication Protocol — MQTT](#14-communication-protocol--mqtt)
15. [Fail-Safe and Fault Tolerance](#15-fail-safe-and-fault-tolerance)
16. [Process Management and Scheduling](#16-process-management-and-scheduling)
17. [Context Switching in the System](#17-context-switching-in-the-system)
18. [RTOS Concepts Applied](#18-rtos-concepts-applied)
19. [Embedded Framework Analysis](#19-embedded-framework-analysis)
20. [LCD Display Subsystem](#20-lcd-display-subsystem)
21. [Maintenance and System Health](#21-maintenance-and-system-health)
22. [Testing and Validation](#22-testing-and-validation)
23. [Wokwi Simulation Code](#23-wokwi-simulation-code)
24. [Wokwi Diagram JSON](#24-wokwi-diagram-json)
25. [Conclusion and Future Work](#25-conclusion-and-future-work)
26. [References](#26-references)

---

## 1. Introduction

This document presents a comprehensive project documentation for the **Industrial Safety Monitoring System** — a real-time embedded system built on the ESP32 microcontroller platform. The system integrates multiple sensors (temperature, gas, flame, water leak), RFID-based access control, MQTT IoT communication, and automated safety responses to monitor and protect industrial environments.

This documentation connects the practical implementation to the theoretical foundations covered in **Chapter 1** (Real-Time Systems fundamentals), **Chapter 2** (Embedded System Architecture), and **Chapter 3** (RTOS, Process Management, Scheduling, and Context Switching) of the Real-Time Embedded Systems course.

The project demonstrates how real-time constraints, deterministic behavior, fault tolerance, and embedded system design principles translate into a functional safety-critical application.

---

## 2. Project Overview

### 2.1 System Description

The Industrial Safety Monitoring System is a **Hard/Firm Real-Time System** designed to:

- Continuously monitor environmental conditions (temperature, humidity, gas levels, flame detection, water leaks)
- Control access to restricted areas via RFID authentication
- Trigger immediate alerts (buzzer, LEDs) when safety thresholds are exceeded
- Communicate sensor data and alerts to a remote server via MQTT over WiFi
- Implement fail-safe mechanisms when sensors malfunction
- Track maintenance schedules and system health metrics

### 2.2 System Classification

| Property | Value |
|----------|-------|
| **System Type** | Real-Time Embedded System |
| **RTS Category** | Hard RTS (safety alerts) / Firm RTS (data reporting) |
| **Processor** | ESP32-DevKit-C V4 (Dual-core Xtensa LX6, 240 MHz) |
| **Architecture** | Harvard Architecture (separate instruction/data buses) |
| **Communication** | WiFi + MQTT (IoT), SPI (RFID), I2C (LCD), Analog (sensors) |
| **Development Platform** | Arduino Framework on Wokwi Simulator |

### 2.3 Key Features

1. **Multi-sensor environmental monitoring** with configurable thresholds
2. **RFID-based access control** with EEPROM persistent storage
3. **Risk score calculation** with multi-level alert system
4. **MQTT IoT communication** for remote monitoring and control
5. **Fail-safe mode** for sensor failure scenarios
6. **Predictive maintenance** tracking based on operating hours
7. **Temperature-controlled relay** for cooling system automation

---

## 3. System Objectives

| Objective | Description | Course Relation |
|-----------|-------------|-----------------|
| **Safety Monitoring** | Detect hazardous conditions within strict timing constraints | Chapter 1: Hard RTS — missed deadlines cause catastrophic consequences |
| **Access Control** | Authenticate personnel before granting facility access | Chapter 2: SPI communication protocol with MFRC522 |
| **Real-Time Response** | Respond to sensor readings within 2-second cycles | Chapter 1: Response Time = Completion Time − Release Time |
| **Fault Tolerance** | Continue operating safely even when sensors fail | Chapter 3: RTOS reliability and fault tolerance features |
| **Remote Communication** | Publish data to cloud every 5 seconds | Chapter 2: Serial communication (USART-based WiFi) |
| **Deterministic Behavior** | Predictable response regardless of system load | Chapter 3: Determinism as core RTOS principle |

---

## 4. Relation to Course Material (Chapters 1–3)

### 4.1 Chapter 1 — Real-Time Systems Fundamentals

| Course Concept | Implementation in Project |
|----------------|--------------------------|
| **Definition of RTS** | System correctness depends on both the logical result (correct sensor reading) AND the time at which it's produced (within 2-second cycle) |
| **Hard RTS** | Fire/gas alerts MUST trigger within milliseconds — a late alert could mean loss of life |
| **Firm RTS** | MQTT data publishing — a late reading is useless for monitoring but missing one won't cause catastrophe |
| **Job & Task** | Each sensor read is a Job; the complete monitoring cycle is a Task |
| **Release Time** | Every 2000ms, the sensor reading task is released |
| **Execution Time** | Sensor reads + risk calculation + alert check ≈ 100ms |
| **Relative Deadline** | Must complete before next release (D = 2000ms) |
| **Response Time** | Time from sensor event to buzzer activation |
| **Time-Triggered Tasks** | Sensor reading every 2s, MQTT publish every 5s, health report every 30s |
| **Event-Triggered Tasks** | RFID card scan (aperiodic), MQTT command received (aperiodic) |
| **System Architecture** | Sensors → Signal Conditioning (ADC) → Computer (ESP32) → Actuators (Buzzer, Relay, LEDs) |
| **Concurrency** | Multiple tasks (sensor read, RFID check, MQTT, LCD update) run quasi-concurrently |
| **Determinism** | Fixed sensor read interval guarantees predictable monitoring |
| **Fault Tolerance** | Fail-safe mode activates when sensors malfunction |
| **Stability** | Under overload (multiple critical alerts), system still executes priority responses |

### 4.2 Chapter 2 — Embedded System Architecture

| Course Concept | Implementation in Project |
|----------------|--------------------------|
| **Microcontroller (MCU)** | ESP32 — processor + memory + WiFi + peripherals on a single chip |
| **Harvard Architecture** | ESP32 uses modified Harvard architecture with separate instruction/data caches |
| **SPI Protocol** | RFID reader (MFRC522) communicates via SPI (MOSI, MISO, SCK, SS) |
| **I2C Protocol** | LCD display uses I2C (SDA, SCL) — only 2 wires for communication |
| **ADC (Analog-to-Digital)** | Gas sensor (pin 34), flame sensor (pin 35), water leak (pin 32) use ESP32's 12-bit ADC |
| **GPIO** | Digital outputs for buzzer (pin 25), LEDs (pins 13, 26), relay (pin 14) |
| **Sensor → Conditioning → Interface → Computer** | DHT22 → digital protocol → GPIO4 → ESP32 processing |
| **Actuator** | Relay controls cooling system; buzzer provides audible alerts |
| **Memory Organization** | EEPROM (1024 bytes) for persistent storage of RFID cards and system state |
| **Interrupt Handling** | RFID detection via SPI polling every 200 ms; timer-based polling for sensors |
| **Communication Protocols** | USART (Serial debug), SPI (RFID), I2C (LCD), WiFi (TCP/IP for MQTT) |
| **System-on-Chip (SoC)** | ESP32 integrates CPU, WiFi, Bluetooth, ADC, SPI, I2C, UART on single chip |

### 4.3 Chapter 3 — RTOS, Process Management, Scheduling

| Course Concept | Implementation in Project |
|----------------|--------------------------|
| **Operating System Purpose** | Arduino framework manages hardware abstraction; loop() acts as a simple scheduler |
| **RTOS Concepts** | Priority-based task execution in main loop (RFID > Sensors > MQTT) |
| **Determinism** | Fixed intervals ensure predictable system behavior |
| **Priority-Based Scheduling** | RFID checked every 200ms (high priority), sensors every 2000ms, MQTT every 5000ms |
| **Process States** | Tasks cycle between Ready (timer elapsed) → Running (executing) → Waiting (timer not elapsed) |
| **Context Switching** | When RFID polling timer elapses, current sensor task yields and RFID executes next |
| **Inter-Task Communication** | Global variables serve as shared memory between tasks (sensor values shared with alert system) |
| **Semaphores/Mutex concept** | LCD access is serialized — only one function updates LCD at a time |
| **Timer Services** | millis() provides system clock for all timing decisions |
| **Interrupt Handlers** | SPI polling (every 200 ms) for RFID card detection — no hardware IRQ line used |
| **Memory Management** | Static allocation (EEPROM address map, fixed-size arrays) avoids dynamic allocation issues |
| **Process Control Block** | Each task has state: last execution time, current values, enabled/disabled flags |
| **Scheduling Algorithm** | Cooperative round-robin with priority differentiation via different periods |
| **Embedded Framework** | Arduino framework provides hardware abstraction, reusable libraries (WiFi, SPI, Wire, DHT) |
| **Middleware** | PubSubClient library acts as MQTT middleware for IoT communication |
| **Fault Tolerance** | Sensor health monitoring, fail-safe mode, and maintenance tracking |

---

## 5. System Architecture

### 5.1 High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    INDUSTRIAL SAFETY SYSTEM v2.0                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐   │
│  │   SENSORS    │     │    ESP32 MCU      │     │   ACTUATORS    │   │
│  │              │     │                    │     │                │   │
│  │ DHT22 (Temp) │────►│  Signal Processing │────►│ Buzzer (Alert) │   │
│  │ MQ-2 (Gas)   │────►│  Risk Calculation  │────►│ Red LED (Warn) │   │
│  │ Flame Sensor │────►│  Decision Making   │────►│ Green LED (OK) │   │
│  │ Water Sensor │────►│  MQTT Publishing   │────►│ Relay (Cooling)│   │
│  └──────────────┘     │                    │     └────────────────┘   │
│                        │  ┌──────────────┐ │                          │
│  ┌──────────────┐     │  │  EEPROM      │ │     ┌────────────────┐   │
│  │ RFID Reader  │────►│  │  (Persistent)│ │────►│ LCD Display    │   │
│  │ (MFRC522)    │     │  └──────────────┘ │     │ (16x2 I2C)    │   │
│  └──────────────┘     └────────┬───────────┘     └────────────────┘   │
│                                 │                                      │
│                        ┌────────▼───────────┐                         │
│                        │   WiFi + MQTT      │                         │
│                        │  (broker.emqx.io)  │                         │
│                        └────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow Model (Chapter 1 — System Architecture)

```text
Physical World (Temperature, Gas, Fire, Water)
       │
       ▼
┌─────────────┐
│   SENSORS   │  (Input Transducers)
│ DHT22, MQ-2 │  Convert physical → electrical signals
│ Flame, Water│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ SIGNAL INTERFACE │  (ADC / Digital Protocol)
│ 12-bit ADC      │  Analog → Digital conversion
│ One-Wire (DHT)  │  
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│  COMPUTER (ESP32) │  Processing + Decision Making
│  Risk Calculation │  RTOS-like task scheduling
│  Alert Logic      │  MQTT communication
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ OUTPUT INTERFACE │  (Digital Signals)
│ GPIO, PWM       │  
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│  ACTUATORS  │  (Output Transducers)
│ Buzzer      │  Electrical → Physical (sound, motion)
│ Relay/Motor │
│ LEDs        │
└─────────────┘
```

This directly mirrors the **Chapter 1 Basic Model of RTS**: Sensor → Input Signal Conditioning → Interface Unit (ADC) → Computer (RTOS) → Output Interface (DAC) → Signal Conditioning → Actuator.

---

## 6. Hardware Components

### 6.1 Component List

| Component | Type | Role | Communication |
|-----------|------|------|---------------|
| **ESP32-DevKit-C V4** | Microcontroller | Central processing unit | — |
| **MFRC522** | RFID Reader | Access control | SPI |
| **LCD 1602** | Display | User interface | I2C |
| **DHT22** | Temp/Humidity Sensor | Environmental monitoring | One-Wire (GPIO4) |
| **MQ-2 Gas Sensor** | Analog Sensor | Gas leak detection | ADC (GPIO34) |
| **Flame Sensor** | Analog Sensor (Potentiometer) | Fire detection | ADC (GPIO35) |
| **Water Leak Sensor** | Analog Sensor (Potentiometer) | Water leak detection | ADC (GPIO32) |
| **Buzzer** | Piezo Buzzer | Audible alerts | Digital (GPIO25) |
| **Red LED** | LED | Danger indicator | Digital (GPIO26) |
| **Green LED** | LED | Safe status indicator | Digital (GPIO13) |
| **Relay Module** | Electromechanical | Cooling system control | Digital (GPIO14) |
| **220Ω Resistors (×2)** | Passive | LED current limiting | — |
| **Breadboard** | Prototyping | Circuit connections | — |

### 6.2 ESP32 Microcontroller Specifications (Chapter 2 — Processor Types)

| Specification | Value |
|---------------|-------|
| **Processor** | Xtensa LX6 Dual-Core |
| **Clock Speed** | Up to 240 MHz |
| **Architecture** | Modified Harvard (RISC) |
| **Flash Memory** | 4 MB |
| **SRAM** | 520 KB |
| **WiFi** | 802.11 b/g/n |
| **Bluetooth** | v4.2 BR/EDR and BLE |
| **ADC** | 12-bit, up to 18 channels |
| **SPI** | 4 interfaces |
| **I2C** | 2 interfaces |
| **UART** | 3 interfaces |
| **GPIO** | 34 programmable pins |

The ESP32 is a **System-on-Chip (SoC)** as described in Chapter 2 — integrating CPU, memory, WiFi, Bluetooth, ADC, and multiple communication interfaces on a single chip. It uses a **modified Harvard architecture** with separate instruction and data caches for efficient parallel access.

---

## 7. Wokwi Circuit Diagram

### 7.1 Circuit Description

The circuit is built on a breadboard with the ESP32-DevKit-C V4 as the central controller. Components are connected as follows:

**SPI Bus (RFID Reader — MFRC522):**
- SS (Slave Select) → GPIO5
- SCK (Clock) → GPIO18
- MOSI (Master Out Slave In) → GPIO23
- MISO (Master In Slave Out) → GPIO19
- RST (Reset) → GPIO27
- 3.3V → ESP32 3V3
- GND → Common Ground

**I2C Bus (LCD 1602):**
- SDA (Data) → GPIO21
- SCL (Clock) → GPIO22
- VCC → 5V rail
- GND → Common Ground

**Analog Sensors:**
- Gas Sensor (MQ-2) AOUT → GPIO34
- Flame Sensor (Potentiometer) SIG → GPIO35
- Water Leak Sensor (Potentiometer) SIG → GPIO32

**Digital Sensor:**
- DHT22 SDA → GPIO4
- DHT22 VCC → 5V rail
- DHT22 GND → Common Ground

**Actuators:**
- Buzzer → GPIO25
- Red LED → GPIO26 (via 220Ω resistor)
- Green LED → GPIO13 (via 220Ω resistor)
- Relay Module IN → GPIO14

### 7.2 Communication Protocol Summary (Chapter 2)

| Protocol | Pins Used | Speed | Device |
|----------|-----------|-------|--------|
| **SPI** | GPIO5, 18, 23, 19, 27 | Up to 10 MHz | MFRC522 RFID |
| **I2C** | GPIO21 (SDA), GPIO22 (SCL) | 400 KHz | LCD 1602 |
| **One-Wire** | GPIO4 | ~1 MHz | DHT22 |
| **ADC** | GPIO34, 35, 32 | 12-bit resolution | Analog sensors |
| **UART** | TX/RX | 115200 baud | Serial debug |
| **WiFi** | Internal | 802.11n | MQTT broker |

---

## 8. Pin Configuration

### 8.1 Complete Pin Map

```text
ESP32 Pin Assignments:
═══════════════════════════════════════
GPIO4  ─── DHT22 (Temperature/Humidity)
GPIO5  ─── MFRC522 SS (SPI Slave Select)
GPIO13 ─── Green LED (Safe indicator)
GPIO14 ─── Relay Module (Cooling control)
GPIO18 ─── MFRC522 SCK (SPI Clock)
GPIO19 ─── MFRC522 MISO (SPI Data In)
GPIO21 ─── LCD SDA (I2C Data)
GPIO22 ─── LCD SCL (I2C Clock)
GPIO23 ─── MFRC522 MOSI (SPI Data Out)
GPIO25 ─── Buzzer (Alarm)
GPIO26 ─── Red LED (Danger indicator)
GPIO27 ─── MFRC522 RST (Reset)
GPIO32 ─── Water Leak Sensor (ADC)
GPIO34 ─── Gas Sensor MQ-2 (ADC)
GPIO35 ─── Flame Sensor (ADC)
3V3    ─── MFRC522 VCC
5V     ─── LCD VCC, DHT22 VCC, Relay VCC
GND    ─── Common Ground (all devices)
═══════════════════════════════════════
```

### 8.2 Sensor Thresholds Configuration

| Sensor | Warning Level | Critical Level | Normal |
|--------|--------------|----------------|--------|
| **Gas (MQ-2)** | 1000 | 2000 | < 1000 |
| **Flame** | 2000 | 3000 | < 2000 |
| **Water Leak** | 1500 | 2500 | < 1500 |
| **Temperature** | 30–39°C | 40°C | 50°C |

> **Note:** Temperature ranges — Normal: < 30°C, Warning: 30–39°C, Critical: 40–49°C, Emergency: ≥ 50°C.

---

## 9. Software Architecture

### 9.1 Layered Architecture (Chapter 3 — Software Framework)

```text
┌────────────────────────────────────────────┐
│         APPLICATION LAYER                   │
│  Safety Logic, Risk Calculation, RFID Auth  │
├────────────────────────────────────────────┤
│         MIDDLEWARE LAYER                    │
│  PubSubClient (MQTT), ArduinoJson          │
├────────────────────────────────────────────┤
│         LIBRARY LAYER                       │
│  WiFi, SPI, Wire, DHT, MFRC522, LCD_I2C   │
├────────────────────────────────────────────┤
│         HAL (Hardware Abstraction Layer)    │
│  Arduino Framework (GPIO, ADC, Timers)     │
├────────────────────────────────────────────┤
│         HARDWARE LAYER                      │
│  ESP32 (CPU, Memory, Peripherals)          │
└────────────────────────────────────────────┘
```

This mirrors the **Chapter 3 Embedded Framework** structure:
- **Predefined Structure**: Arduino's setup()/loop() paradigm
- **Reusable Components**: Libraries for WiFi, SPI, I2C, MQTT
- **Abstraction Layer**: Arduino HAL abstracts register-level operations
- **Extensibility**: Custom safety logic built on top of framework

### 9.2 Module Organization

| Module | Functions | Responsibility |
|--------|-----------|---------------|
| **RFID Module** | saveRFIDToEEPROM(), loadRFIDFromEEPROM(), verifyRFIDAccess(), addRFIDCard() | Access control management |
| **Safety Module** | activateFailSafeMode(), getSafeSensorValue(), checkSensorHealth() | Fault detection and safe defaults |
| **Risk Module** | calculateRiskScore() | Weighted risk assessment |
| **Alert Module** | checkAndTriggerAlerts() | Alert generation and actuator control |
| **Sensor Module** | readAllSensors() | Data acquisition with averaging |
| **Display Module** | updateLCD() | User interface |
| **Cooling Module** | controlCoolingSystem() | Temperature-based relay control |
| **Communication Module** | connectWiFi(), reconnectMQTT(), publishMQTTData(), mqttCallback() | IoT connectivity |
| **Maintenance Module** | updateMaintenanceTracking(), publishSystemHealth() | Predictive maintenance |

---

## 10. Real-Time Task Model

### 10.1 Task Specification Table (Chapter 1 — Task Types)

| Task | Type | Period | Execution Time (est.) | Deadline | Priority |
|------|------|--------|----------------------|----------|----------|
| RFID Check | **Event-Triggered** (polled) | 200 ms | ~5 ms | 200 ms | HIGH |
| Sensor Read | **Time-Triggered** (periodic) | 2000 ms | ~100 ms | 2000 ms | MEDIUM |
| Risk Calculation | Time-Triggered | 2000 ms | ~10 ms | 2000 ms | MEDIUM |
| Alert Check | Time-Triggered | 2000 ms | ~20 ms | 2000 ms | HIGH |
| LCD Update | Time-Triggered | 500 ms | ~5 ms | 500 ms | LOW |
| MQTT Publish | Time-Triggered | 5000 ms | ~50 ms | 5000 ms | LOW |
| System Health | Time-Triggered | 30000 ms | ~20 ms | 30000 ms | LOW |
| Maintenance Track | Time-Triggered | 3600000 ms (1hr) | ~5 ms | 3600000 ms | LOWEST |

### 10.2 Timing Diagram

```text
Time (ms):  0    200   400   600   800  1000  1200  1400  1600  1800  2000
            │     │     │     │     │     │     │     │     │     │     │
RFID:       ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤   ├─┤
LCD:        ├──┤            ├──┤            ├──┤            ├──┤            ├──┤
Sensors:    ├────────┤                                                ├────────┤
MQTT:       ├──┤                                                           (next at 5000)
```

### 10.3 Schedulability Analysis (Chapter 3 — Rate Monotonic Scheduling)

Applying RMS utilization bound test:

```text
U = Σ(Ci/Ti) = C_rfid/T_rfid + C_sensor/T_sensor + C_mqtt/T_mqtt + C_lcd/T_lcd

U = 5/200 + 100/2000 + 50/5000 + 5/500
U = 0.025 + 0.050 + 0.010 + 0.010
U = 0.095 (9.5% CPU utilization)

For n=4 tasks, RMS bound = n(2^(1/n) - 1) = 4(2^0.25 - 1) ≈ 0.757

Since U (0.095) << 0.757, the task set is SCHEDULABLE.
```

This demonstrates the **Chapter 3 RMS concept**: tasks with shorter periods (RFID: 200ms) receive higher effective priority than tasks with longer periods (MQTT: 5000ms).

---

## 11. Sensor Subsystem

### 11.1 DHT22 Temperature and Humidity Sensor

| Parameter | Value |
|-----------|-------|
| **Protocol** | One-Wire digital |
| **Temperature Range** | -40°C to 80°C |
| **Humidity Range** | 0–100% RH |
| **Accuracy** | ±0.5°C, ±2% RH |
| **Sampling Period** | 2000 ms (minimum 2s between reads) |

**Implementation Features:**
- Retry mechanism (up to 3 attempts on failure)
- Statistical tracking (min, max, average temperature)
- Fault detection (NaN check, range validation)
- Default value fallback on sensor failure

### 11.2 MQ-2 Gas Sensor (Analog)

| Parameter | Value |
|-----------|-------|
| **Interface** | Analog output → ESP32 ADC (GPIO34) |
| **Resolution** | 12-bit (0–4095) |
| **Detectable Gases** | LPG, Propane, Methane, Alcohol, Hydrogen, Smoke |
| **Warning Threshold** | 1000 (ADC value) |
| **Critical Threshold** | 2000 (ADC value) |

### 11.3 Flame Sensor (Simulated via Potentiometer)

| Parameter | Value |
|-----------|-------|
| **Interface** | Analog output → ESP32 ADC (GPIO35) |
| **Simulation** | Potentiometer simulates IR flame detection |
| **Warning Threshold** | 2000 |
| **Critical Threshold** | 3000 |

### 11.4 Water Leak Sensor (Simulated via Potentiometer)

| Parameter | Value |
|-----------|-------|
| **Interface** | Analog output → ESP32 ADC (GPIO32) |
| **Simulation** | Potentiometer simulates water conductivity |
| **Warning Threshold** | 1500 |
| **Critical Threshold** | 2500 |

### 11.5 Signal Averaging (Chapter 2 — Signal Conditioning)

The system reads each analog sensor 5 times and averages the results:

```text
gasSum = 0; flameSum = 0; waterSum = 0;
for (i = 0 to 4):
    gasSum   += analogRead(GAS_PIN)
    flameSum += analogRead(FLAME_PIN)
    waterSum += analogRead(WATER_PIN)
    delay(10ms)

gasValue   = gasSum / 5
flameValue = flameSum / 5
waterValue = waterSum / 5
```

This is **input signal conditioning** as described in Chapter 1 and Chapter 2 — filtering noise from sensor readings to improve reliability.

---

## 12. RFID Access Control Subsystem

### 12.1 MFRC522 RFID Reader (Chapter 2 — SPI Protocol)

| Parameter | Value |
|-----------|-------|
| **Communication** | SPI (4-wire + SS + RST) |
| **Frequency** | 13.56 MHz |
| **Supported Cards** | MIFARE Classic 1K, 4K, Ultralight |
| **Read Distance** | ~5 cm |
| **SPI Clock** | Up to 10 MHz |

**SPI Communication (Chapter 2):**
- **MOSI** (GPIO23): Master sends commands to RFID reader
- **MISO** (GPIO19): RFID reader sends data back to master
- **SCK** (GPIO18): Clock signal synchronizes data transfer
- **SS** (GPIO5): Slave Select activates the RFID reader

### 12.2 Access Control Logic

```text
RFID Card Detected
       │
       ▼
┌─────────────────┐
│ Read Card UID   │
│ (via SPI)       │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────┐
│ Search in EEPROM    │────►│ Match Found?     │
│ (Authorized Cards)  │     └────────┬─────────┘
└─────────────────────┘              │
                              Yes ───┼─── No
                               │          │
                               ▼          ▼
                    ┌──────────────┐  ┌──────────────────┐
                    │ACCESS GRANTED│  │ ACCESS DENIED     │
                    │• Green beep  │  │• Double low beep  │
                    │• Welcome LCD │  │• Increment fails  │
                    │• Log to MQTT │  │• Security alert   │
                    └──────────────┘  │  if fails >= 3    │
                                      └──────────────────┘
```

### 12.3 EEPROM Storage Structure (Chapter 2 — Memory Organization)

| Address | Size | Content |
|---------|------|---------|
| 0–3 | 4 bytes | System Operating Hours |
| 4–7 | 4 bytes | Total Alert Count |
| 8–11 | 4 bytes | Total Sensor Faults |
| 12 | 1 byte | Magic Value (0xA5) |
| 18 | 1 byte | Authorized Card Count |
| 20–699 | Variable | RFID Records (64 bytes each, max 10 cards) |
| 700 | 1 byte | Fail-Safe Mode Flag |

Each RFID record contains: UID (15 chars) + Name (19 chars) + Role (14 chars) + Flags + Access Level + Last Access Time + Access Count.

---

## 13. Alert and Risk Management

### 13.1 Risk Score Calculation

The system uses a **weighted risk scoring algorithm** to determine overall danger level:

| Sensor | Warning Score | Critical Score |
|--------|--------------|----------------|
| Gas | +20 | +40 |
| Flame | +30 | +60 |
| Temperature | +20 | +40 |
| Water | +15 | +30 |

**Alert Levels:**

| Risk Score | Status | Alert Level | Response |
|------------|--------|-------------|----------|
| 0–29 | SAFE | 0 | Green LED ON, no buzzer |
| 30–59 | WARNING | 1 | Red LED ON, single buzzer tone |
| 60–99 | CRITICAL | 2 | Red LED ON, triple beep, relay OFF |
| 100+ | EMERGENCY | 3 | All actuators, MQTT emergency broadcast |

### 13.2 Real-Time Response (Chapter 1 — Timing Constraints)

```text
Event: Gas value exceeds critical threshold (2000)
       │
       ├── Release Time: When analogRead() returns value > 2000
       ├── Execution Time: ~20ms (risk calculation + alert logic)
       ├── Response Time: ~25ms (until buzzer activates)
       ├── Relative Deadline: 2000ms (next sensor cycle)
       │
       └── RESULT: Response Time (25ms) << Deadline (2000ms) ✓
```

This meets the **Hard RTS requirement** from Chapter 1: the response is delivered well within the deadline, ensuring safety.

---

## 14. Communication Protocol — MQTT

### 14.1 MQTT Architecture (Chapter 2 — Communication Protocols)

```text
┌──────────┐         ┌────────────────┐         ┌──────────────┐
│  ESP32   │◄───────►│  MQTT Broker   │◄───────►│ Remote       │
│  Client  │  WiFi   │ broker.emqx.io │  Cloud  │ Dashboard    │
│          │         │  Port: 1883    │         │              │
└──────────┘         └────────────────┘         └──────────────┘
     │                                                 │
     │  Publishes:                                     │  Subscribes:
     │  • industry/safety/full (JSON)                  │  • industry/safety/*
     │  • industry/safety/temp                         │  • industry/alert/*
     │  • industry/safety/humidity                     │  • industry/system/health
     │  • industry/alert/critical                      │
     │  • industry/access/log                          │  Commands:
     │                                                 │  • industry/command
     │  Subscribes:                                    │    → emergency_stop
     │  • industry/command                             │    → reset_alerts
     │                                                 │    → test_alarm
```

### 14.2 MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `industry/safety/full` | Publish | Complete JSON sensor payload |
| `industry/safety/temp` | Publish | Temperature reading |
| `industry/safety/humidity` | Publish | Humidity reading |
| `industry/safety/gas` | Publish | Gas level |
| `industry/safety/flame` | Publish | Flame sensor value |
| `industry/safety/water` | Publish | Water leak value |
| `industry/risk/score` | Publish | Calculated risk score |
| `industry/risk/status` | Publish | System status text |
| `industry/alert/critical` | Publish | Critical alert notifications |
| `industry/alert/warning` | Publish | Warning notifications |
| `industry/alert/cleared` | Publish | All-clear notification |
| `industry/access/log` | Publish | RFID access granted log |
| `industry/access/denied` | Publish | RFID access denied log |
| `industry/system/health` | Publish | System health metrics |
| `industry/command` | Subscribe | Remote commands |
| `industry/response` | Publish | Command acknowledgments |

### 14.3 JSON Payload Structure

```json
{
  "sensors": {
    "temperature": {"value": 43.6, "unit": "C"},
    "humidity": {"value": 54, "unit": "%"},
    "gas": {"value": 850},
    "flame": {"value": 1200},
    "water": {"value": 600}
  },
  "risk": {
    "total_score": 0,
    "status": "SAFE"
  },
  "alert": {
    "level": 0,
    "status": "SAFE"
  },
  "system": {
    "uptime": 3600
  }
}
```

---

## 15. Fail-Safe and Fault Tolerance

### 15.1 Fault Tolerance Design (Chapter 1 & 3)

From Chapter 1: *"Fault Tolerance — Detects errors and recovers without affecting performance."*
From Chapter 3: *"RTOS Fault Tolerance — Built to remain continuously operational and recover gracefully even when hardware errors or minor faults occur."*

**Implementation:**

| Fault Condition | Detection Method | Response |
|----------------|-----------------|----------|
| DHT22 returns NaN | isnan() check | Use default temp (25°C) |
| ADC value out of range (< 0 or > 4095) | Range validation | Use safe default value |
| Persistent sensor failure | SENSOR_VALIDATION_WINDOW (5s) | Activate Fail-Safe Mode |
| WiFi disconnected | WiFi.status() check | Run in offline mode |
| MQTT disconnected | client.connected() check | Auto-reconnect |
| Multiple failed RFID attempts (≥ 3) | Counter tracking | Security alert triggered |

### 15.2 Fail-Safe Mode

When multiple sensors fail simultaneously and the failure persists beyond the validation window (5000ms):

1. **EEPROM flag set** (address 700 = 0x01) — persists across reboots
2. **Safe default values used** for all sensor readings
3. **LCD displays** "FAIL-SAFE MODE"
4. **Buzzer alerts** maintenance personnel (2 short beeps)
5. **System continues operating** with conservative assumptions

This ensures the system **never enters an unsafe undefined state** — a core requirement of safety-critical real-time systems.

---

## 16. Process Management and Scheduling

### 16.1 Process Model (Chapter 3 — Process Management)

Each functional module in the system can be modeled as a **process** with its own:

| Process Attribute | RFID Task | Sensor Task | MQTT Task |
|------------------|-----------|-------------|-----------|
| **Process ID** | Task_RFID | Task_Sensor | Task_MQTT |
| **State** | Ready/Running | Ready/Running | Ready/Running |
| **Period** | 200 ms | 2000 ms | 5000 ms |
| **Priority** | High | Medium | Low |
| **CPU Registers** | lastRFIDCheck | lastSensorRead | lastPublishTime |
| **Program Counter** | readRFID() | readAllSensors() | publishMQTTData() |
| **Stack** | Local variables | Sensor buffers | JSON buffer |

### 16.2 Scheduling Implementation (Chapter 3 — Scheduling Algorithms)

The main loop implements a **cooperative priority-based scheduler** resembling Rate Monotonic Scheduling:

```text
void loop() {
    // Highest Priority — shortest period (200ms)
    if (millis() - lastRFIDCheck > 200) {
        readRFID();           // Period: 200ms → Highest Priority (RMS)
    }
    
    // Medium Priority — medium period (2000ms)
    if (millis() - lastSensorRead > 2000) {
        readAllSensors();     // Period: 2000ms → Medium Priority
        calculateRiskScore();
        checkAndTriggerAlerts();
        controlCoolingSystem();
        updateLCD();
    }
    
    // Lowest Priority — longest period (5000ms)
    if (millis() - lastPublishTime > 5000) {
        publishMQTTData();    // Period: 5000ms → Low Priority
        publishSystemHealth();
    }
}
```

**RMS Principle Applied:** Tasks with shorter periods execute more frequently and are checked first in the loop, giving them effective higher priority — matching the Rate Monotonic Scheduling algorithm from Chapter 3.

### 16.3 Process States (Chapter 3 — Process States)

```text
                 Timer Elapsed
    ┌─────────────────────────────────┐
    │                                 │
    ▼                                 │
┌────────┐     CPU Allocated     ┌────────┐
│ READY  │ ─────────────────────►│RUNNING │
│        │                       │        │
└────────┘                       └────┬───┘
    ▲                                 │
    │          Timer Reset            │
    │◄────────────────────────────────┘
    │          (Completed)
    │
    │     Waiting for Timer
    ▼
┌────────┐
│WAITING │  (millis() - lastExec < period)
└────────┘
```

---

## 17. Context Switching in the System

### 17.1 Context Definition (Chapter 3 — Context Switching)

From Chapter 3: *"A task's context is the snapshot of its current execution state. When a switch happens, this information must be safely stored so the task can resume later exactly where it left off."*

In this system, context switching occurs implicitly through the cooperative scheduler:

| Context Element | Saved As | Purpose |
|----------------|----------|---------|
| **Program Counter** | Function pointer (implicit in loop flow) | Which task to resume |
| **CPU Registers** | Local variables, global state | Intermediate calculations |
| **Stack Pointer** | Arduino stack management | Function call depth |
| **Task State** | lastRFIDCheck, lastSensorRead, lastPublishTime | Timing state |
| **Data** | temp, gasValue, flameValue, waterValue | Sensor readings |

### 17.2 Implicit Context Switch Example

```text
Scenario: Sensor task is reading when RFID card is presented

Time 0ms:    Sensor task starts (reading DHT22)
Time 5ms:    DHT22 read completes
Time 10ms:   analogRead(GAS_PIN) starts
Time 15ms:   Gas read completes, next loop iteration begins
Time 16ms:   RFID check timer elapsed → RFID task executes
Time 21ms:   RFID SPI communication
Time 26ms:   RFID task completes → returns to main loop
Time 27ms:   Sensor task continues (flame read)
```

The sensor task's **context** (which sensors have been read, accumulated values) is preserved in global variables while the RFID task executes — this is analogous to saving/restoring CPU registers during a context switch.

---

## 18. RTOS Concepts Applied

### 18.1 RTOS Features Mapped to Implementation (Chapter 3)

| RTOS Feature | Course Definition | Project Implementation |
|--------------|-------------------|------------------------|
| **Determinism** | "System guarantees predefined maximum time for critical operations" | Fixed 2s sensor cycle; alert response < 50ms |
| **Minimal Latency** | "Low interrupt latency and rapid context switching" | RFID polled every 200ms for fast card detection |
| **Priority-Based Scheduling** | "Tasks with highest urgency executed first" | RFID (200ms) > Sensors (2000ms) > MQTT (5000ms) |
| **Predictable Resource Management** | "Static memory allocation to avoid delays" | EEPROM address map; fixed-size arrays; no malloc() |
| **Inter-Task Communication** | "Messaging queues and shared memory" | Global variables (gasValue, temp) shared between tasks |
| **Fault Tolerance** | "Remain operational despite hardware errors" | Fail-safe mode, sensor default values, auto-reconnect |
| **High Availability** | "Zero-downtime, mission-critical environments" | System never stops monitoring even in fail-safe mode |
| **Timer Services** | "System clocks to measure elapsed time" | millis() function provides timing for all tasks |
| **Interrupt Handlers** | "Manages hardware interrupts for time-critical functions" | SPI polling every 200 ms for RFID detection (no IRQ line connected) |

### 18.2 RTOS Components in the System (Chapter 3)

| RTOS Component | Equivalent in Project |
|----------------|----------------------|
| **Real-Time Kernel** | Arduino loop() + millis()-based scheduler |
| **Scheduler** | Priority checks in loop() (shortest period first) |
| **Timer Services** | millis() timer, delay() for buzzer patterns |
| **Memory Management** | EEPROM allocation map, static variables |
| **Function Library** | Arduino libraries (WiFi, SPI, Wire, DHT) |
| **Inter-Task Communication** | Global variables, MQTT publish/subscribe |

---

## 19. Embedded Framework Analysis

### 19.1 Arduino as Embedded Framework (Chapter 3)

From Chapter 3: *"Arduino Framework — A development environment and set of libraries aimed at simplifying embedded systems development. Arduino is used with a range of microcontroller boards and supports real-time applications."*

| Framework Property | Arduino Implementation |
|-------------------|----------------------|
| **Predefined Structure** | setup() runs once; loop() runs continuously |
| **Reusable Components** | Libraries: WiFi.h, SPI.h, Wire.h, DHT.h, MFRC522.h |
| **Abstraction Layer** | pinMode(), digitalWrite(), analogRead() abstract hardware registers |
| **Extensibility** | Custom safety logic, risk scoring, RFID management built on top |
| **Automation** | Serial.begin() auto-configures UART; WiFi.begin() handles 802.11 protocol |

### 19.2 Libraries Used (Chapter 3 — Embedded Software Libraries)

| Library | Purpose | Protocol |
|---------|---------|----------|
| WiFi.h | WiFi connectivity | 802.11 |
| PubSubClient.h | MQTT client | TCP/IP |
| SPI.h | SPI bus driver | SPI |
| MFRC522.h | RFID reader driver | SPI |
| Wire.h | I2C bus driver | I2C |
| LiquidCrystal_I2C.h | LCD driver | I2C |
| DHT.h | Temperature sensor driver | One-Wire |
| ArduinoJson.h | JSON serialization | — |
| EEPROM.h | Non-volatile storage | Internal |

---

## 20. LCD Display Subsystem

### 20.1 Display Modes

| Mode | Trigger | Line 1 | Line 2 |
|------|---------|--------|--------|
| **Normal** | System safe | T:25.0C H:54% SAFE | G:500 OK |
| **Warning** | Risk 30–59 | T:42.0C H:54% WARN! | G:1200 |
| **Critical** | Risk 60–99 | T:52.0C H:54% CRIT! | G:2100 FIRE! |
| **Emergency** | Risk 100+ | T:55.0C H:54% EMRG! | G:2500 LEAK! |
| **Welcome** | RFID access granted | Welcome | [User Name] |
| **Security Alert** | 3+ failed RFID | SECURITY ALERT! | Unauthorized! |
| **Fail-Safe** | Sensor failure | FAIL-SAFE MODE | Using Safe Values |
| **Maintenance** | Sensor fault | MAINTENANCE MODE | [Sensor] FAIL |

### 20.2 I2C Communication (Chapter 2)

The LCD uses **I2C protocol** (also called TWI — Two Wire Interface):
- **SDA** (GPIO21): Bidirectional data line
- **SCL** (GPIO22): Clock line (master-controlled)
- **Address**: 0x27 (7-bit I2C slave address)
- **Speed**: Up to 400 KHz

As described in Chapter 2: *"I2C uses only two wires: clock (SCL) and bidirectional data (SDA). Used to connect low-speed devices like EEPROMs and microcontrollers."*

---

## 21. Maintenance and System Health

### 21.1 Predictive Maintenance (Chapter 1 — Safety)

| Metric | Tracking Method | Threshold |
|--------|----------------|-----------|
| **Operating Hours** | millis() / 3600000 + EEPROM persistence | 100 hours → maintenance required |
| **Total Alerts** | alertCount incremented on each alert | Logged to EEPROM |
| **Sensor Faults** | totalSensorFaultCount | Triggers maintenance mode |
| **System Health** | JSON published every 30s | Free heap, WiFi RSSI, uptime |

### 21.2 System Health JSON Payload

```json
{
  "uptime": 7200,
  "free_heap": 245760,
  "wifi_rssi": -45,
  "mqtt_connected": true,
  "access_count": 12,
  "alert_count": 3,
  "authorized_cards": 2,
  "fail_safe_mode": false,
  "temperature": 25.5,
  "humidity": 54.0
}
```

---

## 22. Testing and Validation

### 22.1 Testing Approach (Chapter 1 — Testability)

| Test Type | Method | Pass Criteria |
|-----------|--------|---------------|
| **Sensor Response** | Adjust potentiometer values | Correct ADC readings and threshold detection |
| **RFID Authentication** | Present authorized/unauthorized cards | Correct access grant/deny |
| **Alert Triggering** | Exceed sensor thresholds | Buzzer, LED, and MQTT alert within deadline |
| **Fail-Safe** | Simulate sensor failure | System enters fail-safe mode safely |
| **MQTT Communication** | Monitor broker topics | All data published at correct intervals |
| **Remote Commands** | Send MQTT commands | Correct system response (emergency stop, reset, test alarm) |
| **Timing Validation** | Monitor Serial output timestamps | Tasks execute within specified periods |
| **Cooling Control** | Raise temperature above 40°C | Relay activates correctly |

### 22.2 Wokwi Testing Procedure

1. **Start simulation** — verify "System Ready" on LCD
2. **Monitor Serial** — confirm sensor readings every 2s
3. **Rotate flame potentiometer** past 2000 → verify WARNING alert
4. **Rotate gas potentiometer** past 2000 → verify CRITICAL alert  
5. **Present RFID card** → verify access granted/denied
6. **Send MQTT command** "test_alarm" → verify buzzer and LED test
7. **Disconnect DHT22** → verify fail-safe activation

---

## 23. Wokwi Simulation Code

The complete firmware source code for the Industrial Safety Monitoring System is provided below. This code runs on the ESP32-DevKit-C V4 in the Wokwi simulator.

**File:** `sketch.ino` (1065 lines)

**Key Code Sections:**

| Section | Lines | Purpose |
|---------|-------|---------|
| Configuration & Defines | 1–68 | Pin definitions, thresholds, EEPROM map |
| Global Variables | 81–148 | System state, sensor values, flags |
| RFID Functions | 150–287 | Save/Load/Verify/Add RFID cards |
| Safety Functions | 289–390 | Fail-safe, sensor validation, health check |
| Risk Calculation | 392–433 | Weighted risk score algorithm |
| Alert System | 435–526 | Multi-level alert with buzzer patterns |
| Sensor Reading | 528–583 | DHT22 + analog reads with averaging |
| LCD Display | 586–650 | Multi-mode display management |
| Cooling Control | 652–669 | Temperature-based relay automation |
| MQTT Callback | 671–767 | Remote command handling |
| WiFi & MQTT | 770–826 | Connection management |
| Data Publishing | 828–892 | JSON telemetry to cloud |
| Maintenance | 894–927 | Operating hours and service tracking |
| Setup | 946–1012 | Hardware initialization |
| Main Loop | 1014–1065 | Task scheduler |

*(Full source code is provided in the project repository as `sketch.ino`)*

---

## 24. Wokwi Diagram JSON

The following JSON defines the complete circuit layout in the Wokwi simulator:

```json
{
  "version": 1,
  "author": "Nebyu Samuel",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-breadboard", "id": "bb1", "top": 446.6, "left": -735.2, "rotate": 90 },
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 336, "left": -667.16 },
    { "type": "board-mfrc522", "id": "rfid1", "top": 371.75, "left": -6.16 },
    { "type": "wokwi-lcd1602", "id": "lcd1", "top": -32, "left": -522.4, "attrs": { "pins": "i2c" } },
    { "type": "wokwi-gas-sensor", "id": "gas1", "top": -218.1, "left": 1312.6 },
    { "type": "wokwi-dht22", "id": "dht1", "top": -364.5, "left": 474.6, "attrs": { "temperature": "43.6", "humidity": "54" } },
    { "type": "wokwi-buzzer", "id": "bz1", "top": 194.4, "left": -267, "attrs": { "volume": "0.1" } },
    { "type": "wokwi-relay-module", "id": "relay1", "top": 182.6, "left": -700.8 },
    { "type": "wokwi-potentiometer", "id": "pot1", "top": 334.7, "left": 1583.8 },
    { "type": "wokwi-potentiometer", "id": "pot2", "top": 344.3, "left": 1161.4 },
    { "type": "wokwi-led", "id": "led1", "top": -282, "left": 42.2, "attrs": { "color": "red" } },
    { "type": "wokwi-led", "id": "led2", "top": -128.4, "left": 42.2, "attrs": { "color": "green" } },
    { "type": "wokwi-resistor", "id": "r1", "top": -53.65, "left": 105.6, "attrs": { "value": "220" } },
    { "type": "wokwi-resistor", "id": "r2", "top": -188.05, "left": 105.6, "attrs": { "value": "220" } },
    { "type": "wokwi-text", "id": "text1", "top": 297.6, "left": 1142.4, "attrs": { "text": "FLAME SENSOR\n" } },
    { "type": "wokwi-text", "id": "text2", "top": 278.4, "left": 1574.4, "attrs": { "text": "WATER LEAK\n" } }
  ],
  "connections": [
    [ "esp:TX", "$serialMonitor:RX", "", [] ],
    [ "esp:RX", "$serialMonitor:TX", "", [] ],
    [ "led2:A", "r1:1", "green", [ "v0" ] ],
    [ "led1:A", "r2:1", "green", [ "v0" ] ],
    [ "lcd1:GND", "bb1:bn.2", "black", [ "h-76.8", "v144", "h67.2", "v124.8" ] ],
    [ "lcd1:VCC", "bb1:bp.2", "red", [ "h-67.2", "v124.9", "h96" ] ],
    [ "lcd1:SCL", "esp:22", "green", [ "h-240", "v288.3", "h211.2", "v76.8" ] ],
    [ "lcd1:SDA", "esp:21", "green", [ "h-288", "v278.6", "h278.4", "v76.8" ] ],
    [ "dht1:VCC", "bb1:tp.1", "red", [ "v9.6", "h-307.2", "v-163.2", "h-374.4", "v576", "h-115.2" ] ],
    [ "dht1:GND", "bb1:tn.1", "black", [ "v28.8", "h0", "v19.2", "h-422.4", "v-134.4", "h-307.2", "v489.6", "h-115.2" ] ],
    [ "dht1:SDA", "esp:4", "green", [ "v28.8", "h-364.7", "v-153.6", "h-988.8", "v662.4", "h336", "v182.4" ] ],
    [ "esp:14", "relay1:IN", "green", [ "h0" ] ],
    [ "relay1:VCC", "bb1:bp.4", "red", [ "h-28.8", "v-38.4", "h192", "v163.2" ] ],
    [ "relay1:GND", "bb1:bn.5", "black", [ "h-19.2", "v-38.8", "h163.2", "v134.4" ] ],
    [ "rfid1:SDA", "esp:5", "green", [ "h-278.4", "v499.2", "h-259.2", "v-451.2" ] ],
    [ "rfid1:SCK", "esp:18", "green", [ "h-268.8", "v508.8", "h-278.4", "v-470.4" ] ],
    [ "rfid1:MOSI", "esp:23", "green", [ "h-259.2", "v518.4", "h-297.6", "v-566.4" ] ],
    [ "rfid1:MISO", "esp:19", "green", [ "h-249.6", "v528", "h-278.4", "v-528" ] ],
    [ "rfid1:RST", "esp:27", "green", [ "h-230.4", "v528", "h-288", "v0", "h-230.4", "v-470.4" ] ],
    [ "rfid1:3.3V", "esp:3V3", "green", [ "h-220.8", "v537.6", "h-518.4", "v-508.8" ] ],
    [ "rfid1:GND", "bb1:tn.18", "black", [ "h0" ] ],
    [ "gas1:AOUT", "esp:34", "green", [ "h48", "v-576", "h-2428.8", "v1180.8" ] ],
    [ "gas1:GND", "bb1:bn.27", "black", [ "h105.6", "v-653.6", "h-2524.8", "v1420.8" ] ],
    [ "gas1:VCC", "bb1:bp.28", "red", [ "h163.2", "v-720.9", "h-2668.8", "v1497.6" ] ],
    [ "pot2:GND", "bb1:tn.25", "black", [ "v0" ] ],
    [ "pot2:VCC", "bb1:tp.26", "red", [ "v0" ] ],
    [ "esp:35", "pot2:SIG", "green", [ "h-124.65", "v624", "h585.6", "v-451.2", "h1401.6" ] ],
    [ "pot1:GND", "bb1:tn.30", "black", [ "v0" ] ],
    [ "pot1:VCC", "bb1:tp.31", "red", [ "v0" ] ],
    [ "pot1:SIG", "esp:32", "green", [ "v230.4", "h-1814.8", "v432", "h-624", "v-547.2" ] ],
    [ "esp:13", "bb1:1t.e", "green", [ "h-28.65", "v-172.8", "h288", "v-76.8" ] ],
    [ "esp:26", "bb1:3t.e", "green", [ "h-19.05", "v-115.2" ] ],
    [ "r1:2", "bb1:1t.a", "green", [ "v182.4", "h-490.8" ] ],
    [ "r2:2", "bb1:3t.a", "green", [ "v19.2", "h-337.2", "v345.6", "h-172.8", "v86.4" ] ],
    [ "led1:C", "bb1:tn.2", "green", [ "v38.4", "h-182", "v326.4", "h-153.6", "v153.6" ] ],
    [ "led2:C", "bb1:tn.4", "green", [ "v249.6", "h-345.2", "v124.8" ] ],
    [ "esp:GND.3", "bb1:bn.15", "black", [ "h0" ] ],
    [ "esp:5V", "bb1:bp.25", "red", [ "h0.15", "v9.6", "h163.2" ] ],
    [ "bb1:bp.21", "bb1:tp.21", "red", [ "h0" ] ],
    [ "bb1:bn.16", "bb1:tn.16", "black", [ "h0" ] ],
    [ "bz1:1", "bb1:tn.7", "black", [ "v57.6", "h-9.6" ] ],
    [ "esp:25", "bz1:2", "green", [ "v0", "h-47.85", "v432", "h537.6", "v-585.6" ] ]
  ],
  "dependencies": {}
}
```

---

## 25. Conclusion and Future Work

### 25.1 Conclusion

This project successfully demonstrates the practical application of Real-Time Embedded Systems concepts from Chapters 1 through 3:

| Chapter | Key Learning | Demonstrated By |
|---------|-------------|-----------------|
| **Chapter 1** | RTS classification, timing constraints, system architecture, task models | Multi-sensor monitoring with hard deadlines, time/event-triggered tasks |
| **Chapter 2** | Embedded architecture, SPI/I2C/UART protocols, microcontrollers, ADC | ESP32 SoC with RFID (SPI), LCD (I2C), analog sensors (ADC), UART debug |
| **Chapter 3** | RTOS principles, scheduling, process management, context switching, frameworks | Priority-based task scheduling, fault tolerance, Arduino framework usage |

The Industrial Safety Monitoring System is a **real-time embedded system** that:
- Meets **Hard RTS constraints** for safety-critical alerts
- Implements **Firm RTS behavior** for data reporting
- Uses **multiple communication protocols** (SPI, I2C, WiFi/MQTT, UART)
- Applies **RTOS scheduling principles** (priority-based, periodic tasks)
- Demonstrates **fault tolerance** through fail-safe mechanisms
- Leverages an **embedded framework** (Arduino) for hardware abstraction

### 25.2 Future Improvements

| Enhancement | Benefit | Related Course Concept |
|-------------|---------|----------------------|
| Migrate to FreeRTOS tasks | True preemptive multitasking | Chapter 3: RTOS, preemptive scheduling |
| Add EDF scheduling | Better CPU utilization for dynamic priorities | Chapter 3: Earliest Deadline First |
| Implement priority inheritance | Prevent priority inversion on shared LCD | Chapter 3: Priority inversion prevention |
| Add OTA firmware updates | Remote maintenance capability | Chapter 3: High availability |
| Integrate camera module | Visual hazard verification | Chapter 2: Additional peripheral |
| Add redundant sensors | Higher fault tolerance | Chapter 1: Safety-critical systems |
| TLS encryption for MQTT | Secure communication | Chapter 1: Security characteristic |
| Machine learning anomaly detection | Predictive hazard identification | Advanced RTS topics |

---

## 26. References

1. **Chapter 1: Real-Time Systems** — Definitions, classification (Hard/Soft/Firm), timing terminology, system architecture, task models, and RTS characteristics.
2. **Chapter 2: Embedded System Architecture** — Processor types, Von Neumann/Harvard architecture, communication protocols (SPI, I2C, USART, USB), microcontroller selection, ATmega32/ARM/8051 architectures, interrupts, and timers.
3. **Chapter 3 Part 1: Architecture and Framework** — Software architecture vs frameworks, RTOS (FreeRTOS, VxWorks, QNX), middleware (DDS, CORBA), embedded frameworks (CMSIS, Mbed OS, Arduino), operating system types and evolution.
4. **Chapter 3 Part 2: Process Management** — Process definition, states, PCB (Process Control Block), inter-process communication (semaphores, message queues, mutexes, shared memory).
5. **Chapter 3 Part 3: Scheduling** — Rate Monotonic Scheduling (RMS), Earliest Deadline First (EDF), Round-Robin (RR), CPU utilization bounds, schedulability analysis.
6. **Chapter 3 Part 4: Context Switching** — Context definition (CPU registers, PC, SP, PSW), context switch overhead, trigger mechanisms, saving/restoring task state.
7. **ESP32 Technical Reference Manual** — Espressif Systems.
8. **MFRC522 Datasheet** — NXP Semiconductors.
9. **DHT22 Datasheet** — Aosong Electronics.
10. **MQTT Protocol Specification v3.1.1** — OASIS Standard.

---

*Document generated for the Real-Time Embedded Systems course project.*  
*Total sections: 26 | Approximate page count: 25 pages when printed.*
