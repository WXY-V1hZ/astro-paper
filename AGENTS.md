# AstroPaper Blog

基于 [Astro](https://astro.build/) v7 + [AstroPaper](https://github.com/satnaing/astro-paper) v6.1.0 主题的个人博客。

## 技术栈

- **框架**: Astro v7
- **包管理器**: bun
- **CSS**: Tailwind CSS v4（`@tailwindcss/vite`）
- **内容格式**: Markdown / MDX
- **数学渲染**: KaTeX（`remark-math` + `rehype-katex`）
- **搜索**: PageFind
- **代码高亮**: Shiki
- **图标**: SVG（`src/assets/icons/`）

## 项目结构

```
src/
├── content/
│   ├── posts/         # 博客文章
│   ├── pages/         # 独立页面（关于页）
│   └── content.config.ts  # 内容集合 schema
├── components/        # Astro 组件
│   ├── Header.astro  # 导航栏
│   ├── Footer.astro  # 页脚
│   ├── Card.astro    # 文章卡片
│   ├── Breadcrumb.astro # 面包屑导航
│   ├── Datetime.astro   # 日期显示
│   ├── Tag.astro        # 标签
│   ├── Pagination.astro # 分页
│   └── ...
├── layouts/          # 页面布局
│   ├── Layout.astro      # 基础 HTML 结构
│   └── PostLayout.astro  # 文章详情布局
├── pages/            # 路由页面
│   ├── index.astro         # 首页
│   ├── about.astro         # 关于页
│   ├── posts/[...slug]/    # 文章详情页
│   ├── tags/               # 标签页
│   ├── archives/           # 归档页
│   └── search.astro        # 搜索页
├── styles/           # 样式
│   ├── global.css    # 全局样式
│   ├── theme.css     # 主题色（浅色/深色）
│   └── typography.css # 文章排版
├── i18n/             # 国际化
│   ├── lang/en.ts    # 英文
│   ├── lang/zh.ts    # 中文
│   ├── types.ts      # i18n 类型
│   └── index.ts      # useTranslations 函数
├── utils/            # 工具函数
├── types/            # TypeScript 类型
├── assets/           # SVG 图标
└── scripts/          # 客户端脚本
```

## 核心配置

- `astro-paper.config.ts` — 博客名称、社交链接、功能开关
- `astro.config.ts` — Astro 核心配置（i18n、Markdown、插件）
- `src/config.ts` — 内部配置（给配置项提供默认值）

## 内容规范

文章放在 `src/content/posts/`，支持 `.md` 和 `.mdx`。

frontmatter 字段:
- `title` (必填) — 标题
- `description` (必填) — 简介
- `pubDatetime` (必填) — 发布日期
- `tags` (必填) — 标签数组，如 `["Astro", "教程"]`
- `draft` (可选) — 设为 true 时不发布
- `featured` (可选) — 设为 true 时出现在首页推荐
- `slug` (可选) — 自定义 URL 路径
- `modDatetime` (可选) — 修改日期

### 代码块文件标注

文章中引用源代码的代码块，在开头的 ``` 后添加 `file="<文件路径>"`：

```markdown
```ts file="src/utils/postFilter.ts"
export function postFilter({ data }) { ...
```

这样读者能直接知道代码来自哪个文件。diff 或命令行片段不需要标注。

## 命令

```bash
bun run dev        # 开发服务器
bun run build      # 生产构建
bun run preview    # 预览构建产物
bun run lint       # ESLint 检查
bun run format     # Prettier 格式化
```

## 语言

默认中文。切换语言需同时改:

1. `astro.config.ts` 的 `defaultLocale`
2. `astro-paper.config.ts` 的 `lang`

## 部署

Cloudflare Pages 自动部署，推送 `main` 分支即触发构建。
