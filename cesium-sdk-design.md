# Cesium SDK 设计文档

> 通用平台 SDK，面向 GIS 通用场景（城市规划、应急指挥、军事仿真、数据可视化等）
> Cesium 版本：1.128.0 | 构建工具：Vite | 包策略：单包

---

## 一、决策记录

| 决策项 | 结论 | 理由 |
|--------|------|------|
| 包策略 | 单包 | 早期功能边界不明确，单包简单直接，稳定后再拆 |
| Vue 绑定 | 不必须 | SDK 保持框架无关，Vue 集成在上层业务做 |
| Cesium 依赖 | peerDependency | 用户自行安装 Cesium，SDK 不捆绑版本 |
| 构建工具 | Vite (Rollup) | 开发体验好，产物支持 ESM/CJS/UMD |

---

## 二、架构分层

```
┌──────────────────────────────────────────┐
│  L3 业务功能层（Draw/Measure/Analysis/Roam）│  ← 可选模块，按需 import
├──────────────────────────────────────────┤
│  L2 核心管理层（Viewer/Layer/Entity/Camera）│  ← 核心，必须加载
├──────────────────────────────────────────┤
│  L1 基础设施层（Event/Config/Logger/Coord）│  ← 核心，必须加载
└──────────────────────────────────────────┘
     ↓ 最底层：Cesium 1.128.0（peerDependency，外部依赖）
```

---

## 三、目录结构

```
cesium-sdk/
├── src/
│   ├── index.ts                       # 统一导出
│   │
│   ├── viewer/                        # ── Viewer 管理 ──
│   │   ├── ViewerManager.ts           #   生命周期、初始化、销毁
│   │   ├── ViewerOptions.ts           #   配置类型定义
│   │   └── Lifecycle.ts               #   生命周期钩子（onReady/onDestroy）
│   │
│   ├── layer/                         # ── 图层管理 ──
│   │   ├── LayerManager.ts            #   统一图层 CRUD
│   │   ├── BaseLayer.ts               #   图层抽象基类
│   │   ├── ImageryLayer.ts            #   影像图层
│   │   ├── TerrainLayer.ts            #   地形图层
│   │   ├── TilesetLayer.ts            #   3DTiles 图层
│   │   └── LayerType.ts               #   图层类型枚举 + 类型守卫
│   │
│   ├── entity/                        # ── 实体/图元管理 ──
│   │   ├── EntityManager.ts           #   统一实体 CRUD
│   │   ├── BaseGraphic.ts             #   图形抽象基类
│   │   ├── PointGraphic.ts
│   │   ├── PolylineGraphic.ts
│   │   ├── PolygonGraphic.ts
│   │   ├── ModelGraphic.ts
│   │   ├── BillboardGraphic.ts
│   │   └── GraphicStyle.ts            #   统一样式类型
│   │
│   ├── camera/                        # ── 相机管理 ──
│   │   ├── CameraManager.ts           #   飞行、锁定、视点管理
│   │   ├── Viewpoint.ts               #   视点数据模型
│   │   └── ViewpointBookmarks.ts      #   视点书签（增删改查）
│   │
│   ├── plugins/                       # ── L3 业务功能 ──
│   │   ├── PluginManager.ts           #   插件注册/卸载
│   │   ├── types.ts                   #   插件接口定义
│   │   │
│   │   ├── draw/                      #   交互绘制
│   │   │   ├── DrawManager.ts
│   │   │   ├── Drawers/
│   │   │   │   ├── PointDrawer.ts
│   │   │   │   ├── PolylineDrawer.ts
│   │   │   │   ├── PolygonDrawer.ts
│   │   │   │   └── RectangleDrawer.ts
│   │   │   └── DrawState.ts           #   绘制状态机
│   │   │
│   │   ├── measure/                   #   测量
│   │   │   ├── MeasureManager.ts
│   │   │   ├── DistanceMeasure.ts
│   │   │   ├── AreaMeasure.ts
│   │   │   └── HeightMeasure.ts
│   │   │
│   │   ├── analysis/                  #   空间分析
│   │   │   ├── SlopeAnalysis.ts       #   坡度坡向
│   │   │   ├── ViewshedAnalysis.ts    #   通视分析
│   │   │   ├── ContourAnalysis.ts     #   等高线
│   │   │   └── ClipAnalysis.ts        #   裁剪分析
│   │   │
│   │   ├── roam/                      #   漫游
│   │   │   ├── RoamManager.ts
│   │   │   ├── RoutePlayer.ts         #   路线回放
│   │   │   └── KeyboardRoam.ts        #   键盘漫游
│   │   │
│   │   └── spatial/                   #   空间查询
│   │       ├── SpatialIndex.ts
│   │       └── BufferQuery.ts
│   │
│   ├── common/                        # ── L1 基础设施 ──
│   │   ├── EventEmitter.ts            #   发布订阅
│   │   ├── ConfigStore.ts             #   全局配置（Ion token、服务地址等）
│   │   ├── DisposePool.ts             #   统一资源销毁池
│   │   ├── Logger.ts                  #   日志（分级、可配置输出）
│   │   └── Constants.ts               #   常量
│   │
│   └── util/                          # ── 工具函数 ──
│       ├── CoordinateUtil.ts          #   WGS84/笛卡尔/屏幕坐标互转
│       ├── MathUtil.ts                #   数学计算
│       ├── ColorUtil.ts               #   颜色处理
│       └── MemoryUtil.ts             #   Cesium 内存清理封装
│
├── types/                             # 类型声明
│   ├── index.d.ts
│   └── cesium-ext.d.ts               #   Cesium 类型补充
│
├── vite.config.ts                     # Vite 构建配置
├── tsconfig.json
├── package.json
└── README.md
```

