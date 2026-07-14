import * as Cesium from "cesium";

import { ErrorCode, SDKError } from "@/common/SDKError";
import type { GeoRange } from "@/util/range";
import { calculateViewerRange, EMPTY_VIEWER_RANGE } from "./range";

export type LonLatResult = {
  lon?: number;
  lat?: number;
};

/**
 * 根据传入的屏幕中的像素坐标获取 viewer 中当前点的经纬度。
 * 参数无效时抛出 SDKError，像素未与地球相交时返回空经纬度。
 */
export const getLonLatByPixel = (pixel: Cesium.Cartesian2, viewer: Cesium.Viewer): LonLatResult => {
  validatePixel(pixel);
  validateViewer(viewer);

  return pickLonLatByPixel(pixel, viewer);
};

/**
 * 获取当前 viewer 可见经纬度范围。
 * Viewer 无效时抛出 SDKError，画布不可用或四角四边均无法拾取时返回空范围副本。
 */
export const getViewerRange = (viewer: Cesium.Viewer): GeoRange => {
  // 判断 viewer 是否合法
  validateViewer(viewer, true);

  const { clientWidth: width, clientHeight: height } = viewer.scene.canvas;
  if (width <= 0 || height <= 0) return { ...EMPTY_VIEWER_RANGE };

  const maxX = Math.max(width - 1, 0);
  const maxY = Math.max(height - 1, 0);

  return calculateViewerRange((xRatio, yRatio) => ({
    xRatio,
    yRatio,
    ...pickLonLatByPixel(new Cesium.Cartesian2(maxX * xRatio, maxY * yRatio), viewer),
  }));
};

/** 执行像素拾取并转换为经纬度，不重复进行参数校验。 */
const pickLonLatByPixel = (pixel: Cesium.Cartesian2, viewer: Cesium.Viewer): LonLatResult => {
  const ray = viewer.camera.getPickRay(pixel);
  let cartesian = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;

  if (!cartesian && viewer.scene.mode === Cesium.SceneMode.COLUMBUS_VIEW) {
    cartesian = viewer.scene.camera.pickEllipsoid(pixel, viewer.scene.globe.ellipsoid);
  }

  if (!cartesian) return { lon: undefined, lat: undefined };

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
  };
};

/** 校验 Viewer 的相机、地球及可选画布是否可用。 */
const validateViewer = (viewer: Cesium.Viewer, requireCanvas = false): void => {
  if (!viewer?.camera || !viewer.scene?.globe || (requireCanvas && !viewer.scene.canvas)) {
    throw new SDKError(ErrorCode.INVALID_OPTIONS, "viewer is required");
  }
};

/** 校验像素坐标的 x、y 分量均为有限数值。 */
const validatePixel = (pixel: Cesium.Cartesian2): void => {
  if (!pixel || !Number.isFinite(pixel.x) || !Number.isFinite(pixel.y)) {
    throw new SDKError(ErrorCode.INVALID_OPTIONS, "pixel must contain finite x and y values");
  }
};
