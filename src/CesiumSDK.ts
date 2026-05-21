import * as Cesium from "cesium";
import { ViewerManager } from "./viewer/ViewerManager";
import type { ViewerInitOptions } from "./viewer/ViewerOptions";
import { LayerManager } from "./layer/LayerManager";
import { EntityManager } from "./entity/EntityManager";
import { CameraManager } from "./camera/CameraManager";
import { PluginManager } from "./plugins/PluginManager";
import type { ISDKPlugin } from "./plugins/types";
import { ConfigStore } from "./common/ConfigStore";
import type { SDKConfig } from "./common/ConfigStore";
import { DisposePool } from "./common/DisposePool";
import { Logger, LogLevel } from "./common/Logger";
import { EventEmitter } from "./common/EventEmitter";
import { SDKError, ErrorCode } from "./common/SDKError";

export interface SDKOptions extends SDKConfig, ViewerInitOptions {}

export interface SDKEvents {
  [key: string]: unknown;
  ready: undefined;
  destroy: undefined;
  error: SDKError;
}

/**
 * Cesium SDK 主入口
 *
 * @example
 * ```typescript
 * const sdk = new CesiumSDK('cesiumContainer', {
 *   ionAccessToken: 'your-token',
 * });
 *
 * await sdk.ready();
 *
 * sdk.layer.addImageryLayer(provider);
 * sdk.entity.addPoint('p1', { longitude: 116, latitude: 39, height: 0 });
 * sdk.camera.flyTo({ longitude: 116, latitude: 39, height: 10000 });
 * ```
 */
export class CesiumSDK extends EventEmitter<SDKEvents> {
  readonly viewer: ViewerManager;
  readonly config: ConfigStore;

  private _layer: LayerManager | null = null;
  private _entity: EntityManager | null = null;
  private _camera: CameraManager | null = null;
  private _pluginManager: PluginManager | null = null;
  private readonly disposePool: DisposePool;
  private readonly logger = new Logger("CesiumSDK");
  private _initialized = false;

  constructor(container: string | HTMLElement, options?: SDKOptions) {
    super();

    const { ionAccessToken, cesiumBaseUrl, logLevel, ...viewerOptions } =
      options ?? {};

    // 初始化配置
    this.config = new ConfigStore({ ionAccessToken, cesiumBaseUrl, logLevel });
    this.logger.setLevel(logLevel ?? LogLevel.WARN);

    // 初始化 Viewer 管理器
    this.viewer = new ViewerManager(container, viewerOptions);

    // 延迟初始化的管理器（在 Viewer ready 后赋值）
    this.disposePool = new DisposePool();
  }

  /** 异步初始化，返回 SDK 实例 */
  async ready(): Promise<this> {
    if (this._initialized) return this;

    await this.viewer.init();
    const cesiumViewer = this.viewer.getViewer();

    // 初始化各管理器
    this._layer = new LayerManager(cesiumViewer);
    this._entity = new EntityManager(cesiumViewer);
    this._camera = new CameraManager(cesiumViewer);
    this._pluginManager = new PluginManager(this);

    this._initialized = true;
    this.emit("ready");
    this.logger.info("SDK initialized");
    return this;
  }

  /** 注册插件（支持链式调用） */
  async use(plugin: ISDKPlugin): Promise<this> {
    this.ensureInitialized();
    await this._pluginManager!.register(plugin);
    return this;
  }

  /** 获取插件 */
  getPlugin<T extends ISDKPlugin = ISDKPlugin>(name: string): T | undefined {
    this.ensureInitialized();
    return this._pluginManager!.get<T>(name);
  }

  /** 注册生命周期钩子 */
  onLifecycle(
    hook: "beforeInit" | "afterInit" | "beforeDestroy" | "afterDestroy",
    callback: () => void,
  ): () => void {
    return this.viewer.lifecycle.on(hook, callback);
  }

  /** 销毁 SDK（级联销毁所有子管理器） */
  async destroy(): Promise<void> {
    if (!this._initialized) return;

    this.logger.info("Destroying SDK...");

    // 1. 卸载所有插件
    if (this._pluginManager) {
      await this._pluginManager.destroyAll();
    }

    // 2. 销毁各子管理器
    this._camera?.destroy();
    this._entity?.removeAll();
    this._layer?.removeAll();

    // 3. 销毁 Viewer（内部处理渲染循环停止 + 内存清理）
    await this.viewer.destroy();

    // 4. 清理全局销毁池
    this.disposePool.disposeAll();

    this._camera = null;
    this._entity = null;
    this._layer = null;
    this._pluginManager = null;
    this._initialized = false;
    this.emit("destroy");
    this.removeAllListeners();
    this.logger.info("SDK destroyed");
  }

  /** SDK 是否已初始化 */
  get initialized(): boolean {
    return this._initialized;
  }

  /** 图层管理器 */
  get layer(): LayerManager {
    this.ensureInitialized();
    return this._layer!;
  }

  /** 实体管理器 */
  get entity(): EntityManager {
    this.ensureInitialized();
    return this._entity!;
  }

  /** 相机管理器 */
  get camera(): CameraManager {
    this.ensureInitialized();
    return this._camera!;
  }

  /** 获取 Cesium Viewer 原生对象 */
  getCesiumViewer(): Cesium.Viewer {
    this.ensureInitialized();
    return this.viewer.getViewer();
  }

  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new SDKError(
        ErrorCode.VIEWER_NOT_INITIALIZED,
        "SDK is not initialized. Call ready() first.",
      );
    }
  }
}
