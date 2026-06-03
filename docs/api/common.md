# Common

Common 模块包含错误、事件、配置、释放池、日志和常量。

## SDKError

### constructor(code, message, detail?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | `ErrorCode` | 是 | 错误码。 |
| `message` | `string` | 是 | 错误信息。 |
| `detail` | `unknown` | 否 | 附加数据。 |

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `"SDKError"` | 错误名称。 |
| `code` | `ErrorCode` | 错误码。 |
| `detail` | `unknown` | 附加数据。 |

## ErrorCode

详见 [错误码](/reference/errors)。

## EventEmitter

### on(event, callback)

注册事件监听。

| 返回值 | 说明 |
| --- | --- |
| `() => void` | 取消监听函数。 |

### once(event, callback)

注册一次性事件监听。

| 返回值 | 说明 |
| --- | --- |
| `() => void` | 取消监听函数。 |

### off(event, callback)

移除指定事件监听。

### emit(event, data?)

触发事件。单个监听器异常会被记录，不阻断其他监听器。

### removeAllListeners(event?)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `event` | `string` | 否 | 指定事件名，不传则清空全部事件。 |

### fromCesiumEvent(cesiumEvent, eventName)

把 Cesium event 转为 SDK event。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cesiumEvent` | `Cesium.Event<any>` | 是 | Cesium event。 |
| `eventName` | `string` | 是 | SDK event 名称。 |

| 返回值 | 说明 |
| --- | --- |
| `() => void` | 移除 Cesium event listener。 |

### listenerCount

| 类型 | 说明 |
| --- | --- |
| `number` | 当前全部监听器数量。 |

## ConfigStore

### constructor(initialConfig?)

创建配置存储，并立即应用 `ionAccessToken` 和 `cesiumBaseUrl`。

### get(key)

| 返回值 | 说明 |
| --- | --- |
| `SDKConfig[K]` | 指定配置值。 |

### set(key, value)

设置配置并重新应用配置。

### getAll()

| 返回值 | 说明 |
| --- | --- |
| `Readonly<SDKConfig>` | 冻结后的配置副本。 |

### merge(partial)

合并配置并重新应用配置。

### SDKConfig

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ionAccessToken` | `string` | 设置 `Cesium.Ion.defaultAccessToken`。 |
| `cesiumBaseUrl` | `string` | 设置 `globalThis.CESIUM_BASE_URL`。 |
| `logLevel` | `LogLevel` | SDK 日志等级。 |
| `[key: string]` | `unknown` | 允许扩展配置。 |

## DisposePool

### add(name, item)

按名称添加可释放资源。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 资源名称。 |
| `item` | `{ dispose?: () => void; destroy?: () => void }` | 是 | 可释放资源。 |

### add(item)

匿名添加资源，内部生成名称。

### has(name)

| 返回值 | 说明 |
| --- | --- |
| `boolean` | 是否存在指定资源。 |

### dispose(name)

释放指定资源并从池中移除。

### disposeAll()

释放全部资源并将 pool 标记为 disposed。

### size

| 类型 | 说明 |
| --- | --- |
| `number` | 当前资源数量。 |

### disposed

| 类型 | 说明 |
| --- | --- |
| `boolean` | 是否已 disposeAll。 |

说明：`disposeAll()` 后再次 `add()` 会抛出普通 `Error`。

## Logger

### constructor(prefix?, level?)

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `prefix` | `string` | `"CesiumSDK"` | 日志前缀。 |
| `level` | `LogLevel` | `LogLevel.WARN` | 日志等级。 |

### setLevel(level)

设置日志等级。

### getLevel()

返回当前日志等级。

### debug/info/warn/error(...args)

按等级输出到对应 console 方法。

### child(subPrefix)

| 返回值 | 说明 |
| --- | --- |
| `Logger` | 继承当前等级的新 logger，prefix 为 `parent:subPrefix`。 |

## LogLevel

| 成员 | 值 |
| --- | --- |
| `DEBUG` | `0` |
| `INFO` | `1` |
| `WARN` | `2` |
| `ERROR` | `3` |
| `SILENT` | `4` |

## Constants

| 常量 | 类型 | 值/说明 |
| --- | --- | --- |
| `SDK_VERSION` | `string` | `"0.1.0"` |
| `WGS84.A` | `number` | `6378137.0` |
| `WGS84.B` | `number` | `6356752.3142451793` |
| `WGS84.FLATTENING` | `number` | `1 / 298.257223563` |
| `DEG_TO_RAD` | `number` | `Math.PI / 180` |
| `RAD_TO_DEG` | `number` | `180 / Math.PI` |
