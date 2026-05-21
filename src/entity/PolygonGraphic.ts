import * as Cesium from 'cesium';
import { BaseGraphic } from './BaseGraphic';
import { GraphicType, PolygonStyle } from './GraphicStyle';
import { CoordinateUtil } from '../util/CoordinateUtil';
import type { WGS84Coordinate } from '../util/CoordinateUtil';
import { ColorUtil } from '../util/ColorUtil';

const DEFAULT_POLYGON_STYLE: Required<PolygonStyle> = {
  color: '#FFFFFF',
  outline: true,
  outlineColor: '#000000',
  outlineWidth: 1,
  heightReference: 'none',
  extrudedHeight: 0,
};

/**
 * 多边形图形
 */
export class PolygonGraphic extends BaseGraphic {
  private readonly positions: WGS84Coordinate[];
  private readonly style: Required<PolygonStyle>;

  constructor(id: string, positions: WGS84Coordinate[], style?: PolygonStyle) {
    super(id, GraphicType.POLYGON);
    this.positions = positions;
    this.style = { ...DEFAULT_POLYGON_STYLE, ...style };
  }

  _attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    const hierarchy = CoordinateUtil.toCartesians(this.positions);
    this.cesiumEntity = viewer.entities.add({
      id: this.id,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(hierarchy),
        material: ColorUtil.fromCss(this.style.color).withAlpha(0.5),
        outline: this.style.outline,
        outlineColor: ColorUtil.fromCss(this.style.outlineColor),
        heightReference: this.toHeightReference(this.style.heightReference),
        extrudedHeight: this.style.extrudedHeight || undefined,
      },
    });
  }

  private toHeightReference(ref: string): Cesium.HeightReference {
    switch (ref) {
      case 'clamp': return Cesium.HeightReference.CLAMP_TO_GROUND;
      case 'relative': return Cesium.HeightReference.RELATIVE_TO_GROUND;
      default: return Cesium.HeightReference.NONE;
    }
  }
}
