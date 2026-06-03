# Errors

SDK 参数错误、生命周期错误和资源释放错误统一通过 `SDKError` 表达。

## SDKError

```ts
throw new SDKError(ErrorCode.INVALID_OPTIONS, "message", detail);
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `"SDKError"` | 错误类型名称。 |
| `code` | `ErrorCode` | 错误码。 |
| `message` | `string` | 格式为 `[${code}] ${message}`。 |
| `detail` | `unknown` | 可选附加信息。 |

## ErrorCode

| 错误码 | 触发场景 |
| --- | --- |
| `VIEWER_NOT_INITIALIZED` | 未初始化 Viewer 或 SDK 时访问依赖 Viewer 的 API。 |
| `VIEWER_ALREADY_EXISTS` | 重复初始化 Viewer。 |
| `INVALID_OPTIONS` | 参数为空、类型错误、数值越界、颜色非法等。 |
| `LAYER_NOT_FOUND` | 当前已导出但现有实现未直接抛出。 |
| `LAYER_ALREADY_EXISTS` | 添加图层时 id 重复。 |
| `ENTITY_NOT_FOUND` | 当前已导出但现有实现未直接抛出。 |
| `ENTITY_ALREADY_EXISTS` | 添加 entity graphic 时 id 重复。 |
| `PLUGIN_NOT_FOUND` | 当前已导出但现有实现未直接抛出。 |
| `PLUGIN_ALREADY_INSTALLED` | 安装插件时 name 重复。 |
| `COORDINATE_TRANSFORM_FAILED` | 坐标转换失败、屏幕拾取失败或没有 globe 交点。 |
| `RESOURCE_DISPOSED` | 已销毁 SDK、layer 或 graphic 后继续访问。 |
| `UNKNOWN` | 预留错误码。 |

## 常见参数规则

| 参数 | 规则 |
| --- | --- |
| `id` | 非空字符串。 |
| `longitude` | finite number，范围 `-180..180`。 |
| `latitude` | finite number，范围 `-90..90`。 |
| `height` | 如果传入，必须是 finite number；`ViewpointData.height` 必填。 |
| `duration` | finite number，必须大于等于 `0`。 |
| `opacity` | finite number，范围 `0..1`。 |
| `pixelSize` / `width` | finite number，必须大于 `0`。 |
| `outlineWidth` / `extrudedHeight` | finite number，必须大于等于 `0`。 |
| CSS color | 必须能被 `Cesium.Color.fromCssColorString` 解析。 |

## 示例

```ts
try {
  sdk.entity.addPoint("", { longitude: 116.391, latitude: 39.907 });
} catch (error) {
  if (error instanceof SDKError) {
    console.log(error.code);
  }
}
```