---

## 四、核心设计模式

### 4.1 管理器模式

所有资源通过 Manager 统一管理，Manager 负责 CRUD + 生命周期：

```typescript
// 使用示例
const sdk = new CesiumSDK(container, options);

const layerMgr = sdk.getLayerManager();
const entityMgr = sdk.getEntityManager();
const cameraMgr = sdk.getCameraManager();

// 级联销毁：sdk.destroy() 自动销毁所有子 Manager
sdk.destroy();
```

### 4.2 DisposePool（统一销毁池）

基于 Cesium 1.128.0 内存泄漏分析，这是最关键的内部模块：

```typescript
class DisposePool {
  private disposables: { dispose: () => void }[] = [];

  // 自动适配 Cesium 的 destroy 和自定义 dispose
  add(item: { destroy?: () => void; dispose?: () => void }): void;

  // 批量销毁
  disposeAll(): void;

  // Cesium 全局静态资源清理（基于泄漏清单）
  static cleanupCesiumGlobals(): void;
}
```

### 4.3 图层统一抽象

Imagery / Terrain / 3DTiles 统一为 ILayer 接口：

```typescript
interface ILayer {
  id: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  show(): void;
  hide(): void;
  flyTo(): Promise<void>;
  remove(): void;
  getCesiumTarget(): any; // escape hatch，允许直接访问 Cesium 原生对象
}
```

### 4.4 插件体系

```typescript
interface ISDKPlugin {
  name: string;
  install(sdk: CesiumSDK): void;
  destroy(): void;
}

// 使用
sdk.use(new DrawPlugin());
sdk.use(new MeasurePlugin());
```

### 4.5 Entity vs Primitive 双轨制

| 场景 | API | 原因 |
|------|-----|------|
| 少量实体（< 1000） | Entity API | 开发简单，数据驱动 |
| 批量渲染（> 1000） | Primitive API | 高性能，需手动管理 |
| SDK 策略 | 默认 Entity，提供 `usePrimitive: true` 切换 | 用户无需感知底层差异 |

---

## 五、内存泄漏处理策略

基于 Cesium 1.128.0 源码分析：

### 可清理的（MemoryUtil.ts 封装）

