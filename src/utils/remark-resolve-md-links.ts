import { visit } from "unist-util-visit";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { slugifyStr } from "./slugify";
import type { Node } from "unist";

const BLOG_PATH = "src/content/posts";

/**
 * Remark plugin: 将文章内相对路径 `.md` 链接解析为目标文章的最终 URL。
 *
 * 例如在 `backend-learning/MySQL.md` 中：
 *   [不同存储引擎之间的区别](ref/MySQL/不同存储引擎之间的区别.md)
 *   → <a href="/posts/backend-learning/ref/mysql/mysql-storage-engine-differences/">
 *
 * 支持目标文章 frontmatter 中的 `slug` 自定义字段。
 */
export function remarkResolveMdLinks() {
  return (tree: Node, file: { path?: string }) => {
    const sourcePath = file.path;
    if (!sourcePath) return;

    const sourceDir = path.dirname(sourcePath);

    visit(tree, "link", (node: { url?: string }) => {
      const url = node.url;
      if (!url || !url.endsWith(".md") || /^https?:\/\//.test(url)) return;

      // 解析目标文件路径
      const targetPath = path.resolve(sourceDir, url);

      if (!fs.existsSync(targetPath)) return;

      // 读取目标文件 frontmatter 获取 slug
      const slug = readFrontmatterSlug(targetPath);

      // 计算目录段（相对 content/posts/ 的路径）
      const relDir = path.relative(
        path.resolve(process.cwd(), BLOG_PATH),
        path.dirname(targetPath),
      );

      const dirSegments =
        relDir === ""
          ? []
          : relDir.split(path.sep).map(s => slugifyStr(s));

      const urlPath = slug
        ? [...dirSegments, slug].join("/")
        : [...dirSegments, slugifyStr(path.basename(targetPath, ".md"))].join(
            "/",
          );

      node.url = `/posts/${urlPath}/`;
    });
  };
}

/** 从 markdown 文件读取 frontmatter 中的 slug 字段 */
function readFrontmatterSlug(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;
    const data = yaml.load(match[1]) as Record<string, unknown>;
    return (data?.slug as string) ?? null;
  } catch {
    return null;
  }
}
