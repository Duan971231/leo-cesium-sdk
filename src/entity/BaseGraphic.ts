import * as Cesium from 'cesium';
import { EventEmitter } from '../common/EventEmitter';
import { DisposePool } from '../common/DisposePool';
import { SDKError, ErrorCode } from '../common/SDKError';
import { GraphicType } from './GraphicStyle';

export interface GraphicEvents {
  [key: string]: unknown;
  visibilityChange: { visible: boolean };
  removed: undefined;
}

/**
 * 图形抽象基类
 */
export abstract class BaseGraphic<T = unknown> extends EventEmitter<GraphicEvents> {
  readonly id: string;
  readonly type: GraphicType;
  protected readonly disposePool: DisposePool;
  protected cesiumEntity: Cesium.Entity | null = null;
  protected viewer: Cesium.Viewer | null = null;
  protected _visible = true;
  protected _removed = false;

  constructor(id: string, type: GraphicType) {
    super();
    this.id = id;
    this.type = type;
    this.disposePool = new DisposePool();
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(val: boolean) {
    if (this._visible === val) return;
    this._visible = val;
    if (this.cesiumEntity) {
      this.cesiumEntity.show = val;
    }
    this.emit('visibilityChange', { visible: val });
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  async flyTo(options?: { duration?: number }): Promise<void> {
    if (!this.cesiumEntity || !this.viewer) return;
    await this.viewer.flyTo(this.cesiumEntity, { duration: options?.duration });
  }

  remove(): void {
    if (this._removed) return;
    this._removed = true;
    if (this.viewer && this.cesiumEntity) {
      this.viewer.entities.remove(this.cesiumEntity);
    }
    this.disposePool.disposeAll();
    this.emit('removed');
    this.removeAllListeners();
    this.cesiumEntity = null;
    this.viewer = null;
  }

  /** 获取 Cesium 原生 Entity */
  getCesiumTarget(): T {
    if (!this.cesiumEntity) {
      throw new SDKError(ErrorCode.RESOURCE_DISPOSED, `Graphic "${this.id}" is disposed`);
    }
    return this.cesiumEntity as T;
  }

  /** 将图形附加到 Viewer */
  abstract _attach(viewer: Cesium.Viewer): void;
}
