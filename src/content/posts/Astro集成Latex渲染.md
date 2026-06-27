---
title: 在 AstroPaper 中开启 LaTeX 公式渲染
description: 教你如何给 AstroPaper 博客添加 KaTeX 数学公式渲染支持，写出一篇充满漂亮公式的文章
pubDatetime: 2026-06-26
slug: astro-paper-latex-support
tags: ["Astro", "LaTeX", "教程"]
---

AstroPaper 默认不带 LaTeX 渲染，但集成起来非常简单，只需要三样东西：**remark-math**（识别公式）、**rehype-katex**（渲染公式）和 **KaTeX CSS**（公式样式）。

## 三步开启公式渲染

### 1. 安装依赖

```bash
# 用你喜欢的包管理器
bun add remark-math rehype-katex katex
# 或
pnpm add remark-math rehype-katex katex
```

### 2. 配置 astro.config.ts

在 `astro.config.ts` 中引入插件，并加入 Markdown 处理管线：

```ts
// 文件顶部的 import 区域加上
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 在 markdown.processor 的 remarkPlugins 和 rehypePlugins 里加上
markdown: {
  processor: unified({
    remarkPlugins: [
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
      remarkMath,          // ← 加这里
    ],
    rehypePlugins: [
      rehypeCallouts,
      rehypeKatex,         // ← 加这里
    ],
  }),
  // 其他配置保持不变
},
```

### 3. 添加 KaTeX 样式

在 `src/layouts/Layout.astro` 的 `<head>` 里加入 CSS：

```astro
<!-- KaTeX CSS for LaTeX formula rendering -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
```

### 4. 修复公式字体颜色（重点）

KaTeX 默认公式颜色偏灰（`#1a1a1a`），跟页面的正文颜色不一致。更麻烦的是，Astro 的 View Transitions（页面间客户端跳转）会让按作用域写的样式偶尔失效——表现为从首页点进文章时公式是灰色的，手动刷新后才正常。

解决办法：在 `src/styles/global.css` 末尾加一条全局规则，让 KaTeX 直接继承页面的文字颜色，避开 View Transitions 的作用域问题：

```css
/* 确保 KaTeX 公式颜色与正文一致，不受 View Transitions 影响 */
.katex {
  color: var(--foreground);
}
```

> `--foreground` 是主题 CSS 变量，浅色模式下是 `#282728`，深色模式下是 `#eaedf3`。这条规则写在全局层级，不依赖任何 CSS 作用域，View Transitions 再怎么重组样式都不会影响它。

## 写公式

安装好之后，在 Markdown 中直接用 `$$` 包裹公式即可：

```markdown
行内公式：$E = mc^2$

独立公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

多行对齐：

$$
\begin{align*}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align*}
$$
```

## 最终效果

上面的代码在文章中会渲染成：

行内公式：$E = mc^2$

独立公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

多行对齐：

$$
\begin{align*}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align*}
$$

## 一些小提示

| 注意事项 | 说明 |
|---|---|
| **中文不要直接放在 `$$` 里** | 用 `\text{中文}` 包裹，否则 KaTeX 会告警 |
| **多行用 align\*** | 用 `\begin{align*}...\end{align*}`，带星号不显示行号 |
| **支持绝大多数 LaTeX 宏** | 矩阵、求和符号、积分、分数、根号等标准宏都支持 |
| **构建时渲染** | KaTeX 在构建时就完成了排版，访客无需加载 JS |

## 题外话：为什么选 KaTeX 而不是 MathJax？

| 对比项 | KaTeX | MathJax |
|---|---|---|
| 渲染时机 | 构建时（静态） | 浏览器端（动态） |
| 速度 | 极快 | 较慢（公式量大时明显） |
| 体积 | 仅 CSS（约 40KB） | 需加载完整 JS 库（300KB+） |
| 适合 Astro | ✅ 完美契合"零 JS"理念 | ❌ 与 Astro 静态输出相悖 |

对于 AstroPaper 这种静态博客而言，KaTeX 是更自然的选择——页面加载时公式已经渲染好了，不需要在浏览器里重新排版。

## 延伸阅读

- [KaTeX 官方文档](https://katex.org/docs/supported)
- [Astro 内容集合文档](https://docs.astro.build/en/guides/content-collections/)
