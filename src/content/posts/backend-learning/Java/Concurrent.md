---
title: Java 并发
description: Java 并发编程知识点整理，包含 JMM、线程安全、锁机制等核心概念
pubDatetime: 2026-03-23
tags: ["Java", "后端"]
---

## 多线程
### JMM（Java Memory Model）
JMM 将内存抽象为两个部分：
- **主内存**：所有线程共享，存储共享变量（实例字段、静态变量等）
- **工作内存**：线程私有，线程对所有变量的操作都要在工作内存中进行，**不能直接读写主内存**
并发问题主要体现在：
- 可见性：在工作内存中对变量的操作对其他线程不可见
- 原子性：多个操作互相独立，不是原子的
- 顺序性：编译器或 CPU 可能会为了优化，重排指令
JMM 使用 `volatile` 解决可见性和顺序性，使用 `synchronized` 和 `atomic` 原子类解决原子性
### 线程的创建方式
#### 继承 Thread 类
```java
static class MyThread extends Thread {  
    @Override  
    public void run() {  
        System.out.println("test");  
    }  
}  
public static void main(String[] args) {  
    MyThread t = new MyThread();  
    t.start();  
}
```
#### 实现 Runnable 接口
```java
static class MyRunnable implements Runnable {  
    @Override  
    public void run() {  
        System.out.println("test Runnable");  
    }  
}  
  
public static void main(String[] args) {  
    Thread t = new Thread(new MyRunnable());  
    t.start();  
}
```
#### 实现 Callable 和 FutureTask
```java
static class MyCallable implements Callable<Integer> {  
    @Override  
    public Integer call() throws Exception {  
        return 1;  
    }  
}  
  
public static void main(String[] args) {  
    FutureTask<Integer> task = new FutureTask<>(new MyCallable());  
    Thread t = new Thread(task);  
    t.start();  
    try {  
        Integer result = task.get();  
        System.out.println(result);  
    } catch (InterruptedException | ExecutionException e) {  
        e.printStackTrace();  
    }  
}
```
#### 使用线程池 Executor
```java
public static void main(String[] args) {  
    ExecutorService executor = Executors.newFixedThreadPool(10);  
    for (int i = 0; i < 10; ++i) {  
        int finalI = i;  
        executor.submit(() -> System.out.println(finalI));  
    }  
    executor.close();  
}
```
### `interrupt` 方法的行为
每个线程内部会维护一个 boolean 值，存储「中断状态」，默认为 `false`，当在外部调用 `interrupt` 方法的时候，会修改目标线程的中断状态为 `true`，并根据情况响应：
- 如果线程处于可中断的阻塞状态（`Thread.sleep()` `Thread.join()` `Object.wait()`）会：
  1. 立即唤醒该线程
  2. 抛出 `InterruptedException`
  3. 自动清除中断状态（设置为 `false`）
- 否则仅设置中断状态（如果线程还存活的话），线程内部可以通过轮询 `Thread.currentThread().isInterrutped()` ，获取中断状态来决定是否要中断当前线程
- 如果目标线程已终止，则不会有任何行为
### 线程的状态
![](pictures/Pasted%20image%2020260323115852.png)
- `NEW`：线程已创建，还未调用 `start` 方法
- `RUNNABLE`：`READY` 就绪 + `RUNNING` 运行中，根据系统调度在两个状态间切换
- `BLOCKED`：**等待监视器锁**时，陷入阻塞状态
- `WAITING`：等待其他线程执行特定的操作（`notify` 等）
- `TIMED_WAITING`：指定等待时间的等待状态
- `TERMINATED`：完成执行，终止状态
### `sleep()` 和 `wait()` 的区别
- `sleep()`
  - 调用后会让出 CPU 时间片，线程进入 `TIMED_WATING` 状态
  - 不会释放持有的对象锁（如果有的话）
  - 超时后会自动将线程恢复为就绪状态
- `wait()`
  - 调用后会让出 CPU 时间片，线程进入 `WATING` 状态（如果带超时参数则是 `TIMED_WAITING`）
  - 只能在 `synchronized` 块中调用，调用后会立即释放对象锁
  - 需要其他线程调用相同对象锁的 `notify()` 才会被唤醒
### `BLOCKED` 和 `WAITING` 的区别
- `BLOCKED`
  - 线程竞争锁失败后，自动进入 `BLOCKED` 状态，是被动触发的
  - 如果竞争成功，则可以进入 `RUNNABLE` 状态
- `WAITING`
  - 等待其他线程操作，进入 `WAITING` 状态，是人为触发的
  - 由其他线程调用对象锁的 `notify` 方法（或者其他唤醒方法）才会被唤醒

