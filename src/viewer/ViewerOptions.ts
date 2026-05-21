/**
 * SDK Viewer 初始化配置
 */
export interface ViewerInitOptions {
  /** 是否显示底图选择器 */
  baseLayerPicker?: boolean;
  /** 是否显示地理编码搜索 */
  geocoder?: boolean;
  /** 是否显示 Home 按钮 */
  homeButton?: boolean;
  /** 是否显示场景模式选择器 */
  sceneModePicker?: boolean;
  /** 是否显示导航帮助 */
  navigationHelpButton?: boolean;
  /** 是否显示动画控件 */
  animation?: boolean;
  /** 是否显示时间线 */
  timeline?: boolean;
  /** 是否显示全屏按钮 */
  fullscreenButton?: boolean;
  /** 是否显示 VR 按钮 */
  vrButton?: boolean;
  /** 是否显示信息框 */
  infoBox?: boolean;
  /** 是否显示选中指示器 */
  selectionIndicator?: boolean;
  /** 是否启用阴影 */
  shadows?: boolean;
  /** 是否自动播放动画 */
  shouldAnimate?: boolean;
  /** 是否显示 FPS */
  debugShowFramesPerSecond?: boolean;
  /** MSAA 采样数 */
  msaaSamples?: number;
  /** 自定义 Cesium Viewer 选项透传 */
  extra?: Record<string, unknown>;
}

/** 默认配置：关闭大部分 UI 控件 */
export const DEFAULT_VIEWER_OPTIONS: Required<
  Omit<ViewerInitOptions, "extra" | "msaaSamples">
> = {
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
