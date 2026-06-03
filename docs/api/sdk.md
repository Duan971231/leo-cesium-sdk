# SDK

SDK 入口由 `CesiumSDK` 提供，负责创建 Viewer，并在 ready 后挂载 layer、entity、camera 和 plugin manager。

## CesiumSDK

### constructor(container, options?)

创建 SDK 实例，但不会立即创建 `Cesium.Viewer`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `container` | `string \| HTMLElement` | 是 | Cesium Viewer 容器 id 或 DOM 元素。 |
| `options` | `SDKOptions` | 否 | SDK 配置和 Viewer 初始化参数。 |

```ts
const sdk = new CesiumSDK("cesiumContainer", {
  ionAccessToken: "token",
  cesiumBaseUrl: "/cesium",
  shouldAnimate: true,
});
```

### ready()

初始化 Viewer、LayerManager、EntityManager、CameraManager 和 PluginManager。

| 返回值 | 说明 |
| --- | --- |
| `Promise<this>` | 初始化完成后的 SDK 实例。 |

错误行为：

- SDK 已销毁时抛出 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。
- Viewer 重复初始化时由 `ViewerManager` 抛出 `SDKError(ErrorCode.VIEWER_ALREADY_EXISTS, ...)`。

### use(plugin)

安装插件。必须在 `ready()` 后调用。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `plugin` | `ISDKPlugin` | 是 | 插件对象。 |

| 返回值 | 说明 |
| --- | --- |
| `Promise<this>` | 当前 SDK 实例。 |

### getPlugin(name)

按名称获取已安装插件。必须在 `ready()` 后调用。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 插件名称。 |

| 返回值 | 说明 |
| --- | --- |
| `T \| undefined` | 匹配插件，不存在时返回 `undefined`。 |

### onLifecycle(hook, callback)

注册 Viewer 生命周期回调。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `hook` | `"beforeInit" \| "afterInit" \| "beforeDestroy" \| "afterDestroy"` | 是 | 生命周期节点。 |
| `callback` | `() => void` | 是 | 回调函数。 |

| 返回值 | 说明 |
| --- | --- |
| `() => void` | 取消监听函数。 |

### destroy()

销毁插件、camera、entity、layer、viewer 和事件监听。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 销毁完成。 |

说明：

- 可重复调用，已销毁时直接返回。
- 未初始化时也会释放本地资源并进入 disposed 状态。

### getCesiumViewer()

获取底层 `Cesium.Viewer`。必须在 `ready()` 后调用。

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Viewer` | Cesium Viewer 实例。 |

## Properties

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `viewer` | `ViewerManager` | Viewer manager。 |
| `config` | `ConfigStore` | SDK 配置存储。 |
| `initialized` | `boolean` | 是否完成初始化。 |
| `disposed` | `boolean` | 是否已销毁。 |
| `layer` | `LayerManager` | 图层管理器，未 ready 时访问会抛错。 |
| `entity` | `EntityManager` | 实体管理器，未 ready 时访问会抛错。 |
| `camera` | `CameraManager` | 相机管理器，未 ready 时访问会抛错。 |

## Types

### SDKOptions

`SDKOptions` 继承 `SDKConfig` 和 `ViewerInitOptions`。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ionAccessToken` | `string` | Cesium Ion token。 |
| `cesiumBaseUrl` | `string` | Cesium assets base url。 |
| `logLevel` | `LogLevel` | 日志等级。 |
| Viewer options | `ViewerInitOptions` | 详见 [Viewer](/api/viewer)。 |

### SDKEvents

| 事件 | 数据类型 | 说明 |
| --- | --- | --- |
| `ready` | `undefined` | SDK 初始化完成。 |
| `destroy` | `undefined` | SDK 已销毁。 |
| `error` | `SDKError` | 错误事件。 |
