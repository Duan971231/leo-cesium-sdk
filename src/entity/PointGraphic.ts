import * as Cesium from "cesium";
import { BaseGraphic } from "./BaseGraphic";
import { GraphicType, PointStyle } from "./GraphicStyle";
import { ColorUtil } from "../util/color";
import { CoordinateUtil } from "../util/coordinate";
import type { WGS84Coordinate } from "../util/coordinate";
import { ValidationUtil } from "../util/validation";

const DEFAULT_POINT_STYLE: Required<PointStyle> = {
  pixelSize: 10,
  color: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 1,
  heightReference: "none",
};

/**
 * 点图形
 */
export class PointGraphic extends BaseGraphic {
  private position: WGS84Coordinate;
  private style: Required<PointStyle>;

  constructor(id: string, position: WGS84Coordinate, style?: PointStyle) {
    super(id, GraphicType.POINT);
    ValidationUtil.coordinate(position);
    this.validateStyle(style);
    this.position = { ...position };
    this.style = { ...DEFAULT_POINT_STYLE, ...style };
  }

  getPosition(): WGS84Coordinate {
    this.ensureNotRemoved();
    return { ...this.position };
  }

  setPosition(position: WGS84Coordinate): this {
    this.ensureNotRemoved();
    ValidationUtil.coordinate(position);
    this.position = { ...position };
    if (this.cesiumEntity) {
      this.cesiumEntity.position = new Cesium.ConstantPositionProperty(
        CoordinateUtil.toCartesian(position),
      );
    }
    this.emitUpdated();
    return this;
  }

  getStyle(): Required<PointStyle> {
    this.ensureNotRemoved();
    return { ...this.style };
  }

  setStyle(style: PointStyle): this {
    this.ensureNotRemoved();
    this.validateStyle(style);
    this.style = { ...this.style, ...style };
    this.applyStyle();
    this.emitUpdated();
    return this;
  }

  _attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    this.cesiumEntity = viewer.entities.add({
      id: this.id,
      position: CoordinateUtil.toCartesian(this.position),
      point: this.createPointOptions(),
    });
  }

  private applyStyle(): void {
    if (!this.cesiumEntity?.point) return;
    this.cesiumEntity.point.pixelSize = new Cesium.ConstantProperty(
      this.style.pixelSize,
    );
    this.cesiumEntity.point.color = new Cesium.ConstantProperty(
      ColorUtil.fromCss(this.style.color),
    );
    this.cesiumEntity.point.outlineColor = new Cesium.ConstantProperty(
      ColorUtil.fromCss(this.style.outlineColor),
    );
    this.cesiumEntity.point.outlineWidth = new Cesium.ConstantProperty(
      this.style.outlineWidth,
    );
    this.cesiumEntity.point.heightReference = new Cesium.ConstantProperty(
      this.toHeightReference(this.style.heightReference),
    );
  }

  private createPointOptions(): Cesium.PointGraphics.ConstructorOptions {
    return {
      pixelSize: this.style.pixelSize,
      color: ColorUtil.fromCss(this.style.color),
      outlineColor: ColorUtil.fromCss(this.style.outlineColor),
      outlineWidth: this.style.outlineWidth,
      heightReference: this.toHeightReference(this.style.heightReference),
    };
  }

  private validateStyle(style?: PointStyle): void {
    if (!style) return;
    ValidationUtil.positiveNumber(style.pixelSize, "Point pixelSize");
    ValidationUtil.nonNegativeNumber(style.outlineWidth, "Point outlineWidth");
    ValidationUtil.cssColor(style.color, "Point color");
    ValidationUtil.cssColor(style.outlineColor, "Point outlineColor");
  }

  private toHeightReference(ref: string): Cesium.HeightReference {
    switch (ref) {
      case "clamp":
        return Cesium.HeightReference.CLAMP_TO_GROUND;
      case "relative":
        return Cesium.HeightReference.RELATIVE_TO_GROUND;
      default:
        return Cesium.HeightReference.NONE;
    }
  }
}
