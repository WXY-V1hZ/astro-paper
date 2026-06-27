---
title: Java 基础
description: Java 面试基础知识整理，包含面向对象、包装类、String、反射等核心概念
pubDatetime: 2026-03-21
slug: java-basics
tags: ["Java", "后端"]
---

- **面向对象三大特性**：封装、继承、多态，尤其是多态的几种体现形式、重载和重写的区别，这类题看起来基础，但很多人答得很浅，容易被追问到哑口无言。
- **int 和 Integer**：为什么要有包装类、自动装箱拆箱的原理、Integer 的缓存机制（-128 到 127），这条线问得很频繁，而且很容易出坑。
- **String、StringBuffer、StringBuilder**：三者的区别和适用场景，以及 String 不可变性的原理，这是一道老题，但每次还是会问。
- **equals 和 hashCode**：为什么要配套重写、不重写会有什么问题，在 HashMap 和 HashSet 里的影响，这个很多人只知道结论，答不出背后的原因。
- **Java 8 新特性**：Lambda 表达式、Stream API、Optional，这些在实际开发里用得很多，面试里也经常问。
- **反射机制**：是什么、怎么用、实际应用在哪里（Spring 的 IOC 就是典型），这块理解清楚了对后面学框架原理很有帮助。
## 数据结构
### 包装类的作用

### `Integer` 的缓存机制

## 面向对象
### 多态
- **方法重载**
- **方法重写**
- **接口**：接口引用可以指向一个**实现了该接口的类的实例**，例如 `Animal` 是一个接口，`Dog` 实现了这个接口，就可以 `Animal a = new Dog()`
- **类之间的上下转型**：父类类型的引用可以指向子类的实例，是子类隐式的向父类的「向上转型」；父类也可以向子类进行「向下转型」但是可能会出错，需要使用 `instanceof` 检查
### 面向对象的设计原则
- **单一职责**：一个类只负责一个职责
- **开放封闭**：对扩展开放，对修改封闭
- **里氏替换**：子类能够替换所有的父类
- **接口隔离**：一个类不应该依赖不需要的接口
- **依赖倒置**：高层模块不应该依赖底层模块，应该都依赖抽象
- **最少知识**：一个类对其他类的了解应该尽可能少，只与自己的成员交互
## 关键字
### `static`
1. 静态变量
2. 静态方法
3. 静态内部类
4. 静态代码块

> [!note] 静态代码块和构造器的执行顺序
> 1. 父类静态代码块
> 2. 子类静态代码块
> 3. 父类实例代码块
> 4. 父类构造器
> 5. 子类实例代码块
> 6. 子类构造器

### `final`
- final 类无法被继承
- final 方法无法被重写
- final 变量无法被修改（不可指向其他对象，指向的对象本身可以被修改）

## 深拷贝和浅拷贝
浅拷贝只拷贝目标对象的值，深拷贝则会复制目标对象内部所有的引用字段的内容
![](pictures/Pasted%20image%2020260321185937.png)
### 深拷贝的实现方式
#### 实现 `Cloneable` 接口
```java
class A implements Cloneable {  
    private String a;  
    private B b;  
    @Override  
    protected Object clone() throws CloneNotSupportedException {  
        A cloned = (A) super.clone(); // 默认的clone行为是浅拷贝  
        cloned.b = (B) b.clone();  
        return cloned;  
    }  
}  
  
class B implements Cloneable {  
    private String b;  
    @Override  
    protected Object clone() throws CloneNotSupportedException {  
        return super.clone();  
    }  
}
```
#### 实现 `Serializable` 接口
```java
class A {  
    private String a;  
    private B b;  
  
    public A deepCopy() {  
        try (  
                ByteArrayOutputStream bos = new ByteArrayOutputStream();  
                ObjectOutputStream oos = new ObjectOutputStream(bos);  
                ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());  
                ObjectInputStream ois = new ObjectInputStream(bis)  
        ) {  
            oos.writeObject(this);  
            oos.flush();  
            oos.close();  
            return (A) ois.readObject();  
        } catch (Exception e) {  
            e.printStackTrace();  
            return null;  
        }  
    }  
}  
  
class B {  
    private String b;  
}
```
#### 手动递归拷贝
```java
class A {  
    private String a;  
    private B b;  
  
    public A deepCopy() {  
        A cloned = new A();  
        cloned.b = b.deepCopy();  
        return cloned;  
    }  
}  
  
class B {  
    private String b;  
    public B deepCopy() {  
        B cloned = new B();  
        cloned.b = this.b;  
        return cloned;  
    }  
}
```
## 反射
![](pictures/Pasted%20image%2020260321193621.png)
当类第一次被「主动使用」时，JVM 会加载该类，并在堆区创建**唯一的** Class 对象，存储该类的元数据 (类名、父类、接口、字段、方法等结构信息)，反射则通过这个 Class 对象实现**反向控制实例对象的能力**

