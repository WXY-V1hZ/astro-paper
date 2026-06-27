---
title: MySQL 主从复制的配置及应用
description: MySQL 主从复制的配置方法及其应用场景
pubDatetime: 2025-02-10
slug: mysql-master-slave-replication
tags: ["MySQL", "主从复制"]
---

## 什么是 MySQL 主从复制？

- **异步** 的复制过程
- 底层基于 MySQL 数据库自带的 **二进制日志** 功能
- MySQL 数据库自带主从复制的功能

就是一台或多台 MySQL 数据库（slave）从另一台 MySQL 数据库（master）进行日志的复制然后解析日志并应用到自身，最终实现 **从库数据和主库数据保持一致** 。

MySQL 复制过程分为三步：

1. master 将改变记录二进制日志（binlog）
2. slave 将 master 的 binlog 拷贝到它的中继日志（relay log）
3. slave 重做中继日志中的事件，将改变应用到自己的数据库中

![MySQL 主从复制（图片来自黑马程序员）](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502101431714.png)

## 配置 MySQL 主从复制

> 我自己操作的时候是用 Windows 的 Hyper-V 创建的 Debian 虚拟机，
>
> Debian 作为主库，Windows 作为从库

### 主库的配置

**第一步**，修改 MySQL 配置文件

```bash
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

在 `[mysql]` 字段下添加以下内容

```
log-bin         = mysql-bin
server-id       = 100
```

`mysql-bin` 即二进制日志的名称（也可以填写具体的路径）

`server-id` 可以随意设置，但必须唯一

`binlog_do_db` 指定要复制的数据库（这里没写上去，所以默认为所有）

然后重启一下 MySQL 服务

```bash
sudo systemctl restart mysql
```

**第二步**，创建从库用户

登录 MySQL 主库

若 MySQL 为 8.0 以下版本，则执行以下语句

```sql
grant replication slave on *.* to 'v1hz-slave'@'%' identified by 'your_password'
```

> 这行 SQL 语句表示，创建一个名为 `v1hz-slave` 的用户，允许该用户从任意 IP 地址连接（`'%'`），将权限授予所有数据库的所有表（`*.*`），用户密码为 `your_password`，授予该用户从属复制的权限（`grant replication slave`）
>
> 也可以将 `'%'` 替换为从库的 IP 地址 或 将 `*.*` 替换为指定的数据库和表 提高安全性

若 MySQL 为 8.0 及更高版本，则不能直接在 `GRANT` 语句中使用 `IDENTIFIED BY` 来设置密码，需要将创建用户和授权分为两步（由于 MySQL 的安全策略，第二步必须在本地执行）

```sql
create user 'v1hz-slave'@'%' identified by 'your_password';
grant replication slave on *.* to 'v1hz-slave'@'%';
```

**第三步**，查看 MySQL 主库的状态

```bash
mysql> show master status;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000002 |      1414 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```

前两列表示日志的名称和位置，待会儿在从库的配置中会用到。

### 从库的配置

**第一步**，修改 MySQL 配置文件

我的从库是 Windows 下的，所以配置文件位于 `/path/to/mysql/my.ini`

在 `[mysql]` 字段下添加以下内容（此处的 `server-id` 必须和主库中配置的不同）

```
server-id=101
```

然后重启一下 MySQL 服务

**第二步**，指定主库

执行以下 SQL 语句（此处的所有字段均替换为上述设置的内容）

```sql
# MySQL 8.0+
CHANGE REPLICATION SOURCE TO
SOURCE_HOST='172.22.160.2',
SOURCE_USER='v1hz-slave',
SOURCE_PASSWORD='nenood1091',
SOURCE_LOG_FILE='mysql-bin.000002',
SOURCE_LOG_POS=1414;

START REPLICA;

# MySQL 5.x
CHANGE MASTER TO
MASTER_HOST='172.22.160.2',
MASTER_USER='v1hz-slave',
MASTER_PASSWORD='nenood1091',
MASTER_LOG_FILE='mysql-bin.000002',
MASTER_LOG_POS=1414;

