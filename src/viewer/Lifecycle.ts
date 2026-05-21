export type LifecycleHook = 'beforeInit' | 'afterInit' | 'beforeDestroy' | 'afterDestroy';
type LifecycleCallback = () => void | Promise<void>;

/**
 * Viewer 生命周期钩子管理
 */
export class Lifecycle {
  private readonly listeners = new Map<LifecycleHook, Set<LifecycleCallback>>();

  /** 注册生命周期回调，返回取消函数 */
  on(hook: LifecycleHook, callback: LifecycleCallback): () => void {
    let set = this.listeners.get(hook);
    if (!set) {
      set = new Set();
      this.listeners.set(hook, set);
    }
    set.add(callback);
    return () => {
      set?.delete(callback);
    };
  }

  /** 触发生命周期事件 */
  async emit(hook: LifecycleHook): Promise<void> {
    const callbacks = Array.from(this.listeners.get(hook) ?? []);
    for (const callback of callbacks) {
      await callback();
    }
  }

  /** 移除所有监听 */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
