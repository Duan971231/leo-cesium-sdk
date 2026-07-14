import * as Cesium from "cesium";

import { ErrorCode, SDKError } from "@/common/SDKError";

export interface WGS84Coordinate {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface ScreenCoordinate {
  x: number;
  y: number;
}

export const CoordinateUtil = {
  /** 将 WGS84 经纬度坐标转换为 Cesium.Cartesian3。 */
  toCartesian(coord: WGS84Coordinate): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(coord.longitude, coord.latitude, coord.height ?? 0);
  },

  /** 批量将 WGS84 经纬度坐标转换为 Cesium.Cartesian3。 */
  toCartesians(coords: WGS84Coordinate[]): Cesium.Cartesian3[] {
    const positions: number[] = [];
    for (const coordinate of coords) {
      positions.push(coordinate.longitude, coordinate.latitude, coordinate.height ?? 0);
    }
    return Cesium.Cartesian3.fromDegreesArrayHeights(positions);
  },

  /** 将 Cesium.Cartesian3 转换为 WGS84 经纬度坐标，转换失败时抛出 SDKError。 */
  toWGS84(cartesian: Cesium.Cartesian3): WGS84Coordinate {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    if (!cartographic) {
      throw new SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, "Cannot convert Cartesian3 to WGS84");
    }
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
    };
  },

  /** 将世界坐标转换为屏幕坐标，坐标不可见时抛出 SDKError。 */
  toScreen(cartesian: Cesium.Cartesian3, scene: Cesium.Scene): ScreenCoordinate {
    const result = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian);
    if (!result) {
      throw new SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, "Cannot convert Cartesian3 to screen coordinates");
    }
    return { x: result.x, y: result.y };
  },

  /** 将屏幕坐标拾取为地球表面的世界坐标，无法相交时抛出 SDKError。 */
  fromScreen(screen: ScreenCoordinate, scene: Cesium.Scene): Cesium.Cartesian3 {
    const ray = scene.camera.getPickRay(new Cesium.Cartesian2(screen.x, screen.y));
    if (!ray) {
      throw new SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, "Cannot create pick ray from screen coordinates");
    }
    const cartesian = scene.globe.pick(ray, scene);
    if (!cartesian) {
      throw new SDKError(ErrorCode.COORDINATE_TRANSFORM_FAILED, "No intersection with globe");
    }
    return cartesian;
  },

  /** 将屏幕坐标转换为 WGS84 经纬度坐标。 */
  screenToWGS84(screen: ScreenCoordinate, scene: Cesium.Scene): WGS84Coordinate {
    const cartesian = this.fromScreen(screen, scene);
    return this.toWGS84(cartesian);
  },

  /** 将 WGS84 经纬度坐标转换为屏幕坐标。 */
  wgs84ToScreen(coord: WGS84Coordinate, scene: Cesium.Scene): ScreenCoordinate {
    const cartesian = this.toCartesian(coord);
    return this.toScreen(cartesian, scene);
  },

  /** 判断 Cartesian3 的三个分量是否均为有限数值。 */
  isValid(cartesian: Cesium.Cartesian3): boolean {
    return (
      Cesium.defined(cartesian) &&
      Number.isFinite(cartesian.x) &&
      Number.isFinite(cartesian.y) &&
      Number.isFinite(cartesian.z)
    );
  },
};
