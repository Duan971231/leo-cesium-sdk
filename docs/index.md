# Cesium SDK

`@leo_blitz/cesium-sdk` 是一个 framework-agnostic 的 TypeScript Cesium SDK，提供 Viewer 生命周期、图层、实体、相机、插件和通用工具封装。

## 功能文档

- [快速开始](/guide/getting-started)
- [SDK 入口](/api/sdk)
- [Viewer](/api/viewer)
- [Layer](/api/layer)
- [Entity](/api/entity)
- [Camera](/api/camera)
- [Plugins](/api/plugins)
- [Common](/api/common)
- [Utils](/api/utils)
- [错误码](/reference/errors)

## 设计边界

- Cesium 是 peer dependency，由宿主应用安装和配置。
- SDK 不绑定 React、Vue 或其他宿主框架。
- Cesium assets、workers、token 由宿主应用配置。
- 文档只列出当前从 `src/index.ts` 公开导出的 API。
