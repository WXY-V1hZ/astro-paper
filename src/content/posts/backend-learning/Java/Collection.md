---
title: Java 集合
description: Java 集合框架的知识点整理，包含 List、Set、Map 等核心接口与实现
pubDatetime: 2026-03-21
slug: java-collection
tags: ["Java", "后端"]
---

## List

### LinkedList 和 ArrayDeque 的区别

二者都实现了 `Deque` 接口，但底层数据结构并不一样：

- `LinkedList`：
  1. 底层使用双向链表实现，随机访问的复杂度是 $O(n)$
  2. 节点分散在堆中，缓存局部性差
  3. 允许存 null
- `ArrayDeque`：
  1. 底层使用循环数组，动态扩容，随机访问的复杂度是 $O(1)$
  2. 元素连续存储，缓存友好
  3. 不允许存 null，尝试 `push(null)` 会抛出 `NullException`
  4. **更适合作为栈使用**

### `Collections.synchronizedList` 如何让普通 list 线程安全

`synchronizedList` 会返回一个内部类 `SynchronizedList/SynchronizedRandomAccessList`，内部对所有的 public 方法加 `synchronized`，锁对象为 this 或者可以传入自定义锁

### ArrayList 扩容机制

当元素个数达到容量上限时，会触发扩容操作：

1. 计算新的容量，扩容为原容量的 1.5 倍
2. 根据新容量创建数组
3. 将原数组中的元素复制到新数组中
4. 更新 ArrayList 内部引用到新数组

## Set

`HashSet`：不保证顺序
`TreeSet`：可以自定义排序顺序
`LinkedHashSet`：只保证插入顺序

```java
import java.util.TreeSet;
import java.util.Comparator;

public class SetSortDemo {
    // 1. 基本类型/字符串（自然排序）
    public static void testTreeSetBasic() {
        TreeSet<Integer> numSet = new TreeSet<>();
        numSet.add(3);
        numSet.add(1);
        numSet.add(2);
        // 遍历输出：1 2 3（自动按自然顺序升序）
        for (Integer num : numSet) {
            System.out.print(num + " ");
        }
    }

    // 2. 自定义对象（实现Comparable接口）
    static class User implements Comparable<User> {
        private String name;
        private int age;

        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }

        // 重写compareTo，按年龄升序排序
        @Override
        public int compareTo(User o) {
            return this.age - o.age;
        }

        @Override
        public String toString() {
            return name + ":" + age;
        }
    }

    // 3. 自定义对象（传入Comparator，按年龄降序）
    public static void testTreeSetCustom() {
        TreeSet<User> userSet = new TreeSet<>(new Comparator<User>() {
            @Override
            public int compare(User u1, User u2) {
                return u2.age - u1.age; // 降序
            }
        });
        userSet.add(new User("张三", 20));
        userSet.add(new User("李四", 25));
        userSet.add(new User("王五", 22));
        // 遍历输出：李四:25 王五:22 张三:20（按年龄降序）
        for (User user : userSet) {
            System.out.println(user);
        }
    }

    // 4. LinkedHashSet：保留添加顺序（不按值排序）
    public static void testLinkedHashSet() {
        LinkedHashSet<String> strSet = new LinkedHashSet<>();
        strSet.add("b");
        strSet.add("a");
        strSet.add("c");
        // 遍历输出：b a c（和添加顺序一致）
        for (String str : strSet) {
            System.out.print(str + " ");
        }
    }
}
```

## Map

### HashMap 实现原理

- 使用哈希算法将元素映射到数组的槽位上
- 当哈希冲突时，以链表的形式存储在同一个槽位上，查询时遍历链表
- 当链表元素**大于 8 个时且数组长度大于 64 时**将链表转换为**红黑树**，数量减至**少于 6 时**，换回**链表**

### 哈希冲突的解决方法

- **链接法**：将冲突的元素以链表的形式存储在同一个槽位上
- **开放寻址法**：在哈希表中寻找一个可用的位置
  - 线性探测
  - 二次探测
  - 双重散列
- **再哈希法**：使用另一个哈希函数计算哈希值，知道找到不冲突的位置
- **扩容**：当哈希冲突过多时，扩容哈希桶，重新分配键值对

### 扩容机制

HashMap 的初始容量为 16

1. 如果元素个数超过了 `总容量 * 负载因子` 就会触发扩容（负载因子默认为 **0.75**），如果哈希冲突的**链表长度大于 8 而元素个数还没超过 64** 也会触发扩容
2. 先将哈希表的容量扩展两倍，然后将旧哈希表中的元素放到新的哈希表中
   > [!note] 哈希表的容量为什么必须是二的幂次？—— 对二的幂取模和与运算
   > 一个位运算恒等式：$x~mod~2^n~=~x~\&~2^n~-~1$
   > 所以对于一个哈希值 $x$，原容量 $2^n$，新容量 $2^(n + 1)$
   > 考虑 $x$ 在原容量最高位对应的位置，
   > 如果为 $0$ 则 $新位置=原位置$
   > 如果为 $1$ 则 $新位置=原位置+原容量$

### ConcurrentHashMap 实现原理

#### 基本结构

- 底层采用 **数组 + 链表/红黑树** 结构（与 `HashMap` 相同）。
- **取消 JDK 1.7 的 Segment 分段锁**，改用更细粒度的并发控制。

#### 线程安全机制

通过 **CAS + synchronized** 组合实现高效并发：

1. **初始化 table**：使用 `volatile` + `CAS` 安全地创建底层数组。
2. **插入新节点到空桶**：直接使用 `CAS` 设置头节点（无锁，高并发友好）。
3. **桶非空（存在链表或红黑树）**：使用 `synchronized` **锁定该桶的头节点**，再进行遍历、更新或插入。
   - 锁粒度仅为**单个桶**，不影响其他桶的并发操作。

#### 为什么不用 ReentrantLock？

- JDK 1.8 改用 `synchronized` 锁头节点，因为：
  - JVM 对 `synchronized` 优化极好（偏向锁、轻量级锁等）
  - 锁对象是**桶头节点本身**，无需额外 Lock 对象，**内存更省**
  - 代码更简洁，维护成本更低

#### 性能优势

- **读操作完全无锁**（依赖 `volatile` 保证可见性）
- **写操作锁粒度极小**（仅锁冲突桶的头节点）
- \*\*高并发下吞吐量远高于 `Hashtable` 或 `Collections.synchronizedMap
