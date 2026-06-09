import * as Cesium from "cesium";

export interface ViewerInitOptions {
  animation?: boolean; // 是否显示动画控件，左下角播放/暂停按钮
  baseLayerPicker?: boolean; // 是否显示底层选择器
  baseLayer?: Cesium.ImageryLayer | false; // 基础影像图层，设为false则不创建
  geocoder?: boolean; // 是否显示地理编码搜索框，或自定义搜索服务
  homeButton?: boolean; //是否显示返回初始视角按钮
  sceneModePicker?: boolean; //是否显示2D/3D模式切换按钮
  navigationHelpButton?: boolean; // 是否显示导航帮助按钮
  navigationInstructionsInitiallyVisible?: boolean; // 导航帮助是否默认展开
  timeline?: boolean; // 是否显示时间轴
  fullscreenButton?: boolean; // 是否显示全屏按钮
  vrButton?: boolean; // 是否显示VR模组按钮，默认false,
  infoBox?: boolean; //是否显示点击实体时的信息框
  selectionIndicator?: boolean; // 是否显示选中实体的高亮指示器
  shadows?: boolean;
  shouldAnimate?: boolean;
  debugShowFramesPerSecond?: boolean;
  msaaSamples?: number;
  projectionPicker?: boolean; // 是否显示投影方式选择器
  scene3DOnly?: boolean; //是否强制只使用3D模式（禁用2D和哥伦布视图）
  terrainShadows?: Cesium.ShadowMode; // 地形阴影模式：DISABLED、ENABLED、RECEIVE_ONLY
  requestRenderMode?: boolean; // 是否启用按需渲染模式（节省资源）
  maximumRenderTimeChange?: number; // 在按需渲染模式下，最大允许的渲染时间变化（秒）
  sceneMode?: Cesium.SceneMode; // 初始场景模式
  creditContainer?: Element | string;
  extra?: Record<string, unknown>;
}

export const DEFAULT_VIEWER_OPTIONS: Required<
  Omit<ViewerInitOptions, "extra" | "msaaSamples">
> = {
  animation: false,
  baseLayerPicker: false,
  baseLayer: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false,
  timeline: false,
  fullscreenButton: false,
  vrButton: false,
  infoBox: false,
  selectionIndicator: false,
  shadows: false,
  shouldAnimate: true,
  debugShowFramesPerSecond: false,
  projectionPicker: false,
  scene3DOnly: false,
  terrainShadows: Cesium.ShadowMode.RECEIVE_ONLY,
  requestRenderMode: false,
  maximumRenderTimeChange: Infinity,
  sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
  creditContainer: document.createElement("div"),
};
