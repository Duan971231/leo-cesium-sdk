import { Logger, LogLevel } from "./Logger";

type DisposableItem = { dispose?: () => void; destroy?: () => void };

export class DisposePool {
  private readonly pool = new Map<string, DisposableItem>();
  private readonly logger: Logger;
  private _disposed = false;

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger("DisposePool", LogLevel.WARN);
  }

  add(nameOrItem: string, item: DisposableItem): void;
  add(nameOrItem: DisposableItem): void;
  add(nameOrItem: string | DisposableItem, item?: DisposableItem): void {
    this.ensureAlive();
    if (typeof nameOrItem === "string") {
      this.pool.set(nameOrItem, item!);
    } else {
      this.pool.set(`__anon_${this.pool.size}`, nameOrItem);
    }
  }

  has(name: string): boolean {
    return this.pool.has(name);
  }

  dispose(name: string): void {
    const item = this.pool.get(name);
    if (!item) return;
    this.safeDispose(item, name);
    this.pool.delete(name);
  }

  disposeAll(): void {
    for (const [name, item] of this.pool) {
      this.safeDispose(item, name);
    }
    this.pool.clear();
    this._disposed = true;
  }

  get size(): number {
    return this.pool.size;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  private safeDispose(item: DisposableItem, name: string): void {
    try {
      if (typeof item.dispose === "function") {
        item.dispose();
      } else if (typeof item.destroy === "function") {
        item.destroy();
      }
    } catch (e) {
      this.logger.error(`Failed to dispose resource "${name}":`, e);
    }
  }

  private ensureAlive(): void {
    if (this._disposed) {
      throw new Error("DisposePool has already been disposed");
    }
  }
}
