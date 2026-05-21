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

export interface BillboardStyle {
  image: string;
  width?: number;
  height?: number;
  color?: string;
  heightReference?: 'none' | 'clamp' | 'relative';
}

export interface ModelStyle {
  uri: string;
  scale?: number;
  minimumPixelSize?: number;
  heightReference?: 'none' | 'clamp' | 'relative';
}

export enum GraphicType {
  POINT = 'point',
  POLYLINE = 'polyline',
  POLYGON = 'polygon',
  BILLBOARD = 'billboard',
  MODEL = 'model',
}
