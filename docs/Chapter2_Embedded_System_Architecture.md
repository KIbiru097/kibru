# Chapter 2: Embedded System Architecture

## Table of Contents

1. [Introduction to Embedded Systems Architecture](#1-introduction-to-embedded-systems-architecture)
2. [Key Components of Embedded Architecture](#2-key-components-of-embedded-architecture)
3. [Processor Types](#3-processor-types)
4. [Processor Architecture](#4-processor-architecture)
5. [Communication Protocols](#5-communication-protocols)
6. [Criteria for Choosing a Microcontroller](#6-criteria-for-choosing-a-microcontroller)
7. [Types of Microcontrollers](#7-types-of-microcontrollers)
8. [8051 Microcontroller Architecture](#8-8051-microcontroller-architecture)
9. [ATmega32 Microcontroller](#9-atmega32-microcontroller)
10. [ARM Cortex-M0+ Architecture](#10-arm-cortex-m0-architecture)
11. [Interrupts and Polling](#11-interrupts-and-polling)
12. [Timers and Counters](#12-timers-and-counters)

---

## 1. Introduction to Embedded Systems Architecture

### 1.1 What is Embedded System Architecture?

The architecture of an embedded system is an **abstraction** of the embedded device -- a generalization that doesn't show detailed implementation such as software source code or hardware circuit design.

- At the architectural level, hardware and software components are represented as some **composition of interacting elements**
- Elements are representations of hardware and/or software whose implementation details have been abstracted
- A **structure** is one possible representation of the architecture, containing its own set of represented elements, properties, and inter-relationship information

### 1.2 Core Definition

> Embedded system architecture is the structural design combining hardware and software to perform specific, dedicated functions, often under real-time constraints.

It consists of:
- A **processor** (MCU/MPU)
- **Memory**
- **Peripherals**
- Typically using Harvard or Von Neumann structures
- Integrated with software (device drivers, RTOS, and application code)

### 1.3 The Microcontroller Unit (MCU)

The architecture of an embedded system is centered around its **microcontroller (MCU)**:

- Single integrated circuit containing the processor, RAM, flash memory, serial receivers/transmitters, and other core components
- Designed to be **inexpensive**, **low-resource**, **low-energy consuming**, self-contained systems on a single chip
- Often referred to as **System-on-Chip (SoC)**
- Due to variety of processors, memories, and interfaces, there is no actual reference architecture for microcontrollers

---

## 2. Key Components of Embedded Architecture

### 2.1 Hardware Architecture

| Component | Description |
|-----------|-------------|
| **Processor** | Microcontroller or microprocessor -- central component around which the system is built |
| **Memory** | ROM for code, RAM for data |
| **Peripheral Interfaces** | I/O ports, serial communication (UART, I2C, SPI) |
| **Specialized Controllers** | ADC, DAC, timers, PWM generators |

### 2.2 Software Architecture

| Layer | Description |
|-------|-------------|
| **Device Drivers** | Low-level hardware abstraction |
| **Middleware** | Communication stacks, protocol handlers |
| **Application Software** | Main program logic |
| **RTOS (optional)** | Task scheduling and resource management |

> Systems may operate without an OS ("bare-metal") or use a Real-Time Operating System (RTOS) to manage task timing.

### 2.3 Peripheral Integration

```
Sensors (Input) --> Processor (Processing) --> Actuators (Output)
       ^                                            |
       |_____________ Feedback Loop ________________|
```

Sensors detect environmental variables (input), which are processed and acted upon by actuators (output), forming a **closed-loop control system**.

---

## 3. Processor Types

The processor is the central component of the embedded system around which the whole system is built. A processor can be:

| Processor Type | Description |
|---------------|-------------|
| **Microprocessor** | General-purpose processing unit; requires external memory and peripherals |
| **Microcontroller** | Processor + memory + peripherals on a single chip; self-contained |
| **DSP (Digital Signal Processor)** | Optimized for digital signal processing operations |
| **ASIC (Application-Specific IC)** | Custom-designed for a specific application; not programmable |
| **FPGA (Field-Programmable Gate Array)** | Reconfigurable hardware; programmable logic blocks |
| **Multicore Processors** | Multiple processing cores on a single chip |

### 3.1 Microprocessor vs Microcontroller

| Feature | Microprocessor | Microcontroller |
|---------|---------------|----------------|
| Integration | CPU only | CPU + Memory + I/O on one chip |
| External Components | Requires external memory, I/O | Self-contained |
| Cost | Higher (needs supporting hardware) | Lower (all-in-one) |
| Power Consumption | Higher | Lower |
| Application | General-purpose computing | Dedicated/embedded tasks |

### 3.2 ASICs

- Lack of programmability and high cost make ASICs not suitable for prototyping
- More effective than software-based solutions on microprocessors
- Widely used in communication, medical, network, and multimedia systems
- Examples: cellular phones, network routers, game consoles

### 3.3 FPGAs

- Reconfigurable hardware logic
- Can be reprogrammed after manufacturing
- Bridge between ASICs and microprocessors
- Suitable for prototyping and medium-volume production

### 3.4 Multicore Processors

- Processor clock speed is linked to transistor density
- When transistor shrinking slowed, single-core speed improvement also slowed
- **Power wall issue**: denser transistors = higher energy consumption and heat
- Solution: multiple cores on a single chip
- Most current systems are multicore

---

## 4. Processor Architecture

### 4.1 Von Neumann Architecture

- **Stored program mechanism**
- Single shared memory holds both data and instructions
- Instruction fetch and data operation **cannot occur simultaneously** (shared bus)
- CPU registers: Program Counter (PC), Instruction Register (IR), general-purpose registers
- **Von Neumann bottleneck**: limited by single bus bandwidth
- Solution: Cache memory

```
+-------+     Single Bus     +--------+
|  CPU  | <================> | Memory |
+-------+                   | (Data + |
                            | Program)|
                            +--------+
```

### 4.2 Harvard Architecture

- **Stored program mechanism**
- Separate memory blocks for program (instructions) and data
- More efficient: accessing instructions and data can be done **in parallel**
- Data memory accessed more frequently than program memory
- Potential memory block access imbalance

```
+-------+     Program Bus    +----------+
|       | <================> | Program  |
|  CPU  |                    | Memory   |
|       |     Data Bus       +----------+
|       | <================> | Data     |
+-------+                   | Memory   |
                            +----------+
```

### 4.3 Super Harvard Architecture (SHARC)

- Secondary data stored in program memory to **balance the load** on both memory blocks
- Extensively used for DSP (Digital Signal Processing)

### 4.4 Instruction Sets

| Type | Characteristics |
|------|----------------|
| **CISC** (Complex Instruction Set Computer) | Many instructions, variable length, complex operations in single instruction |
| **RISC** (Reduced Instruction Set Computer) | Few simple instructions, fixed length, executes in single clock cycle |

**Instruction characteristics:**
- Fixed vs. variable length
- Addressing modes
- Number of operands
- Types of operations supported

### 4.5 Pipelining in RISC

Pipelining allows multiple instructions to be processed simultaneously at different stages:

```
Stage 1: Fetch  | I1 | I2 | I3 | I4 |
Stage 2: Decode |    | I1 | I2 | I3 |
Stage 3: Execute|    |    | I1 | I2 |
                 T1   T2   T3   T4
```

---

## 5. Communication Protocols

### 5.1 Serial vs Parallel Communication

| Type | Description | Examples |
|------|-------------|----------|
| **Serial** | Sends/receives data one bit at a time | Ethernet, I2C, SPI, USB, SATA |
| **Parallel** | Sends/receives multiple data bits at a time through parallel channels | ISA, ATA, SCSI, PCI |

### 5.2 Serial Communication Protocols

#### USART (Universal Synchronous/Asynchronous Receiver-Transmitter)

- Transmits and receives data **bit by bit** over a single wire with respect to clock pulses
- PIC microcontroller has two pins: TXD (transmit) and RXD (receive)
- Used for serial data transmission and reception

#### SPI (Serial Peripheral Interface)

- Used to send data between microcontroller and peripherals (SD cards, sensors, shift registers)
- **Three-wire** SPI communication (Master-to-Slave, Slave-to-Master, Clock)
- Additional **SS (Slave Select)** line for multiple ICs
- Data rate **higher** than USART

#### I2C (Inter-Integrated Circuit)

- Pronounced "eye-two-see"
- Advanced form of USART
- Used to connect **low-speed devices** (EEPROMs, microcontrollers)
- Transmission speeds up to **400 KHz**
- Only **two wires**: clock (SCL) and bidirectional data (SDA)
- Also called **Two Wire Interface (TWI)**

#### FireWire

- Developed by Apple
- **High-speed** buses capable of audio/video transmission
- Available in 4-pin, 6-pin, or 8-pin configurations

#### Ethernet

- Used mostly in **LAN connections**
- Bus consists of 8 lines (4 Tx/Rx pairs)

#### USB (Universal Serial Bus)

- Most popular serial interface
- Used for virtually all types of connections
- 4 lines: VCC, Ground, Data+, Data-

---

## 6. Criteria for Choosing a Microcontroller

When selecting a microcontroller, ensure it meets system needs and is cost-effective:

| Criterion | Description |
|-----------|-------------|
| **Speed** | Operational speed the microcontroller can support |
| **Packaging** | Important for assembly, space, and prototyping |
| **I/O Pin Count** | Number of input/output devices that can be connected |
| **RAM** | Available data memory |
| **ROM** | Available program memory |
| **Cost per Unit** | Budget considerations |
| **Power Consumption** | Energy efficiency requirements |

---

## 7. Types of Microcontrollers

A microcontroller is a functional **computer system-on-a-chip** containing a processor, memory, and programmable I/O peripherals.

### 7.1 8051 Microcontroller

- Created by **Intel in 1981**
- **8-bit** microcontroller
- Four parallel 8-bit ports (programmable and addressable)

### 7.2 AVR Microcontroller

- **AVR** = Alf and Vegard's RISC Processor
- Modified **Harvard architecture**
- Program and data stored in separate physical memory systems

### 7.3 ARM Microcontroller (Advanced RISC Machine)

- Most popular microcontroller in digital embedded systems
- **Cost-sensitive** and **high-performance**
- Preferred by most industries for product development

### 7.4 PIC Microcontroller (Peripheral Interface Controller)

- Produced by **Microchip Technology**
- Used in development of electronics, computer robotics, and similar devices

---

## 8. 8051 Microcontroller Architecture

### 8.1 Memory Organization

#### ROM (Program Memory)
- Original 8051 has **4K bytes on-chip ROM**
- Maximum: 64K bytes (no member exceeds this)
- Program Counter is a **16-bit register**

#### RAM (Data Memory)
- **128 bytes** of RAM (addresses 00H to 7FH)
- Divided into three groups:

| Address Range | Size | Purpose |
|--------------|------|---------|
| 00H - 1FH | 32 bytes | Register banks and stack |
| 20H - 2FH | 16 bytes | Bit-addressable read/write memory |
| 30H - 7FH | 80 bytes | General-purpose scratch pad (read/write storage) |

---

## 9. ATmega32 Microcontroller

### 9.1 Overview

- **AT** = Atmel, **mega** = mega series, **32** = number of ports
- Low-power **CMOS 8-bit** microcontroller
- Based on **AVR enhanced RISC architecture**
- Manufactured by Atmel Corporation (founded 1984)

### 9.2 Key Features

| Feature | Specification |
|---------|--------------|
| Working Registers | 32 x 8-bit general purpose |
| Flash Memory | 32K bytes (in-system self-programmable) |
| Internal SRAM | 2K bytes |
| EEPROM | 1024 bytes |
| Package | 40-pin DIP |
| I/O Lines | 32 programmable |
| ADC | 8 channel, 10-bit |
| Timers/Counters | Two 8-bit + One 16-bit |
| PWM Channels | 4 |
| Serial | Programmable USART |
| SPI | Master/Slave interface |
| Watchdog Timer | Programmable with separate oscillator |

### 9.3 Pin Configuration

| Pin | Function |
|-----|----------|
| **VCC & GND** | Digital supply voltage (2.7V - 5.5V, never exceed 6.0V) |
| **XTAL1 & XTAL2** | Crystal oscillator connections (typical C1, C2 = 22pF) |
| **RESET** | Low level > 1.5ns generates reset; all I/O registers set to initial values |
| **AVCC** | Supply voltage for ADC (connect externally to VCC) |
| **AREF** | Analog reference pin for ADC |

### 9.4 Ports

| Port | Description |
|------|-------------|
| **PORT A** (PA0-PA7) | 8-bit bidirectional I/O; alternative function as ADC analog input |
| **PORT B** (PB0-PB7) | 8-bit bidirectional I/O with optional internal pull-ups |
| **PORT C** (PC0-PC7) | 8-bit bidirectional I/O with optional internal pull-ups |
| **PORT D** (PD0-PD7) | 8-bit bidirectional I/O with optional internal pull-ups |

All ports are tri-stated on reset and can be programmed for alternative functions.

---

## 10. ARM Cortex-M0+ Architecture

### 10.1 Overview

- **ARM** = Advanced RISC Machine (founded November 1990)
- ARM Cortex-M is a group of **32-bit RISC** ARM processor cores
- Licensed by ARM company
- Most **energy-efficient** ARM processor available for embedded applications
- Architecture for the digital world (not a product)
- Smallest silicon footprint and minimal code size for 32-bit performance

### 10.2 ARM Processor Categories

| Category | Purpose |
|----------|---------|
| **Cortex-A** | Application processors (smartphones, tablets) |
| **Cortex-R** | Real-time processors (automotive, industrial) |
| **Cortex-M** | Microcontroller processors (embedded, IoT) |

### 10.3 Key Features of ARM Cortex-M0+

| Feature | Specification |
|---------|--------------|
| CPU | High-performance 32-bit |
| Performance | 2.42 CoreMark/MHz, 0.93 MIPS/MHz |
| Pipeline | Low-latency 2-stage |
| Sleep Modes | WFI, WFE, sleep-on-exit, deep sleep |
| Trace | Optional Micro Trace Buffer |
| Bus Architecture | Von Neumann with optional single-cycle I/O |
| Interrupts | Non-maskable interrupt + 1 to 32 physical interrupts |
| Memory Protection | Integrated Memory Protection Unit (MPU) |

---

## 11. Interrupts and Polling

### 11.1 Overview

Two techniques for processor-to-peripheral communication:

| Technique | Description | Analogy |
|-----------|-------------|---------|
| **Polling** | Processor repeatedly checks device status at regular intervals | Like a salesperson going door-to-door |
| **Interrupt** | Peripheral sends a signal to processor when it needs attention | Like a shopkeeper -- customer comes to them |

### 11.2 Types of Interrupts

#### Hardware Interrupts
- Electronic alerting signal sent from an **external device** to the processor
- Example: Pressing a key on the keyboard triggers a hardware interrupt

#### Software Interrupts
- Caused by an **exceptional condition** or special instruction in the instruction set
- Example: Division by zero causes a divide-by-zero exception
- Work similar to subroutine calls

### 11.3 Interrupt Service Routine (ISR)

For every interrupt, there must be an **Interrupt Service Routine (ISR)** or interrupt handler.

The table of memory locations holding ISR addresses is called the **Interrupt Vector Table**.

### 11.4 Steps to Execute an Interrupt

1. Microcontroller closes the currently executing instruction
2. Saves current context and address of next instruction (PC) on the stack
3. Jumps to the memory location of the Interrupt Vector Table
4. Gets the address of the ISR from the vector table
5. Executes the ISR until reaching the **RETI** (Return from Interrupt) instruction
6. Upon RETI, pops the PC address from the stack
7. Resumes execution from the interrupted location

```
Normal Execution --> Interrupt Occurs --> Save Context (Push PC to Stack)
    --> Jump to IVT --> Get ISR Address --> Execute ISR
    --> RETI --> Pop PC from Stack --> Resume Normal Execution
```

---

## 12. Timers and Counters

### 12.1 Distinction

Both timers and counters are built from **adder logic** with registers to hold the current value, with an increment input that adds one to the current register value.

| Component | Clock Source | Purpose |
|-----------|-------------|---------|
| **Timer** | Periodic clock signal | Measures time intervals |
| **Counter** | Aperiodic signal | Counts occurrences of external events |

---

## References

- Chapter 2: Embedded System Architecture lecture slides
- ATmega32 Datasheet
- ARM Cortex-M0+ Technical Reference Manual
- 8051 Microcontroller Architecture Reference
