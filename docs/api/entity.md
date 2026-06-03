# Entity

Entity 模块负责点、线、面图形的创建、更新、移除和 Cesium entity escape hatch。

## EntityManager

### constructor(viewer)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `viewer` | `Cesium.Viewer` | 是 | 底层 Viewer。 |

### addPoint(id, position, style?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | entity id。 |
| `position` | `WGS84Coordinate` | 是 | 点坐标。 |
| `style` | `PointStyle` | 否 | 点样式。 |

| 返回值 | 说明 |
| --- | --- |
| `PointGraphic` | 点图形实例。 |

### addPolyline(id, positions, style?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | entity id。 |
| `positions` | `WGS84Coordinate[]` | 是 | 线坐标，至少 2 个点。 |
| `style` | `PolylineStyle` | 否 | 线样式。 |

| 返回值 | 说明 |
| --- | --- |
| `PolylineGraphic` | 线图形实例。 |

### addPolygon(id, positions, style?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | entity id。 |
| `positions` | `WGS84Coordinate[]` | 是 | 面坐标，至少 3 个点。 |
| `style` | `PolygonStyle` | 否 | 面样式。 |

| 返回值 | 说明 |
| --- | --- |
| `PolygonGraphic` | 面图形实例。 |

### get(id)

| 返回值 | 说明 |
| --- | --- |
| `T \| undefined` | 图形不存在时返回 `undefined`。 |

### getAll()

| 返回值 | 说明 |
| --- | --- |
| `ReadonlyMap<string, BaseGraphic>` | 图形 Map snapshot。 |

### getByType(type)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `GraphicType` | 是 | 图形类型。 |

| 返回值 | 说明 |
| --- | --- |
| `BaseGraphic[]` | 匹配的图形数组。 |

### remove(id)

| 返回值 | 说明 |
| --- | --- |
| `boolean` | 删除成功返回 `true`，不存在返回 `false`。 |

### removeAll()

移除全部图形。

### count

| 类型 | 说明 |
| --- | --- |
| `number` | 当前图形数量。 |

## BaseGraphic

### Properties

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 图形 id。 |
| `type` | `GraphicType` | 图形类型。 |
| `visible` | `boolean` | 可见状态，可读写。 |

### show()

设置 `visible = true`。

### hide()

设置 `visible = false`。

### flyTo(options?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `options.duration` | `number` | 否 | 飞行时长。当前方法透传给 Cesium，未做运行时校验。 |

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 飞行完成。 |

### remove()

从 `viewer.entities` 中移除 entity 并释放监听。重复调用会直接返回。

### getCesiumTarget()

| 返回值 | 说明 |
| --- | --- |
| `T` | 底层 `Cesium.Entity` 或泛型指定对象。 |

已移除时抛出 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。

### GraphicEvents

| 事件 | 数据类型 | 说明 |
| --- | --- | --- |
| `visibilityChange` | `{ visible: boolean }` | 可见性变化。 |
| `updated` | `undefined` | 位置或样式更新。 |
| `removed` | `undefined` | 图形移除。 |

## PointGraphic

### getPosition()

| 返回值 | 说明 |
| --- | --- |
| `WGS84Coordinate` | 点坐标副本。 |

### setPosition(position)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `position` | `WGS84Coordinate` | 是 | 新坐标。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例，支持链式调用。 |

### getStyle()

| 返回值 | 说明 |
| --- | --- |
| `Required<PointStyle>` | 点样式副本。 |

### setStyle(style)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `style` | `PointStyle` | 是 | 部分点样式，会与现有样式合并。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例。 |

## PolylineGraphic

### getPositions()

| 返回值 | 说明 |
| --- | --- |
| `WGS84Coordinate[]` | 线坐标副本。 |

### setPositions(positions)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `positions` | `WGS84Coordinate[]` | 是 | 新坐标，至少 2 个点。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例。 |

### getStyle()

| 返回值 | 说明 |
| --- | --- |
| `Required<PolylineStyle>` | 线样式副本。 |

### setStyle(style)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `style` | `PolylineStyle` | 是 | 部分线样式，会与现有样式合并。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例。 |

## PolygonGraphic

### getPositions()

| 返回值 | 说明 |
| --- | --- |
| `WGS84Coordinate[]` | 面坐标副本。 |

### setPositions(positions)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `positions` | `WGS84Coordinate[]` | 是 | 新坐标，至少 3 个点。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例。 |

### getStyle()

| 返回值 | 说明 |
| --- | --- |
| `Required<PolygonStyle>` | 面样式副本。 |

### setStyle(style)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `style` | `PolygonStyle` | 是 | 部分面样式，会与现有样式合并。 |

| 返回值 | 说明 |
| --- | --- |
| `this` | 当前实例。 |

## Style Types

### PointStyle

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pixelSize` | `number` | `10` | 点像素大小，必须大于 0。 |
| `color` | `string` | `"#FFFFFF"` | CSS color。 |
| `outlineColor` | `string` | `"#000000"` | CSS color。 |
| `outlineWidth` | `number` | `1` | 描边宽度，必须大于等于 0。 |
| `heightReference` | `"none" \| "clamp" \| "relative"` | `"none"` | 高程参考。 |

### PolylineStyle

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `width` | `number` | `2` | 线宽，必须大于 0。 |
| `color` | `string` | `"#FFFFFF"` | CSS color。 |
| `clampToGround` | `boolean` | `false` | 是否贴地。 |

### PolygonStyle

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `"#FFFFFF"` | CSS color，当前实现会以 `0.5` alpha 渲染。 |
| `outline` | `boolean` | `true` | 是否显示轮廓。 |
| `outlineColor` | `string` | `"#000000"` | CSS color。 |
| `outlineWidth` | `number` | `1` | 当前实现会校验但未应用到 Cesium polygon。 |
| `heightReference` | `"none" \| "clamp" \| "relative"` | `"none"` | 高程参考。 |
| `extrudedHeight` | `number` | `0` | 拉伸高度，必须大于等于 0。 |

## GraphicType

| 成员 | 值 | 说明 |
| --- | --- | --- |
| `POINT` | `"point"` | 点。 |
| `POLYLINE` | `"polyline"` | 线。 |
| `POLYGON` | `"polygon"` | 面。 |

## 参数校验

- `id` 必须是非空字符串。
- `WGS84Coordinate.longitude` 必须在 `-180..180`。
- `WGS84Coordinate.latitude` 必须在 `-90..90`。
- `height` 如果传入，必须是 finite number。
- 重复 id 会抛出 `SDKError(ErrorCode.ENTITY_ALREADY_EXISTS, ...)`。
