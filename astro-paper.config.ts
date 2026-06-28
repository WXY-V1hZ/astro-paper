import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.wxiny.com",
    title: "唯一赫兹",
    description: "V1hZ's Blog",
    author: "V1hZ",
    profile: "https://github.com/WXY-V1hZ",
    ogImage: "default-og.jpg",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "auto",
    // googleVerification: undefined
  },
  posts: {
    perPage: 6,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showNavArchivesIcon: false,
    showBackButton: true,
    editPost: {
      enabled: false,
      // url: "https://github.com/satnaing/astro-paper/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/WXY-V1hZ" },
    { name: "mail",     url: "mailto:nenood1091@gmail.com" },
  ],
  shareLinks: [
    // { name: "whatsapp", url: "https://wa.me/?text=" },
    // { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    // { name: "x",        url: "https://x.com/intent/post?url=" },
    // { name: "telegram", url: "https://t.me/share/url?url=" },
    // { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    // { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
