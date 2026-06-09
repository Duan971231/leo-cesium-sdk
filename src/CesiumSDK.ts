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
  private _disposed = false;

  constructor(container: string | HTMLElement, options?: SDKOptions) {
    super();
    const { ionAccessToken, cesiumBaseUrl, logLevel, ...viewerOptions } =
      options ?? {};
    this.config = new ConfigStore({ ionAccessToken, cesiumBaseUrl, logLevel });
    this.logger.setLevel(logLevel ?? LogLevel.WARN);
    this.viewer = new ViewerManager(container, viewerOptions);
    this.disposePool = new DisposePool();
  }

  async ready(): Promise<this> {
    this.ensureNotDisposed();
    if (this._initialized) return this;

    await this.viewer.init();
    const cesiumViewer = this.viewer.getViewer();

    this._layer = new LayerManager(cesiumViewer);
    this._entity = new EntityManager(cesiumViewer);
    this._camera = new CameraManager(cesiumViewer);
    this._pluginManager = new PluginManager(this);

    this._initialized = true;
    this.emit("ready");
    this.logger.info("SDK initialized");
    return this;
  }

  async use(plugin: ISDKPlugin): Promise<this> {
    this.ensureInitialized();
    await this._pluginManager!.register(plugin);
    return this;
  }

  getPlugin<T extends ISDKPlugin = ISDKPlugin>(name: string): T | undefined {
    this.ensureInitialized();
    return this._pluginManager!.get<T>(name);
  }

  /** 绑定 viewer 生命周期函数 */
  onLifecycle(
    hook: "beforeInit" | "afterInit" | "beforeDestroy" | "afterDestroy",
    callback: () => void,
  ): () => void {
    this.ensureNotDisposed();
    return this.viewer.lifecycle.on(hook, callback);
  }

  async destroy(): Promise<void> {
    if (this._disposed) return;
    if (!this._initialized) {
      this.disposePool.disposeAll();
      this._disposed = true;
      this.emit("destroy");
      this.removeAllListeners();
      return;
    }

    this.logger.info("Destroying SDK...");

    if (this._pluginManager) {
      await this._pluginManager.destroyAll();
    }

    this._camera?.destroy();
    this._entity?.removeAll();
    this._layer?.removeAll();

    await this.viewer.destroy();

    this.disposePool.disposeAll();

    this._camera = null;
    this._entity = null;
    this._layer = null;
    this._pluginManager = null;
    this._initialized = false;
    this._disposed = true;
    this.emit("destroy");
    this.removeAllListeners();
    this.logger.info("SDK destroyed");
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get layer(): LayerManager {
    this.ensureInitialized();
    return this._layer!;
  }

  get entity(): EntityManager {
    this.ensureInitialized();
    return this._entity!;
  }

  get camera(): CameraManager {
    this.ensureInitialized();
    return this._camera!;
  }

  getCesiumViewer(): Cesium.Viewer {
    this.ensureInitialized();
    return this.viewer.getViewer();
  }

  /** 确保 SDK 已初始化 */
  private ensureInitialized(): void {
    this.ensureNotDisposed();
    if (!this._initialized) {
      throw new SDKError(
        ErrorCode.VIEWER_NOT_INITIALIZED,
        "SDK is not initialized. Call ready() first.",
      );
    }
  }

  private ensureNotDisposed(): void {
    if (this._disposed) {
      throw new SDKError(
        ErrorCode.RESOURCE_DISPOSED,
        "SDK has been destroyed. Create a new CesiumSDK instance.",
      );
    }
  }
}
