import * as Cesium from "cesium";
import { BaseLayer } from "./BaseLayer";
import { ImageryLayer } from "./ImageryLayer";
import { LayerType } from "./LayerType";
import { Logger } from "../common/Logger";
import { SDKError, ErrorCode } from "../common/SDKError";
import { ValidationUtil } from "../util/ValidationUtil";

export interface AddImageryLayerOptions {
  id?: string;
  opacity?: number;
}

export class LayerManager {
  private readonly layers = new Map<string, BaseLayer>();
  private readonly viewer: Cesium.Viewer;
  private readonly logger = new Logger("LayerManager");
  private nextLayerId = 0;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  addImageryLayer(
    provider: Cesium.ImageryProvider,
    options?: AddImageryLayerOptions,
  ): ImageryLayer {
    this.validateProvider(provider);
    ValidationUtil.opacity(options?.opacity, "Layer opacity");

    const id = options?.id ?? this.createImageryLayerId();
    ValidationUtil.id(id, "Layer id");
    this.ensureNotExists(id);

    const layer = new ImageryLayer(id, provider, { opacity: options?.opacity });
    layer._attach(this.viewer);
    this.layers.set(id, layer);
    this.logger.info(`Added imagery layer: ${id}`);
    return layer;
  }

  get<T extends BaseLayer = BaseLayer>(id: string): T | undefined {
    return this.layers.get(id) as T | undefined;
  }

  getAll(): ReadonlyMap<string, BaseLayer> {
    return new Map(this.layers);
  }

  getByType(type: LayerType): BaseLayer[] {
    const result: BaseLayer[] = [];
    for (const layer of this.layers.values()) {
      if (layer.type === type) result.push(layer);
    }
    return result;
  }

  remove(id: string): boolean {
    ValidationUtil.id(id, "Layer id");
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.remove();
    this.layers.delete(id);
    this.logger.info(`Removed layer: ${id}`);
    return true;
  }

  removeAll(): void {
    for (const layer of this.layers.values()) {
      layer.remove();
    }
    this.layers.clear();
  }

  get count(): number {
    return this.layers.size;
  }

  private ensureNotExists(id: string): void {
    if (this.layers.has(id)) {
      throw new SDKError(
        ErrorCode.LAYER_ALREADY_EXISTS,
        `Layer "${id}" already exists`,
      );
    }
  }

  private createImageryLayerId(): string {
    let id: string;
    do {
      id = `imagery_${this.nextLayerId}`;
      this.nextLayerId += 1;
    } while (this.layers.has(id));
    return id;
  }

  private validateProvider(provider: Cesium.ImageryProvider): void {
    if (!provider) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Imagery provider is required",
      );
    }
  }
}
