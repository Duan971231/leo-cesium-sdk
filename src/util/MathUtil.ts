import * as Cesium from 'cesium';
import { WGS84Coordinate } from './CoordinateUtil';
import { WGS84, DEG_TO_RAD } from '../common/Constants';

export const MathUtil = {
  /** Haversine 公式计算两点间地表距离（米） */
  haversineDistance(a: WGS84Coordinate, b: WGS84Coordinate): number {
    const dLat = (b.latitude - a.latitude) * DEG_TO_RAD;
    const dLon = (b.longitude - a.longitude) * DEG_TO_RAD;
    const lat1 = a.latitude * DEG_TO_RAD;
    const lat2 = b.latitude * DEG_TO_RAD;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return WGS84.A * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  },

  /** 三维欧氏距离 */
  euclideanDistance(a: Cesium.Cartesian3, b: Cesium.Cartesian3): number {
    return Cesium.Cartesian3.distance(a, b);
  },

  /** 计算多边形面积（球面过剩法，单位：平方米） */
  sphericalArea(ring: WGS84Coordinate[]): number {
    if (ring.length < 3) return 0;
    const n = ring.length;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      total += (ring[j].longitude - ring[i].longitude) * DEG_TO_RAD
        * (2 * Math.sin(ring[i].latitude * DEG_TO_RAD)
          + Math.sin(ring[j].latitude * DEG_TO_RAD));
    }
    return Math.abs(total * WGS84.A * WGS84.A / 3);
  },

  /** 角度转弧度 */
  degToRad(deg: number): number {
    return Cesium.Math.toRadians(deg);
  },

  /** 弧度转角度 */
  radToDeg(rad: number): number {
    return Cesium.Math.toDegrees(rad);
  },

  /** 线性插值 */
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Cesium.Math.clamp(t, 0, 1);
  },

  /** 限制值在范围内 */
  clamp(value: number, min: number, max: number): number {
    return Cesium.Math.clamp(value, min, max);
  },
};
