import * as Cesium from "cesium";
import type { WGS84Coordinate } from "../util/CoordinateUtil";
import { CoordinateUtil } from "../util/CoordinateUtil";
import { ValidationUtil } from "../util/ValidationUtil";

export interface ViewpointData {
  longitude: number;
  latitude: number;
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export class Viewpoint {
  readonly longitude: number;
  readonly latitude: number;
  readonly height: number;
  readonly heading: number;
  readonly pitch: number;
  readonly roll: number;

  constructor(data: ViewpointData) {
    ValidationUtil.viewpoint(data);
    this.longitude = data.longitude;
    this.latitude = data.latitude;
    this.height = data.height;
    this.heading = data.heading ?? 0;
    this.pitch = data.pitch ?? -90;
    this.roll = data.roll ?? 0;
  }

  toObject(): ViewpointData {
    return {
      longitude: this.longitude,
      latitude: this.latitude,
      height: this.height,
      heading: this.heading,
      pitch: this.pitch,
      roll: this.roll,
    };
  }

  static fromCartesian(
    cartesian: Cesium.Cartesian3,
    heading = 0,
    pitch = -90,
    roll = 0,
  ): Viewpoint {
    const wgs84 = CoordinateUtil.toWGS84(cartesian);
    return new Viewpoint({
      longitude: wgs84.longitude,
      latitude: wgs84.latitude,
      height: wgs84.height ?? 0,
      heading,
      pitch,
      roll,
    });
  }

  static fromCamera(camera: Cesium.Camera): Viewpoint {
    const wgs84 = CoordinateUtil.toWGS84(camera.positionWC);
    return new Viewpoint({
      longitude: wgs84.longitude,
      latitude: wgs84.latitude,
      height: wgs84.height ?? 0,
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll),
    });
  }

  toCartesian(): Cesium.Cartesian3 {
    return CoordinateUtil.toCartesian(this.toObject());
  }
}
