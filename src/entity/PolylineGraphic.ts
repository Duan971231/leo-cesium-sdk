import * as Cesium from 'cesium';
import { BaseGraphic } from './BaseGraphic';
import { GraphicType, PolylineStyle } from './GraphicStyle';
import { CoordinateUtil } from '../util/CoordinateUtil';
import type { WGS84Coordinate } from '../util/CoordinateUtil';
import { ColorUtil } from '../util/ColorUtil';

const DEFAULT_POLYLINE_STYLE: Required<PolylineStyle> = {
  width: 2,
  color: '#FFFFFF',
  clampToGround: false,
};

/**
 * 线图形
 */
export class PolylineGraphic extends BaseGraphic {
  private readonly positions: WGS84Coordinate[];
  private readonly style: Required<PolylineStyle>;

  constructor(id: string, positions: WGS84Coordinate[], style?: PolylineStyle) {
    super(id, GraphicType.POLYLINE);
    this.positions = positions;
    this.style = { ...DEFAULT_POLYLINE_STYLE, ...style };
  }

  _attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    const cartesians = CoordinateUtil.toCartesians(this.positions);
    this.cesiumEntity = viewer.entities.add({
      id: this.id,
      polyline: {
        positions: cartesians,
        width: this.style.width,
        material: ColorUtil.fromCss(this.style.color),
        clampToGround: this.style.clampToGround,
      },
    });
  }
}
