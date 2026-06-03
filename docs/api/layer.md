# Layer

Layer 模块负责图层抽象和图层管理。当前公开实现包含 imagery layer。

## LayerManager

### constructor(viewer)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `viewer` | `Cesium.Viewer` | 是 | 底层 Viewer。 |

### addImageryLayer(provider, options?)

添加 imagery provider，并返回 SDK 包装后的 `ImageryLayer`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `provider` | `Cesium.ImageryProvider` | 是 | Cesium imagery provider。 |
| `options` | `AddImageryLayerOptions` | 否 | 图层 id 和透明度。 |

| 返回值 | 说明 |
| --- | --- |
| `ImageryLayer` | 新增图层。 |

错误行为：

- `provider` 为空时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- `options.id` 为空字符串时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- `options.opacity` 不在 `0..1` 时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- id 重复时抛出 `SDKError(ErrorCode.LAYER_ALREADY_EXISTS, ...)`。

### get(id)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 图层 id。 |

| 返回值 | 说明 |
| --- | --- |
| `T \| undefined` | 图层不存在时返回 `undefined`。 |

### getAll()

返回图层 Map snapshot，不暴露内部可变集合。

| 返回值 | 说明 |
| --- | --- |
| `ReadonlyMap<string, BaseLayer>` | 图层快照。 |

### getByType(type)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `LayerType` | 是 | 图层类型。 |

| 返回值 | 说明 |
| --- | --- |
| `BaseLayer[]` | 匹配的图层数组。 |

### remove(id)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 图层 id。 |

| 返回值 | 说明 |
| --- | --- |
| `boolean` | 删除成功返回 `true`，不存在返回 `false`。 |

### removeAll()

移除全部图层。

### count

| 类型 | 说明 |
| --- | --- |
| `number` | 当前图层数量。 |

## BaseLayer

### Properties

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 图层 id。 |
| `type` | `LayerType` | 图层类型。 |
| `visible` | `boolean` | 可见状态，可读写。 |

### show()

设置 `visible = true`。

### hide()

设置 `visible = false`。

### flyTo()

飞行到当前图层。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 飞行完成。 |

### remove()

移除图层并释放监听。重复调用会直接返回。

### getCesiumTarget()

获取底层 Cesium 对象。

### LayerEvents

| 事件 | 数据类型 | 说明 |
| --- | --- | --- |
| `visibilityChange` | `{ visible: boolean }` | 可见性变化。 |
| `removed` | `undefined` | 图层移除。 |

## ImageryLayer

### constructor(id, provider, options?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 图层 id。 |
| `provider` | `Cesium.ImageryProvider` | 是 | imagery provider。 |
| `options` | `ImageryLayerOptions` | 否 | 图层选项。 |

### opacity

| 类型 | 说明 |
| --- | --- |
| `number` | 透明度，范围 `0..1`。 |

设置非法透明度会抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。

### flyTo()

调用 `viewer.flyTo(cesiumLayer)`。

### getCesiumTarget()

| 返回值 | 说明 |
| --- | --- |
| `Cesium.ImageryLayer` | 底层 Cesium imagery layer。 |

已移除或未 attach 时抛出 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。

### remove()

从 `viewer.imageryLayers` 中移除图层并释放资源。

## Types

### AddImageryLayerOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 可选图层 id，不传时自动生成 `imagery_N`。 |
| `opacity` | `number` | 初始透明度，范围 `0..1`。 |

### ImageryLayerOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 当前构造函数未使用。 |
| `provider` | `Cesium.ImageryProvider` | 当前构造函数未使用。 |
| `opacity` | `number` | 初始透明度。 |
| `alpha` | `number` | `opacity` 未传时作为初始透明度。 |
| `brightness` | `number` | 当前实现未使用。 |
| `contrast` | `number` | 当前实现未使用。 |
| `minimumTerrainLevel` | `number` | 当前实现未使用。 |
| `maximumTerrainLevel` | `number` | 当前实现未使用。 |

### LayerType

| 成员 | 值 | 说明 |
| --- | --- | --- |
| `IMAGERY` | `"imagery"` | 影像图层。 |
| `CUSTOM` | `"custom"` | 自定义图层类型。 |

### LayerTypeGuard

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `isImagery` | `type: LayerType` | `type is LayerType.IMAGERY` | 判断是否 imagery layer。 |
