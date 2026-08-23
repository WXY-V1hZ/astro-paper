import mermaid from "mermaid";

let initialized = false;

async function renderMermaid() {
  const blocks = document.querySelectorAll<HTMLElement>(
    'pre[data-language="mermaid"] > code'
  );

  if (blocks.length === 0) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme:
      document.documentElement.dataset.theme === "dark" ? "dark" : "default",
  });

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) continue;

    const container = document.createElement("div");
    container.className = "mermaid my-6 overflow-x-auto";
    container.textContent = code.textContent ?? "";
    pre.replaceWith(container);
  }

  await mermaid.run();
}

function setupMermaid() {
  if (!initialized) {
    initialized = true;
    document.addEventListener("astro:page-load", renderMermaid);
  }

  void renderMermaid();
}

setupMermaid();
