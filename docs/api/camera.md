# Camera

Camera 模块负责视角读取、飞行、直接设置视角、全局缩放、目标跟踪和书签。

## CameraManager

### constructor(viewer)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `viewer` | `Cesium.Viewer` | 是 | 底层 Viewer。 |

### getCurrentViewpoint()

| 返回值 | 说明 |
| --- | --- |
| `Viewpoint` | 当前 camera 位置和朝向。 |

### flyTo(viewpoint, options?)

飞行到指定视角。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `viewpoint` | `Viewpoint \| ViewpointData` | 是 | 目标视角。 |
| `options` | `FlyToOptions` | 否 | 飞行参数。 |

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 飞行完成。 |

错误行为：

- `viewpoint` 坐标或角度非法时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- `duration` 小于 0 或非 finite number 时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- `maximumHeight` 小于 0 或非 finite number 时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- Cesium flight cancel 时 reject `Error("Flight cancelled")`。

### flyToPosition(coord, options?)

飞行到 WGS84 坐标。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `coord` | `WGS84Coordinate` | 是 | 目标坐标。 |
| `options` | `FlyToOptions & { heading?: number; pitch?: number }` | 否 | 飞行和朝向参数。 |

说明：

- `coord.height` 未传时使用 `1000`。
- `heading`、`pitch` 未传时使用 `Viewpoint` 默认值。

### setView(viewpoint)

立即设置 camera 视角，不执行飞行动画。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `viewpoint` | `Viewpoint \| ViewpointData` | 是 | 目标视角。 |

### zoomGlobal(duration?)

飞行到内置全球视角 `{ longitude: 105, latitude: 35, height: 20000000 }`。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `duration` | `number` | `2` | 飞行时长，必须大于等于 0。 |

### zoomTo(target, duration?)

飞行到 Cesium target。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `target` | `Cesium.Entity \| Cesium.EntityCollection \| Cesium.DataSource` | - | 目标对象。 |
| `duration` | `number` | `2` | 飞行时长。 |

### lockTo(entity)

设置 `viewer.trackedEntity`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entity` | `Cesium.Entity` | 是 | 要跟踪的 entity。 |

### unlock()

清除 `viewer.trackedEntity`。

### addBookmark(id, name, viewpoint?)

新增视角书签。如果不传 `viewpoint`，使用当前视角。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 书签 id。 |
| `name` | `string` | 是 | 书签名称，必须是非空字符串。 |
| `viewpoint` | `ViewpointData` | 否 | 书签视角。 |

| 返回值 | 说明 |
| --- | --- |
| `ViewpointBookmark` | 书签副本。 |

说明：当前实现不会阻止重复 id，新书签会覆盖旧书签。

### getBookmark(id)

| 返回值 | 说明 |
| --- | --- |
| `ViewpointBookmark \| undefined` | 书签副本，不存在时返回 `undefined`。 |

### getAllBookmarks()

| 返回值 | 说明 |
| --- | --- |
| `ViewpointBookmark[]` | 全部书签副本。 |

### removeBookmark(id)

| 返回值 | 说明 |
| --- | --- |
| `boolean` | 删除成功返回 `true`，不存在返回 `false`。 |

### flyToBookmark(id, options?)

飞行到书签视角。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 书签存在时等待飞行完成；不存在时直接返回。 |

### getCesiumTarget()

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Camera` | 底层 Cesium camera。 |

### destroy()

清空书签并释放本地资源。

## Viewpoint

### constructor(data)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | `ViewpointData` | 是 | 视角数据。 |

默认值：

- `heading`: `0`
- `pitch`: `-90`
- `roll`: `0`

### toObject()

| 返回值 | 说明 |
| --- | --- |
| `ViewpointData` | 当前视角数据。 |

### toCartesian()

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Cartesian3` | 由经纬度和高度转换的 Cartesian3。 |

### static fromCartesian(cartesian, heading?, pitch?, roll?)

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `cartesian` | `Cesium.Cartesian3` | - | 位置。 |
| `heading` | `number` | `0` | heading，单位 degree。 |
| `pitch` | `number` | `-90` | pitch，单位 degree。 |
| `roll` | `number` | `0` | roll，单位 degree。 |

### static fromCamera(camera)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `camera` | `Cesium.Camera` | 是 | Cesium camera。 |

| 返回值 | 说明 |
| --- | --- |
| `Viewpoint` | 从 camera 读取的位置和朝向。 |

## Types

### ViewpointData

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `longitude` | `number` | 是 | 经度，范围 `-180..180`。 |
| `latitude` | `number` | 是 | 纬度，范围 `-90..90`。 |
| `height` | `number` | 是 | 高度，必须是 finite number。 |
| `heading` | `number` | 否 | heading，单位 degree。 |
| `pitch` | `number` | 否 | pitch，单位 degree。 |
| `roll` | `number` | 否 | roll，单位 degree。 |

### FlyToOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `duration` | `number` | 飞行时长，必须大于等于 0。 |
| `maximumHeight` | `number` | 飞行最大高度，必须大于等于 0。 |

### ViewpointBookmark

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 书签 id。 |
| `name` | `string` | 书签名称。 |
| `viewpoint` | `ViewpointData` | 书签视角。 |
