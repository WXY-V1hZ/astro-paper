---
title: Github Pages 自定义域名（Hexo）
description: 为 GitHub Pages 配置自定义域名的完整步骤
pubDatetime: 2025-02-12
slug: github-pages-custom-domain
tags: ["域名"]
---

## 购买域名

在 [namesilo](namesilo.com) 购买一个自己喜欢的域名（不止可以在 namesilo 购买，也有其他的域名注册商）

## 添加 DNS

管理购买好的域名的 DNS，在 namesilo 中的步骤如下（其他的域名注册商中类似）：

找到 Domain Manager（My Account → Domain Manager）

点击如图所示图标（Manage DNS for your domain）

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121526322.png)

先添加一条 CNAME 记录

Hostname 填 `www`，Target Hostname 填自己的 Github Pages 地址，然后点击 `SUBMIT` 即添加成功

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121528489.png)

下滑找到 DNS Template

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121526326.png)然后在列表中找到 Github 一栏，点击 `Apply Template`，然后在 DNS 记录中会自动添加四条

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121527323.png)

## 配置 Hexo
在 hexo 源代码目录的 source 文件夹中添加 `CNAME` 文件（全大写，无后缀），内容为自己购买的域名

然后运行 `hexo g` `hexo d` 提交至 Github（也可以直接在仓库中添加一个 CNAME 文件）

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121531853.png)

## 配置 GitHub

在 Github 的 hexo 仓库中，进入 Settings → Pages → Custom domain

填入自己购买的域名，点击 `save` 并开启 `Enforce HTTPS`

然后可能会显示错误，等待一会儿后就会显示成功

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121534729.png)
