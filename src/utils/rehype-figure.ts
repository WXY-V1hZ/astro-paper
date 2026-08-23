import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

/**
 * Rehype plugin: 将 markdown 中独立的 ![alt](url) 图片
 * 自动包裹为 <figure><img><figcaption>alt</figcaption></figure>
 * 同时支持 Obsidian 的 ![alt|462](url) 图片宽度语法。
 *
 * 只处理 <p> 中仅有 <img> 的情况，不影响行内图片或已有 figure 包裹的图片。
 */
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName !== "p") return;

      // 只处理只有一个子元素的 <p>
      if (node.children.length !== 1) return;

      const img = node.children[0];
      if (img.type !== "element" || img.tagName !== "img") return;

      // 解析 Obsidian 图片尺寸语法：![alt|462](url)
      const rawAlt = String(img.properties?.alt ?? "");
      const separator = rawAlt.lastIndexOf("|");
      const rawSize = separator >= 0 ? rawAlt.slice(separator + 1).trim() : "";
      const size = /^\d+$/.test(rawSize) ? rawSize : undefined;
      const alt = size ? rawAlt.slice(0, separator) : rawAlt;

      if (size) {
        img.properties ??= {};
        img.properties.alt = alt;
        img.properties.width = size;
        img.properties.style = `width: ${size}px; max-width: 100%;`;
      }

      // 构建 figure 节点（图片点交由 AstroPaper 自带的灯箱处理）
      const figcaption = h("figcaption", { class: "text-center" }, alt);

      const figure = h("figure", { class: "image-figure" }, img, figcaption);

      parent.children[index] = figure;
    });
  };
}
