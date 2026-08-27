---
title: Synchronized 锁机制：从无锁到重量级锁
description: 深入理解 synchronized 锁的实现原理、锁升级过程，以及乐观锁与悲观锁的区别。
pubDatetime: 2026-08-23
slug: java-synchronized-lock-mechanism
tags:
  - Java
  - 后端
  - JUC
---

## 引言

`synchronized` 用于将一段代码块标记为同步执行，底层通过将一个对象作为锁，来保证同一时间只有一个线程执行代码块。

对于控制同步代码块的对象锁，它有四种状态：无锁、偏向锁（JDK15+ 弃用）、轻量级锁、重量级锁，锁的状态管理通过「**对象头**」中的 Mark Word 实现。

一个堆中的对象，主要包含两部分：

- 对象头：包含 Mark Word 和 Class Pointer（指向方法区中的 Class 对象）
- 实例数据

Mark Word 是一个 32bit 的数据 [^1]，用于记录对象实例的运行时信息，结构如下表：

<table>
  <thead>
    <tr>
      <th rowspan="2">锁状态</th>
      <th colspan="2">25bit</th>
      <th rowspan="2">4bit</th>
      <th>1bit</th>
      <th>2bit</th>
    </tr>
    <tr>
      <th>23bit</th><th>2bit</th><th>是否偏向锁</th><th>锁标志位</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>无锁</td><td colspan="2">对象的HashCode</td><td>分代年龄</td><td>0</td><td>01</td></tr>
    <tr><td>偏向锁</td><td>线程ID</td><td>Epoch</td><td>分代年龄</td><td>1</td><td>01</td></tr>
    <tr><td>轻量级锁</td><td colspan="4">指向栈中锁记录的指针</td><td>00</td></tr>
    <tr><td>重量级锁</td><td colspan="4">指向重量级锁的指针</td><td>10</td></tr>
    <tr><td>GC标记</td><td colspan="4">空</td><td>11</td></tr>
  </tbody>
</table>

无锁就表示没有线程持有这个对象（即作为一个普通的对象），有线程争抢对象后，会根据竞争情况升级到更高级的锁。

- 如果没有线程持有对象锁，就是无锁状态
- 如果有线程持有对象锁，就一定不是无锁状态

## 锁的实现

锁从设计思想的角度可以分为「**乐观锁**」和「**悲观锁**」。

对于一个共享资源，

- 乐观锁假定这个资源大部分时间空闲的（即资源竞争不激烈），当一个线程想要使用资源时，要么能够立即获取到，要么多尝试几次就能获取到。
- 悲观锁假定这个资源大部分时间是被占有的（即资源竞争激烈），当一个线程想要使用资源时，如果获取不到，就阻塞等待。

在具体实现上，可以分为「**无锁编程**」和「**有锁编程**」

- 无锁编程一般通过 CAS 等原子操作实现并发控制，避免了线程切换。
- 有锁编程的底层，依赖操作系统提供的并发控制原语，涉及线程的阻塞和唤醒。

无锁编程性能好，但可能会浪费 CPU（自旋导致 CPU 空转），有锁编程开销高，但不浪费 CPU，于是 `synchronized` 采用了 **锁升级** 机制，先自旋几次（轻量级锁），还拿不到锁再阻塞（重量级锁）

## 偏向锁

偏向锁假定来竞争资源的 **总是同一个线程**，当线程获得锁后，在 Mark Word 中记下这个线程 id，后续再有线程来的时候，只需要对比 id 是否一致，如果一致则线程直接进入临界区，避免了 CAS（直接比值比 CAS 耗时少）。

但是，偏向锁在 Java15+ 被弃用 [^2]，原因有以下几点：

1. 现代 CPU 执行 CAS 很快，节省的开销不明显
2. 对比 id 时，如果不一致，需要撤销偏向锁，然后才能升级为轻量级锁，撤销操作的成本比较高
3. 符合“一个线程竞争”的场景少

## 轻量级锁

加锁流程如下：

1. 在栈帧中创建一个 Lock Record（每次尝试获取锁都会创建一个）
2. 在 Lock Record 中存储：指向锁对象的指针、锁对象的原始 Mark Word（displaced 字段）
3. 通过 CAS 尝试将 Mark Word 改为指向 Lock Record 的指针
   1. 成功则进入临界区，失败则检查是否是重入
   2. 是重入则，将 displaced 置为 null（后面解锁会用到）， 再进入临界区
   3. CAS 失败并且不是重入则自旋，自旋多次依旧没得到锁就会升级为重量级锁 [^3]

通过 Lock Record 中的对象指针，和对象头中的 Lock Record 指针，使得锁对象和线程互相知道对方的存在。

关于重入判断：

判断是否重入的关键在于，Lock Record 位于 **线程私有** 的栈帧中。因此可以通过 Lock Record 的地址判断其所属线程，从而得知是否是重入。

![轻量级锁的加锁流程|511](pictures/Pasted%20image%2020260823154223.png)

![加锁后的内存结构](pictures/Pasted%20image%2020260823153910.png)

解锁流程如下：

1. 判断是否是重入，是则直接返回
2. 不是重入则 CAS 恢复 Mark Word
3. 操作成功则解锁完成，失败则说明已是重量级锁，走重量级锁的解锁流程

![轻量级锁的解锁流程|462](pictures/Pasted%20image%2020260823155934.png)

## 重量级锁

重量级锁和轻量级锁的关键区别在于，竞争失败后不自旋，而是进入挂起并进入等待队列，解锁时被唤醒再尝试获取锁。

重量级锁的核心是 **ObjectMonitor**，每个 Java 对象都可以关联一个，重量级锁对象的 Mark Word 就是指向 ObjectMonitor 的指针。

ObjectMonitor 类似于 Lock Record 的升级版本，其大致结构如下：

```cpp
class ObjectMonitor {
    _header;        // 保存原始的 Mark Word
    _owner;         // 当前持有锁的线程
    _recursions;    // 重入次数
    _EntryList;     // 阻塞等待获取锁的线程队列
    _WaitSet;       // 调用了 wait() 的线程队列
    _cxq;           // 竞争队列（CAS 失败后先进入这里）
    _succ;          // 继任者线程
}
```

| ObjectMonitor         | 职责                   | Lock Record                           |
| --------------------- | ---------------------- | ------------------------------------- |
| `_header`             | **保存原始 Mark Word** | `_displaced_header`                   |
| `_owner`              | **标识持锁线程**       | Lock Record 在栈上，栈是线程私有的    |
| `_recursions`         | **记录重入次数**       | 通过多个 Lock Record 栈式结构隐式表示 |
| `_EntryList` + `_cxq` | **等待队列**           | 无                                    |
| `_WaitSet`            | **wait/notify 支持**   | 不支持                                |
| `_succ`               | **继任者线程**         | 无                                    |

锁对象头中的 Mark Word 的转换如图：

![](pictures/Pasted%20image%2020260823204044.png)

[^1]: 32 位 JVM 通常为 32 bit，64 位 JVM 通常为 64 bit。

[^2]: Java15 默认禁用，可以手动启用；18 时被标记为 deprecated；21 时彻底移除相关代码。

[^3]: JVM 有自适应自旋策略，自旋次数由 JVM 动态决定而不是固定次数。
