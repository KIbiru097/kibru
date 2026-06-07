# Project Documentation: Real-Time Embedded Systems

## 1. Introduction

### 1.1 Project Overview

- **Project Title:** Real-Time Embedded Systems
- **Type of RTS:** Hard / Soft / Firm Real-Time System (application-dependent)
- **Objective:** To design a system that guarantees responses within specified timing constraints while maintaining logical correctness.

### 1.2 System Definition

- **Inputs:** Sensor data (temperature, pressure, position, etc.)
- **Outputs:** Actuator signals (motor control, cooling, display alerts)
- **Timing Constraint Example:** After event X (e.g., temperature > 50 C), action Y (e.g., cooling ON) must complete within 100 ms.

---

## 2. System Architecture

### 2.1 Overall Structure

| Layer | Components |
|-------|-----------|
| **Hardware** | CPU, I/O devices, memory, sensors, actuators |
| **Real-Time Operating System (RTOS)** | FreeRTOS / VxWorks / QNX -- provides predictable behavior and task scheduling |
| **RT Tasks/Processes** | Share resources, communicate/synchronize with each other and environment |

### 2.2 Basic Model

| Component | Description |
|-----------|-------------|
| **Sensor** | Converts physical signal to electrical (e.g., thermistor, photodiode) |
| **Signal Conditioning (Input)** | Amplifier, filter before ADC |
| **Interface Unit (Input)** | Analog-to-Digital Converter (ADC) |
| **Computer/RTOS** | Processes data and makes decisions |
| **Interface Unit (Output)** | Digital-to-Analog Converter (DAC) or PWM |
| **Signal Conditioning (Output)** | Driver circuit to power actuator |
| **Actuator** | Converts electrical to physical action (motor, heater, relay) |

### 2.3 Embedded Hardware Platform

| Component | Typical Choice |
|-----------|---------------|
| **Processor** | ARM Cortex-M0+ / ATmega32 / 8051 |
| **Memory** | Flash (program) + SRAM (data) + EEPROM |
| **Communication** | USART, SPI, I2C, USB |
| **I/O** | GPIO ports, ADC, DAC, PWM |

---

## 3. Timing & Task Model

### 3.1 Key Timing Terms

| Term | Definition |
|------|-----------|
| **Job** | Smallest schedulable unit (e.g., read sensor, compute control signal) |
| **Task** | Set of related jobs (e.g., Temperature Control Task) |
| **Release Time** | Time when job becomes ready |
| **Execution Time** | Time taken to finish (C_i) |
| **Relative Deadline** | Max allowed response time after release |
| **Absolute Deadline** | Release time + Relative deadline |
| **Response Time** | Completion time - Release time |

### 3.2 Task Types

| Task Type | Trigger Source | Scheduling | Example |
|-----------|---------------|-----------|---------|
| **Time-Triggered (Periodic)** | System clock/ticks | Static (Offline) | Sample temperature every 100 ms |
| **Event-Triggered (Aperiodic)** | External interrupt | Dynamic (Online) | Emergency stop button press |

### 3.3 Example Task Specification

| Parameter | Value |
|-----------|-------|
| Task Name | ReadSensor_Task |
| Type | Periodic |
| Period | 100 ms |
| Execution Time | C = 5 ms |
| Relative Deadline | D = 20 ms |
| Priority | High |

---

## 4. RTS Classification & Justification

### 4.1 Classification

| Type | Consequence of Missed Deadline | Example |
|------|-------------------------------|---------|
| **Hard RTS** | Catastrophic failure, loss of life, major financial damage | Flight control, automotive brakes |
| **Soft RTS** | Degraded performance, no catastrophe | Video processing, mobile phones |
| **Firm RTS** | Late result is useless; occasional misses tolerable | Video conferencing, satellite tracking |

### 4.2 System Comparison

| Characteristic | Hard RTS | Firm RTS | Soft RTS |
|---------------|----------|----------|----------|
| Response Time | Hard-required | Firm-required | Soft-required |
| Peak Load Performance | Predictable | Predictable | Degraded |
| Safety Critical | Yes | Sometimes | No |
| Size of Data | Small | Small/Medium | Large |
| Error Detection | Autonomous | Autonomous | User-assisted |
| Late Result Value | Catastrophic | Useless (no value) | Reduced value |

---

## 5. Key RTS Characteristics

| Characteristic | How to Ensure It |
|---------------|-----------------|
| **Time Constraints** | Each task has a deadline; scheduler ensures timing |
| **Correctness** | Logical result + temporal result (on time) |
| **Embedded** | Dedicated hardware+software for specific purpose |
| **Concurrency** | Multiple tasks via preemptive RTOS scheduling |
| **Determinism** | WCET analysis; predictable behavior |
| **Fault Tolerance** | Watchdog timer, redundant sensors, error recovery |
| **Stability** | Under overload, critical tasks still meet deadlines |
| **Resource Management** | Priority-based scheduling; no unbounded priority inversion |
| **Distributed** | Components at different geographical locations |
| **Security** | Access control, data encryption |
| **Scalability** | Handle varying workloads by adjusting resources |

