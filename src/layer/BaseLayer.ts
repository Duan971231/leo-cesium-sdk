import * as Cesium from "cesium";
import { EventEmitter } from "../common/EventEmitter";
import { DisposePool } from "../common/DisposePool";
import { SDKError, ErrorCode } from "../common/SDKError";
import { LayerType } from "./LayerType";
import { Logger } from "../common/Logger";

export interface LayerEvents {
  [key: string]: unknown;
  visibilityChange: { visible: boolean };
  removed: undefined;
}

/**
 * 图层抽象基类
 */
export abstract class BaseLayer<T = unknown> extends EventEmitter<LayerEvents> {
  readonly id: string;
  readonly type: LayerType;
  protected readonly disposePool: DisposePool;
  protected _visible = true;
  protected _removed = false;
  protected readonly logger: Logger;

  constructor(id: string, type: LayerType) {
    super();
    this.id = id;
    this.type = type;
    this.disposePool = new DisposePool();
    this.logger = new Logger(`Layer:${id}`);
  }

  get visible(): boolean {
    this.ensureNotRemoved();
    return this._visible;
  }

  set visible(val: boolean) {
    this.ensureNotRemoved();
    if (this._visible === val) return;
    this._visible = val;
    this.applyVisibility(val);
    this.emit("visibilityChange", { visible: val });
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  abstract flyTo(): Promise<void>;

  remove(): void {
    if (this._removed) return;
    this._removed = true;
    this.disposePool.disposeAll();
    this.emit("removed");
    this.removeAllListeners();
  }

  /**
   * 获取 Cesium 原生对象（类型安全）
   */
  abstract getCesiumTarget(): T;

  /**
   * 子类实现具体的可见性切换
   */
  protected abstract applyVisibility(visible: boolean): void;

  protected ensureNotRemoved(): void {
    if (this._removed) {
      throw new SDKError(
        ErrorCode.RESOURCE_DISPOSED,
        `Layer "${this.id}" is disposed`,
      );
    }
  }
}
