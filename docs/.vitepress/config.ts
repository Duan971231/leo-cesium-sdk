import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Cesium SDK",
  description: "Framework-agnostic TypeScript SDK for Cesium",
  base: "/leo-cesium-sdk/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/sdk" },
      { text: "Errors", link: "/reference/errors" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
        ],
      },
      {
        text: "API",
        items: [
          { text: "SDK", link: "/api/sdk" },
          { text: "Viewer", link: "/api/viewer" },
          { text: "Layer", link: "/api/layer" },
          { text: "Entity", link: "/api/entity" },
          { text: "Camera", link: "/api/camera" },
          { text: "Plugins", link: "/api/plugins" },
          { text: "Common", link: "/api/common" },
          { text: "Utils", link: "/api/utils" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Errors", link: "/reference/errors" },
        ],
      },
    ],
    search: {
      provider: "local",
    },
  },
});
