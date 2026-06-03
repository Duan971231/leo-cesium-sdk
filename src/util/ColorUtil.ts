import * as Cesium from 'cesium';

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const ColorUtil = {
  fromCss(css: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(css);
  },

  toRGBA(color: Cesium.Color): RGBA {
    return { r: color.red, g: color.green, b: color.blue, a: color.alpha };
  },

  fromRGBA(rgba: RGBA): Cesium.Color {
    return new Cesium.Color(rgba.r, rgba.g, rgba.b, rgba.a);
  },

  fromHex(hex: string): Cesium.Color {
    return Cesium.Color.fromCssColorString(hex);
  },

  toHex(color: Cesium.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.green * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.blue * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  },

  withAlpha(color: Cesium.Color, alpha: number): Cesium.Color {
    return Cesium.Color.fromAlpha(color, alpha);
  },
};
