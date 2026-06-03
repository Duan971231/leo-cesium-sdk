import * as Cesium from 'cesium';
import { Logger } from './Logger';

export type EventMap = { [key: string]: unknown };
type EventKey<T extends EventMap> = string & keyof T;
type EventCallback<T> = (data: T) => void;

export class EventEmitter<Events extends EventMap = EventMap> {
  private static readonly logger = new Logger('EventEmitter');
  private readonly listeners = new Map<string, Set<EventCallback<unknown>>>();

  on<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback as EventCallback<unknown>);

    return () => this.off(event, callback);
  }

  once<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): () => void {
    const wrapper: EventCallback<Events[K]> = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  off<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  emit<K extends EventKey<Events>>(event: K, data?: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(data);
      } catch (error) {
        EventEmitter.logger.warn(`Event listener for "${event}" failed`, error);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

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

  get listenerCount(): number {
    let count = 0;
    for (const set of this.listeners.values()) {
      count += set.size;
    }
    return count;
  }
}
