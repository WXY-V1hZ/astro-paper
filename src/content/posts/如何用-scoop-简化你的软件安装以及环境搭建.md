---
title: 如何用 scoop 简化你的软件安装以及环境搭建
description: 使用 scoop 包管理器简化 Windows 软件安装与环境搭建
pubDatetime: 2025-02-13
tags: ["scoop"]
---

前段时间发现一个 Windows 平台的软件包管理器，用上后发现许多事情变得方便了许多，遂写一篇软件推荐的文章

## scoop 能做什么

举个例子，想搭建基本的 C++ 环境，只需要运行以下命令

```bash
scoop install mingw
```

安装完成后什么都不用做，运行 `g++ -v` 就发现 C++ 环境已经搭好了，不用自己配置环境变量

不仅如此，如果想卸载，运行以下命令

```bash
scoop uninstall mingw
```

scoop 的卸载十分干净，环境变量也会帮你删除，也就不用担心会残留什么东西

说到这里，其实就能感觉到，这和 Linux 的 `apt`、Mac 的 `brew` 很像

不过 scoop 也有缺点，就是只推荐下载命令行软件，像 QQ 微信这种软件就无法下载

也可以添加额外的库下载非命令行软件，但是卸载可能会不完全或者使用有点小问题

## 怎么安装 scoop

### 一键式安装

访问 [scoop 官网](https://scoop.sh/) 可以看到安装方法，只需要两行命令

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

第一行命令确保 Powershell 允许执行 ps1 脚本

第二行命令则是获取安装脚本并运行

但是这种安装方法会直接将 scoop 安装到 C 盘，后续的软件也会一起安装到 C 盘

通过自定义安装就可以自定义安装位置

### 自定义安装

首先确保 Powershell 允许执行 ps1 脚本

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后获取 scoop 安装脚本

```bash
irm get.scoop.sh -outfile 'install.ps1'
```

允许安装脚本并指定安装位置

```bash
.\install.ps1 -ScoopDir '{scoop安装位置}'
```

然后 scoop 就被安装到指定的位置了，运行 `scoop -v` 检查安装结果

## scoop 的目录结构

scoop 的目录结构如下

```bash
scoop
├── apps/              # 存放所有已安装的软件（每个软件一个子目录）
│   ├── git/
│   │   ├── current/  # 指向当前使用的版本
│   │   ├── 2.39.1/   # 具体的软件版本
│   ├── python/
│   │   ├── current/
│   │   ├── 3.11.2/
│   ├── scoop/
│   │   ├── current/
│   │   ├── 1.0.0/
│   ├── ...
│
├── buckets/           # 存放软件仓库（bucket）
│   ├── main/          # 默认官方 bucket（包含核心应用）
│   ├── extras/        # 额外软件（如 Chrome、VLC）
│   ├── ...
│
├── cache/             # 存放已下载的安装包，避免重复下载
│   ├── git#2.39.1.zip
│   ├── python#3.11.2.zip
│
├── persist/           # 用于存放需要持久化的数据
│   ├── some_app/
│
└── shims/             # 可执行文件的软链接目录（添加到环境变量 PATH）
    ├── git.exe  → 指向 apps/git/current/git.exe
    ├── python.exe → 指向 apps/python/current/python.exe
```

## scoop 的常用命令

```bash
scoop install <软件名>      # 安装软件

scoop uninstall <软件名>    # 卸载软件

scoop update *             # 更新所有软件

scoop bucket add extras    # 添加额外的软件源

scoop search <软件名>       # 搜索软件

scoop list                 # 查看已安装的软件

scoop cleanup *            # 清理旧版本以及缓存
```

