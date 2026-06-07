# Chapter 1: Real-Time Systems (RTS)

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Definitions](#2-core-definitions)
3. [Key Terminology](#3-key-terminology)
4. [System Architecture](#4-system-architecture)
5. [Classification of Real-Time Systems](#5-classification-of-real-time-systems)
6. [Task Types: Time-Triggered vs Event-Triggered](#6-task-types-time-triggered-vs-event-triggered)
7. [Key Characteristics of Real-Time Systems](#7-key-characteristics-of-real-time-systems)
8. [Theoretical Foundation](#8-theoretical-foundation)
9. [Summary](#9-summary)

---

## 1. Introduction

This chapter focuses on designing and understanding a **Real-Time System (RTS)** -- a system where the correctness of output depends not only on the logical result but also on the **time** at which the result is produced. A response delivered late is as bad as a wrong response.

---

## 2. Core Definitions

### 2.1 What is Real-Time?

Real-time is a **quantitative notion of time** measured using a physical clock.

**Example:** After a certain event occurs (temperature exceeds 50 degrees), the corresponding action (cooling system) must complete within 100 ms.

### 2.2 What is a System?

A system is a mapping of a set of inputs into a set of outputs. When the internal details of the system are not of interest, the mapping function can be considered as a black box with one or more inputs entering and one or more outputs exiting the system.

### 2.3 Real-Time System Definition

> *"A system that must respond to inputs within specified timing constraints (deadlines). Failure to meet these deadlines may lead to severe consequences depending on the system type."*

A real-time system is an aggregate of computers, I/O devices, and application-specific software, all characterized by:

- Intensive interaction with the external environment
- Time-dependent variations in the state of the external environment
- Need to keep control over all individual parts of the external environment
- System activities subject to timing constraints
- Inherent concurrency in system activities

### 2.4 Two Dimensions of Correctness

1. **Logical correctness** (value domain): The computed result is algorithmically/functionally correct
2. **Temporal correctness** (time domain): The result is produced within the required deadline

> A logically-correct response produced later than expected may be as bad as a wrong response.

---

## 3. Key Terminology

| Term | Definition |
|------|-----------|
| **Job** | The smallest piece of work that can be assigned to a processor; may or may not require resources |
| **Task** | A set of related jobs that jointly provide some system functionality |
| **Release Time** | The time at which a job becomes ready for execution |
| **Execution Time** | The time taken by a job to finish its execution |
| **Deadline** | The time by which a job should finish its execution |
| **Relative Deadline** | Deadline - Release time |
| **Absolute Deadline** | Release time + Relative deadline |
| **Response Time** | Completion time - Release time |

### Timing Diagram Relationships

```text
Release Time          Completion Time
    |                      |
    |--- Execution Time ---|
    |                      |
    |---- Response Time ---|
    |                               |
    |------ Relative Deadline ------|
```

**Absolute Deadline** = Release Time + Relative Deadline

---

## 4. System Architecture

### 4.1 Overall Structure of RTS

The overall structure of a Real-Time System consists of:

| Layer | Description |
|-------|-------------|
| **Hardware** | CPU, I/O devices, memory, sensors, actuators |
| **Real-Time Operating System (RTOS)** | Functions as a standard OS with predictable behavior and well-defined functionality |
| **Collection of RT Tasks/Processes** | Share resources, communicate/synchronize with each other and the environment |

### 4.2 Basic Model Components

The data flow through a real-time system follows this path:

```text
Physical World --> Sensor --> Signal Conditioning (Input) --> Interface Unit (ADC)
    --> Computer/RTOS --> Interface Unit (DAC) --> Signal Conditioning (Output)
    --> Actuator --> Physical World
```

| Component | Function |
|-----------|----------|
| **Sensor** | Converts physical characteristics (temperature, pressure, light) into electrical signals |
| **Input Signal Conditioning** | Prepares sensor signals for the computer (amplification, filtering) |
| **Input Interface Unit** | Includes Analog-to-Digital Converter (ADC) for converting analog signals to digital |
| **Computer (RTOS)** | Processes data and makes decisions based on programmed algorithms |
| **Output Interface Unit** | Includes Digital-to-Analog Converter (DAC) for converting digital signals to analog |
| **Output Signal Conditioning** | Prepares signals for the actuator (driver circuits, power amplification) |
| **Actuator** | Converts electrical signals into physical actions (motion, heat, pressure changes) |

---

## 5. Classification of Real-Time Systems

Real-time systems are divided into three main categories based on the **consequence of a missed deadline**:

### 5.1 Hard Real-Time System

- System response **must** occur within a specified deadline
- Failure to meet timing requirements can have **catastrophic consequences**
- Many are considered **safety critical**
- Exceeding response time leads to potential **loss of life** and/or **major financial damage**
- Time is critical AND achieving the desired result is important

**Examples:** Flight control systems, automotive brakes, robotics, nuclear reactor control

### 5.2 Soft Real-Time System

- Response times are important but **not critical** to system operation
- Failure to meet timing requirements would **not impair** the system
- System will still function correctly if deadlines are **occasionally missed**
- Mistakes do not lead to system damage or disaster
- Often connected to **Quality-of-Service (QoS)**
- Cost associated with overrunning may be abstract

**Examples:** Video processing, digital cameras, mobile phones

### 5.3 Firm Real-Time System

- Systems that are soft real-time but where there is **no benefit from late delivery** of service
- A few missed deadlines will not lead to total failure
- Missing **more than a few** may lead to complete and catastrophic system failure
- The computation is **obsolete** if the job is not finished on time
- Cost may be interpreted as **loss of revenue**

**Examples:** Prediction systems, video conferencing, satellite-based tracking of enemy movements

### 5.4 Comparison Table

| Characteristic | Hard RTS | Soft RTS |
|----------------|----------|----------|
| Response Time | Hard-required | Soft-required |
| Peak Load Performance | Predictable | Degraded |
| Safety Critical | Yes | No |
| Size of Data | Small | Large |
| Error Detection | Autonomous | User-assisted |
| Consequence of Failure | Catastrophic | Degraded quality |

---

## 6. Task Types: Time-Triggered vs Event-Triggered

Synchronization between external processes and internal actions (tasks) can be defined in two ways:

### 6.1 Time-Triggered Tasks (Cyclic/Periodic)

- Completion of operations depends on the **number of operations** and **speed of the computer**
- Synchronization obtained by adding a **clock** to the computer system
- Clock signal interrupts the computer at **predetermined fixed time intervals**
- Tasks are **periodic** (cyclic)

### 6.2 Event-Triggered Tasks (Aperiodic)

- Actions performed in **response to some event**, not at particular times
- System must respond within a **given maximum time** to a particular event
- Events occur at **non-deterministic intervals**
- Tasks are referred to as **aperiodic**

### 6.3 Comparison

| Feature | Time-Triggered (TT) | Event-Triggered (ET) |
|---------|---------------------|---------------------|
| **Trigger Source** | System Clock / Ticks | External Interrupts / Signals |
| **Task Type** | Periodic (cyclic) | Aperiodic (sporadic) |
| **Scheduling** | Static (Offline) | Dynamic (Online) |
| **Flexibility** | Low (Hard to change) | High (Adaptive) |
| **Testability** | High (Repeatable) | Lower (Hard to simulate all event combos) |
| **Typical Protocol** | TTP (Time-Triggered Protocol) | CAN (Controller Area Network) |

---

## 7. Key Characteristics of Real-Time Systems

| Characteristic | Description |
|----------------|-------------|
| **Time Constraints** | Time interval allotted for the response of the ongoing program. Tasks must complete within their time intervals. |
| **Correctness** | Correct result must be obtained within the given time interval. Result not obtained in time is not considered correct. |
| **Embedded** | Combination of hardware and software designed for a specific purpose. Collects data from environment and processes it. |
| **Safety** | Provides critical safety. Can perform for a long time without failures. Recovers quickly when failure occurs. |
| **Concurrency** | Can respond to several processes at a time. Responds to every task in short intervals. |
| **Distributed** | Components may be at different geographical locations. Operations are operated in distributed ways. |
| **Stability** | Responds within time constraints even when load is very heavy. Does not delay results under heavy load. |
| **Fault Tolerance** | Designed to tolerate and recover from faults/errors without affecting performance or output. |
| **Determinism** | Behavior must be predictable and repeatable for a given input. Same output for same input regardless of load. |
| **Real-time Communication** | Communication between components must be reliable, fast, and secure. |
| **Resource Management** | Efficient management of processing power, memory, and I/O devices. Resources used optimally to meet constraints. |
| **Scalability** | Handles varying workloads by increasing or decreasing resources as needed. |
| **Security** | Protects sensitive data from unauthorized access or tampering. Restricted access control. |
| **Heterogeneous Environment** | May operate with components having different characteristics. Must handle differences seamlessly. |

---

## 8. Theoretical Foundation

| Discipline | Application in RTS |
|-----------|-------------------|
| **Computer Architecture** | Hardware platform (CPU, memory, I/O) for high-speed execution |
| **Operating Systems** | RTOS for resource management and scheduling |
| **Software Engineering** | Reliable and modular design methodologies |
| **Programming Languages** | C, C++, Ada for low-level control and predictable timing |
| **Algorithms & Data Structures** | O(1) or O(log n) operations for responsiveness |
| **Control Theory** | Feedback loops for flight controllers, robots, temperature regulation |
| **Queuing Theory** | Modeling task arrivals and minimizing latency |

---

## 9. Summary

| Aspect | Key Points |
|--------|-----------|
| **What makes a system "real-time"?** | Guaranteed response within a deadline |
| **Two dimensions of correctness** | Logical (value) + Temporal (time) |
| **Three types of RTS** | Hard, Soft, Firm |
| **Two task activation models** | Time-triggered (periodic) & Event-triggered (aperiodic) |
| **Main components** | Sensors -> Conditioning -> Interface -> Computer/RTOS -> Actuators |
| **Core characteristics** | Determinism, concurrency, fault tolerance, stability, safety |
| **Key conclusion** | RTS is not just about being fast -- it is about being **predictable** and **meeting deadlines** |

---

## References

- Real-Time System lecture slides (PPT One)
- Real-Time Systems: Design Principles for Distributed Embedded Applications
- Timing constraints, response time, and deadline analysis
