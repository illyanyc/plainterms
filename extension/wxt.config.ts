import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "PlainTerms - Policy Analyzer",
    description:
      "Instantly understand any Privacy Policy or Terms of Service. AI-powered red flag detection, plain English summaries, and actionable insights.",
    permissions: ["sidePanel", "activeTab", "storage", "contextMenus"],
    host_permissions: ["<all_urls>"],
    side_panel: {
      default_path: "sidepanel/index.html",
    },
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
    action: {
      default_icon: {
        16: "icons/icon-16.png",
        32: "icons/icon-32.png",
        48: "icons/icon-48.png",
        128: "icons/icon-128.png",
      },
    },
  },
});
