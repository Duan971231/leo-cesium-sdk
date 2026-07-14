import * as Cesium from "cesium";
import { ViewerInitOptions, DEFAULT_VIEWER_OPTIONS } from "./ViewerOptions";
import { Lifecycle } from "./Lifecycle";
import { DisposePool } from "../common/DisposePool";
import { Logger } from "../common/Logger";
import { SDKError, ErrorCode } from "../common/SDKError";
import { MemoryUtil } from "../util/memory";

export class ViewerManager {
  private viewer: Cesium.Viewer | null = null;
  private readonly container: string | HTMLElement;
  private readonly options: ViewerInitOptions;
  private readonly disposePool: DisposePool;
  readonly lifecycle: Lifecycle;
  private readonly logger = new Logger("ViewerManager");
  private _isReady = false;

  constructor(container: string | HTMLElement, options: ViewerInitOptions) {
    this.container = container;
    this.options = { ...DEFAULT_VIEWER_OPTIONS, ...options };
    this.disposePool = new DisposePool();
    this.lifecycle = new Lifecycle();
  }

  get isReady(): boolean {
    return this._isReady;
  }

  getViewer(): Cesium.Viewer {
    this.ensureReady();
    return this.viewer!;
  }

  getCesiumTarget(): Cesium.Viewer {
    return this.getViewer();
  }

  async init(): Promise<void> {
    if (this.viewer) {
      throw new SDKError(
        ErrorCode.VIEWER_ALREADY_EXISTS,
        "Viewer is already initialized",
      );
    }

    await this.lifecycle.emit("beforeInit");

    const cesiumOptions: Cesium.Viewer.ConstructorOptions = {
      baseLayer: this.options.baseLayer,
      baseLayerPicker: this.options.baseLayerPicker,
      geocoder: this.options.geocoder,
      homeButton: this.options.homeButton,
      sceneModePicker: this.options.sceneModePicker,
      navigationHelpButton: this.options.navigationHelpButton,
      animation: this.options.animation,
      timeline: this.options.timeline,
      fullscreenButton: this.options.fullscreenButton,
      vrButton: this.options.vrButton,
      infoBox: this.options.infoBox,
      selectionIndicator: this.options.selectionIndicator,
      shadows: this.options.shadows,
      shouldAnimate: this.options.shouldAnimate,
      sceneMode: this.options.sceneMode,
      terrainShadows: this.options.terrainShadows,
      requestRenderMode: this.options.requestRenderMode,
      maximumRenderTimeChange: this.options.maximumRenderTimeChange,
      scene3DOnly: this.options.scene3DOnly,
      navigationInstructionsInitiallyVisible:
        this.options.navigationInstructionsInitiallyVisible,
      projectionPicker: this.options.projectionPicker,
      creditContainer: this.options.creditContainer,
      ...this.options.extra,
    };

    if (this.options.msaaSamples) {
      cesiumOptions.msaaSamples = this.options.msaaSamples;
    }

    this.viewer = new Cesium.Viewer(this.container, cesiumOptions);
    this._isReady = true;

    if (this.options.debugShowFramesPerSecond) {
      this.viewer.scene.debugShowFramesPerSecond = true;
    }

    this.disposePool.add("viewer", { destroy: () => this.destroyViewer() });
    this.logger.info("Viewer initialized");
    await this.lifecycle.emit("afterInit");
  }

  async destroy(): Promise<void> {
    if (!this.viewer) return;
    await this.lifecycle.emit("beforeDestroy");
    this.disposePool.disposeAll();
    this._isReady = false;
    await this.lifecycle.emit("afterDestroy");
    this.lifecycle.removeAllListeners();
    this.logger.info("Viewer destroyed");
  }

  private destroyViewer(): void {
    if (!this.viewer) return;
    this.viewer.useDefaultRenderLoop = false;
    this.viewer.destroy();
    MemoryUtil.cleanupCesiumGlobals();
    this.viewer = null;
  }

  private ensureReady(): void {
    if (!this._isReady || !this.viewer) {
      throw new SDKError(
        ErrorCode.VIEWER_NOT_INITIALIZED,
        "Viewer is not initialized",
      );
    }
  }
}