---

## 6. Embedded Hardware Foundation

### 6.1 Processor Architectures

| Architecture | Key Feature | Use Case |
|-------------|-------------|----------|
| **Von Neumann** | Single memory for data + instructions | Simple microcontrollers |
| **Harvard** | Separate memories for data and instructions | AVR, DSP |
| **Super Harvard (SHARC)** | Balanced memory access | Digital Signal Processing |

### 6.2 Instruction Set Comparison

| CISC | RISC |
|------|------|
| Complex instructions | Simple instructions |
| Variable length | Fixed length |
| Multiple clock cycles | Single clock cycle |
| Examples: x86, 8051 | Examples: ARM, AVR |

### 6.3 Communication Interfaces

| Protocol | Wires | Speed | Application |
|----------|-------|-------|-------------|
| **USART** | 2 (TX, RX) | Low-Medium | Basic serial communication |
| **SPI** | 3-4 (MOSI, MISO, SCK, SS) | High | SD cards, sensors |
| **I2C** | 2 (SDA, SCL) | Up to 400 KHz | EEPROMs, low-speed devices |
| **USB** | 4 (VCC, GND, D+, D-) | High | Universal connectivity |
| **Ethernet** | 8 (4 pairs) | Very High | Network/LAN |

---

## 7. Interrupt Handling

### 7.1 Interrupt vs Polling

| Feature | Interrupt | Polling |
|---------|-----------|---------|
| Mechanism | Device signals processor | Processor checks device repeatedly |
| Efficiency | High (no wasted CPU cycles) | Low (CPU constantly checking) |
| Response Time | Fast (immediate service) | Slower (depends on polling interval) |
| Complexity | Higher (ISR management) | Simpler (sequential checking) |

### 7.2 Interrupt Execution Flow

```text
1. Save context (push PC to stack)
2. Look up ISR address in Interrupt Vector Table
3. Execute ISR
4. RETI: restore context (pop PC from stack)
5. Resume normal execution
```

---

## 8. Theoretical & Technical Foundation

| Discipline | Application |
|-----------|-------------|
| **Computer Architecture** | ARM Cortex-M4 with predictable cache/memory timing |
| **Operating Systems** | RTOS with fixed-priority preemptive scheduling |
| **Programming Language** | C / C++ / Ada for low-level control |
| **Algorithms** | O(1) or O(log n) operations (circular buffer, priority queue) |
| **Control Theory** | PID controller for maintaining setpoints |
| **Scheduling Theory** | Rate Monotonic (RMS) or Earliest Deadline First (EDF) |
| **Queuing Theory** | Modeling task arrivals and minimizing latency |

---

## 9. Safety & Error Handling

### 9.1 Safety Considerations

- Potential hazards: overheating, actuator runaway, communication failure
- Mitigation: hardware watchdog, independent safety monitor, redundancy

### 9.2 Error Detection & Recovery

| Mechanism | Purpose |
|-----------|---------|
| **Watchdog Timer** | Detects software hang/crash |
| **CRC Checks** | Validates communication integrity |
| **Range Checks** | Validates sensor data bounds |
| **Redundant Sensors** | Cross-validation of readings |
| **Safe State Recovery** | System reset to known-good state |

---

## 10. Testing & Validation

| Method | Description |
|--------|-------------|
| **WCET Analysis** | Worst-case execution time measurement |
| **Peak Load Simulation** | Stress testing under maximum task load |
| **Hardware-in-the-Loop (HIL)** | Testing with real hardware and simulated environment |
| **Deadline Miss Ratio** | Measuring frequency of missed deadlines |
| **Recovery Time** | Time to return to normal after a fault |

---

## 11. Conclusion

A Real-Time System is not just about being fast -- it is about being **predictable** and **meeting deadlines**. The system must produce logically correct results **at the right time**. The architecture typically involves sensors, actuators, an RTOS, and carefully scheduled tasks (time-triggered or event-triggered). The embedded hardware platform (microcontroller with appropriate architecture, memory, and communication interfaces) forms the foundation upon which the RTOS and application tasks operate. Key characteristics include determinism, concurrency, fault tolerance, and stability.

---

## 12. Document Index

| Document | Contents |
|----------|----------|
| [Chapter 1: Real-Time Systems](Chapter1_Real_Time_Systems.md) | RTS definitions, classification, task models, characteristics |
| [Chapter 2: Embedded System Architecture](Chapter2_Embedded_System_Architecture.md) | Hardware architecture, processors, communication, microcontrollers |
| This Document | Combined project documentation and reference |

---

## References

1. Real-Time System lecture slides (Chapter 1 - PPT One)
2. Embedded System Architecture lecture slides (Chapter 2)
3. ATmega32 Datasheet - Atmel Corporation
4. ARM Cortex-M0+ Technical Reference Manual
5. 8051 Microcontroller Architecture Reference
