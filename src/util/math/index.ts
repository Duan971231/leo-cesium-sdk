import * as Cesium from "cesium";

type GeographicCoordinate = {
  longitude: number;
  latitude: number;
};

const WGS84_SEMI_MAJOR_AXIS = 6378137;
const DEG_TO_RAD = Math.PI / 180;

export const MathUtil = {
  /** 判断输入是否为有限数值。 */
  isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  },

  /** 使用 Haversine 公式计算两个经纬度坐标间的球面距离，单位为米。 */
  haversineDistance(source: GeographicCoordinate, target: GeographicCoordinate): number {
    const dLat = (target.latitude - source.latitude) * DEG_TO_RAD;
    const dLon = (target.longitude - source.longitude) * DEG_TO_RAD;
    const lat1 = source.latitude * DEG_TO_RAD;
    const lat2 = target.latitude * DEG_TO_RAD;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return WGS84_SEMI_MAJOR_AXIS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  },

  /** 计算两个 Cartesian3 坐标间的欧氏距离。 */
  euclideanDistance(a: Cesium.Cartesian3, b: Cesium.Cartesian3): number {
    return Cesium.Cartesian3.distance(a, b);
  },

  /** 计算经纬度闭合环在 WGS84 球面上的近似面积，单位为平方米。 */
  sphericalArea(ring: GeographicCoordinate[]): number {
    if (ring.length < 3) return 0;
    const n = ring.length;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      total +=
        (ring[j].longitude - ring[i].longitude) *
        DEG_TO_RAD *
        (2 * Math.sin(ring[i].latitude * DEG_TO_RAD) + Math.sin(ring[j].latitude * DEG_TO_RAD));
    }
    return Math.abs((total * WGS84_SEMI_MAJOR_AXIS * WGS84_SEMI_MAJOR_AXIS) / 3);
  },

  /** 将角度转换为弧度。 */
  degToRad(deg: number): number {
    return Cesium.Math.toRadians(deg);
  },

  /** 将弧度转换为角度。 */
  radToDeg(rad: number): number {
    return Cesium.Math.toDegrees(rad);
  },

  /** 在起止值之间插值，并将插值系数限制在 [0, 1]。 */
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Cesium.Math.clamp(t, 0, 1);
  },

  /** 将数值限制在指定的最小值与最大值之间。 */
  clamp(value: number, min: number, max: number): number {
    return Cesium.Math.clamp(value, min, max);
  },
};
