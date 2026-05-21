import * as Cesium from "cesium";
import { BaseLayer } from "./BaseLayer";
import { LayerType } from "./LayerType";
import { SDKError, ErrorCode } from "../common/SDKError";

export interface ImageryLayerOptions {
  url?: string;
  provider?: Cesium.ImageryProvider;
  opacity?: number;
  alpha?: number;
  brightness?: number;
  contrast?: number;
  minimumTerrainLevel?: number;
  maximumTerrainLevel?: number;
}

/**
 * 影像图层
 */
export class ImageryLayer extends BaseLayer<Cesium.ImageryLayer> {
  private cesiumLayer: Cesium.ImageryLayer | null = null;
  private viewer: Cesium.Viewer | null = null;
  private readonly imageryProvider: Cesium.ImageryProvider;
  private _opacity: number;

  constructor(
    id: string,
    provider: Cesium.ImageryProvider,
    options?: ImageryLayerOptions,
  ) {
    super(id, LayerType.IMAGERY);
    this.imageryProvider = provider;
    this._opacity = options?.opacity ?? options?.alpha ?? 1.0;
  }

  get opacity(): number {
    return this._opacity;
  }

  set opacity(val: number) {
    this._opacity = Math.max(0, Math.min(1, val));
    if (this.cesiumLayer) {
      this.cesiumLayer.alpha = this._opacity;
    }
  }

  /** 将图层添加到 Viewer 的 ImageryLayers 中 */
  _attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    this.cesiumLayer = viewer.imageryLayers.addImageryProvider(
      this.imageryProvider,
    );
    this.cesiumLayer.alpha = this._opacity;
    this.cesiumLayer.show = this._visible;
  }

  protected applyVisibility(visible: boolean): void {
    if (this.cesiumLayer) {
      this.cesiumLayer.show = visible;
    }
  }

  async flyTo(): Promise<void> {
    if (!this.cesiumLayer || !this.viewer) return;
    await this.viewer.flyTo(this.cesiumLayer);
  }

  getCesiumTarget(): Cesium.ImageryLayer {
    if (!this.cesiumLayer) {
      throw new SDKError(
        ErrorCode.RESOURCE_DISPOSED,
        "Imagery layer not attached",
      );
    }
    return this.cesiumLayer;
  }

  remove(): void {
    if (this.viewer && this.cesiumLayer) {
      this.viewer.imageryLayers.remove(this.cesiumLayer);
    }
    this.cesiumLayer = null;
    this.viewer = null;
    super.remove();
  }
}
