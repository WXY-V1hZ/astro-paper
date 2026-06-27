---
title: Kafka 入门
description: Kafka 核心概念整理，包含 Topic、Partition、Broker、Consumer Group 等
pubDatetime: 2026-03-29
tags: ["Kafka", "后端"]
---

#### 主题-Topic
生产者可以将不同的消息放到不同的主题中，消费者只需要关注自己订阅的主题即可![](pictures/Pasted%20image%2020260329174825.png)
#### 分区-Partition
- 每个主题可以分为多个分区（Partition），每个分区可以被不同的消费者线程并行处理
- kafka 只会保证每个分区内的消息是有序的，也就是说如果一个主题有多个分区，就不能保证该主题的全局顺序性
kafka 会根据 key 的哈希来决定放到哪一个分区，如果希望一个用户的交易记录是顺序处理的，可以将用户的 ID 作为分区的 key，这样同一个用户的消息就会放到同一个分区被顺序处理
![](pictures/Pasted%20image%2020260329174931.png)
#### Broker, Leader, Follower
- kafka 为了实现高可用，可以部署在多个服务器上，称为一个 Broker
- 每个 Broker 可以装载多个主题的多个分区
- 每个分区在每个 Broker 上都有一份，分为 Leader 和 Follower
- Leader 负责实际的读写请求，Follower 则持续复制 Leader 的数据保证数据不会丢失
- 宕机后其中的一个 Follower 会变为 Leader
![](pictures/Pasted%20image%2020260329194501.png)
#### 消费者组（Consumer Group）
- 多个消费者可以组成一个消费者组，共同订阅多个主题
- 主题中的每条消息，只能被消费者组中的一个消费者消费，但是可以被多个消费者组消费
![](pictures/Pasted%20image%2020260329195158.png)