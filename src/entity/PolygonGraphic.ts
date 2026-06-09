import * as Cesium from "cesium";
import { BaseGraphic } from "./BaseGraphic";
import { GraphicType, PolygonStyle } from "./GraphicStyle";
import { CoordinateUtil } from "../util/CoordinateUtil";
import type { WGS84Coordinate } from "../util/CoordinateUtil";
import { ColorUtil } from "../util/ColorUtil";
import { ValidationUtil } from "../util/ValidationUtil";

const DEFAULT_POLYGON_STYLE: Required<PolygonStyle> = {
  color: "#FFFFFF",
  outline: true,
  outlineColor: "#000000",
  outlineWidth: 1,
  heightReference: "none",
  extrudedHeight: 0,
};

/**
 * 多边形图形
 */
export class PolygonGraphic extends BaseGraphic {
  private positions: WGS84Coordinate[];
  private style: Required<PolygonStyle>;

  constructor(id: string, positions: WGS84Coordinate[], style?: PolygonStyle) {
    super(id, GraphicType.POLYGON);
    ValidationUtil.positions(positions, 3, "Polygon");
    this.validateStyle(style);
    this.positions = positions.map((position) => ({ ...position }));
    this.style = { ...DEFAULT_POLYGON_STYLE, ...style };
  }

  getPositions(): WGS84Coordinate[] {
    this.ensureNotRemoved();
    return this.positions.map((position) => ({ ...position }));
  }

  setPositions(positions: WGS84Coordinate[]): this {
    this.ensureNotRemoved();
    ValidationUtil.positions(positions, 3, "Polygon");
    this.positions = positions.map((position) => ({ ...position }));
    if (this.cesiumEntity?.polygon) {
      this.cesiumEntity.polygon.hierarchy = new Cesium.ConstantProperty(
        this.createHierarchy(),
      );
    }
    this.emitUpdated();
    return this;
  }

  getStyle(): Required<PolygonStyle> {
    this.ensureNotRemoved();
    return { ...this.style };
  }

  setStyle(style: PolygonStyle): this {
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
      polygon: this.createPolygonOptions(),
    });
  }

  private applyStyle(): void {
    if (!this.cesiumEntity?.polygon) return;
    this.cesiumEntity.polygon.material = new Cesium.ColorMaterialProperty(
      ColorUtil.fromCss(this.style.color).withAlpha(0.5),
    );
    this.cesiumEntity.polygon.outline = new Cesium.ConstantProperty(
      this.style.outline,
    );
    this.cesiumEntity.polygon.outlineColor = new Cesium.ConstantProperty(
      ColorUtil.fromCss(this.style.outlineColor),
    );
    this.cesiumEntity.polygon.heightReference = new Cesium.ConstantProperty(
      this.toHeightReference(this.style.heightReference),
    );
    this.cesiumEntity.polygon.extrudedHeight = new Cesium.ConstantProperty(
      this.style.extrudedHeight || undefined,
    );
  }

  private createPolygonOptions(): Cesium.PolygonGraphics.ConstructorOptions {
    return {
      hierarchy: this.createHierarchy(),
      material: ColorUtil.fromCss(this.style.color).withAlpha(0.5),
      outline: this.style.outline,
      outlineColor: ColorUtil.fromCss(this.style.outlineColor),
      heightReference: this.toHeightReference(this.style.heightReference),
      extrudedHeight: this.style.extrudedHeight || undefined,
    };
  }

  private createHierarchy(): Cesium.PolygonHierarchy {
    return new Cesium.PolygonHierarchy(
      CoordinateUtil.toCartesians(this.positions),
    );
  }

  private validateStyle(style?: PolygonStyle): void {
    if (!style) return;
    ValidationUtil.cssColor(style.color, "Polygon color");
    ValidationUtil.cssColor(style.outlineColor, "Polygon outlineColor");
    ValidationUtil.nonNegativeNumber(
      style.outlineWidth,
      "Polygon outlineWidth",
    );
    ValidationUtil.nonNegativeNumber(
      style.extrudedHeight,
      "Polygon extrudedHeight",
    );
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
