import * as Cesium from 'cesium';

export type EventMap = { [key: string]: unknown };
type EventKey<T extends EventMap> = string & keyof T;
type EventCallback<T> = (data: T) => void;

/**
 * 类型安全的发布订阅事件系统
 */
export class EventEmitter<Events extends EventMap = EventMap> {
  private readonly listeners = new Map<string, Set<EventCallback<unknown>>>();

  /** 注册事件监听，返回取消函数 */
  on<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback as EventCallback<unknown>);

    return () => this.off(event, callback);
  }

  /** 注册一次性监听 */
  once<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): () => void {
    const wrapper: EventCallback<Events[K]> = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /** 取消监听 */
  off<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /** 触发事件 */
  emit<K extends EventKey<Events>>(event: K, data?: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(data);
      } catch {
        // 防止单个监听器异常影响其他监听器
      }
    }
  }

  /** 移除指定事件或全部监听 */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /** 将 Cesium 原生 Event 桥接到 SDK EventEmitter */
  fromCesiumEvent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cesiumEvent: Cesium.Event<any>,
    eventName: string,
  ): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removal = cesiumEvent.addEventListener((result: any) => {
      this.emit(eventName, result);
    });
    return () => {
      removal();
    };
  }

  /** 当前事件监听数量 */
  get listenerCount(): number {
    let count = 0;
    for (const set of this.listeners.values()) {
      count += set.size;
    }
    return count;
  }
}
