import * as Cesium from 'cesium';
import { BaseGraphic } from './BaseGraphic';
import { GraphicType, PointStyle } from './GraphicStyle';
import { CoordinateUtil } from '../util/CoordinateUtil';
import type { WGS84Coordinate } from '../util/CoordinateUtil';
import { ColorUtil } from '../util/ColorUtil';

const DEFAULT_POINT_STYLE: Required<PointStyle> = {
  pixelSize: 10,
  color: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 1,
  heightReference: 'none',
};

/**
 * 点图形
 */
export class PointGraphic extends BaseGraphic {
  private readonly position: WGS84Coordinate;
  private readonly style: Required<PointStyle>;

  constructor(id: string, position: WGS84Coordinate, style?: PointStyle) {
    super(id, GraphicType.POINT);
    this.position = position;
    this.style = { ...DEFAULT_POINT_STYLE, ...style };
  }

  _attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    const cartesian = CoordinateUtil.toCartesian(this.position);
    this.cesiumEntity = viewer.entities.add({
      id: this.id,
      position: cartesian,
      point: {
        pixelSize: this.style.pixelSize,
        color: ColorUtil.fromCss(this.style.color),
        outlineColor: ColorUtil.fromCss(this.style.outlineColor),
        outlineWidth: this.style.outlineWidth,
        heightReference: this.toHeightReference(this.style.heightReference),
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
