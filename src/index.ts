// ── 主入口 ──
export { CesiumSDK } from './CesiumSDK';
export type { SDKOptions, SDKEvents } from './CesiumSDK';

// ── L1 基础设施 ──
export { SDKError, ErrorCode } from './common/SDKError';
export { EventEmitter } from './common/EventEmitter';
export { ConfigStore } from './common/ConfigStore';
export type { SDKConfig } from './common/ConfigStore';
export { DisposePool } from './common/DisposePool';
export { Logger, LogLevel } from './common/Logger';
export { SDK_VERSION, WGS84, DEG_TO_RAD, RAD_TO_DEG } from './common/Constants';

// ── 工具函数 ──
export { CoordinateUtil } from './util/CoordinateUtil';
export type { WGS84Coordinate, ScreenCoordinate } from './util/CoordinateUtil';
export { MathUtil } from './util/MathUtil';
export { ColorUtil } from './util/ColorUtil';
export type { RGBA } from './util/ColorUtil';
export { MemoryUtil } from './util/MemoryUtil';

// ── L2 核心管理 ──
export { ViewerManager } from './viewer/ViewerManager';
export type { ViewerInitOptions } from './viewer/ViewerOptions';
export { Lifecycle } from './viewer/Lifecycle';

export { LayerManager } from './layer/LayerManager';
export type { AddImageryLayerOptions } from './layer/LayerManager';
export { BaseLayer } from './layer/BaseLayer';
export { ImageryLayer } from './layer/ImageryLayer';
export { LayerType, LayerTypeGuard } from './layer/LayerType';

export { EntityManager } from './entity/EntityManager';
export { BaseGraphic } from './entity/BaseGraphic';
export { PointGraphic } from './entity/PointGraphic';
export { PolylineGraphic } from './entity/PolylineGraphic';
export { PolygonGraphic } from './entity/PolygonGraphic';
export { GraphicType } from './entity/GraphicStyle';
export type {
  PointStyle,
  PolylineStyle,
  PolygonStyle,
  BillboardStyle,
  ModelStyle,
} from './entity/GraphicStyle';

export { CameraManager } from './camera/CameraManager';
export type { FlyToOptions, ViewpointBookmark } from './camera/CameraManager';
export { Viewpoint } from './camera/Viewpoint';
export type { ViewpointData } from './camera/Viewpoint';

// ── L3 插件体系 ──
export { PluginManager } from './plugins/PluginManager';
export type { ISDKPlugin } from './plugins/types';
