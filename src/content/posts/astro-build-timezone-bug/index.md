---
title: 开发环境正常但生产构建丢失文章？居然是时区在作祟...
description: bun run dev 正常显示，但 bun run build 后文章不见了——排查发现是 pubDatetime 的时区问题
pubDatetime: 2026-06-28
slug: astro-build-timezone-bug
tags: ["Astro", "Debug"]
---

## 现象

`bun run dev` 预览一切正常。但 `bun run build && bun run preview` 后，文章不见了——页面上显示 404，构建产物里也没有对应的 HTML 文件。

更诡异的是：**只有这一篇文章受影响**，其他文章都正常。

## 为什么 dev 正常但 build 不行？

看 AstroPaper 的 `postFilter.ts` 中的文章过滤逻辑：

```ts
export function postFilter({ data }) {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
}
```

关键在最后一行：`import.meta.env.DEV || isPublishTimePassed`

| 环境 | `import.meta.env.DEV` | 结果 |
|---|---|---|
| `bun run dev`（开发服务器） | `true` | **跳过时间检查**，文章直接显示 |
| `bun run build`（生产构建） | `false` | 检查 `isPublishTimePassed`，时间没到就过滤掉 |
| `bun run preview`（预览构建产物） | `false` | 直接展示构建结果，没生成就是没有 |

所以 `bun run dev` 能看见，是因为开发模式**绕过了时间检查**。问题一直存在，只是开发环境把它掩盖了。

## 根本原因：UTC 与本地时区的差异

看 `new Date("2026-06-28")` 在 JavaScript 中的行为：

- 不指定时间 → 默认 **UTC 时间 00:00:00**
- 在东八区（UTC+8），这相当于 **6月28日早上 8:00**
- 如果在 6月28日凌晨 3:00 构建，`Date.now()` 返回的是 UTC 时间 6月27日 19:00
- 此时距离 UTC 6月28日 00:00 还有 5 小时

而 `scheduledPostMargin` 只有 15 分钟——补不回 5 小时的差距。

## 为什么其他文章不受影响？

因为其他文章的日期都是过去的：
- `pubDatetime: 2024-02-02` → 一年半以前，不管什么时区都早就过了
- `pubDatetime: 2025-01-08` → 一年以前，同理

只有发布时间是**当天或未来**的文章才会触发这个问题。

## 修复方案

在 `postFilter.ts` 中用 dayjs 配合站点配置的时区来解析日期：

```ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import config from "@/config";

dayjs.extend(utc);
dayjs.extend(timezone);

export function postFilter({ data }) {
  const tz = data.timezone ?? config.site.timezone;
  // 在站点时区下解释日期，而非 UTC
  const publishTime = dayjs.utc(data.pubDatetime).tz(tz, true);
  const isPublishTimePassed =
    Date.now() > publishTime.valueOf() - config.posts.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
}
```

关键区别：

```diff
- const publishTime = dayjs(data.pubDatetime).tz(tz);
+ const publishTime = dayjs.utc(data.pubDatetime).tz(tz, true);
```

`.tz(tz)` 只是转换显示（同一个时间点换了个时区标签），`.tz(tz, true)` 则是**固定时间值**，把 `2026-06-28 00:00:00` 直接当作目标时区的时间。

## 从中学到的

1. **开发环境和生产环境行为不同时，先检查 feature flag 和条件判断**。`import.meta.env.DEV` 这类编译时常量是常见的原因
2. **JavaScript 的 `new Date("YYYY-MM-DD")` 默认是 UTC 时间**。不指定时区的话，国内用户在东八区会比预期晚 8 小时
3. **`dayjs().tz(tz, true)` 和 `dayjs().tz(tz)` 的区别**：前者固定时间值改变时区，后者转换到目标时区的时间点——差别巨大
