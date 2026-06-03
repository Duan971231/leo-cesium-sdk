# Cesium SDK

`@leo_blitz/cesium-sdk` 是一个 framework-agnostic 的 TypeScript Cesium SDK。当前版本聚焦于 Cesium Viewer 生命周期、影像图层、基础 Entity 图形、相机视角控制、插件生命周期和通用工具能力。

## Requirements

- Node.js 18+
- Cesium 1.136.x，由宿主应用安装和配置

Cesium 是 peer dependency。SDK 不打包 Cesium，也不接管宿主应用的 assets、workers、token 和 bundler 配置。

## Install

```bash
npm install cesium @leo_blitz/cesium-sdk
```

## Quick Start

```typescript
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

`sdk.layer`、`sdk.entity`、`sdk.camera`、`sdk.getCesiumViewer()` 和插件相关 API 需要在 `await sdk.ready()` 之后使用。`destroy()` 后 SDK 实例不可复用，需要重新创建实例。

## Package Output

`package.json` 当前声明的构建产物：

- ESM: `dist/cesium-sdk.es.js`
- CommonJS: `dist/cesium-sdk.cjs`
- Type declarations: `dist/index.d.ts`

包入口仅导出根路径：

```typescript
import { CesiumSDK } from "@leo_blitz/cesium-sdk";
```

## SDK Entry

`CesiumSDK` 负责组合各个 manager，并提供统一生命周期：

- `ready()`：初始化 Cesium Viewer，并创建 `LayerManager`、`EntityManager`、`CameraManager`、`PluginManager`。
- `destroy()`：销毁插件、图形、图层、Viewer 和本地资源引用。
- `use(plugin)`：安装插件。
- `getPlugin(name)`：读取已安装插件。
- `onLifecycle(hook, callback)`：监听 `beforeInit`、`afterInit`、`beforeDestroy`、`afterDestroy`。
- `getCesiumViewer()`：获取底层 `Cesium.Viewer`。
- `initialized` / `disposed`：读取 SDK 状态。

初始化参数来自 `SDKConfig` 与 `ViewerInitOptions`：

- SDK config: `ionAccessToken`、`cesiumBaseUrl`、`logLevel`。
- Viewer options: `baseLayerPicker`、`geocoder`、`homeButton`、`sceneModePicker`、`navigationHelpButton`、`animation`、`timeline`、`fullscreenButton`、`vrButton`、`infoBox`、`selectionIndicator`、`shadows`、`shouldAnimate`、`debugShowFramesPerSecond`、`msaaSamples`、`extra`。

## ViewerManager

`ViewerManager` 负责 Cesium Viewer 的创建、销毁和生命周期 hook。

主要能力：

- `init()`：创建 `Cesium.Viewer`。
- `destroy()`：销毁 viewer 并清理 Cesium 全局资源。
- `getViewer()` / `getCesiumTarget()`：获取底层 `Cesium.Viewer`。
- `isReady`：读取 viewer 是否初始化完成。
- `lifecycle`：管理 viewer lifecycle hook。

## LayerManager

`LayerManager` 当前只管理影像图层。

主要能力：

- `addImageryLayer(provider, options)`：添加 `Cesium.ImageryProvider`，返回 `ImageryLayer`。
- `get(id)`：按 id 获取图层。
- `getAll()`：返回图层 Map snapshot。
- `getByType(type)`：按 `LayerType` 查询图层。
- `remove(id)`：移除指定图层。
- `removeAll()`：移除全部图层。
- `count`：读取图层数量。

`ImageryLayer` 支持：

- `visible`、`show()`、`hide()`：控制显隐。
- `opacity`：读取或设置透明度，范围 `0` 到 `1`。
- `flyTo()`：飞到该影像图层。
- `remove()`：从 viewer 中移除图层。
- `getCesiumTarget()`：获取底层 `Cesium.ImageryLayer`。

## EntityManager

`EntityManager` 当前支持 point、polyline、polygon 三类基础图形。

主要能力：

- `addPoint(id, position, style)`：添加点。
- `addPolyline(id, positions, style)`：添加线，至少 2 个坐标。
- `addPolygon(id, positions, style)`：添加面，至少 3 个坐标。
- `get(id)`：按 id 获取图形。
- `getAll()`：返回图形 Map snapshot。
- `getByType(type)`：按 `GraphicType` 查询图形。
- `remove(id)`：移除指定图形。
- `removeAll()`：移除全部图形。
- `count`：读取图形数量。

图形对象公共能力：

- `visible`、`show()`、`hide()`：控制显隐。
- `flyTo(options)`：飞到图形。
- `remove()`：移除图形。
- `getCesiumTarget()`：获取底层 `Cesium.Entity`。

各图形更新能力：

- `PointGraphic`: `getPosition()`、`setPosition(position)`、`getStyle()`、`setStyle(style)`。
- `PolylineGraphic`: `getPositions()`、`setPositions(positions)`、`getStyle()`、`setStyle(style)`。
- `PolygonGraphic`: `getPositions()`、`setPositions(positions)`、`getStyle()`、`setStyle(style)`。

## CameraManager

`CameraManager` 负责视角读取、飞行、定位、跟踪和书签。

主要能力：

- `getCurrentViewpoint()`：获取当前相机视角。
- `flyTo(viewpoint, options)`：飞到指定 `Viewpoint` 或 `ViewpointData`。
- `flyToPosition(coord, options)`：按 WGS84 坐标飞行。
- `setView(viewpoint)`：立即设置视角。
- `zoomGlobal(duration)`：缩放到全局视角。
- `zoomTo(target, duration)`：飞到 `Cesium.Entity`、`Cesium.EntityCollection` 或 `Cesium.DataSource`。
- `lockTo(entity)` / `unlock()`：设置或取消 `trackedEntity`。
- `addBookmark(id, name, viewpoint)`：添加视角书签，未传 viewpoint 时使用当前视角。
- `getBookmark(id)`、`getAllBookmarks()`、`removeBookmark(id)`、`flyToBookmark(id, options)`：管理和使用书签。
- `getCesiumTarget()`：获取底层 `Cesium.Camera`。
- `destroy()`：清理相机 manager 内部状态。

## PluginManager

插件通过 `CesiumSDK.use(plugin)` 安装。插件接口为：

```typescript
interface ISDKPlugin {
  readonly name: string;
  install(sdk: CesiumSDK): void | Promise<void>;
  destroy(): void | Promise<void>;
}
```

`PluginManager` 支持插件注册、卸载、查询、批量销毁和数量统计。`CesiumSDK.destroy()` 会自动调用已安装插件的 `destroy()`。

## Utilities

当前根入口导出以下通用能力：

- Common: `SDKError`、`ErrorCode`、`EventEmitter`、`ConfigStore`、`DisposePool`、`Logger`、`LogLevel`、`SDK_VERSION`、`WGS84`、`DEG_TO_RAD`、`RAD_TO_DEG`。
- Util: `CoordinateUtil`、`MathUtil`、`ColorUtil`、`MemoryUtil`、`ValidationUtil`。
- Types: `SDKOptions`、`SDKEvents`、`SDKConfig`、`ViewerInitOptions`、`WGS84Coordinate`、`ScreenCoordinate`、`RGBA`、`ViewpointLike`、`AddImageryLayerOptions`、`PointStyle`、`PolylineStyle`、`PolygonStyle`、`FlyToOptions`、`ViewpointBookmark`、`ViewpointData`、`ISDKPlugin`。

## Error Behavior

运行时参数校验由 `ValidationUtil` 负责。常见错误行为：

- 空 id、非法坐标、非法颜色、非法透明度、非法 duration 等参数会抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- 重复图层 id 会抛出 `SDKError(ErrorCode.LAYER_ALREADY_EXISTS, ...)`。
- 重复实体 id 会抛出 `SDKError(ErrorCode.ENTITY_ALREADY_EXISTS, ...)`。
- 重复插件 name 会抛出 `SDKError(ErrorCode.PLUGIN_ALREADY_INSTALLED, ...)`。
- 未初始化时访问 manager 会抛出 `SDKError(ErrorCode.VIEWER_NOT_INITIALIZED, ...)`。
- 已销毁资源继续访问会抛出 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。

## Not Implemented Yet

以下能力不是当前公开实现的一部分，不应作为当前 API 使用：

- Terrain layer
- 3D Tiles layer
- Billboard graphic
- Model graphic
- Drawing
- Measurement
- Spatial analysis
- Roaming

## Build And Test

```bash
npm run typecheck
npm run build
npm test
```

如果 PowerShell execution policy 阻止 `npm.ps1`，可以直接运行底层命令：

```bash
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
node --test tests\*.test.mjs
```

## Development Notes

- 源码使用 UTF-8 编码。
- SDK 保持 framework-agnostic，不假设 React、Vue 或其他宿主框架。
- Cesium assets、workers、token 由宿主应用负责。
- 内部 Cesium cleanup helper 可能触碰 Cesium private API，升级 Cesium 时需要重点验证。
