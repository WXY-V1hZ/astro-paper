---
title: 搭建 PicGo 图床并在 Typora 中使用
description: 搭建 PicGo 图床并在 Typora 中使用的详细教程
pubDatetime: 2025-02-12
slug: picgo-typora-image-hosting
tags: ["图床", "写作"]
---

## 创建 GitHub 仓库

在 GitHub 账号中新建一个仓库，公开，名字随意
![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202501291638347.png)

## 创建 GitHub 的 token

- Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → Generate new token (classic)
- 然后 Note 栏随便填，Expiration 选择 never（也可以不选 never，但是后面 token 过期了要手动更新）
- Select scopes 中勾选 repo
- 点击 Generate token，完成创建，复制生成的 token

> 注意：生成的 token 只会在创建时显示一次，所以要复制保存好

## 下载 PicGo

下载完成后进入图床设置 → Github

- 填入 GitHub 仓库名
- 分支填 main
- 填入上一步中复制的 token
- 设定存储路径为 PicGo/（也可以自行设置其他的）
- 自定义域名可以不填，也可以填写 `https://fastly.jsdelivr.net/gh/{Github用户名}/{Github仓库}@main`，根据自己的情况填写，填上这个域名可以加快图片预览的速度（个人感觉没有很大差距）
  点击确定，完成配置
  然后就可以上传自己的图片并复制链接了

## 配置 Typora

在 Typora 的偏好设置中如下设置

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502120057590.png)

自己选上 PicGo 可执行文件的路径，然后验证图片上传选项

显示成功即可在 Typora 中自动上传图片了

我自己是使用 [Pixpin](https://pixpin.cn/)，截屏会自动复制图片，粘贴就能自动上传

## 其他

Obsidian 中可以下载 Image Auto Upload 插件实现自动上传