# Plugins

插件模块提供 SDK 扩展点。通常通过 `CesiumSDK.use(plugin)` 安装插件，也可以直接使用 `PluginManager`。

## ISDKPlugin

```ts
interface ISDKPlugin {
  readonly name: string;
  install(sdk: CesiumSDK): void | Promise<void>;
  destroy(): void | Promise<void>;
}
```

| 字段/方法 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 插件名称，必须是非空字符串。 |
| `install` | `(sdk: CesiumSDK) => void \| Promise<void>` | 安装插件。 |
| `destroy` | `() => void \| Promise<void>` | 销毁插件。 |

## PluginManager

### constructor(sdk)

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sdk` | `CesiumSDK` | 是 | SDK 实例。 |

### register(plugin)

安装插件。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `plugin` | `ISDKPlugin` | 是 | 插件。 |

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 安装完成。 |

错误行为：

- 插件对象、`name`、`install`、`destroy` 非法时抛出 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- 插件名称重复时抛出 `SDKError(ErrorCode.PLUGIN_ALREADY_INSTALLED, ...)`。
- `install()` 失败时不会登记为已安装状态。

### unregister(name)

卸载插件。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 插件名称。当前实现不校验空字符串。 |

| 返回值 | 说明 |
| --- | --- |
| `Promise<boolean>` | 成功卸载返回 `true`，不存在返回 `false`。 |

### get(name)

| 返回值 | 说明 |
| --- | --- |
| `T \| undefined` | 插件不存在时返回 `undefined`。 |

### getNames()

| 返回值 | 说明 |
| --- | --- |
| `string[]` | 已安装插件名称列表。 |

### destroyAll()

销毁全部插件并清空注册表。

| 返回值 | 说明 |
| --- | --- |
| `Promise<void>` | 销毁完成。 |

说明：单个插件 destroy 失败会记录日志，不阻断其他插件销毁。

### count

| 类型 | 说明 |
| --- | --- |
| `number` | 已安装插件数量。 |

## 示例

```ts
const plugin = {
  name: "example",
  install(sdk) {
    sdk.on("ready", () => {
      console.log("SDK ready");
    });
  },
  destroy() {
    console.log("plugin destroyed");
  },
};

await sdk.ready();
await sdk.use(plugin);
```
