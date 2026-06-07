# Chapter 3: RTOS, Process Management, Scheduling, and Context Switching

## Table of Contents

1. [Architecture and Framework](#1-architecture-and-framework)
2. [Operating Systems Overview](#2-operating-systems-overview)
3. [Real-Time Operating Systems (RTOS)](#3-real-time-operating-systems-rtos)
4. [RTOS Components and Features](#4-rtos-components-and-features)
5. [Real-Time Kernel](#5-real-time-kernel)
6. [Process Management](#6-process-management)
7. [Process Scheduling](#7-process-scheduling)
8. [Context Switching](#8-context-switching)
9. [Inter-Process Communication](#9-inter-process-communication)
10. [Summary](#10-summary)

---

## 1. Architecture and Framework

### 1.1 Software Architecture

Software Architecture refers to the high-level structure or blueprint of a software system. It defines the overall design and the components (modules, services, layers) that make up the system, along with their interactions and dependencies.

- Concerned with how the system is structured and organized to meet its goals (scalability, maintainability, performance, security)
- Focused on decisions about system organization that impact long-term goals and technical requirements
- Ensures the overall structure is aligned with functional and non-functional requirements

### 1.2 Software Framework

A framework is a set of pre-written, reusable software components or libraries designed to help developers build applications more efficiently.

**Framework characteristics:**
1. **Predefined Structure** — Enforces a certain way to organize code
2. **Reusable Components** — Provides essential components for common tasks
3. **Abstraction Layer** — Abstracts lower-level operations (system calls, hardware interactions)
4. **Extensibility** — Designed to be extended with custom features
5. **Automation and Convention** — "Convention over configuration" principle

### 1.3 Types of Software Frameworks

| Type | Examples | Purpose |
|------|----------|---------|
| **Web Frameworks** | Django, Flask, Ruby on Rails | Building web applications |
| **Mobile Frameworks** | React Native, Flutter | Mobile app development |
| **Game Frameworks** | Unity, Unreal Engine | Video game creation |
| **Embedded Frameworks** | FreeRTOS, Zephyr, Arduino | Embedded system development |

### 1.4 Embedded Frameworks

An embedded framework is a software development framework specifically designed for creating applications that run on embedded systems.

Key characteristics:
- Provides structured environment with predefined tools, libraries, and components
- Handles hardware abstraction, real-time task scheduling, communication protocols
- Manages low-level hardware interaction
- Systems have limited resources (CPU power, memory, storage)

### 1.5 Real-Time Embedded Framework (RTEF)

A Real-Time Embedded Framework (RTEF) is an implementation of the Active Object design pattern specifically designed for real-time embedded systems. It provides event-driven infrastructure for executing Active Objects based on a real-time kernel (RTOS kernel) to ensure deterministic, real-time performance.

---

## 2. Operating Systems Overview

### 2.1 Definition and Purpose

An operating system (OS) is a software layer that acts as an intermediary between computer hardware and user applications. It manages hardware resources, provides essential services to applications, and facilitates user interaction.

**Core Functions:**

| Function | Description |
|----------|-------------|
| **Resource Management** | Manages CPU, memory, storage, and I/O devices |
| **Process Management** | Creates, schedules, and executes processes; handles synchronization |
| **Memory Management** | Allocates/deallocates memory, manages virtual memory, handles protection |
| **File System Management** | Hierarchical file organization, access control, storage operations |
| **Device Management** | Controls I/O devices, provides device drivers |
| **User Interface** | CLI, GUI, or both |
| **Security and Protection** | Authentication, access control, encryption, malware prevention |

### 2.2 Evolution of Operating Systems

1. **Serial Processing Systems** — One program at a time (ENIAC, UNIVAC)
2. **Batch Processing Systems** — Multiple jobs executed sequentially without user intervention (IBM OS/360)
3. **Time-Sharing Systems** — Multiple users interact simultaneously; CPU time divided (CTSS, UNIX)
4. **Distributed Systems** — Coordination across multiple networked computers (Android, Windows DFS)
5. **Real-Time Systems** — Strict timing constraints and deadlines (VxWorks, QNX, FreeRTOS)

### 2.3 Types of Operating Systems

| Type | Key Feature |
|------|-------------|
| **Single-User OS** | Supports one user at a time (personal computers) |
| **Multi-User OS** | Multiple users simultaneously (servers) |
| **Batch OS** | Processes jobs in batches without intervention |
| **Multiprocessing OS** | Concurrent execution on multiple CPUs |
| **Time-Sharing OS** | Divides CPU time among active processes |
| **Multitasking OS** | Single user runs multiple programs concurrently |
| **Distributed OS** | Manages resources across networked computers |
| **Real-Time OS (RTOS)** | Guarantees timely responses within time constraints |

---

## 3. Real-Time Operating Systems (RTOS)

### 3.1 Definition

An RTOS is a class of operating systems intended for real-time applications that process data as it comes in, mostly without buffer delay. It is a time-bound system defined by fixed time constraints.

> "A Real-Time Operating System (RTOS) is designed to process inputs and execute tasks within strictly guaranteed, predictable timeframes. Unlike general-purpose operating systems, an RTOS values deterministic behavior and timing reliability — not overall system throughput."

### 3.2 Why RTOS?

- Offers **priority-based scheduling** to separate critical from non-critical processing
- Provides **API functions** for cleaner and smaller application code
- **Abstracts timing dependencies** — task-based design reduces interdependencies
- Offers **modular task-based development** allowing independent testing
- Is **event-driven** with no time wasted on unoccurred events

### 3.3 RTOS Gives Control Over

**Resources:**
- No unexpected background processes
- Bounded number of tasks

**Timing:**
- Manipulation of task priorities
- Choice of scheduling options

### 3.4 Popular RTOS Examples

| RTOS | Description | Use Case |
|------|-------------|----------|
| **FreeRTOS** | Open-source, supports wide range of microcontrollers | General embedded systems |
| **RTEMS** | Open-source, multiprocessor support | Space missions |
| **VxWorks** | Commercial, safety-critical | Aerospace, automotive, industrial |
| **QNX** | Commercial, real-time | Automotive infotainment, ADAS |

---

## 4. RTOS Components and Features

### 4.1 Core Features

**Timing & Responsiveness:**
- **Determinism** — System guarantees predefined maximum time for critical operations
- **Minimal Latency** — Low interrupt latency and rapid context switching

**Task Management & Scheduling:**
- **Priority-Based Scheduling** — Highest urgency tasks execute first
- **Preemptive Multitasking** — OS can halt lower-priority threads for higher-priority tasks

**Resource & System Management:**
- **Predictable Resource Management** — Static/fixed memory allocation avoids unpredictable delays
- **Inter-Task Communication & Synchronization** — Queues, pipes, and mutexes for smooth coordination

**Reliability & Safety:**
- **Fault Tolerance** — Remains operational despite hardware errors or minor faults
- **High Availability** — Designed for zero-downtime, mission-critical environments

### 4.2 RTOS Requirements Summary

| Requirement | Explanation |
|-------------|-------------|
| **Determinism** | Operations happen within strictly defined time frame |
| **Task Prioritization** | Tasks prioritized by urgency; CPU allocated accordingly |
| **Concurrency** | Multiple tasks running simultaneously or appearing to |
| **Memory Management** | Efficient allocation without fragmentation |
| **Minimal Latency** | Consistent, minimal response time to external events |
| **Reliability and Stability** | Mission-critical operation |
| **Small Footprint** | Minimal memory usage for resource-constrained systems |

### 4.3 RTOS Components

| Component | Function |
|-----------|----------|
| **Real-Time Kernel** | Manages hardware resources, processor time, task synchronization |
| **Scheduler** | Determines task execution order based on priority |
| **SMP (Symmetric Multiprocessing)** | Handles parallel processing on multiple cores |
| **Function Library** | Interface between kernel and application code |
| **Memory Management** | Allocates memory to programs |
| **Fast Dispatch Latency** | Minimizes time between task identification and execution |
| **Timer Services** | System clocks, delays, and timeouts |
| **Interrupt Handlers** | Manages hardware interrupts for time-critical functions |
| **Semaphores** | Controls access to shared resources |
| **Message Queues** | Passes data between tasks |
| **Mutexes** | Binary locks protecting critical code regions |

---

## 5. Real-Time Kernel

### 5.1 Definition

The kernel is the core of the RTOS that manages hardware resources, processor time, and task synchronization. It handles critical, low-level functions like interrupt handling and task dispatching.

- Built upon a lean, high-performance real-time kernel
- Provides fundamental elements for organizing event-driven and time-driven logic
- Replaces traditional polling logic and complex state machines
- Enables multiple threads (tasks) coded independently
- Threads have assigned priorities and execute only when events occur
- Designed specifically for microcontrollers with minimalist architecture
- Performs no internal memory allocation

### 5.2 Principles of Real-Time Kernel

| Principle | Description |
|-----------|-------------|
| **Determinism** | Consistent, predictable system response to events |
| **Task Scheduling** | Efficient algorithm assigns priorities and schedules execution |
| **Priority Inversion Prevention** | Techniques (priority inheritance, ceiling protocols) prevent lower-priority tasks from blocking higher-priority ones |
| **Minimal Overhead** | Low memory footprint, fast context switching, quick system calls |
| **Interrupt Handling** | Minimized interrupt latency for timely ISR execution |
| **Synchronization & Communication** | Semaphores, mutexes, message queues, event flags |
| **Configurability** | Adjustable scheduling policies, interrupt priorities, resource management |

### 5.3 Types of Kernel

| Kernel Type | Description | Examples |
|-------------|-------------|----------|
| **Monolithic** | All OS services in kernel space — fast but less fault-isolation | Unix, Linux |
| **Microkernel** | Minimal kernel; most services in user space — better reliability | Minix 3, Mach |
| **Hybrid** | Mix of monolithic + microkernel — speed + safety balance | Windows NT, macOS/XNU |
| **Nanokernel** | Extremely minimal; only basic hardware abstraction | Nemesis |
| **Exokernel** | Only handles protection; applications access hardware directly | MIT Exokernel (XOK) |

---

## 6. Process Management

### 6.1 Definition

A process is a running program that serves as the foundation for all computation. Unlike a program (passive entity), a process is an active entity — essentially running software representing the fundamental unit of work in a system.

### 6.2 Process Memory Layout

When placed in memory, a program becomes a process with four sections:

| Section | Content |
|---------|---------|
| **Stack** | Temporary data: function parameters, return addresses, local variables |
| **Heap** | Dynamically allocated memory during execution |
| **Text** | Executable code (program instructions) |
| **Data** | Global and static variables |

### 6.3 Process Attributes

| Attribute | Description |
|-----------|-------------|
| **Process ID (PID)** | Unique identifier assigned by OS |
| **Process State** | Ready, running, waiting, etc. |
| **CPU Registers** | Saved/restored during context switches |
| **Account Information** | CPU time used, execution limits |
| **I/O Status** | Devices allocated, open files |
| **CPU Scheduling Info** | Priority, scheduling parameters |

### 6.4 Process Control Block (PCB)

Every process has a PCB — a data structure managed by the operating system that stores all information required to track a process:

- Process state (ready, waiting, running)
- Process privileges (resource access rights)
- Process ID (unique identifier)
- Pointer to parent process
- Program counter (address of next instruction)
- CPU registers (must be saved/restored on context switch)

### 6.5 Components of Process Management

1. **Process Mapping** — Visual representations of task flow and dependencies
2. **Process Analysis** — Evaluating for bottlenecks and inefficiencies
3. **Process Redesign** — Optimizing workflows and performance
4. **Process Implementation** — Introducing redesigned processes
5. **Process Monitoring** — Tracking performance and maintaining efficiency

---

## 7. Process Scheduling

### 7.1 Definition

Process scheduling allocates processor execution time to tasks based on strict timing constraints and priority levels. Its primary goal is to guarantee system determinism — ensuring critical operations complete on time.

### 7.2 Scheduling Algorithms

| Algorithm | Type | Priority Assignment | CPU Utilization | Use Case |
|-----------|------|-------------------|-----------------|----------|
| **Rate Monotonic (RMS)** | Static, fixed-priority | Shorter period → higher priority | Bounded by n(2^(1/n)-1) | Periodic tasks |
| **Earliest Deadline First (EDF)** | Dynamic | Nearest deadline → highest priority | Up to 100% | Mixed task sets |
| **Round-Robin (RR)** | Equal priority | Equal time slices (quanta) | Fair distribution | Same-priority tasks |

### 7.3 Rate Monotonic Scheduling (RMS)

**Characteristics:**
- Static priority assigned before execution (remains fixed)
- Higher frequency = shorter period = higher priority
- Preemptive — higher-priority task immediately interrupts lower-priority
- Implicit deadline — deadline equals period

**Schedulability Test:**

```text
U = Σ(Ci/Ti) ≤ n(2^(1/n) - 1)

Where:
  n  = number of processes
  Ci = computation time of process i
  Ti = time period of process i
  U  = processor utilization
```

**Scheduling Steps:**
1. Calculate scheduling time = LCM of all task periods
2. Assign priority (shortest period = highest priority)
3. Execute highest priority ready task; preempt if needed

### 7.4 Earliest Deadline First (EDF)

- Dynamic priority: task with nearest absolute deadline executes first
- Achieves up to 100% CPU utilization (theoretical)
- More computationally expensive at runtime than RMS
- Suitable for both periodic and aperiodic tasks

### 7.5 Round-Robin (RR)

- Used for tasks with identical priority levels
- Allocates equal time slices (quanta) in cyclical order
- Prevents any single task from monopolizing CPU
- Context switch occurs at end of each quantum

---

## 8. Context Switching

### 8.1 Definition

A context switch occurs when the CPU switches from executing one task to another. The task's "context" (snapshot of execution state) must be safely stored so the task can resume later exactly where it left off.

### 8.2 Context Components

| Component | Description |
|-----------|-------------|
| **CPU Registers** | Data, index, and general-purpose registers storing intermediate calculations |
| **Program Counter (PC)** | Memory address of the next instruction to execute |
| **Stack Pointer (SP)** | Memory address of the top of the task's stack |
| **Program Status Word (PSW)** | Condition codes, interrupt status, execution mode |

### 8.3 Context Switch Process

```text
1. SAVE current task's context:
   - Push CPU registers to task's stack
   - Save Program Counter (PC)
   - Save Stack Pointer (SP)
   - Save Program Status Word (PSW)
   - Update task's state in PCB to "Ready" or "Waiting"

2. SELECT next task:
   - Scheduler determines highest-priority ready task
   - Based on scheduling algorithm (RMS, EDF, RR)

3. RESTORE new task's context:
   - Load Stack Pointer from new task's PCB
   - Load Program Counter
   - Restore CPU registers from stack
   - Restore PSW
   - Update new task's state to "Running"

4. RESUME execution at new task's PC address
```

### 8.4 Context Switch Triggers

| Trigger | Description |
|---------|-------------|
| **Timer interrupt** | Time slice expired (Round-Robin) |
| **Higher priority task ready** | Preemption (RMS, EDF) |
| **Task voluntarily yields** | Task calls yield() or waits for event |
| **I/O operation** | Task blocked waiting for peripheral |
| **Interrupt** | Hardware interrupt requires ISR execution |

### 8.5 Context Switch Overhead

Context switching introduces overhead:
- **Time cost**: Saving/restoring registers takes CPU cycles
- **Cache invalidation**: New task may not have data in cache
- **Pipeline flush**: CPU instruction pipeline may need flushing

Real-time kernels minimize this overhead to maintain deterministic behavior.

---

## 9. Inter-Process Communication

### 9.1 Definition

Exchange of data between two or more separate, independent processes/threads using facilities provided by the operating system: message queues, semaphores, and shared memory.

### 9.2 IPC Mechanisms

| Mechanism | Purpose | Blocking? |
|-----------|---------|-----------|
| **Semaphores** | Control access to shared resources by multiple processes | Yes (counting) |
| **Message Queues** | Pass data and messages between different tasks | Optional |
| **Mutexes** | Binary locks protecting critical code sections | Yes (binary) |
| **Shared Memory** | Direct memory access between processes | No (needs sync) |
| **Pipes** | Unidirectional data flow between processes | Yes |
| **Event Flags** | Signal occurrence of events between tasks | Optional (API-dependent) |

> **Note:** Tasks can block while waiting on event flags unless a non-blocking/polling API variant is used. The blocking behavior depends on the specific RTOS implementation and API call.

### 9.3 Synchronization Challenges

- **Race Conditions** — Multiple tasks accessing shared data simultaneously
- **Deadlock** — Two or more tasks waiting for each other's resources
- **Priority Inversion** — Lower-priority task holds resource needed by higher-priority task
- **Starvation** — Task never gets CPU time due to higher-priority tasks

---

## 10. Summary

### 10.1 Key Concepts Table

| Concept | Definition | Importance |
|---------|-----------|------------|
| **RTOS** | OS guaranteeing timely response within time constraints | Deterministic behavior for safety-critical systems |
| **Real-Time Kernel** | Core managing resources, scheduling, and synchronization | Foundation of all RTOS operations |
| **Process** | Running program as fundamental unit of work | Basic entity managed by OS |
| **PCB** | Data structure storing process state information | Enables context switching |
| **Scheduling** | Algorithm determining task execution order | Ensures deadlines are met |
| **RMS** | Static priority based on task period | Predictable scheduling for periodic tasks |
| **EDF** | Dynamic priority based on deadline proximity | Maximum CPU utilization |
| **Context Switch** | Saving/restoring task execution state | Enables multitasking |
| **IPC** | Communication between concurrent processes | Coordination and data sharing |
| **Embedded Framework** | Reusable tools/libraries for embedded development | Efficient development with hardware abstraction |

### 10.2 Relationship Between Concepts

```text
┌────────────────────────────────────────────────────────┐
│                  EMBEDDED FRAMEWORK                      │
│  (Arduino, FreeRTOS, Mbed OS, Zephyr)                  │
├────────────────────────────────────────────────────────┤
│                       RTOS                              │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │  Scheduler  │  │  Kernel  │  │  IPC Mechanisms  │   │
│  │  (RMS/EDF)  │  │          │  │  (Sem/Mutex/MQ)  │   │
│  └──────┬──────┘  └────┬─────┘  └────────┬────────┘   │
│         │               │                  │            │
│         ▼               ▼                  ▼            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PROCESS MANAGEMENT                   │   │
│  │  Tasks ←→ PCB ←→ Context Switch ←→ States       │   │
│  └─────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────┤
│                    HARDWARE                              │
│  CPU Registers, Memory, Timers, Interrupts, I/O        │
└────────────────────────────────────────────────────────┘
```

---

## References

- Real-Time Embedded Framework (RTEF) and Active Object design pattern
- FreeRTOS, VxWorks, QNX, RTEMS documentation
- Rate Monotonic Analysis (RMA) — Liu & Layland, 1973
- Process scheduling algorithms and CPU utilization bounds
- Context switching mechanisms in embedded systems
- Inter-Process Communication (IPC) in real-time systems