## 线程池
### 线程池的使用
```java
ThreadPoolExecutor threadPool = new ThreadPoolExecutor(
    corePoolSize, // 核心线程数 线程池长期维持的最小线程数
    corePoolSize * 2, // 最大线程数 线程池能容纳的最多线程数
    60L, // 空闲线程存活时间 超过核心线程数的空闲线程 多久后销毁
    TimeUnit.SECONDS, // 存活时间单位
    new ArrayBlockingQueue<>(100), // 任务阻塞队列 核心线程忙时 新任务存这里
    Executors.defaultThreadFactory(), // 线程创建工厂 用于设置线程名 优先级等
    new ThreadPoolExecutor.AbortPolicy() // 拒绝策略 队列满且线程数达最大时 如何处理新任务
);

// 提交任务的两种方式和之前一致 这里用execute提交Runnable（无返回值 不能捕获异常）
threadPool.execute(() -> {
    // 函数式接口，如果有返回值就是Callable类，没有就是Runnable类
});

// 关闭线程池 推荐用shutdown 等待已提交任务完成后再关闭
threadPool.shutdown();
// 若需要强制关闭 可调用shutdownNow 会中断正在执行的任务 返回未执行的任务
// List<Runnable> unExecutedTasks = threadPool.shutdownNow();
```

### 线程池的工作流程
![](pictures/Pasted%20image%2020260421193027.png)
1. 判断线程数是否到达核心数，未到达则直接创建新的**核心线程**，反之将任务加入**等待队列**
2. 判断队列是否已满，如果未满则放入，已满则创建**非核心线程**
3. 判断线程数是否达到**最大线程数**，如果未到达则创建**非核心线程**，反之则**根据策略拒绝任务**

### 线程池的参数
```java
public ThreadPoolExecutor(
    int corePoolSize,
    int maximumPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,
    RejectedExecutionHandler handler
)
```

### 拒绝策略
- `CallerRunsPolicy`: 使用线程池的调用者所在的线程去执行被拒绝的任务，除非线程池被停止或者线程池的任务队列已有空缺。
- `AbortPolicy`: 直接抛出一个任务被线程池拒绝的异常。
- `DiscardPolicy`: 不做任何处理，静默拒绝提交的任务。
- `DiscardOldestPolicy`: 抛弃最老的任务，然后执行该任务。
- 自定义拒绝策略，通过实现接口可以自定义任务拒绝策略。

### 线程池的种类
- `ScheduledThreadPool`：可以设置定期的执行任务，它支持定时或周期性执行任务，比如每隔 10 秒钟执行一次任务，我通过这个实现类设置定期执行任务的策略。
- `FixedThreadPool`：它的核心线程数和最大线程数是一样的，所以可以把它看作是固定线程数的线程池，它的特点是线程池中的线程数除了初始阶段需要从 0 开始增加外，之后的线程数量就是固定的，就算任务数超过线程数，线程池也不会再创建更多的线程来处理任务，而是会把超出线程处理能力的任务放到任务队列中进行等待。需要特别注意的是：**它使用的是无界的 `LinkedBlockingQueue`（容量 Integer. MAX_VALUE）**，在任务消费速度跟不上生产速度时，队列会无限堆积，最终可能导致 OOM——这也是阿里手册禁止直接使用 `Executors.newFixedThreadPool()` 的主要原因。
- `CachedThreadPool`：可以称作可缓存线程池，它的特点在于线程数理论上没有上限（`maximumPoolSize` 被设置为 `Integer.MAX_VALUE`），当线程闲置 60 秒后会被回收。它使用 `SynchronousQueue` 作为工作队列，容量为 0，只负责对任务进行中转和传递，每来一个任务若无空闲线程就会立即创建新线程。**在高并发瞬时大量任务提交的场景下，CachedThreadPool 会快速创建成百上千的线程，很可能直接把系统资源耗尽导致 OOM**，这也是阿里手册禁止使用它的核心原因，生产环境请手动 new `ThreadPoolExecutor` 并显式约束最大线程数。
- `SingleThreadExecutor`：它会使用唯一的线程去执行任务，原理和 FixedThreadPool 是一样的，只不过这里线程只有一个，如果线程在执行任务的过程中发生异常，线程池也会重新创建一个线程来执行后续的任务。这种线程池由于只有一个线程，所以非常适合用于所有任务都需要按被提交的顺序依次执行的场景，而前几种线程池不一定能够保障任务的执行顺序等于被提交的顺序，因为它们是多线程并行执行的。
- `SingleThreadScheduledExecutor`：它实际和 ScheduledThreadPool 线程池非常相似，它只是 ScheduledThreadPool 的一个特例，内部只有一个线程。

