---
title: JVM 内存分区
description: 梳理 JVM 各内存分区的作用、栈帧结构、方法区与堆的基本原理
pubDatetime: 2026-08-21
slug: jvm-memory-areas
tags: ["Java", "后端", "JVM"]
---

## 引言

JVM 内存分区的本质是，将一段连续的内存抽象为不同作用的内存分区，包含以下分区：

线程隔离数据：

- 程序计数器：记录当前线程下一条需要运行的字节码指令的地址
- 虚拟机栈：调用 Java 方法时，创建一个栈帧记录方法信息，栈帧入栈
- 本地方法栈

线程共享数据：

- 方法区
- 堆

![](pictures/Pasted%20image%2020260821125946.png)

## 虚拟机栈

### 一个栈帧包含了什么

调用 Java 方法时，创建一个栈帧记录方法信息，栈帧入栈。

一个栈帧主要包含以下内容：

- **局部变量表**：存储了方法参数和内部定义的局部变量
- **操作数栈**：方法的调用参数、中间计算结果
- **动态链接**：每个类加载后都会在方法区创建一个自己的运行时常量池，栈帧中的动态链接存储一个引用，指向该运行时常量池
- **方法返回地址**：方法执行结束后需要跳转的目标指令地址。在一个方法调用前，就会将下一条指令的地址存入新栈帧的方法返回地址。

函数返回时，需要将局部变量表中需要返回的值，复制到上一个栈帧的操作数栈中。

JVM 为了优化，让操作数栈在栈帧的顶部，局部变量表在栈帧的底部，将两个栈帧重叠一部分，在函数返回时能复用一部分空间，如图：

![局部变量表和操作数栈部分重叠](pictures/Pasted%20image%2020260821144032.png)

### 调用函数时发生了什么

> [!note] 提醒
> 下面的代码、文字讲解、图，要三者结合起来看

```java file="Test.java"
Class Test {
    void test() { // 1. test 栈帧入栈

        // 2. 在堆中分配 Dog 对象，对象地址存入局部变量表中的 animal
        Animal animal = new Dog();

        /*
        3. 将 animal 变量中存的对象地址，推入操作数栈
        4. speak 是实例方法，所以开始动态解析：从栈帧的动态链接找到当前类的运行时常量池，并从中找到 speak 方法的符号引用
        5. 从操作数栈中弹出对象地址，根据地址从堆中找到 Dog 对象，根据 Dog 对象内部的类型指针找到方法区中 Dog 类的类信息
        6. 在 Dog 类的 vtable 中找到 speak 方法的直接引用
        7. 使用直接引用调用 speak 方法，创建 speak 栈帧并入栈
        */
        animal.speak();
    }
}
```

以上面这段代码中执行 `test` 为例，Animal 是抽象类，Dog 是具体实现类，发生以下事件，和下文的图一起看

1. test 栈帧入栈
2. 在堆中分配 Dog 对象（如果 Dog 类还未加载需要加载，加载时会将类信息存入方法区，），对象地址存入局部变量表中的 animal
3. 将 animal 变量中存的对象地址，推入操作数栈
4. speak 是实例方法，所以开始动态解析：从栈帧的动态链接找到当前类的运行时常量池，并从中找到 speak 方法的符号引用
5. 从操作数栈中弹出对象地址，根据地址从堆中找到 Dog 对象，根据 Dog 对象内部的类型指针找到方法区中 Dog 类的类信息
6. 在 Dog 类的 vtable 中找到 speak 方法的直接引用
7. 使用直接引用调用 speak 方法，创建 speak 栈帧并入栈

![](pictures/Pasted%20image%2020260821182359.png)

![](pictures/Pasted%20image%2020260821182004.png)

## 方法区

方法区在 Java8 及之前，为了复用代码，使用「**永久代**」作为方法区的实现，后来工程师们意识到永久代有以下问题：

1. 永久代可以通过参数来设定大小，永久代过小可能会出现内存溢出，太大可能会空间浪费
2. 永久代的复杂设计并不是方法区所需要的，会带来一系列问题

Java9+ 使用「**元空间**」作为方法区的实现

### 字节码中的常量池

编译出来的 class 文件可以通过 javap 命令反编译得到可读性较好的字节码，以 `javac -g .\Test.java && javap -c -v .\Test.class` 为例，字节码文件包含以下部分（从上到下）：

- 文件信息

```class file="Test.class"
Classfile /C:/Users/v1hz/Programs/proj/java/LearnJvm/src/main/java/com/v1hz/learnjvm/Test.class
  Last modified 2026年8月21日; size 704 bytes
  SHA-256 checksum 2dd688dd5fd52dd30dd84e390bc8fa6ac5d6526249a467d3719f302204b89722
  Compiled from "Test.java"
```

- 类信息

```class file="Test.class"
public class com.v1hz.learnjvm.Test
  minor version: 0
  major version: 65
  flags: (0x0021) ACC_PUBLIC, ACC_SUPER
  this_class: #8                          // com/v1hz/learnjvm/Test
  super_class: #2                         // java/lang/Object
  interfaces: 0, fields: 1, methods: 3, attributes: 1
```

- 常量池

```class file="Test.class"
Constant pool:
   #1 = Methodref          #2.#3          // java/lang/Object."<init>":()V
   #2 = Class              #4             // java/lang/Object
   #3 = NameAndType        #5:#6          // "<init>":()V
   #4 = Utf8               java/lang/Object
   #5 = Utf8               <init>
   #6 = Utf8               ()V
   #7 = Fieldref           #8.#9          // com/v1hz/learnjvm/Test.count:I
   #8 = Class              #10            // com/v1hz/learnjvm/Test
   #9 = NameAndType        #11:#12        // count:I
```

- 字段信息和方法信息

```class file="Test.class"
{
  // 字段信息
  int count;
    descriptor: I
    flags: (0x0000)

  // 方法信息
  public com.v1hz.learnjvm.Test(); // 构造函数
    descriptor: ()V
    flags: (0x0001) ACC_PUBLIC
    Code:
      stack=2, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: aload_0
         5: iconst_0
         6: putfield      #7                  // Field count:I
         9: return
      LineNumberTable:
        line 14: 0
        line 16: 4
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      10     0  this   Lcom/v1hz/learnjvm/Test;
}
```

### 运行时常量池

方法区中的运行时常量池包含以下内容：

1. 编译期间产生的，通过加载字节码中的静态信息得到的数据，比如：字节码生成的 Class 对象、常量池
2. 运行期间产生的，JVM 开发者可以将必要的数据都放进去，比如：运行时解析得到的直接引用、字符串常量池等

方法区内的数据一般需要长期稳定使用，其垃圾回收往往不需要关注，但是垃圾回收是会发生的。

## 堆

一般从垃圾回收的角度对堆进行划分
