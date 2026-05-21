import { Logger } from './Logger';

type DisposableItem = { dispose?: () => void; destroy?: () => void };

/**
 * 统一资源销毁池，支持命名追踪
 */
export class DisposePool {
  private readonly pool = new Map<string, DisposableItem>();
  private readonly logger: Logger;
  private _disposed = false;

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger('DisposePool', 2);
  }

  /** 添加可销毁资源（命名或匿名） */
  add(nameOrItem: string, item: DisposableItem): void;
  add(nameOrItem: DisposableItem): void;
  add(nameOrItem: string | DisposableItem, item?: DisposableItem): void {
    this.ensureAlive();
    if (typeof nameOrItem === 'string') {
      this.pool.set(nameOrItem, item!);
    } else {
      this.pool.set(`__anon_${this.pool.size}`, nameOrItem);
    }
  }

  /** 检查是否包含指定名称的资源 */
  has(name: string): boolean {
    return this.pool.has(name);
  }

  /** 选择性销毁指定名称的资源 */
  dispose(name: string): void {
    const item = this.pool.get(name);
    if (!item) return;
    this.safeDispose(item, name);
    this.pool.delete(name);
  }

  /** 销毁所有资源 */
  disposeAll(): void {
    for (const [name, item] of this.pool) {
      this.safeDispose(item, name);
    }
    this.pool.clear();
    this._disposed = true;
  }

  /** 当前池中资源数量 */
  get size(): number {
    return this.pool.size;
  }

  /** 是否已全部销毁 */
  get disposed(): boolean {
    return this._disposed;
  }

  private safeDispose(item: DisposableItem, name: string): void {
    try {
      if (typeof item.dispose === 'function') {
        item.dispose();
      } else if (typeof item.destroy === 'function') {
        item.destroy();
      }
    } catch (e) {
      this.logger.error(`Failed to dispose resource "${name}":`, e);
    }
  }

  private ensureAlive(): void {
    if (this._disposed) {
      throw new Error('DisposePool has already been disposed');
    }
  }
}