| 泄漏源 | 清理方式 |
|--------|---------|
| RenderState 缓存 | `Cesium.RenderState.clearCache()` |
| RequestScheduler 状态 | `Cesium.RequestScheduler.clearForSpecs()` |
| DracoLoader Worker | `Cesium.DracoLoader._decoderTaskProcessor.destroy()` |
| KTX2Transcoder Worker | `Cesium.KTX2Transcoder._transcodeTaskProcessor.destroy()` |
| ResourceCache | 遍历 `Cesium.ResourceCache.cacheEntries` 逐个 destroy + delete |
| WebGL 上下文 | `gl.getExtension('WEBGL_lose_context').loseContext()` |

### 不可清理的（文档说明）

| 泄漏源 | 说明 |
|--------|------|
| HeightmapTerrainData Worker | 地形网格 Worker，模块 const |
| QuantizedMeshTerrainData Worker | 量化网格 Worker |
| Primitive combineGeometry Worker | 几何合并 Worker |
| Vector3DTile* Worker (5个) | 矢量瓦片 Worker |
| Transforms 变换缓存 | 坐标变换矩阵 |

SDK 的 `ViewerManager.destroy()` 执行顺序：
1. 停止渲染循环 (`useDefaultRenderLoop = false`)
2. 销毁所有子 Manager（图层、实体、相机、插件）
3. 清理全局静态缓存 (`MemoryUtil.cleanupCesiumGlobals()`)
4. 调用 `viewer.destroy()`
5. 可选：丢失 WebGL 上下文

---

## 六、构建配置

### package.json 关键配置

```json
{
  "name": "cesium-sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/cesium-sdk.cjs",
  "module": "./dist/cesium-sdk.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/cesium-sdk.es.js",
      "require": "./dist/cesium-sdk.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "cesium": "^1.128.0"
  },
  "devDependencies": {
    "cesium": "1.128.0",
    "vite": "^6.x",
    "typescript": "^5.x",
    "vite-plugin-dts": "^4.x"
  }
}
```

### Vite 构建要点

- 外部化 Cesium：`build.rollupOptions.external: ['cesium']`
- 生成类型声明：使用 `vite-plugin-dts`
- 产物格式：ESM + CJS 双格式
- 不打包 Cesium Workers/Assets（由宿主项目处理）

---

## 七、API 设计原则

1. **顶层封装 + 底层可访问**：所有 Manager 暴露 `getCesiumTarget()` 作为 escape hatch
2. **异步优先**：所有可能异步的操作返回 Promise
3. **链式调用**：返回 this 的方法支持链式
4. **类型严格**：零 any，所有公开 API 有完整 JSDoc
5. **Tree-shaking 友好**：ESM 导出，按需 import

---

## 八、开发路线

### Phase 1 — 核心骨架（L1 + L2）

- [ ] 项目初始化（Vite + TS + package.json）
- [ ] EventEmitter + ConfigStore + Logger
- [ ] DisposePool + MemoryUtil
- [ ] CoordinateUtil
- [ ] ViewerManager（初始化、销毁、生命周期）
- [ ] LayerManager + BaseLayer + ImageryLayer
- [ ] EntityManager + BaseGraphic + 基础图形（Point/Polyline/Polygon）
- [ ] CameraManager + Viewpoint

### Phase 2 — 完善核心

- [ ] TerrainLayer + TilesetLayer
- [ ] ModelGraphic + BillboardGraphic
- [ ] PluginManager + 插件接口
- [ ] ViewpointBookmarks
- [ ] 完善类型定义

### Phase 3 — 业务插件（L3）

- [ ] DrawPlugin（交互绘制，支持撤销/重做）
- [ ] MeasurePlugin（距离/面积/高度）
- [ ] AnalysisPlugin（坡度/通视/等高线/裁剪）
- [ ] RoamPlugin（路线回放/键盘漫游）
- [ ] SpatialPlugin（空间索引/缓冲区查询）

### Phase 4 — 打磨

- [ ] 单元测试（Cesium mock 策略）
- [ ] API 文档（TypeDoc）
- [ ] Example / Playground
- [ ] 性能基准测试
- [ ] CI/CD 构建发布流程
