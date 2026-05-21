import * as Cesium from 'cesium';
import { BaseGraphic } from './BaseGraphic';
import { PointGraphic } from './PointGraphic';
import { PolylineGraphic } from './PolylineGraphic';
import { PolygonGraphic } from './PolygonGraphic';
import { GraphicType } from './GraphicStyle';
import { Logger } from '../common/Logger';
import { SDKError, ErrorCode } from '../common/SDKError';
import type { WGS84Coordinate } from '../util/CoordinateUtil';
import type { PointStyle, PolylineStyle, PolygonStyle } from './GraphicStyle';

/**
 * 实体管理器：统一实体 CRUD
 */
export class EntityManager {
  private readonly graphics = new Map<string, BaseGraphic>();
  private readonly viewer: Cesium.Viewer;
  private readonly logger = new Logger('EntityManager');

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /** 添加点 */
  addPoint(id: string, position: WGS84Coordinate, style?: PointStyle): PointGraphic {
    this.ensureNotExists(id);
    const graphic = new PointGraphic(id, position, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added point: ${id}`);
    return graphic;
  }

  /** 添加线 */
  addPolyline(id: string, positions: WGS84Coordinate[], style?: PolylineStyle): PolylineGraphic {
    this.ensureNotExists(id);
    const graphic = new PolylineGraphic(id, positions, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added polyline: ${id}`);
    return graphic;
  }

  /** 添加多边形 */
  addPolygon(id: string, positions: WGS84Coordinate[], style?: PolygonStyle): PolygonGraphic {
    this.ensureNotExists(id);
    const graphic = new PolygonGraphic(id, positions, style);
    graphic._attach(this.viewer);
    this.graphics.set(id, graphic);
    this.logger.info(`Added polygon: ${id}`);
    return graphic;
  }

  /** 获取图形 */
  get<T extends BaseGraphic = BaseGraphic>(id: string): T | undefined {
    return this.graphics.get(id) as T | undefined;
  }

  /** 获取所有图形 */
  getAll(): ReadonlyMap<string, BaseGraphic> {
    return this.graphics;
  }

  /** 按类型获取图形 */
  getByType(type: GraphicType): BaseGraphic[] {
    const result: BaseGraphic[] = [];
    for (const g of this.graphics.values()) {
      if (g.type === type) result.push(g);
    }
    return result;
  }

  /** 移除图形 */
  remove(id: string): boolean {
    const graphic = this.graphics.get(id);
    if (!graphic) return false;
    graphic.remove();
    this.graphics.delete(id);
    this.logger.info(`Removed entity: ${id}`);
    return true;
  }

  /** 移除所有图形 */
  removeAll(): void {
    for (const g of this.graphics.values()) {
      g.remove();
    }
    this.graphics.clear();
  }

  /** 图形数量 */
  get count(): number {
    return this.graphics.size;
  }

  private ensureNotExists(id: string): void {
    if (this.graphics.has(id)) {
      throw new SDKError(ErrorCode.ENTITY_ALREADY_EXISTS, `Entity "${id}" already exists`);
    }
  }
}
