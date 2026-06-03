import type * as Cesium from 'cesium';
import { BaseGraphic } from './BaseGraphic';
import { PointGraphic } from './PointGraphic';
import { PolylineGraphic } from './PolylineGraphic';
import { PolygonGraphic } from './PolygonGraphic';
import { GraphicType } from './GraphicStyle';
import { Logger } from '../common/Logger';
import { SDKError, ErrorCode } from '../common/SDKError';
import { ValidationUtil } from '../util/ValidationUtil';
import type { WGS84Coordinate } from '../util/CoordinateUtil';
import type { PointStyle, PolylineStyle, PolygonStyle } from './GraphicStyle';

export class EntityManager {
  private readonly graphics = new Map<string, BaseGraphic>();
  private readonly viewer: Cesium.Viewer;
  private readonly logger = new Logger('EntityManager');

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  addPoint(id: string, position: WGS84Coordinate, style?: PointStyle): PointGraphic {
    ValidationUtil.id(id, 'Entity id');
    ValidationUtil.coordinate(position);
    this.validatePointStyle(style);
    this.ensureNotExists(id);
    const graphic = new PointGraphic(id, position, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added point: ${id}`);
    return graphic;
  }

  addPolyline(id: string, positions: WGS84Coordinate[], style?: PolylineStyle): PolylineGraphic {
    ValidationUtil.id(id, 'Entity id');
    ValidationUtil.positions(positions, 2, 'Polyline');
    this.validatePolylineStyle(style);
    this.ensureNotExists(id);
    const graphic = new PolylineGraphic(id, positions, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added polyline: ${id}`);
    return graphic;
  }

  addPolygon(id: string, positions: WGS84Coordinate[], style?: PolygonStyle): PolygonGraphic {
    ValidationUtil.id(id, 'Entity id');
    ValidationUtil.positions(positions, 3, 'Polygon');
    this.validatePolygonStyle(style);
    this.ensureNotExists(id);
    const graphic = new PolygonGraphic(id, positions, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added polygon: ${id}`);
    return graphic;
  }

  get<T extends BaseGraphic = BaseGraphic>(id: string): T | undefined {
    return this.graphics.get(id) as T | undefined;
  }

  getAll(): ReadonlyMap<string, BaseGraphic> {
    return new Map(this.graphics);
  }

  getByType(type: GraphicType): BaseGraphic[] {
    const result: BaseGraphic[] = [];
    for (const g of this.graphics.values()) {
      if (g.type === type) result.push(g);
    }
    return result;
  }

  remove(id: string): boolean {
    ValidationUtil.id(id, 'Entity id');
    const graphic = this.graphics.get(id);
    if (!graphic) return false;
    graphic.remove();
    this.graphics.delete(id);
    this.logger.info(`Removed entity: ${id}`);
    return true;
  }

  removeAll(): void {
    for (const g of this.graphics.values()) {
      g.remove();
    }
    this.graphics.clear();
  }

  get count(): number {
    return this.graphics.size;
  }

  private ensureNotExists(id: string): void {
    if (this.graphics.has(id)) {
      throw new SDKError(ErrorCode.ENTITY_ALREADY_EXISTS, `Entity "${id}" already exists`);
    }
  }

  private validatePointStyle(style?: PointStyle): void {
    if (!style) return;
    ValidationUtil.positiveNumber(style.pixelSize, 'Point pixelSize');
    ValidationUtil.nonNegativeNumber(style.outlineWidth, 'Point outlineWidth');
    ValidationUtil.cssColor(style.color, 'Point color');
    ValidationUtil.cssColor(style.outlineColor, 'Point outlineColor');
  }

  private validatePolylineStyle(style?: PolylineStyle): void {
    if (!style) return;
    ValidationUtil.positiveNumber(style.width, 'Polyline width');
    ValidationUtil.cssColor(style.color, 'Polyline color');
  }

  private validatePolygonStyle(style?: PolygonStyle): void {
    if (!style) return;
    ValidationUtil.cssColor(style.color, 'Polygon color');
    ValidationUtil.cssColor(style.outlineColor, 'Polygon outlineColor');
    ValidationUtil.nonNegativeNumber(style.outlineWidth, 'Polygon outlineWidth');
    ValidationUtil.nonNegativeNumber(style.extrudedHeight, 'Polygon extrudedHeight');
  }
}
