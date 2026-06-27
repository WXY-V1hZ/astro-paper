---
title: 延迟加载 conda 脚本，解决 Powershell 启动慢
description: 解决 Powershell 因加载 conda 脚本而启动慢的问题
pubDatetime: 2025-02-01
slug: lazy-load-conda-powershell
tags: ["PowerShell", "优化"]
---
## 遇到的问题
Windows 系统中，下载 conda 并配置 powershell 后，每次启动终端都会有很长一段时间用于加载 conda 的数据，要等上一两秒才能使用，比较影响日常使用。
![启动后需要等一秒多](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502012039543.png)
之所以会这样，是因为下载 conda 后如果要在 powershell 中使用，需要先运行 `conda init`，正是这行命令添加了一些配置到 powershell 中。
通过运行 `code $PROFILE` 可以使用 vscode 打开 powershell 的配置文件，可以看到这样的一行内容：
```powershell
(& "D:\Softwares\Apps\scoop\apps\miniconda3\current\Scripts\conda.exe" "shell.powershell" "hook") | Out-String | ?{$_} | Invoke-Expression
```
这个 `.ps1` 文件配置了每次 powershell 启动时运行的命令，正是上面这行代码使得每次 powershell 启动都要进行加载，拖慢了启动速度。
解决办法有两个。
## 1. 使用 Anaconda Powershell Prompt
删除 `conda init` 添加的代码，然后每次想用 conda 的时候打开 Anaconda Powershell Prompt 而不是 Powershell，这样就 Powershell 就不会被拖慢。
## 2. 修改 Powershell 的配置文件，延迟加载
核心思想就是，并不是每次打开 Powershell 都是要用 conda，那么就可以等到要使用 conda 的时候在手动进行加载，于是就有了这样的一个解决办法。
对 `Microsoft.PowerShell_profile.ps1` 修改，如下
```powershell
# 在需要使用conda的时候使用miniconda命令激活conda，然后就可以正常使用conda
function miniconda {
    # 下面这一行一般是执行 conda init 后会添加的内容
    (& "path\to\conda\Scripts\conda.exe" "shell.powershell" "hook") | Out-String | ?{$_} | Invoke-Expression
}
# 注意：这里的代码不能直接照抄，因为conda的路径不一样，需要按照自己的实际情况来写
# 这里也不一定是要叫 miniconda，可以随便设置为自己喜欢的命令名称
```
这样每次想要使用 conda 的时候，运行 `miniconda` 命令就可以手动加载 conda
![手动加载](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502012036557.png)
如图，一开始没有运行 `miniconda` 命令的时候无法会提示错误，让我们先运行 `conda init`
在运行 `miniconda` 命令手动加载后就可以正常使用 conda 命令了，同时 Powershell 的启动也十分迅速
## 其他
对于 Powershell 的配置文件还有很多有意思的用法，但是我没有很多特殊的需求，除了一些基础的配置外只加了一个 `cls` ，这样每次启动 Powershell 都会得到一个清爽的屏幕。