import * as Cesium from "cesium";

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const ColorUtil = {
  /** 将 CSS 颜色字符串转换为 Cesium.Color。 */
  fromCss(css: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(css);
  },

  /** 将 Cesium.Color 转换为 RGBA 分量对象。 */
  toRGBA(color: Cesium.Color): RGBA {
    return { r: color.red, g: color.green, b: color.blue, a: color.alpha };
  },

  /** 根据 RGBA 分量创建 Cesium.Color。 */
  fromRGBA(rgba: RGBA): Cesium.Color {
    return new Cesium.Color(rgba.r, rgba.g, rgba.b, rgba.a);
  },

  /** 将十六进制颜色字符串转换为 Cesium.Color。 */
  fromHex(hex: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(hex);
  },

  /** 将 Cesium.Color 转换为不含透明度的十六进制颜色字符串。 */
  toHex(color: Cesium.Color): string {
    const r = Math.round(color.red * 255)
      .toString(16)
      .padStart(2, "0");
    const g = Math.round(color.green * 255)
      .toString(16)
      .padStart(2, "0");
    const b = Math.round(color.blue * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}`;
  },

  /** 返回使用指定透明度的新 Cesium.Color。 */
  withAlpha(color: Cesium.Color, alpha: number): Cesium.Color {
    return Cesium.Color.fromAlpha(color, alpha);
  },
};
