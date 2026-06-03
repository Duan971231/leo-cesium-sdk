# Viewer

Viewer 模块负责 `Cesium.Viewer` 的创建、销毁和生命周期 hook。

## ViewerManager

### constructor(container, options)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `container` | `string \| HTMLElement` | 是 | Cesium Viewer 容器。 |
| `options` | `ViewerInitOptions` | 是 | Viewer 初始化参数。 |

### init()

创建 `Cesium.Viewer`。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 初始化完成。 |

错误行为：

- 已初始化时抛出 `SDKError(ErrorCode.VIEWER_ALREADY_EXISTS, ...)`。

### destroy()

销毁 Viewer，触发生命周期 hook，并清理 Cesium 全局缓存。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 销毁完成。 |

### getViewer()

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Viewer` | 当前 Viewer。 |

错误行为：

- Viewer 未初始化时抛出 `SDKError(ErrorCode.VIEWER_NOT_INITIALIZED, ...)`。

### getCesiumTarget()

`getViewer()` 的别名，用于获取底层 Cesium 对象。

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Viewer` | 当前 Viewer。 |

## Properties

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `isReady` | `boolean` | Viewer 是否已完成初始化。 |
| `lifecycle` | `Lifecycle` | 生命周期管理器。 |

## ViewerInitOptions

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `baseLayerPicker` | `boolean` | `false` | 是否显示底图选择器。 |
| `geocoder` | `boolean` | `false` | 是否显示 geocoder。 |
| `homeButton` | `boolean` | `false` | 是否显示 home button。 |
| `sceneModePicker` | `boolean` | `false` | 是否显示 scene mode picker。 |
| `navigationHelpButton` | `boolean` | `false` | 是否显示 navigation help。 |
| `animation` | `boolean` | `false` | 是否显示 animation widget。 |
| `timeline` | `boolean` | `false` | 是否显示 timeline。 |
| `fullscreenButton` | `boolean` | `false` | 是否显示 fullscreen button。 |
| `vrButton` | `boolean` | `false` | 是否显示 VR button。 |
| `infoBox` | `boolean` | `false` | 是否显示 info box。 |
| `selectionIndicator` | `boolean` | `false` | 是否显示 selection indicator。 |
| `shadows` | `boolean` | `false` | 是否启用 shadows。 |
| `shouldAnimate` | `boolean` | `true` | Viewer 是否自动动画。 |
| `debugShowFramesPerSecond` | `boolean` | `false` | 是否显示 FPS。 |
| `msaaSamples` | `number` | `undefined` | MSAA samples。 |
| `extra` | `Record<string, unknown>` | `undefined` | 透传给 Cesium Viewer 的额外参数。 |

## Lifecycle

### on(hook, callback)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `hook` | `LifecycleHook` | 是 | 生命周期 hook。 |
| `callback` | `() => void \| Promise<void>` | 是 | 回调。 |

| 返回值 | 说明 |
| --- | --- |
| `() => void` | 取消监听函数。 |

### emit(hook)

按注册顺序执行指定 hook 的所有回调。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 执行完成。 |

### removeAllListeners()

清空全部生命周期监听。

## LifecycleHook

```ts
type LifecycleHook =
  | "beforeInit"
  | "afterInit"
  | "beforeDestroy"
  | "afterDestroy";
```