START SLAVE;
```

**第三步**，检查主从复制状态

```sql
mysql> show replica status\G;
*************************** 1. row ***************************
             Replica_IO_State: Waiting for source to send event
                  Source_Host: 172.22.160.2
                  Source_User: v1hz-slave
                  Source_Port: 3306
                Connect_Retry: 60
              Source_Log_File: mysql-bin.000002
          Read_Source_Log_Pos: 1414
               Relay_Log_File: V1hZ-DESKTOP-relay-bin.000004
                Relay_Log_Pos: 327
        Relay_Source_Log_File: mysql-bin.000002
           Replica_IO_Running: Yes
          Replica_SQL_Running: Yes
              Replicate_Do_DB:
          Replicate_Ignore_DB:
           Replicate_Do_Table:
       Replicate_Ignore_Table:
      Replicate_Wild_Do_Table:
  Replicate_Wild_Ignore_Table:
                   Last_Errno: 0
                   Last_Error:
                 Skip_Counter: 0
          Exec_Source_Log_Pos: 1414
              Relay_Log_Space: 714
              Until_Condition: None
               Until_Log_File:
                Until_Log_Pos: 0
           Source_SSL_Allowed: No
           Source_SSL_CA_File:
           Source_SSL_CA_Path:
              Source_SSL_Cert:
            Source_SSL_Cipher:
               Source_SSL_Key:
        Seconds_Behind_Source: 0
Source_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 0
                Last_IO_Error:
               Last_SQL_Errno: 0
               Last_SQL_Error:
  Replicate_Ignore_Server_Ids:
             Source_Server_Id: 100
                  Source_UUID: 1ca9aa76-e773-11ef-af5e-00155d01090c
             Source_Info_File: mysql.slave_master_info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
    Replica_SQL_Running_State: Replica has read all relay log; waiting for more updates
           Source_Retry_Count: 10
                  Source_Bind:
      Last_IO_Error_Timestamp:
     Last_SQL_Error_Timestamp:
               Source_SSL_Crl:
           Source_SSL_Crlpath:
           Retrieved_Gtid_Set:
            Executed_Gtid_Set:
                Auto_Position: 0
         Replicate_Rewrite_DB:
                 Channel_Name:
           Source_TLS_Version:
       Source_public_key_path:
        Get_Source_public_key: 0
            Network_Namespace:
1 row in set (0.00 sec)

ERROR:
No query specified
```

### 可能遇到的问题

我在实际操作中运行 `show replica status\G` 后遇到报错：

```bash
Authentication plugin ‘caching_sha2_password‘ reported error: Authentication...
```

在主库中运行以下语句：

```sql
ALTER USER 'v1hz-slave'@'%' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

由于运行以上语句会导致主库的二进制日志改变，所以需要运行 `show master status` 查看新的日志名称和位置

重启从库的 MySQL，停止复制后重新运行：

```sql
STOP REPLICA;

CHANGE REPLICATION SOURCE TO
SOURCE_HOST='172.22.160.2',
SOURCE_USER='v1hz-slave',
SOURCE_PASSWORD='nenood1091',
SOURCE_LOG_FILE='mysql-bin.000002',
SOURCE_LOG_POS=1414;

START REPLICA;
```

### 测试 MySQL 主从复制

在主库中运行

```sql
CREATE DATABASE test
    DEFAULT CHARACTER SET = 'utf8mb4';
```

然后刷新从库，就可以看到从库中也新建了一个名为 `test` 的数据库

> 一开始配置主库的时候运行的是 `grant replication slave on *.* ...`
>
> 所以所有的数据库和表都会同步
>
> 如果指定数据库或表就不会有这样的效果了

## 使用 Sharding-JDBC 实现读写分离

在 `pom.xml` 中添加以下 Maven 坐标

```xml
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
    <version>4.1.1</version>
</dependency>
```

然后修改 `application.yml`，添加如下设置

```yml
shardingsphere:
  datasource:
    names: master, slave # 数据源的名称，与下面的配置对应
    master: # master 数据源的相关配置
      type: com.alibaba.druid.pool.DruidDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://172.22.160.2:3306/reggie?characterEncoding=utf-8
      username: root
      password: your_password
    slave: # slave 数据源的相关配置
      type: com.alibaba.druid.pool.DruidDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/reggie?characterEncoding=utf-8
      username: root
      password: your_password
  masterslave: # 配置读写分离规则
    load-balance-algorithm-type: round_robin # 负载均衡采用轮询算法
    name: dataSource
    master-data-source-name: master
    slave-data-source-names: slave
  props: # 开启 SQL 显示日志
    sql:
      show: true
main:
  allow-bean-definition-overriding: true # 允许 bean 定义覆盖配置项
```

然后项目就能启用读写分离了
