import * as Cesium from "cesium";
import { BaseGraphic } from "./BaseGraphic";
import { GraphicType, PolylineStyle } from "./GraphicStyle";
import { ColorUtil } from "../util/color";
import { CoordinateUtil } from "../util/coordinate";
import type { WGS84Coordinate } from "../util/coordinate";
import { ValidationUtil } from "../util/validation";

const DEFAULT_POLYLINE_STYLE: Required<PolylineStyle> = {
  width: 2,
  color: "#FFFFFF",
  clampToGround: false,
};

/**
 * 线图形
 */
export class PolylineGraphic extends BaseGraphic {
  private positions: WGS84Coordinate[];
  private style: Required<PolylineStyle>;

  constructor(id: string, positions: WGS84Coordinate[], style?: PolylineStyle) {
    super(id, GraphicType.POLYLINE);
    ValidationUtil.positions(positions, 2, "Polyline");
    this.validateStyle(style);
    this.positions = positions.map((position) => ({ ...position }));
    this.style = { ...DEFAULT_POLYLINE_STYLE, ...style };
  }

  getPositions(): WGS84Coordinate[] {
    this.ensureNotRemoved();
    return this.positions.map((position) => ({ ...position }));
  }

  setPositions(positions: WGS84Coordinate[]): this {
    this.ensureNotRemoved();
    ValidationUtil.positions(positions, 2, "Polyline");
    this.positions = positions.map((position) => ({ ...position }));
    if (this.cesiumEntity?.polyline) {
      this.cesiumEntity.polyline.positions = new Cesium.ConstantProperty(
        CoordinateUtil.toCartesians(this.positions),
      );
    }
    this.emitUpdated();
    return this;
  }

  getStyle(): Required<PolylineStyle> {
    this.ensureNotRemoved();
    return { ...this.style };
  }

  setStyle(style: PolylineStyle): this {
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
      polyline: this.createPolylineOptions(),
    });
  }

  private applyStyle(): void {
    if (!this.cesiumEntity?.polyline) return;
    this.cesiumEntity.polyline.width = new Cesium.ConstantProperty(
      this.style.width,
    );
    this.cesiumEntity.polyline.material = new Cesium.ColorMaterialProperty(
      ColorUtil.fromCss(this.style.color),
    );
    this.cesiumEntity.polyline.clampToGround = new Cesium.ConstantProperty(
      this.style.clampToGround,
    );
  }

  private createPolylineOptions(): Cesium.PolylineGraphics.ConstructorOptions {
    return {
      positions: CoordinateUtil.toCartesians(this.positions),
      width: this.style.width,
      material: ColorUtil.fromCss(this.style.color),
      clampToGround: this.style.clampToGround,
    };
  }

  private validateStyle(style?: PolylineStyle): void {
    if (!style) return;
    ValidationUtil.positiveNumber(style.width, "Polyline width");
    ValidationUtil.cssColor(style.color, "Polyline color");
  }
}
