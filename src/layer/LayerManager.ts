import * as Cesium from 'cesium';
import { BaseLayer } from './BaseLayer';
import { ImageryLayer } from './ImageryLayer';
import { LayerType } from './LayerType';
import { Logger } from '../common/Logger';
import { SDKError, ErrorCode } from '../common/SDKError';

export interface AddImageryLayerOptions {
  id?: string;
  opacity?: number;
}

/**
 * 图层管理器：统一图层 CRUD
 */
export class LayerManager {
  private readonly layers = new Map<string, BaseLayer>();
  private readonly viewer: Cesium.Viewer;
  private readonly logger = new Logger('LayerManager');

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /** 添加影像图层 */
  addImageryLayer(
    provider: Cesium.ImageryProvider,
    options?: AddImageryLayerOptions,
  ): ImageryLayer {
    const id = options?.id ?? `imagery_${this.layers.size}`;
    this.ensureNotExists(id);

    const layer = new ImageryLayer(id, provider, { opacity: options?.opacity });
    layer._attach(this.viewer);
    this.layers.set(id, layer);
    this.logger.info(`Added imagery layer: ${id}`);
    return layer;
  }

  /** 获取图层 */
  get<T extends BaseLayer = BaseLayer>(id: string): T | undefined {
    return this.layers.get(id) as T | undefined;
  }

  /** 获取所有图层 */
  getAll(): ReadonlyMap<string, BaseLayer> {
    return this.layers;
  }

  /** 按类型获取图层 */
  getByType(type: LayerType): BaseLayer[] {
    const result: BaseLayer[] = [];
    for (const layer of this.layers.values()) {
      if (layer.type === type) result.push(layer);
    }
    return result;
  }

  /** 移除图层 */
  remove(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.remove();
    this.layers.delete(id);
    this.logger.info(`Removed layer: ${id}`);
    return true;
  }

  /** 移除所有图层 */
  removeAll(): void {
    for (const layer of this.layers.values()) {
      layer.remove();
    }
    this.layers.clear();
  }

  /** 图层数量 */
  get count(): number {
    return this.layers.size;
  }

  private ensureNotExists(id: string): void {
    if (this.layers.has(id)) {
      throw new SDKError(ErrorCode.LAYER_ALREADY_EXISTS, `Layer "${id}" already exists`);
    }
  }
}
