---
title: AQS 与 JUC 常见组件
description: 从 AQS 的设计目标出发，梳理其状态管理与 FIFO 等待队列机制，并分析 ReentrantLock 公平/非公平锁、以及 CountDownLatch 等 JUC 组件是如何基于 AQS 实现的。
pubDatetime: 2026-08-24
slug: java-aqs-and-juc-components
tags:
  - Java
  - 后端
  - JUC
---

## AQS

首先明确我们希望构建出怎样的同步器：

1. **状态管理**：下游可以自由定义同步状态，以此实现多种同步逻辑，比如可重入、独占/共享等
2. **等待队列**：锁被占用时，后来的线程需要休眠并排队等待
3. **主动唤醒**：锁释放后，应该主动唤醒等待队列中的线程

AQS 在以上基础上还提供：

1. **中断机制**：支持在等待锁时响应中断信号，实现应用的优雅退出或任务取消
2. **超时机制**：防止线程无限期阻塞，导致请求积压

AQS 通过一个锁状态和一个 FIFO 队列（双向链表）来管理多线程的同步状态。

AQS 的非静态成员变量如下：

```java file="AbstractQueuedSynchronizer.java"
private transient volatile Node head;  // 队列头节点哨兵
private transient volatile Node tail;  // 队列尾节点哨兵
private volatile int state;            // 同步状态
```

其中 `Node` 表示一个正在等待的线程，其结构如下：

```java file="AbstractQueuedSynchronizer.java"
abstract static class Node {
    volatile Node prev;  // 前驱节点
    volatile Node next;  // 后继节点
    Thread waiter;       // 指向一个等待线程
    volatile int status; // 节点状态
    // ......省略了后续的方法
}
```

AQS 提供了 `tryAcquire` 方法供下游自定义获取锁的逻辑，在 `acquire` 中调用 `tryAcquire` 并封装等待队列的逻辑。

```java file="AbstractQueuedSynchronizer.java"
// 子类必须重写 tryAcquire 方法
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}

// 尝试获取锁，如果获取失败，则调用封装好的等待队列的逻辑
public final void acquire(int arg) {
    if (!tryAcquire(arg))
        acquire(null, arg, false, false, false, 0L);
}

// 包私有方法
final int acquire(
        Node node,             // 队列中的线程节点
        int arg,               // 请求参数
        boolean shared,        // 共享锁
        boolean interruptible, // 是否可中断
        boolean timed,         // 是否需要超时
        long time
) {
    //...
}
```

- `tryAcquire` 表示希望只尝试获取一次锁，如果失败则立即返回 false
- `acquire` 表示尝试获取锁，如果失败则等待，内部会调用 `tryAcquire`

**总结**：

- 通过重写 `tryAcquire` 方法，在内部编写 `state` 的变化逻辑做到 **状态管理**
- AQS 在向外提供一个 `final acquire` 方便下游调用，并在包私有的 `acquire` 中封装 **队列、唤醒、中断、超时、共享** 相关的逻辑

## ReentrantLock

`ReentrantLock` 的结构如下

```java file="ReentrantLock.java"
public class ReentrantLock implements Lock, java.io.Serializable {

    abstract static class Sync extends AbstractQueuedSynchronizer {
        // 内部类，继承AQS
    }
    static final class NonfairSync extends Sync {
        // 非公平锁
    }
    static final class FairSync extends Sync {
        // 公平锁
    }
    private final Sync sync; // 唯一的成员变量，内置锁相关逻辑

    // 根据传入的 bool 判断用哪个锁
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }

    public void lock() {
        sync.lock();
    }
    public void unlock() {
        sync.release(1);
    }
    // ...
}
```

AQS 中的 `state` 在 `ReentrantLock` 中的定义为「重入次数」。

内部定义了一个同步器 `Sync` 及其两个子类 `FairSync` `NonfairSync`，两个子类内部重写了 `tryAcquire` 方法并实现了重入相关逻辑，以 `NonfairSync` 为例：

```Java file="ReentrantLock.java"
abstract static class Sync extends AbstractQueuedSynchronizer {
    final void lock() {  
        if (!initialTryLock())  // 尝试快速获取锁，如果失败再走 AQS 的逻辑
            acquire(1);  
    }
}
static final class NonfairSync extends Sync {

    final boolean initialTryLock() {
        Thread current = Thread.currentThread();
        if (compareAndSetState(0, 1)) { // 先假设 state == 0，直接 CAS
            setExclusiveOwnerThread(current); // 保存 owner 为当前线程
            return true;
        } else if (getExclusiveOwnerThread() == current) { // owner 就是当前线程，说明重入
            int c = getState() + 1;
            if (c < 0) // c 是 int 类型，为负数说明溢出了
                throw new Error("Maximum lock count exceeded");
            setState(c);
            return true;
        } else
            return false;
    }

    // 先执行 initialTryLock，然后才在 acquire 内部被调用
    protected final boolean tryAcquire(int acquires) {
        // 只在第一次进入锁时设置 owner
        if (getState() == 0 && compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(Thread.currentThread());
            return true;
        }
        return false;
    }
}
```

关于公平锁/非公平锁，二者的差距很小：

```java file="ReentrantLock.java"
// FairSync 的 tryAcquire
protected final boolean tryAcquire(int acquires) {  
    if (getState() == 0 && !hasQueuedPredecessors() &&  // 判断队列中是否有正在等待的线程
        compareAndSetState(0, acquires)) {  
        setExclusiveOwnerThread(Thread.currentThread());  
        return true;  
    }  
    return false;  
}
```

`FairSync` 和 `NonfairSync` 的差距只有一行，公平锁先判断等待队列中是否有线程，如果没有才争抢，如果有则直接失败。

## CountDownLatch

先看 `CountDownLatch` 的用法：

```java file="Main.java"
public static void main(String[] args) throws InterruptedException {  
    int n = 10; // 有 10 个前置任务  
    CountDownLatch latch = new CountDownLatch(n);  // 创建一个 latch，目标是完成十个任务  
    for (int i = 0; i < 10; ++i) {  
        int num = i;  
        Thread task = new Thread(() -> {  
            System.out.println(num);  
            latch.countDown(); // 完成一个任务  
        });  
        task.start();  
    }  
    boolean success = latch.await(5, TimeUnit.SECONDS);  // 等待所有任务完成，5 秒超时  
    System.out.println(success);  
}
```

`CountDownLatch` 一样包含一个继承 AQS 的子类 `Sync`，内部重写了 `tryAcquireShared` 和 `tryReleaseShared`