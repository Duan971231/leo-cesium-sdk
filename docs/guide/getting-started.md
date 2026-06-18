# Getting Started

## 安装

```bash
npm install cesium @leo_blitz/cesium-sdk
```

## 基础用法

```ts
import { CesiumSDK } from "@leo_blitz/cesium-sdk";

const sdk = new CesiumSDK("cesiumContainer", {
  ionAccessToken: "your-token",
  cesiumBaseUrl: "/cesium",
  shouldAnimate: true,
});

await sdk.ready();

const point = sdk.entity.addPoint(
  "beijing",
  { longitude: 116.391, latitude: 39.907, height: 0 },
  { pixelSize: 12, color: "#ffcc00" },
);

await sdk.camera.flyToPosition({
  longitude: 116.391,
  latitude: 39.907,
  height: 10000,
});

point.setStyle({ color: "#00aaff" });

await sdk.destroy();
```

## 生命周期要求

- 调用 `sdk.ready()` 后才能访问 `sdk.layer`、`sdk.entity`、`sdk.camera` 和插件 API。
- `sdk.destroy()` 后当前实例不可复用，需要重新创建 `CesiumSDK`。
- 访问未初始化或已销毁资源会抛出 `SDKError`。

## 验证命令

```bash
npm run typecheck
npm run build
npm run docs:build
```
