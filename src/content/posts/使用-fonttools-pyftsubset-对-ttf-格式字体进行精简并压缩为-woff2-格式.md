---
title: 使用 fonttools-pyftsubset 对 ttf 格式字体进行精简并压缩为 woff2 格式
description: 使用 fonttools 对 ttf 字体进行精简并压缩为 woff2 格式
pubDatetime: 2025-01-31
slug: font-subset-woff2
tags: ["字体压缩"]
---

为了让网站使用自定义字体，需要将字体文件一并上传，但是一般的中文字体文件都很大，动辄 20MB+
解决办法就是使用一些工具对字体进行精简和压缩
网上找了一些在线工具，但是都只能压缩为 woff2 格式，20MB 左右的字体压缩后依然有 8MB+
一个有效的解决办法就是使用 fonttools 中的 pyftsubset 对字体进行精简，具体步骤如下

## 使用 pip 下载 fonttools

```shell
pip install fonttools -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 准备字体文件以及精简字符文件

```shell
Library\Downloads\FutureRoundSC_Regular took 5s
❯ ls

    Directory: D:\Library\Downloads\FutureRoundSC_Regular

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          30/01/2025    23:29          10980 36.txt
-a---          30/01/2025    23:28          13797 46.txt
-a---          18/09/2020    08:49       21996848 FutureRoundSC_Regular.ttf
```

其中 `FutureRoundSC_Regular.ttf` 是我需要压缩的字体文件

另外两个 txt 文件的内容是常用 3600 字简体中文和常用 4600 字简体中文

精简字符集可以在 https://www.fontspider.vip/ 中复制粘贴获取

## 使用 pyftsubset 对文件进行精简和压缩

格式为 `pyftsubset {字体路径} --text-file={精简字符集路径} --flavor={转换后的格式}`，如下

```shell
pyftsubset .\FutureRoundSC_Regular.ttf --text-file=./36.txt --flavor=woff2
```

如果不添加 `--flavor` 则只会精简字符集而不压缩为 woff2 格式

## 最终效果

```shell
Library\Downloads\FutureRoundSC_Regular
❯ ls

    Directory: D:\Library\Downloads\FutureRoundSC_Regular

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          30/01/2025    23:29          10980 36.txt
-a---          30/01/2025    23:28          13797 46.txt
-a---          30/01/2025    23:34         755444 FutureRoundSC_Regular-subset.woff2
-a---          18/09/2020    08:49       21996848 FutureRoundSC_Regular.ttf
```

缩小了近 30 倍，效果显著！

---

#### 参考文献

1. https://forum.freemdict.com/t/topic/13913
