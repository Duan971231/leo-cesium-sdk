import * as Cesium from 'cesium';

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * 颜色处理工具
 */
export const ColorUtil = {
  /** CSS 颜色字符串 → Cesium.Color */
  fromCss(css: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(css);
  },

  /** Cesium.Color → RGBA（0~1 范围） */
  toRGBA(color: Cesium.Color): RGBA {
    return { r: color.red, g: color.green, b: color.blue, a: color.alpha };
  },

  /** RGBA（0~1 范围） → Cesium.Color */
  fromRGBA(rgba: RGBA): Cesium.Color {
    return new Cesium.Color(rgba.r, rgba.g, rgba.b, rgba.a);
  },

  /** Hex → Cesium.Color */
  fromHex(hex: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(hex);
  },

  /** Cesium.Color → Hex */
  toHex(color: Cesium.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.green * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.blue * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  },

  /** 带透明度 */
  withAlpha(color: Cesium.Color, alpha: number): Cesium.Color {
    return Cesium.Color.fromAlpha(color, alpha);
  },
};
