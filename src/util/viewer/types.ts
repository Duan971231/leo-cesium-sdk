export type ViewerRangeSample = {
  xRatio: number;
  yRatio: number;
  lon?: number;
  lat?: number;
};

export type ValidViewerRangeSample = ViewerRangeSample & {
  lon: number;
  lat: number;
};

export type CornerKey = "leftTop" | "rightTop" | "rightBottom" | "leftBottom";
export type EdgeKey = "top" | "right" | "bottom" | "left";
export type RatioPoint = Pick<ViewerRangeSample, "xRatio" | "yRatio">;
export type SamplePicker = (xRatio: number, yRatio: number) => ViewerRangeSample;

export type EdgeConfig = {
  startCorner: CornerKey;
  endCorner: CornerKey;
  start: RatioPoint;
  end: RatioPoint;
};

export type EdgeSamples = {
  config: EdgeConfig;
  samples: ViewerRangeSample[];
  refinedSamples: ViewerRangeSample[];
  refinedSampleByT: Map<string, ViewerRangeSample>;
  directionPairByCorner: Partial<Record<CornerKey, DirectionPair | null>>;
};

export type DirectionPair = {
  near: ValidViewerRangeSample;
  inner: ValidViewerRangeSample;
};

export const EDGE_SAMPLE_COUNT = 9;
export const HALF_EDGE_STEP = 1 / (EDGE_SAMPLE_COUNT - 1) / 2;

export const CORNER_POINTS: Record<CornerKey, RatioPoint> = {
  leftTop: { xRatio: 0, yRatio: 0 },
  rightTop: { xRatio: 1, yRatio: 0 },
  rightBottom: { xRatio: 1, yRatio: 1 },
  leftBottom: { xRatio: 0, yRatio: 1 },
};

export const EDGES: Record<EdgeKey, EdgeConfig> = {
  top: {
    startCorner: "leftTop",
    endCorner: "rightTop",
    start: CORNER_POINTS.leftTop,
    end: CORNER_POINTS.rightTop,
  },
  right: {
    startCorner: "rightTop",
    endCorner: "rightBottom",
    start: CORNER_POINTS.rightTop,
    end: CORNER_POINTS.rightBottom,
  },
  bottom: {
    startCorner: "leftBottom",
    endCorner: "rightBottom",
    start: CORNER_POINTS.leftBottom,
    end: CORNER_POINTS.rightBottom,
  },
  left: {
    startCorner: "leftTop",
    endCorner: "leftBottom",
    start: CORNER_POINTS.leftTop,
    end: CORNER_POINTS.leftBottom,
  },
};

export const CORNER_EDGES: Record<CornerKey, EdgeKey[]> = {
  leftTop: ["top", "left"],
  rightTop: ["top", "right"],
  rightBottom: ["right", "bottom"],
  leftBottom: ["bottom", "left"],
};

/** 判断采样结果是否包含有效的经纬度。 */
export const isValidViewerRangeSample = (sample: ViewerRangeSample): sample is ValidViewerRangeSample =>
  Number.isFinite(sample.lon) && Number.isFinite(sample.lat);
