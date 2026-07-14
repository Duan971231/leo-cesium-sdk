import { areGeoRangesEqual, intersectGeoRanges, isValidGeoRange } from "./operations";

export { WORLD_RANGE, areGeoRangesEqual, intersectGeoRanges, isValidGeoRange } from "./operations";
export type { GeoRange } from "./types";

/** 经纬度范围相关的无状态工具。 */
export const rangeUtil = {
  /** 按指定容差逐项比较两个经纬度范围，默认要求完全相等。 */
  areGeoRangesEqual,
  /** 计算两个经纬度范围的交集；无重叠面积时返回 undefined。 */
  intersectGeoRanges,
  /** 判断输入是否为边界合法且面积大于 0 的经纬度范围。 */
  isValidGeoRange,
};
