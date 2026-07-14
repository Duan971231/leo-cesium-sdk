import * as Cesium from "cesium";

import { ErrorCode, SDKError } from "@/common/SDKError";

type CoordinateLike = {
  longitude: number;
  latitude: number;
  height?: number;
};

export interface ViewpointLike extends CoordinateLike {
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

/** 必要性参数校验 */
export const ValidationUtil = {
  /** 校验字符串 ID 非空，否则抛出 SDKError。 */
  id(value: string, label: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be a non-empty string`);
    }
  },

  /** 校验经纬度及可选高度是否合法，否则抛出 SDKError。 */
  coordinate(value: CoordinateLike, label = "Coordinate"): void {
    if (!value || typeof value !== "object") {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} is required`);
    }

    const { longitude, latitude, height } = value;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "Longitude must be a finite number between -180 and 180");
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "Latitude must be a finite number between -90 and 90");
    }
    if (height !== undefined && !Number.isFinite(height)) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "Height must be a finite number");
    }
  },

  /** 校验坐标数组达到最小数量且每个坐标均合法，否则抛出 SDKError。 */
  positions(positions: CoordinateLike[], minCount: number, label: string): void {
    if (!Array.isArray(positions) || positions.length < minCount) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} requires at least ${minCount} positions`);
    }
    for (const position of positions) {
      this.coordinate(position);
    }
  },

  /** 校验视点坐标、高度与姿态角是否合法，否则抛出 SDKError。 */
  viewpoint(value: ViewpointLike): void {
    this.coordinate(value, "Viewpoint data");
    if (!Number.isFinite(value.height)) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "Viewpoint height must be a finite number");
    }
    this.angle(value.heading, "heading");
    this.angle(value.pitch, "pitch");
    this.angle(value.roll, "roll");
  },

  /** 校验可选角度为有限数值，否则抛出 SDKError。 */
  angle(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value)) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be a finite number`);
    }
  },

  /** 校验可选时长为非负有限数值，否则抛出 SDKError。 */
  duration(value: number | undefined): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "duration must be 0 or greater");
    }
  },

  /** 校验可选数值大于或等于 0，否则抛出 SDKError。 */
  nonNegativeNumber(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be 0 or greater`);
    }
  },

  /** 校验可选数值严格大于 0，否则抛出 SDKError。 */
  positiveNumber(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value <= 0) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be greater than 0`);
    }
  },

  /** 校验可选透明度位于 [0, 1]，否则抛出 SDKError。 */
  opacity(value: number | undefined, label = "Opacity"): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be between 0 and 1`);
    }
  },

  /** 校验可选字符串可被解析为 CSS 颜色，否则抛出 SDKError。 */
  cssColor(value: string | undefined, label: string): void {
    if (value === undefined) return;
    if (typeof value !== "string") {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be a valid CSS color`);
    }
    try {
      if (!Cesium.Color.fromCssColorString(value)) {
        throw new Error("Invalid color");
      }
    } catch {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} must be a valid CSS color`);
    }
  },
};
