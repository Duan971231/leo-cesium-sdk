import { getLonLatByPixel, getViewerRange } from "./viewer";

export { getLonLatByPixel, getViewerRange } from "./viewer";
export type { LonLatResult } from "./viewer";

/** Cesium Viewer 坐标拾取与可见范围工具。 */
export const viewerUtil = {
  getLonLatByPixel,
  getViewerRange,
};
