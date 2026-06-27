---
title: Solitude 启用 Mathjax
description: 在 Hexo Solitude 主题中启用 Mathjax 的解决方法
pubDatetime: 2025-02-02
slug: solitude-mathjax-setup
tags: ["mathjax"]
---

在使用 solitude 作为 hexo 博客的主题，但是这个主题好像只内置了 katex，而且文档中也没提起怎么开启 katex，网上找到的一些开启 mathjax 教程也没有起效，一番探索下找到了下面的解决办法

#### 切换 hexo 渲染引擎

卸载自己的引擎，然后安装 `hexo-renderer-markdown-it`

```shell
npm un {当前使用的渲染引擎} --save
npm i hexo-renderer-markdown-it --save
```

#### 安装插件

```shell
npm i markdown-it-mathjax3 --save
```

#### 配置

在根目录下的 `_config.yml` 中添加如下配置

```yml
markdown:
  render:
    html: true
    xhtmlOut: true
    breaks: true
    linkify: true
    typographer: true
  plugins:
    - markdown-it-mathjax3
  anchors:
    level: 2
    collisionSuffix: ""
```

#### 查看效果

运行 `hexo s` 查看公式渲染效果
