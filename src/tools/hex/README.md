# HexRenderer

`HexRenderer` 用于在 Cesium Viewer 中按相机高度绘制六边形线框网格。模块只负责网格计算、渲染和缓存，不维护业务数据。

## 使用方式

```ts
import * as Cesium from "cesium";
import { HexRenderer } from "@leo_blitz/cesium-sdk";

const renderer = new HexRenderer(viewer, {
  lineColor: Cesium.Color.YELLOW.withAlpha(0.8),
  lineWidth: 2,
});

renderer.destroy();
```

组件默认监听相机变化。使用结束后必须调用 `destroy()`，以终止 Worker、移除相机监听并清理 Cesium Primitive。

## Worker 部署

SDK 构建后，Worker 固定输出为 `dist/blitz_workers/hex-renderer.js`。使用 Vite 的宿主项目推荐让宿主构建工具创建 Worker：

```ts
import HexWorker from "@leo_blitz/cesium-sdk/blitz_workers/hex-renderer.js?worker";
import { HexRenderer } from "@leo_blitz/cesium-sdk";

const renderer = new HexRenderer(viewer, {
  workerFactory: () => new HexWorker(),
});
```

这种方式在开发环境和生产构建中都由宿主 Vite 管理 Worker 的创建和最终资源地址，不依赖 SDK 入口文件的 `import.meta.url`，也不会因为 `assetsInlineLimit` 转成 `data:` URL。

非 Vite 项目可以把 `dist/blitz_workers` 复制到站点静态目录，并通过 `workerUrl` 传入同源完整地址。不传 `workerUrl` 时，默认从 `document.baseURI` 下的 `blitz_workers/hex-renderer.js` 加载。

`workerFactory` 和 `workerUrl` 不能同时使用。

新增 Worker 时，入口文件必须使用唯一名称，例如 `terrain-parser.ts`，构建后会自动输出为 `dist/blitz_workers/terrain-parser.js`。构建配置和 `package.json` 已使用名称占位符与通配符导出，不需要为新 Worker 单独增加配置。

## Source Range

不传 `sourceRange` 时使用以下默认范围：

```ts
{
  minLon: -179.66312,
  minLat: -85.585595,
  maxLon: 179.66312,
  maxLat: 85.585595,
}
```

需要限制网格区域时，可以通过 `sourceRange` 传入自定义范围。

## Levels 输入

所有输入都会在构造阶段转换成只读 `levels`。后续相机判断、Worker 计算和缓存只使用转换后的结果。

### 默认生成

不传 `levels` 时，基础边长为 `50` 米，边长倍率为 `3`，使用以下相机高度阈值：

```ts
[5000, 10000, 20000, 100000, 500000, 1000000];
```

生成的高度区间采用 `[minCameraHeight, maxCameraHeight)`。

### 配置生成

```ts
const renderer = new HexRenderer(viewer, {
  sourceRange,
  levels: {
    baseSizeMeters: 100,
    sizeMultiplier: 2,
    cameraHeightThresholds: [1000, 5000, 20000],
  },
});
```

`cameraHeightThresholds` 必须是严格递增的正有限数。生成结果从高度 `0` 开始，最后一级自动延伸到 `Number.POSITIVE_INFINITY`。

### 完整配置

```ts
const renderer = new HexRenderer(viewer, {
  sourceRange,
  levels: [
    {
      level: 1,
      sideLengthMeters: 100,
      minCameraHeight: 0,
      maxCameraHeight: 5000,
    },
    {
      level: 2,
      sideLengthMeters: 500,
      minCameraHeight: 5000,
      maxCameraHeight: Number.POSITIVE_INFINITY,
    },
  ],
});
```

完整配置允许高度区间存在间隔，但不允许区间重叠、重复 level、非正边长或无效高度。当前高度没有匹配项时，已有网格会隐藏。

## 配置项

| 参数                 | 默认值               | 说明                                           |
| -------------------- | -------------------- | ---------------------------------------------- |
| `sourceRange`        | 内置全球范围         | 网格中心点允许出现的经纬度范围                 |
| `levels`             | 默认生成             | level 数组或生成配置                           |
| `workerFactory`      | `undefined`          | 由宿主创建 Worker；Vite 项目推荐使用           |
| `workerUrl`          | 页面基址下的 Worker  | Worker 的同源 URL；用于静态资源部署            |
| `lineColor`          | `#aaa`，透明度 `0.5` | Cesium 线颜色                                  |
| `lineWidth`          | `2`                  | 线宽                                           |
| `chunkSize`          | `32`                 | chunk 横向单元数量                             |
| `chunkHeight`        | `chunkSize`          | chunk 纵向单元数量                             |
| `cachePaddingChunks` | `1`                  | 可视范围外额外保留的 chunk 圈数                |
| `maxChunksPerLevel`  | `64`                 | 每个 level 的最小缓存上限；可见 chunk 始终保留 |
| `rangePaddingDegree` | `0.01`               | 判断视野范围变化的经纬度容差                   |
| `autoListenCamera`   | `true`               | 是否自动监听相机变化                           |

## 生命周期 API

- `getLevels()`：返回 levels 的只读快照。
- `setSourceRange(range)`：校验并更新数据范围，清理旧缓存后重新计算。
- `refresh()`：立即读取相机状态并请求计算。
- `destroy()`：释放 Worker、相机监听和 Primitive；可以重复调用。

`destroy()` 后调用其他 public API 会抛出 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。非法配置会抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。

## 内部流程

1. 主线程根据相机高度从标准化后的 `levels` 中选择当前 level。
2. 主线程将 `sourceRange`、可视范围、当前 level 和已有缓存 key 发给单一 Worker。
3. Worker 计算可视 chunk，并只生成缓存中缺失的线段。
4. 主线程丢弃过期 request id，更新 Cesium `PolylineCollection`。
5. 不可见且超出 padding 的 chunk 立即移除，剩余超量缓存按最近使用时间淘汰。

## 目录职责

- `renderer/`：生命周期、相机监听、渲染和缓存。
- `level/`：默认 level 与输入标准化。
- `calculation/`：chunk 和六边形线段纯计算。
- `worker/`：唯一命名的 Worker 入口、创建逻辑与可测试协议。
- `types/`：public 和 internal 类型。
- `../utils/`：可复用的范围与 Viewer 工具。

## 限制

- `sourceRange` 不支持跨国际日期变更线。
- 六边形经度跨度按 `sourceRange` 中心纬度估算，大范围或高纬度区域会有形变。
- WebGL 平台可能限制可用线宽。
- Cesium assets、Hex Worker 路径及 token 仍由宿主应用配置。
