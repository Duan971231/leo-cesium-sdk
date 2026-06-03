export interface PointStyle {
  pixelSize?: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  heightReference?: 'none' | 'clamp' | 'relative';
}

export interface PolylineStyle {
  width?: number;
  color?: string;
  clampToGround?: boolean;
}

export interface PolygonStyle {
  color?: string;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  heightReference?: 'none' | 'clamp' | 'relative';
  extrudedHeight?: number;
}

export enum GraphicType {
  POINT = 'point',
  POLYLINE = 'polyline',
  POLYGON = 'polygon',
}
