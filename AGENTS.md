# AGENTS.md

本文件定义本仓库的本地协作规范。目标是让 Cesium SDK 长期保持易维护、易阅读、低耦合、可验证。

## 语言与交付

- 与用户交流使用简体中文，代码、API、类型、错误码和技术术语保持英文。
- 变更前先理解现有结构，不基于猜测实现。
- 交付必须说明变更点、影响范围、验证命令和回滚方式。
- 未明确要求时，不输出大段源码；优先提交最小 diff。

## SDK 设计原则

- SDK 对外 API 要稳定、清晰、少惊喜。公开导出的类型、枚举、方法必须有真实实现支撑。
- 不提前暴露未实现能力。Terrain、3D Tiles、Billboard、Model 等能力只有在实现、测试、文档齐全后再导出。
- 保持模块职责单一：
  - `viewer` 只负责 Cesium Viewer 生命周期。
  - `layer` 只负责图层抽象与图层管理。
  - `entity` 只负责实体图形抽象、创建、更新和移除。
  - `camera` 只负责视角、飞行、书签和跟踪。
  - `plugins` 只负责插件生命周期。
  - `common` 放通用基础设施。
  - `util` 放无状态工具函数和通用校验。
- 不让 manager 承担过多业务逻辑。通用校验放到 `ValidationUtil`，通用坐标转换放到 `CoordinateUtil`。
- 业务模块之间避免横向依赖。需要共享能力时放到 `common` 或 `util`。

## API 与类型

- 所有 public API 必须有明确输入、输出、错误行为。
- public 方法参数必须先做运行时校验，再调用 Cesium API。
- 参数错误统一抛 `SDKError(ErrorCode.INVALID_OPTIONS, ...)`。
- 已销毁资源访问统一抛 `SDKError(ErrorCode.RESOURCE_DISPOSED, ...)`。
- `CesiumSDK.destroy()` 后实例不可复用；需要新生命周期时创建新实例。
- getter 返回集合时不得暴露内部可变集合，必须返回 snapshot 或只读副本。
- 对象状态更新 API 应返回 `this`，便于链式调用，但不得牺牲清晰性。

## 可维护性

- 优先复用现有工具和模式，不为单个调用点新增抽象。
- 新增抽象必须满足至少一个条件：
  - 消除实际重复逻辑。
  - 降低跨模块耦合。
  - 明确表达领域概念。
  - 形成稳定扩展点。
- 不把测试专用逻辑写进生产代码。
- 不在 manager 中直接复制坐标、颜色、数值等校验规则；使用 `ValidationUtil`。
- 不把 Cesium 私有 API 散落在业务模块中；需要使用时集中封装并写清风险。

## 可读性

- 源码、注释、文档必须使用 UTF-8。
- 不保留乱码注释。发现乱码注释时应清理或改写为清晰英文/中文。
- 注释只解释非显而易见的设计意图、边界条件、风险或 Cesium 行为差异。
- 不写无意义注释，例如“设置变量”“调用函数”。
- 文件内代码顺序建议：
  1. imports
  2. types/interfaces
  3. constants
  4. class/exported API
  5. private helpers

## Cesium 集成约束

- Cesium 保持 peer dependency，不打包进 SDK。
- 不假设宿主框架。SDK 应保持 framework-agnostic。
- Cesium assets、workers、token 由宿主应用配置，SDK 只提供必要 helper 和文档。
- 避免默认调用 Cesium 私有 API。私有 API 清理应通过明确策略控制，例如 `safe` / `aggressive`。
- 包装 Cesium 对象时提供 escape hatch，如 `getCesiumTarget()`，但 SDK 自身 API 应覆盖常见场景。

## 错误与生命周期

- 初始化、销毁、插件安装、资源移除都必须是可重复理解的状态机。
- `ready()` 失败时不得留下半初始化状态；已创建资源应清理。
- `destroy()` 应尽力释放插件、manager、viewer、监听器和本地引用。
- 单个事件监听器异常不得阻断其他监听器，但必须记录。
- 插件安装失败应避免登记为已安装状态。

## 发布与包结构

- `package.json` 的 `exports` 必须和真实构建产物一致。
- `README.md` 必须和当前公开 API 保持一致。
- 发布前应确认 `dist/index.d.ts` 包含预期类型。
- 子路径导出只有在模块边界稳定后再添加。
- 不提交无意义大文件或二进制产物，除非发布流程明确需要。

## 代码修改边界

- 保持最小改动，不做无关重构。
- 不回滚用户已有改动，除非用户明确要求。
- 发现脏工作区时，先区分相关和无关改动；无关改动不要触碰。
- 批量格式化或注释清理应与功能变更分开说明。

# 不要删除已经写好的中文注释。
