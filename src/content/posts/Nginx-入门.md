---
title: Nginx 入门
description: Nginx 基础入门配置指南
pubDatetime: 2025-02-11
slug: nginx-introduction
tags: ["Nginx"]
---

## 环境说明

操作系统：Debian（HyperV 虚拟机）

Nginx 版本：1.22.1

## 什么是 Nginx ?

- 轻量级的 Web 服务器 / 反向代理服务器 / 电子邮件代理服务器
- 占用内存少，并发能力强

使用 `apt` 命令即可安装 Nginx

```bash
sudo apt install nginx
```

Nginx 的默认安装目录：

`/etc/nginx/`：配置文件目录

`/usr/share/nginx/`：默认的网页根目录

`/var/log/nginx/`：日志目录

`/run/nginx.pid/`：运行时文件，用于存储 PID

如果安装后输入 `nginx` 显示没有命令，则需要配置一下环境

```bash
echo 'export PATH=$PATH:/usr/sbin' >> ~/.bashrc
source ~/.bashrc
```

## Nginx 常用命令

在启动 Nginx 服务前，可以使用 `nginx -t` 命令，检查配置文件是否有错误

```bash
v1hz@v1hz-VM-Debian:/$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

运行 `nginx` 命令即可启动 Nginx 服务

运行 `nginx -s stop` 停止 Nginx 服务

运行 `nginx -s reload`

不过更推荐使用 `systemctl` 来管理 Nginx 服务

```bash
systemctl start nginx
systemctl stop nginx
systemctl reload nginx
```

## Nginx 配置文件结构

- 全局块：和 Nginx 运行相关的全局配置
- events 块：和网络连接相关的配置
- http 块：代理、缓存、日志记录、虚拟主机配置
  - http 全局块
  - Server 块
    - Server 全局块
    - location 块

> 其中，http 块中可以配置多个 Server 块，Server 块中可以配置多个 location 块

我们主要是要配置 http 块的内容

## Nginx 具体应用

### 部署静态资源

Nginx 的配置文件：

- **主配置文件**：`/etc/nginx/nginx.conf`
- **模块配置目录**：一般存放全局配置
  - **存放路径**：`/etc/nginx/modules-available/`
  - **启用路径**：`/etc/nginx/modules-enabled/`
- **MIME类型配置**：`/etc/nginx/mime.types`
- **虚拟主机配置目录**：一般存放 http 块的配置
  - **存放路径**：`/etc/nginx/sites-available/`
  - **启用路径**：`/etc/nginx/sites-enabled/`
- **其他全局配置**：`/etc/nginx/conf.d/`

其中 **存放路径** 和 **启用路径** 之间通过建立符号链接的方式启用配置文件

比如有一个 `test.html` 想要通过 Nginx 部署，将该文件放到 `var/www/html` 下

然后在 `/ect/nginx/sites-available/` 下创建文件 `test.conf` 并添加以下内容：

```nginx
server {
    listen 81; # 监听端口
    server_name localhost; # 服务器名

    root /var/www/html; # 静态资源位置
    index test.html; # 默认初始页面

    location / {
        try_files $uri $uri/ =404; # 尝试查找请求的资源，找不到则返回 404
    }

}
```

然后运行以下命令创建符号链接来启用配置文件

```bash
sudo ln -s /ect/nginx/sites-available/test.conf /ect/nginx/sites-enabled/test.conf
```

然后运行 `sudo systemctl reload nginx`，再访问 `localhost:81` 即可看到 `test.html` 的渲染页面

> 解释一下为什么创建符号链接能做到启用符号链接的效果
>
> 在 `/etc/nginx/nginx.conf` 中的 http 块中，最后有一行为：
>
> ```
> include /etc/nginx/sites-enabled/*;
> ```
>
> 所以为 `/ect/nginx/sites-available` 中想要启用的文件创建一个符号链接到 `/etc/nginx/sites-enabled` 中，配置就能被导入到 `nginx.conf` 中，从而启用配置
>
> `/etc/nginx/modules-available/` 也是同理

### 反向代理

在理解反向代理是什么之前，先了解一下什么是正向代理

**正向代理** 就是客户端设置代理服务器，通过代理服务器转发请求，最终访问到目标服务器，目标服务器返回的内容同样交由代理服务器返回给客户端，如图

![正向代理示意图](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502111750195.png)

**反向代理** 则是服务端设置反向代理服务器，和正向代理类似，但是对于客户而言，反向代理服务器等同于目标服务器，客户端不知道真正的目标服务器的地址，如图

![反向代理示意图](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502111803889.png)

要使用 Nginx 来实现反向代理，同样需要编写好配置文件

和上面一样，在 `/ect/nginx/sites-available/` 中创建一个配置文件，添加如下内容

```nginx
server {
    listen 82;  # 监听80端口
    server_name your_domain_or_ip;  # 配置你的域名或IP
    location / {
        proxy_pass 192.168.1.50:8080;  # 将请求转发到 192.168.1.5
    }
}

```

然后添加符号链接、重启服务

访问本机的 IP 地址的 82 端口后，Nginx 就会将请求转发到 `192.168.1.50:8080` 进而访问到 `192.168.1.50:8080` 

### 负载均衡

小型的服务一般单台服务器就能满足基本需求，但是当服务变得庞大，就需要多台服务器组成应用集群，进行性能的水平扩展以及避免单点故障出现

- 应用集群：将同一个应用部署到多台机器上，组成应用集群，接收负载均衡器分发的请求，进行业务处理并返回响应
- 负载均衡器：将用户的请求依据对应的负载均衡算法分发到应用集群中的一台服务器进行处理

![负载均衡示意图](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502111850979.png)

负载均衡的配置如下：

```nginx
http {
    upstream backend {
        # 定义负载均衡的后端服务器
        server 192.168.1.2;  # 服务器1
        server 192.168.1.3;  # 服务器2

        # 可选配置：根据需要调整负载均衡策略，默认是轮询
        # 例如，使用加权负载均衡
        # server 192.168.1.2 weight=3;   # 为服务器1设置更高的权重
        # server 192.168.1.3 weight=1;   # 为服务器2设置较低的权重
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://backend;  # 转发请求到 upstream 定义的 backend
        }
    }
}

```

Nginx 支持的主要负载均衡策略

|    负载均衡策略    | 描述                                                         |
| :----------------: | :----------------------------------------------------------- |
|      **轮询**      | 默认策略，按顺序将请求依次分发到所有后端服务器。             |
|    **加权轮询**    | 为每个后端服务器指定权重，流量根据权重分配。                 |
|   **最少连接数**   | 将请求转发到当前连接数最少的后端服务器。                     |
|    **IP 哈希**     | 基于客户端 IP 地址进行哈希，确保同一个客户端的请求发送到同一台服务器。 |
|      **随机**      | 随机选择一个后端服务器处理请求。                             |
| **加权最少连接数** | 结合加权和最少连接数，将请求分发给连接数最少且权重较高的服务器。 |
|      **公平**      | 基于请求的处理时间和服务器负载进行公平调度。                 |

