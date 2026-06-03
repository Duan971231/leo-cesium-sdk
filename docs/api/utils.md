# Utils

Utils 模块包含坐标、数学、颜色、内存清理和参数校验工具。

## CoordinateUtil

### toCartesian(coord)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `coord` | `WGS84Coordinate` | 是 | WGS84 坐标。 |

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Cartesian3` | Cartesian3 坐标。 |

### toCartesians(coords)

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Cartesian3[]` | Cartesian3 坐标数组。 |

### toWGS84(cartesian)

| 返回值 | 说明 |
| --- | --- |
| `WGS84Coordinate` | WGS84 坐标。 |

失败时抛出 `SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, ...)`。

### toScreen(cartesian, scene)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cartesian` | `Cesium.Cartesian3` | 是 | 世界坐标。 |
| `scene` | `Cesium.Scene` | 是 | Cesium scene。 |

| 返回值 | 说明 |
| --- | --- |
| `ScreenCoordinate` | 窗口坐标。 |

### fromScreen(screen, scene)

从屏幕坐标拾取 globe 交点。

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Cartesian3` | globe 交点。 |

失败时抛出 `SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, ...)`。

### screenToWGS84(screen, scene)

| 返回值 | 说明 |
| --- | --- |
| `WGS84Coordinate` | 屏幕坐标对应的 WGS84 坐标。 |

### wgs84ToScreen(coord, scene)

| 返回值 | 说明 |
| --- | --- |
| `ScreenCoordinate` | WGS84 坐标对应的屏幕坐标。 |

### isValid(cartesian)

| 返回值 | 说明 |
| --- | --- |
| `boolean` | Cartesian3 已定义且 x/y/z 都是 finite number 时返回 `true`。 |

### WGS84Coordinate

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `longitude` | `number` | 是 | 经度。 |
| `latitude` | `number` | 是 | 纬度。 |
| `height` | `number` | 否 | 高度。 |

### ScreenCoordinate

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `x` | `number` | 是 | 屏幕 x。 |
| `y` | `number` | 是 | 屏幕 y。 |

## MathUtil

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `haversineDistance` | `(a: WGS84Coordinate, b: WGS84Coordinate)` | `number` | 球面距离，单位 meter。 |
| `euclideanDistance` | `(a: Cesium.Cartesian3, b: Cesium.Cartesian3)` | `number` | Cartesian3 欧氏距离。 |
| `sphericalArea` | `(ring: WGS84Coordinate[])` | `number` | 球面面积，少于 3 个点返回 `0`。 |
| `degToRad` | `(deg: number)` | `number` | degree 转 radian。 |
| `radToDeg` | `(rad: number)` | `number` | radian 转 degree。 |
| `lerp` | `(start: number, end: number, t: number)` | `number` | 线性插值，`t` 会 clamp 到 `0..1`。 |
| `clamp` | `(value: number, min: number, max: number)` | `number` | 数值 clamp。 |

## ColorUtil

### fromCss(css)

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Color` | 从 CSS color string 创建 Cesium color。 |

### toRGBA(color)

| 返回值 | 说明 |
| --- | --- |
| `RGBA` | Cesium color 的 rgba 值。 |

### fromRGBA(rgba)

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Color` | 从 RGBA 创建 Cesium color。 |

### fromHex(hex)

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Color` | 从 hex string 创建 Cesium color。 |

### toHex(color)

| 返回值 | 说明 |
| --- | --- |
| `string` | `#rrggbb`，不包含 alpha。 |

### withAlpha(color, alpha)

| 返回值 | 说明 |
| --- | --- |
| `Cesium.Color` | 设置 alpha 后的新 Cesium color。 |

### RGBA

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `r` | `number` | red，Cesium 使用 `0..1`。 |
| `g` | `number` | green，Cesium 使用 `0..1`。 |
| `b` | `number` | blue，Cesium 使用 `0..1`。 |
| `a` | `number` | alpha，Cesium 使用 `0..1`。 |

## MemoryUtil

这些方法用于清理 Cesium 内部缓存或 WebGL 上下文。部分方法访问 Cesium 私有字段，失败时会记录日志并尽量忽略。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `cleanupCesiumGlobals` | `()` | `void` | 依次清理 RenderState、RequestScheduler、ResourceCache 和 decoder workers。 |
| `clearRenderStateCache` | `()` | `void` | 清理 RenderState cache。 |
| `clearRequestScheduler` | `()` | `void` | 清理 RequestScheduler。 |
| `clearResourceCache` | `()` | `void` | 销毁 ResourceCache entries。 |
| `destroyDecoderWorkers` | `()` | `void` | 销毁 Draco/KTX2 task processor。 |
| `loseWebGLContext` | `(scene: Cesium.Scene)` | `void` | 尝试主动 lose WebGL context。 |

## ValidationUtil

所有校验失败都会抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。

| 方法 | 参数 | 说明 |
| --- | --- | --- |
| `id` | `(value: string, label: string)` | 校验非空字符串。 |
| `coordinate` | `(value: WGS84Coordinate, label?)` | 校验经纬度和可选 height。 |
| `positions` | `(positions: WGS84Coordinate[], minCount: number, label: string)` | 校验坐标数组最小长度和每个坐标。 |
| `viewpoint` | `(value: ViewpointLike)` | 校验 viewpoint 坐标、height 和角度。 |
| `angle` | `(value: number \| undefined, label: string)` | 校验角度是 finite number。 |
| `duration` | `(value: number \| undefined)` | 校验 duration 大于等于 0。 |
| `nonNegativeNumber` | `(value: number \| undefined, label: string)` | 校验数值大于等于 0。 |
| `positiveNumber` | `(value: number \| undefined, label: string)` | 校验数值大于 0。 |
| `opacity` | `(value: number \| undefined, label?)` | 校验透明度在 `0..1`。 |
| `cssColor` | `(value: string \| undefined, label: string)` | 校验 CSS color。 |

### ViewpointLike

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `longitude` | `number` | 是 | 经度。 |
| `latitude` | `number` | 是 | 纬度。 |
| `height` | `number` | 是 | 高度。 |
| `heading` | `number` | 否 | heading。 |
| `pitch` | `number` | 否 | pitch。 |
| `roll` | `number` | 否 | roll。 |
