import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

/**
 * Rehype plugin: 将 markdown 中独立的 ![alt](url) 图片
 * 自动包裹为 <figure><img><figcaption>alt</figcaption></figure>
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

      // 获取 alt 文本
      const alt = (img.properties?.alt as string) || "";

      // 构建 figure 节点（图片点交由 AstroPaper 自带的灯箱处理）
      const figcaption = h("figcaption", { class: "text-center" }, alt);

      const figure = h("figure", { class: "image-figure" }, img, figcaption);

      parent.children[index] = figure;
    });
  };
}
