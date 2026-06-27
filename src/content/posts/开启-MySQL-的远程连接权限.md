---
title: 开启 MySQL 的远程连接权限
description: 开启 MySQL 远程连接权限的配置指南
pubDatetime: 2025-01-31
slug: mysql-remote-access
tags: ["MySQL远程连接", "Debug"]
---

## 前置说明

系统：Ubuntu 2204

MySQL 版本：8.0

---

登录 MySQL 服务器：

```bash
mysql -u root -p
```

查看 root 用户的访问权限：

```sql
SELECT user, host FROM mysql.user WHERE user = 'root';
```

如果查询结果如下，host 列中只有 localhost，说明 root 只能从本地访问，不能远程访问

```bash
+------+-----------+
| user | host      |
+------+-----------+
| root | localhost |
+------+-----------+
```

解决方法如下：

## 修改 MySQL 配置文件

打开 MySQL 配置文件

```bash
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

找到以下行

```ini
bind-address = 127.0.0.1
# 这说明MySQL只允许内部访问
```

修改为

```ini
bind-address = 0.0.0.0
```

> 如果没有 `bind-address` 字段，则在 `[mysqld]` 下自行添加

保存文件并重启 MySQL 服务

```bash
sudo systemctl restart mysql
```

## 授予权限

创建用户

```sql
CREATE USER 'root'@'%' IDENTIFIED BY '{your_password}';
```

授予权限

```sql
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
```

刷新权限

```sql
FLUSH PRIVILEGES;
```

验证修改

```sql
SELECT user, host FROM mysql.user WHERE user = 'root';
```

查询结果如下：

```bash
mysql> SELECT user, host FROM mysql.user WHERE user = 'root';
+------+-----------+
| user | host      |
+------+-----------+
| root | %         |
| root | localhost |
+------+-----------+
2 rows in set (0.00 sec)
```

## 其他可能

也有可能是防火墙直接阻止外部访问 MySQL 的端口，但是没遇到这个情况所以就不写了
