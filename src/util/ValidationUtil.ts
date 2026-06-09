import * as Cesium from "cesium";
import { SDKError, ErrorCode } from "../common/SDKError";
import type { WGS84Coordinate } from "./CoordinateUtil";

export interface ViewpointLike extends WGS84Coordinate {
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export const ValidationUtil = {
  id(value: string, label: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be a non-empty string`,
      );
    }
  },

  coordinate(value: WGS84Coordinate, label = "Coordinate"): void {
    if (!value || typeof value !== "object") {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, `${label} is required`);
    }

    const { longitude, latitude, height } = value;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Longitude must be a finite number between -180 and 180",
      );
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Latitude must be a finite number between -90 and 90",
      );
    }
    if (height !== undefined && !Number.isFinite(height)) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Height must be a finite number",
      );
    }
  },

  positions(
    positions: WGS84Coordinate[],
    minCount: number,
    label: string,
  ): void {
    if (!Array.isArray(positions) || positions.length < minCount) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} requires at least ${minCount} positions`,
      );
    }
    for (const position of positions) {
      this.coordinate(position);
    }
  },

  viewpoint(value: ViewpointLike): void {
    this.coordinate(value, "Viewpoint data");
    if (!Number.isFinite(value.height)) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Viewpoint height must be a finite number",
      );
    }
    this.angle(value.heading, "heading");
    this.angle(value.pitch, "pitch");
    this.angle(value.roll, "roll");
  },

  angle(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value)) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be a finite number`,
      );
    }
  },

  duration(value: number | undefined): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "duration must be 0 or greater",
      );
    }
  },

  nonNegativeNumber(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be 0 or greater`,
      );
    }
  },

  positiveNumber(value: number | undefined, label: string): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value <= 0) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be greater than 0`,
      );
    }
  },

  opacity(value: number | undefined, label = "Opacity"): void {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be between 0 and 1`,
      );
    }
  },

  cssColor(value: string | undefined, label: string): void {
    if (value === undefined) return;
    if (typeof value !== "string") {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be a valid CSS color`,
      );
    }
    try {
      if (!Cesium.Color.fromCssColorString(value)) {
        throw new Error("Invalid color");
      }
    } catch {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        `${label} must be a valid CSS color`,
      );
    }
  },
};