> 这个 Class 对象就像是类的在镜子中的镜像，所以称为反射 (reflect)

## 注解
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotataion {
    String value(); // 使用空参接口表示注解的属性
}
```
- `@Target`：传入的 `ElementType` 是一个枚举，表示注解的作用对象
- `@Retention`：传入的 `RetentionPolicy` 是一个枚举，表示注解的作用域，
  - `SOURCE`：只作用于编译期前，编译后即消失
  - `CLASS`：编译后会写入字节码，但无法通过反射获取
  - `RUNTIME`：能通过反射获取，能在运行时存在

> [!note] 通过反射获取注解时
> - 当注解的作用域是 `RUNTIME` 时能够通过反射获取该注解
> - JVM 会动态创建一个注解的实现类，生成一个动态代理，
> - 该动态代理内有一个 `AnnotationInvocationHandler`，
> - 这个 handler 中的 map `memberValues` 中存储着注解的属性，
> - 例如对于 `@TestAnnotation(value = "test")` 就会存储 `("value", "test")` 的键值对

## 异常
- 错误（Error）
  错误一般是运行环境错误导致的，当出现 Error 时程序（至少当前线程）应该直接终止
- 异常（Exception）
    - 运行时异常（非受检异常）
      通常是程序逻辑错误，不需要强制捕获
    - 非运行时异常（受检异常）
      通常是外部错误，这类异常必须被处理，也就是被捕获或抛出

## Object 类方法
- `equals`：默认实现和 `==` 一样，比较两个对象的内存地址值
- `hashCode`：必须和 `equals` 一起重写
- `toString`：默认返回@+对象的哈希码十六进制表示
- `getClass`：不能重写，返回运行时的实际类对象
- `clone`：默认是浅拷贝，可以重写实现深拷贝
- `notify` `notifyAll`：只能用于 `synchronized` 块，唤醒等待的线程（前者随机唤醒，后者唤醒所有等待线程）
- `wait`：只能用于 `synchronized` 块，会让当前持有锁对象的线程「释放锁并进入等待」

> [!note] `equals` 和 `hashCode`
> java 中约定：
> 当 `a.equals(b)` 为 `true` 时，`a.hashCode() == b.hashCode()` 一定为 `true`
> 当 `a.hashCode() == b.hashCode()` 为 `true` 时，`a.equals(b)` 不一定为 `true`
> 
> 如果只重写 `equals` 方法，当 `a.equals(b)` 为 `true` 而 `a.hashCode() == b.hashCode()` 为 `false` 时两个对象会被当成不同的元素放入集合

## 设计模式
### 单例模式
#### 饿汉式
通过静态变量实现，类加载时初始化一个静态实例，后续获取时都返回这个实例
```java
public class Singleton {  
    private static final Singleton INSTANCE = new Singleton();  
    public Singleton getInstance() {  
        return INSTANCE;  
    }  
}
```
#### 懒汉式
```java
public class Singleton {  
    private static volatile Singleton instance;  // volatile确保变量对其他线程的可见性同时阻止指令重排
    public static Singleton getInstance() {  
        if (instance == null) {  // 第一次检查，只有实例未初始化才加锁
            synchronized (Singleton.class) {  
                if (instance == null) {  // 第二次检查，确保只有实例未初始化的时候才创建实例
                    instance = new Singleton();  
                }  
            }  
        }  
        return instance;  
    }  
}
```

> [!note] 多线程共享缓存与 `volatile`
> `static` 变量存放在 JVM 的「方法区」，这部分内存在多个线程之间共享（主内存），每个线程会将自己需要的数据从主内存读取、保存到自己的缓存，所以如果只修改缓存内的数据，数据的更新对其他线程**不可见**，为了解决这个问题，Java 提供了 `volatile` 关键字，被 `volatile` 修饰的变量有以下特性：
> 1. 写操作：通过「内存屏障」确保修改完成后，使其他 CPU 核心中该变量的缓存行失效
> 2. 读操作：确保能读取到最新值，最新值可能来自主内存，也可能来自其他 CPU 缓存（通过缓存一致性协议实现）
> 
> 最终达到的效果就是所谓的「 `volatile` 修饰的变量对其他线程可见」

### 适配器模式+策略模式
例如对接多个支付服务，使用适配器模式封装第三方服务，使用策略模式来动态选择不同的服务
```java
// 1. 统一目标接口（我们定义的）
public interface PaymentService {
    boolean pay(String orderId, BigDecimal amount);
}

