export const SDK_VERSION = '0.1.0';

/** WGS84 椭球体参数 */
export const WGS84 = {
  A: 6378137.0,
  B: 6356752.3142451793,
  FLATTENING: 1 / 298.257223563,
} as const;

/** 角度/弧度转换常量 */
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
