export type LifecycleHook = 'beforeInit' | 'afterInit' | 'beforeDestroy' | 'afterDestroy';
type LifecycleCallback = () => void | Promise<void>;

export class Lifecycle {
  private readonly listeners = new Map<LifecycleHook, Set<LifecycleCallback>>();

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

  async emit(hook: LifecycleHook): Promise<void> {
    const callbacks = Array.from(this.listeners.get(hook) ?? []);
    for (const callback of callbacks) {
      await callback();
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
