import * as Cesium from 'cesium';
import { SDKError, ErrorCode } from '../common/SDKError';

export interface WGS84Coordinate {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface ScreenCoordinate {
  x: number;
  y: number;
}

/**
 * 坐标转换工具：WGS84 / Cartesian3 / Screen 互转
 */
export const CoordinateUtil = {
  /** WGS84 → Cartesian3 */
  toCartesian(coord: WGS84Coordinate): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
      coord.longitude,
      coord.latitude,
      coord.height ?? 0,
    );
  },

  /** 批量 WGS84 → Cartesian3 */
  toCartesians(coords: WGS84Coordinate[]): Cesium.Cartesian3[] {
    const positions: number[] = [];
    for (const c of coords) {
      positions.push(c.longitude, c.latitude, c.height ?? 0);
    }
    return Cesium.Cartesian3.fromDegreesArrayHeights(positions);
  },

  /** Cartesian3 → WGS84 */
  toWGS84(cartesian: Cesium.Cartesian3): WGS84Coordinate {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    if (!cartographic) {
      throw new SDKError(
        ErrorCode.COORDINATE_TRANSFORM_FAILED,
        'Cannot convert Cartesian3 to WGS84',
      );
    }
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
    };
  },

  /** Cartesian3 → 屏幕坐标 */
  toScreen(cartesian: Cesium.Cartesian3, scene: Cesium.Scene): ScreenCoordinate {
    const result = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian);
    if (!result) {
      throw new SDKError(
        ErrorCode.COORDINATE_TRANSFORM_FAILED,
        'Cannot convert Cartesian3 to screen coordinates',
      );
    }
    return { x: result.x, y: result.y };
  },

  /** 屏幕坐标 → Cartesian3（射线与椭球面交点） */
  fromScreen(screen: ScreenCoordinate, scene: Cesium.Scene): Cesium.Cartesian3 {
    const ray = scene.camera.getPickRay(new Cesium.Cartesian2(screen.x, screen.y));
    if (!ray) {
      throw new SDKError(
        ErrorCode.COORDINATE_TRANSFORM_FAILED,
        'Cannot create pick ray from screen coordinates',
      );
    }
    const cartesian = scene.globe.pick(ray, scene);
    if (!cartesian) {
      throw new SDKError(
        ErrorCode.COORDINATE_TRANSFORM_FAILED,
        'No intersection with globe',
      );
    }
    return cartesian;
  },

  /** 屏幕坐标 → WGS84 */
  screenToWGS84(screen: ScreenCoordinate, scene: Cesium.Scene): WGS84Coordinate {
    const cartesian = this.fromScreen(screen, scene);
    return this.toWGS84(cartesian);
  },

  /** WGS84 → 屏幕坐标 */
  wgs84ToScreen(coord: WGS84Coordinate, scene: Cesium.Scene): ScreenCoordinate {
    const cartesian = this.toCartesian(coord);
    return this.toScreen(cartesian, scene);
  },

  /** 判断 Cartesian3 是否有效（非 NaN、非 Infinity） */
  isValid(cartesian: Cesium.Cartesian3): boolean {
    return (
      Cesium.defined(cartesian) &&
      Number.isFinite(cartesian.x) &&
      Number.isFinite(cartesian.y) &&
      Number.isFinite(cartesian.z)
    );
  },
};
