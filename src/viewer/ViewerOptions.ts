import type * as Cesium from "cesium";

export interface ViewerInitOptions {
  baseLayer?: Cesium.ImageryLayer | false;
  baseLayerPicker?: boolean;
  geocoder?: boolean;
  homeButton?: boolean;
  sceneModePicker?: boolean;
  navigationHelpButton?: boolean;
  animation?: boolean;
  timeline?: boolean;
  fullscreenButton?: boolean;
  vrButton?: boolean;
  infoBox?: boolean;
  selectionIndicator?: boolean;
  shadows?: boolean;
  shouldAnimate?: boolean;
  debugShowFramesPerSecond?: boolean;
  msaaSamples?: number;
  extra?: Record<string, unknown>;
}

export const DEFAULT_VIEWER_OPTIONS: Required<
  Omit<ViewerInitOptions, "extra" | "msaaSamples">
> = {
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  vrButton: false,
  infoBox: false,
  selectionIndicator: false,
  shadows: false,
  shouldAnimate: true,
  debugShowFramesPerSecond: false,
};
