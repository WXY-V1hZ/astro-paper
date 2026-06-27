---
title: 测试
description: 两篇文章标题相同导致页面过渡动画无声消失，经过 git bisect 逐层排查最终定位的过程
pubDatetime: 2026-06-28
slug: test
tags: ["Astro", "Debug"]
---

## 现象

新增几篇操作系统笔记后，发现页面切换过渡动画消失了。

之前从首页点进文章，会有一个平滑的淡入淡出效果。现在变成了生硬的无动画跳转。

把新增的几篇文章删除，动画就回来了；加回去，又没了。难道文章内容还能影响网页动画？？？

---

**结果先行：**

两篇文章如果 frontmatter 的 `title` 相同，在列表页会生成重复的 `transition:name`，导致 View Transitions 冲突，退化为无动画跳转。

**修复方法** —— 把列表页 `Card.astro` 和详情页 `[...slug]/index.astro` 中 `transition:name` 的来源从 `title` 改为 `id`：

```diff
// Card.astro（列表页卡片）
- <Heading transition:name={toTransitionName(title)}>
+ <Heading transition:name={toTransitionName(id)}>

// [...slug]/index.astro（文章详情页标题）
- style={{ viewTransitionName: toTransitionName(title) }}
+ style={{ viewTransitionName: toTransitionName(post.id) }}
```

`id` 是 Astro Content Collection 为每篇文章生成的唯一标识符（文件路径），天然不会重复。**注意两边必须同步改**，否则列表页和详情页的 `transition:name` 对不上，标题过渡动画依然不会生效。

以下是完整的排查过程。

---

## 用 git bisect 定位问题

项目一共有 6 个 commit，靠肉眼逐个 checkout 看太慢了。用 `git bisect` 二分查找：

```bash
git bisect start
git bisect bad HEAD       # 当前版本有问题
git bisect good 93c6210    # 最早的版本没问题

# Git 自动跳到中间某个版本，测试后告诉它结果
git bisect good           # 这个版本没问题
git bisect bad            # 这个版本有问题

# 重复几次后，Git 给出结果
# 3f481a3 is the first bad commit
```

然而 bisect 的结果是 "为所有文章添加 slug" 这个 commit 出了问题——它只改了 `.md` 的 frontmatter，不可能影响页面动画。这说明 bisect 被 `.astro` 缓存污染了，结果不准。

于是手动一个个 checkout 测试，最后锁定问题是出在**新增了三篇操作系统笔记之后**。

## 进一步缩小范围

先怀疑是图片太多、或者是嵌套目录导致的问题。把文件从 `course-final/operating-system/` 移到 `posts/` 根目录——问题依旧。把图片全部删掉——问题依旧。

最后发现：只要同时存在 `course-final/operating-system/进程管理.md` 和 `backend-learning/OS/3.进程管理.md` 这两篇文章，动画就消失。删掉任意一篇，动画就恢复。

这两篇文章的 frontmatter 里，`title` 字段都是 `"操作系统 - 进程管理"`。

## 根本原因

问题出在 `Card.astro` 组件中的一行代码：

```astro
<Heading transition:name={toTransitionName(title)} />
```

Astro 的 View Transitions 用 `transition:name` 来匹配页面之间的元素，实现平滑动画。当你点击文章列表中的卡片时，浏览器会找详情页里**同样 name 的元素**，然后在这两个元素之间做过渡。

这个 name 应该是**唯一**的——同一页面上不能有两个元素共享同一个 name。

然而当两篇文章的 `title` 相同时，`toTransitionName(title)` 生成的 name 也相同。在文章列表页上，这两张卡片就有了相同的 `transition:name`：

```html
<!-- 文章卡片 A -->
<h2 style="view-transition-name: u64cd-u7cfb-u7a0b-...">操作系统 - 进程管理</h2>

<!-- 文章卡片 B（title 一样，name 也一样） -->
<h2 style="view-transition-name: u64cd-u7cfb-u7a0b-...">操作系统 - 进程管理</h2>
```

浏览器发现同一页面上有两个元素共用同一个 `view-transition-name`，直接报错放弃过渡动画，退化为无动画跳转。

## 修复

把 `transition:name` 的来源从 `title` 改为 `id`。需要改两处——列表页和详情页，**必须同步改**，否则两边对不上，标题过渡依然不生效。

`id` 是 Astro Content Collection 为每篇文章生成的唯一标识符——就是文章文件相对于 `src/content/posts/` 的路径，天然不会重复：

```diff
// Card.astro（列表页卡片）
- <Heading transition:name={toTransitionName(title)}>
+ <Heading transition:name={toTransitionName(id)}>

// [...slug]/index.astro（文章详情页标题）
- style={{ viewTransitionName: toTransitionName(title) }}
+ style={{ viewTransitionName: toTransitionName(post.id) }}
```

因为文件路径是唯一的，所以 `transition:name` 也永远不会冲突：

```
id: course-final/operating-system/进程管理 →  name: course-final-operating-system-进程管理
id: backend-learning/OS/3.进程管理         →  name: backend-learning-OS-3-进程管理
```

## 经验总结

1. **View Transitions 的 `transition:name` 必须唯一**，同一页面不能重复
2. **`title` 不是唯一字段**，两篇文章可以同名，不要用它做标识
3. **`id`（文件路径）永远唯一**，适合作为元素的过渡标识
4. **`git bisect` 很有用，但 `.astro` 缓存会干扰定位**，测试不同分支时记得清缓存
