---
title: MySQL 查询慢的原因
description: MySQL 查询慢的常见原因分析，包含索引、连接数、BufferPool、慢查询日志等
pubDatetime: 2026-03-10
slug: mysql-slow-query-causes
tags: ["MySQL", "后端"]
---

1. 没使用索引
2. 连接数太少
   - 数据库最大连接数过小：MySQL 默认最大连接数为 100，最大可达到 16384，可以通过 `max_connection` 字段调整
   - 客户端连接池太小：调整 ORM 库的连接池大小，Java 中通过 `application.yml` 文件配置
3. BufferPool 太小：通过 `innodb_buffer_pool_reads` `innodb_buffer_pool_read_requests` 来分别查看物理磁盘读取数和 BufferPool 读取请求数，计算得到的缓存命中率小于 **99%** 就说明 BufferPool 太小了