// 2. 适配器：封装支付宝
public class AlipayAdapter implements PaymentService {
    private final AlipayClient client = new AlipayClient(); // 第三方SDK
    
    @Override
    public boolean pay(String orderId, BigDecimal amount) {
        // 转换参数、调用支付宝SDK、处理返回值...
        return "success".equals(client.execute(orderId, amount.doubleValue()));
    }
}

// 3. 策略上下文
public class PaymentContext {
    private PaymentService strategy;
    
    public void setPaymentMethod(PaymentService method) {
        this.strategy = method; // 注入具体适配器
    }
    
    public void processPayment(String orderId, BigDecimal amount) {
        strategy.pay(orderorderId, amount); // 执行
    }
}
```
### 责任链模式
```java
// 请求上下文
class Request {
    private boolean loggedIn;
    private String role;
    private int requestCount;
    // 构造函数、getter 省略...
    public Request(boolean loggedIn, String role, int count) {
        this.loggedIn = loggedIn; this.role = role; this.requestCount = count;
    }
    public boolean isLoggedIn() { return loggedIn; }
    public String getRole() { return role; }
    public int getRequestCount() { return requestCount; }
}

// 抽象处理者
abstract class AuthHandler {
    protected AuthHandler next;

    public void setNext(AuthHandler next) {
        this.next = next;
    }

    public abstract boolean handle(Request req);
}

// 1. 登录态校验
class LoginHandler extends AuthHandler {
    @Override
    public boolean handle(Request req) {
        if (!req.isLoggedIn()) {
            System.out.println("❌ 未登录");
            return false;
        }
        System.out.println("✅ 登录态校验通过");
        return next != null ? next.handle(req) : true;
    }
}

// 2. 权限校验
class PermissionHandler extends AuthHandler {
    @Override
    public boolean handle(Request req) {
        if (!"admin".equals(req.getRole())) {
            System.out.println("❌ 无管理员权限");
            return false;
        }
        System.out.println("✅ 权限校验通过");
        return next != null ? next.handle(req) : true;
    }
}

// 3. 频率限制
class RateLimitHandler extends AuthHandler {
    @Override
    public boolean handle(Request req) {
        if (req.getRequestCount() > 5) {
            System.out.println("❌ 请求过于频繁");
            return false;
        }
        System.out.println("✅ 频率校验通过");
        return next != null ? next.handle(req) : true;
    }
}

