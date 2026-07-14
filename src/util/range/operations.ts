import type { GeoRange } from "./types";

/** 全球经纬度范围。 */
export const WORLD_RANGE: Readonly<GeoRange> = Object.freeze({
  minLon: -180,
  minLat: -90,
  maxLon: 180,
  maxLat: 90,
});

/** 判断输入是否为边界合法且面积大于 0 的经纬度范围。 */
export const isValidGeoRange = (value: unknown): value is GeoRange => {
  if (!value || typeof value !== "object") return false;

  const range = value as GeoRange;
  return (
    Number.isFinite(range.minLon) &&
    Number.isFinite(range.minLat) &&
    Number.isFinite(range.maxLon) &&
    Number.isFinite(range.maxLat) &&
    range.minLon >= WORLD_RANGE.minLon &&
    range.maxLon <= WORLD_RANGE.maxLon &&
    range.minLat >= WORLD_RANGE.minLat &&
    range.maxLat <= WORLD_RANGE.maxLat &&
    range.minLon < range.maxLon &&
    range.minLat < range.maxLat
  );
};

/** 计算两个经纬度范围的交集；无重叠面积时返回 undefined。 */
export const intersectGeoRanges = (source: GeoRange, target: GeoRange): GeoRange | undefined => {
  const intersection = {
    minLon: Math.max(source.minLon, target.minLon),
    minLat: Math.max(source.minLat, target.minLat),
    maxLon: Math.min(source.maxLon, target.maxLon),
    maxLat: Math.min(source.maxLat, target.maxLat),
  };

  return intersection.minLon < intersection.maxLon && intersection.minLat < intersection.maxLat
    ? intersection
    : undefined;
};

/** 按指定容差逐项比较两个经纬度范围，默认要求完全相等。 */
export const areGeoRangesEqual = (source: GeoRange, target: GeoRange, padding = 0): boolean =>
  Math.abs(source.minLon - target.minLon) <= padding &&
  Math.abs(source.minLat - target.minLat) <= padding &&
  Math.abs(source.maxLon - target.maxLon) <= padding &&
  Math.abs(source.maxLat - target.maxLat) <= padding;
