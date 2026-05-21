import * as Cesium from 'cesium';
import { Viewpoint, ViewpointData } from './Viewpoint';
import { Logger } from '../common/Logger';
import { DisposePool } from '../common/DisposePool';
import type { WGS84Coordinate } from '../util/CoordinateUtil';

export interface FlyToOptions {
  duration?: number;
  maximumHeight?: number;
}

export interface ViewpointBookmark {
  id: string;
  name: string;
  viewpoint: ViewpointData;
}

/**
 * 相机管理器：飞行、锁定、视点管理
 */
export class CameraManager {
  private readonly viewer: Cesium.Viewer;
  private readonly disposePool: DisposePool;
  private readonly logger = new Logger('CameraManager');
  private readonly bookmarks = new Map<string, ViewpointBookmark>();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.disposePool = new DisposePool();
  }

  /** 获取当前视点 */
  getCurrentViewpoint(): Viewpoint {
    return Viewpoint.fromCamera(this.viewer.camera);
  }

  /** 飞行到指定视点 */
  async flyTo(viewpoint: Viewpoint | ViewpointData, options?: FlyToOptions): Promise<void> {
    const vp = viewpoint instanceof Viewpoint ? viewpoint : new Viewpoint(viewpoint);
    return new Promise((resolve, reject) => {
      this.viewer.camera.flyTo({
        destination: vp.toCartesian(),
        orientation: {
          heading: Cesium.Math.toRadians(vp.heading),
          pitch: Cesium.Math.toRadians(vp.pitch),
          roll: Cesium.Math.toRadians(vp.roll),
        },
        duration: options?.duration ?? 2,
        maximumHeight: options?.maximumHeight,
        complete: () => resolve(),
        cancel: () => reject(new Error('Flight cancelled')),
      });
    });
  }

  /** 飞行到 WGS84 坐标 */
  async flyToPosition(
    coord: WGS84Coordinate,
    options?: FlyToOptions & { heading?: number; pitch?: number },
  ): Promise<void> {
    return this.flyTo(
      new Viewpoint({
        longitude: coord.longitude,
        latitude: coord.latitude,
        height: coord.height ?? 1000,
        heading: options?.heading,
        pitch: options?.pitch,
      }),
      options,
    );
  }

  /** 立即跳转到视点（无动画） */
  setView(viewpoint: Viewpoint | ViewpointData): void {
    const vp = viewpoint instanceof Viewpoint ? viewpoint : new Viewpoint(viewpoint);
    this.viewer.camera.setView({
      destination: vp.toCartesian(),
      orientation: {
        heading: Cesium.Math.toRadians(vp.heading),
        pitch: Cesium.Math.toRadians(vp.pitch),
        roll: Cesium.Math.toRadians(vp.roll),
      },
    });
  }

  /** 缩放到全局 */
  async zoomGlobal(duration = 2): Promise<void> {
    return this.flyTo(
      new Viewpoint({ longitude: 105, latitude: 35, height: 20000000 }),
      { duration },
    );
  }

  /** 缩放到指定范围 */
  async zoomTo(
    target: Cesium.Entity | Cesium.EntityCollection | Cesium.DataSource,
    duration = 2,
  ): Promise<void> {
    await this.viewer.flyTo(target, { duration });
  }

  /** 锁定相机到目标 */
  lockTo(entity: Cesium.Entity): void {
    this.viewer.trackedEntity = entity;
  }

  /** 解锁相机 */
  unlock(): void {
    this.viewer.trackedEntity = undefined;
  }

  // ── 视点书签 ──

  /** 添加书签 */
  addBookmark(id: string, name: string, viewpoint?: ViewpointData): ViewpointBookmark {
    const vp = viewpoint ?? this.getCurrentViewpoint().toObject();
    const bookmark: ViewpointBookmark = { id, name, viewpoint: vp };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  /** 获取书签 */
  getBookmark(id: string): ViewpointBookmark | undefined {
    return this.bookmarks.get(id);
  }

  /** 获取所有书签 */
  getAllBookmarks(): ViewpointBookmark[] {
    return Array.from(this.bookmarks.values());
  }

  /** 删除书签 */
  removeBookmark(id: string): boolean {
    return this.bookmarks.delete(id);
  }

  /** 飞行到书签 */
  async flyToBookmark(id: string, options?: FlyToOptions): Promise<void> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return;
    return this.flyTo(bookmark.viewpoint, options);
  }

  /** 获取 Cesium 原生 Camera */
  getCesiumTarget(): Cesium.Camera {
    return this.viewer.camera;
  }

  /** 销毁 */
  destroy(): void {
    this.bookmarks.clear();
    this.disposePool.disposeAll();
    this.logger.info('CameraManager destroyed');
  }
}