// 客户端：动态组装链
public class ChainDemo {
    public static void main(String[] args) {
        // 场景1: 普通用户查询信息 → 登录 + 权限（但非 admin）
        AuthHandler chain1 = new LoginHandler();
        chain1.setNext(new PermissionHandler());
        System.out.println("=== 场景1: 普通用户 ===");
        chain1.handle(new Request(true, "user", 1)); // 应该失败

        // 场景2: 管理员删除操作 → 登录 + 权限 + 频率
        AuthHandler chain2 = new LoginHandler();
        chain2.setNext(new PermissionHandler());
        chain2.getNext().setNext(new RateLimitHandler());
        System.out.println("\n=== 场景2: 管理员高频请求 ===");
        chain2.handle(new Request(true, "admin", 10)); // 应该因频率失败
    }
}
```

## I/O
- BIO (Blocking I/O)：读写操作完成前，线程会一直阻塞
- NIO (Non-Blocking I/O)：多路复用的、同步非阻塞的 I/O
- AIO (Asynchronous I/O)：基于事件和回调机制实现的异步 I/O
### NIO 的实现原理（I/O 多路复用）
NIO 的实现基于「I/O 多路复用」，分为多种机制：`select` `poll` `epoll`，
#### `select` 和 `poll`
- 在用户态会创建连接的文件描述符 fd，然后传给内核，调用 `select` 或 `poll` 时，内核会遍历一次所有的 fd，返回所有就绪的 fd
- `select` 和 `poll` 的区别在于：前者从用户态传给内核的 fd 数量是有限的，后者则没有
#### `epoll`
1. `epoll_create` 会申请两个内存，分别存储红黑树和双向链表
2. `epoll_ctl` 将所有 fd 注册到红黑树，并为每个 fd 设置回调函数
3. `epoll_wait` 会阻塞地等待连接：当 fd 就绪时，内核的终端处理程序会触发回调函数，回调函数会将 fd 加到双向链表，然后由 `epoll_wait` 从中取出 fd
#### Java 的封装
- Java 将 I/O 多路复用的三种机制封装为了 `Selector`，由 JVM 自动选择最优实现
- 文件描述符被封装为 `SelectableChannel(ServerChannel/SocketChannel)`
- 注册事件被封装为 `SelectionKey`
```java
public class NIOServer {  
    public static void main(String[] args) throws IOException {  
        Selector selector = Selector.open();  
        ServerSocketChannel channel = ServerSocketChannel.open(); // 监听TCP连接请求的服务端通道  
        channel.socket().bind(new InetSocketAddress("localhost", 8080));  
        channel.configureBlocking(false);  
        channel.register(selector, SelectionKey.OP_ACCEPT); // 从监听可连接事件开始  
        while(true) {  
            selector.select(); // 底层调用 epoll_wait            
            Set<SelectionKey> selectedKeys = selector.selectedKeys(); // 获取所有就绪的文件描述符  
            Iterator<SelectionKey> iterator = selectedKeys.iterator();  
            while(iterator.hasNext()) {  
                SelectionKey key = iterator.next();  
                iterator.remove();  
                if (key.isAcceptable()) {  
                    // 得到可连接事件后，连接客户端，开始监听可读事件  
                    SocketChannel socketChannel = channel.accept(); // 已建立连接的数据通道  
                    socketChannel.configureBlocking(false);  
                    socketChannel.register(selector, SelectionKey.OP_READ);  
                } else if (key.isReadable()) { // 有可读事件，读取数据  
                    SocketChannel socketChannel = (SocketChannel) key.channel(); // 获取已连接的通道  
                    ByteBuffer buffer = ByteBuffer.allocate(1024);  
                    socketChannel.read(buffer);  
                    System.out.println(new String(buffer.array()));  
                    socketChannel.close();  
                }  
            }  
        }  
    }  
}
```

