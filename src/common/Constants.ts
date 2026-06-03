export const SDK_VERSION = '0.1.0';

export const WGS84 = {
  A: 6378137.0,
  B: 6356752.3142451793,
  FLATTENING: 1 / 298.257223563,
} as const;

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
