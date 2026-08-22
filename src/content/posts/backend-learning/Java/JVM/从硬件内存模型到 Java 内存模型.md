---
title: 从硬件内存模型到 Java 内存模型
description: 从硬件缓存一致性到 Java 内存模型，梳理可见性、有序性、原子性与 Happens-Before 规则
pubDatetime: 2026-08-20
slug: hardware-memory-model-to-jmm
tags: ["Java", "后端", "JVM"]
---

## 引言

多线程环境下，一旦出现线程间通信，就会带来一系列问题，「内存模型」就是为了解决这些问题的。

「内存模型」描述的是：

1. 在并发环境下，一段程序中的内存读写操作会以怎样的规则执行
2. 一个线程何时能观察到另一个线程的内存操作

## 硬件内存模型

CPU 的处理速度远超内存的读写速度，所以需要在 CPU 和内存之间加上读写速度更快的缓存，这就构成了最简单的硬件内存模型：CPU - 寄存器 - 多级缓存 - 主存（内存）。

为了提高程序运行速度，单台计算机中会有多个 CPU，在多 CPU 场景下，内存模型如图：

![](pictures/Pasted%20image%2020260820213142.png)

在多核处理器和多线程环境下，内存访问主要会产生以下三个问题，即**内存读写三要素**：

1. **可见性**：在多个 CPU 核心共享某个变量的场景下，其中一个核心修改数据后，修改结果可能暂存在缓存或写缓冲区中，导致其他核心无法立即观察到数据变化。硬件层面通过「**缓存一致性协议**」解决可见性问题，保证不同核心的共享数据的「**最终一致**」。
2. **有序性**：为了提高执行效率，编译器和 CPU 可能在不影响单线程结果的前提下，对指令进行重排。多线程环境下，指令重排会就会导致运行结果的不确定性。硬件层面通过「**内存屏障**」等技术解决有序性问题。
3. **原子性**：一些操作往往分多个步骤，多线程环境执行时，这些步骤可能交错进行，导致运行结果的不确定性。硬件层面通过 CAS、原子指令来解决原子性问题。

对于一个指定的 CPU 架构（比如 x86 或 arm），硬件内存模型的目标是让汇编代码能运行在一个具有一致性的内存视图上，即明确多核多线程环境下，处理器会以怎样的规则读写内存。

## Java 内存模型

不同 CPU 架构的硬件内存模型并不一样，有的允许更多的指令重排，有的则更少，我们希望使用 Java 这种高级语言编写代码时，能够忽略不同架构的差异，拥有一致的内存视图，于是就需要设计一个高级编程语言层面的内存模型，在 Java 中，就是 **JMM**（Java Memory Model，Java 内存模型）。

JMM 提供了：

1. 线程与内存之间交互方式的抽象
2. 解决内存读写的三要素的同步机制（volatile、锁、原子操作等）

### 抽象

Java 内存模型和硬件内存模型类似，结构为“线程 - 工作内存 - 主存”，抽象化如图 [^1]：

![](pictures/Pasted%20image%2020260820213204.png)

Java 内存模型、JVM 内存结构、硬件内存模型的映射关系抽象如图：

![](pictures/2%203.png)

在 JVM 中：

1. 基本类型变量和引用存储在线程栈中
2. 引用指向的对象存储在堆中
3. 持有对象引用的线程就能访问该对象，堆并不关心是哪个线程在访问对象

### 可见性

下面的代码运行后会一直空转，体现了可见性问题：

```java file="Main.java"
static int a = 1;
public static void main(String[] args) throws InterruptedException {
    // 线程1
    // 一直空转直到读到 a 为 2
    Thread t1 = new Thread(() -> { while (a != 2) {} });
    // 线程2
    // 将 a 赋值为2
    Thread t2 = new Thread(() -> a = 2);

    // 启动两个线程并阻塞等待其结束
    t1.start();
    Thread.sleep(1000);
    t2.start();
    t1.join();
    t2.join();
}
```

解决方案：

1. `volatile`：`volatile` 保证以下两点
   1. 被其修饰的变量被读写时，总是读写主存而不是工作内存
   2. 禁止 volatile 变量和之前的语句重排
2. `synchronized`：退出同步代码块时，会将同步代码块内修改的变量刷入主存，后续用同一个锁再进入时，会让当前线程的工作内存失效，重新读取主存（即监视器锁规则的 Happends-Before，见下文）

```java file="Main.java"
// 1
static volatile int a = 1;
// ...

// 2
static int a = 1;
Thread t1 = new Thread(new Runnable() {
    @Override
    public void run() {
        while (a != 2) {
            synchronized (this) {
                // 进入同步代码块，重新读取主存
                int b = a + 1;
            }
        }
    }
});
```

### Happens-Before

Happens-Before 规则保证：如果 A happens-before B，那么 A 中对内存的修改一定对 B 可见

具体包含以下几条：

1. **程序次序规则**：同一个线程中，按照代码顺序，前面的操作 happens-before 后面的操作
2. **监视器锁规则**：对一个锁的 unlock 操作 happens-before 后续对该锁的 lock 操作
3. **volatile 变量规则**：对一个 volatile 变量的写操作 happens-before 后续对该变量的读操作
4. **线程启动规则**：Thread.start() happens-before 该新线程中的任意操作
5. **线程终止规则**：线程中的任意操作 happens-before 其他线程对该线程的 join() 返回
6. **线程中断规则**：调用 Thread.interrupt() happens-before 被中断线程检测到中断事件
7. **对象终结规则**：对象的构造函数执行结束 happens-before 该对象的 finalize() 方法
8. **传递性规则**：如果 A happens-before B，且 B happens-before C，则 A happens-before C

[^1]: 此处为 JMM 的抽象展示，并不代表真的创建了本地内存、主内存等区域
