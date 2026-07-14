import { WORLD_RANGE, type GeoRange } from "@/util/range";
import {
  CORNER_EDGES,
  CORNER_POINTS,
  EDGES,
  EDGE_SAMPLE_COUNT,
  HALF_EDGE_STEP,
  type CornerKey,
  type DirectionPair,
  type EdgeConfig,
  type EdgeKey,
  type EdgeSamples,
  type RatioPoint,
  type SamplePicker,
  type ValidViewerRangeSample,
  type ViewerRangeSample,
  isValidViewerRangeSample,
} from "./types";

export const EMPTY_VIEWER_RANGE: Readonly<GeoRange> = Object.freeze({
  minLon: 0,
  minLat: 0,
  maxLon: 0,
  maxLat: 0,
});

const MINIMUM_RANGE_SPAN = 1e-6;

/** 根据屏幕比例采样器计算 Viewer 可见经纬度范围。 */
export const calculateViewerRange = (pickSample: SamplePicker): GeoRange => {
  const corners = pickCorners(pickSample);
  const cornerSamples = Object.values(corners);
  const missingCorners = (Object.keys(corners) as CornerKey[]).filter(
    (corner) => !isValidViewerRangeSample(corners[corner]),
  );

  const cornerRange = createRangeFromSamples(cornerSamples);
  if (missingCorners.length === 0) {
    return cornerRange ? ensureMinimumRange(clampRange(cornerRange)) : { ...EMPTY_VIEWER_RANGE };
  }

  const edgeSampler = createEdgeSampler(corners, pickSample);
  const edgesToSample = new Set<EdgeKey>();
  missingCorners.forEach((corner) => {
    CORNER_EDGES[corner].forEach((edge) => edgesToSample.add(edge));
  });
  edgesToSample.forEach((edge) => edgeSampler.get(edge));

  const range = createRangeFromSamples([...cornerSamples, ...getAllEdgeSamples(edgeSampler.values())]);
  if (!range) return { ...EMPTY_VIEWER_RANGE };

  if (missingCorners.length === 4) {
    inferRangeFromHitEdges(range, edgeSampler);
  } else {
    inferRangeFromMissingCorners(range, missingCorners, edgeSampler, pickSample);
  }

  return ensureMinimumRange(
    clampRange(
      mergeRanges(range, createRangeFromSamples([...cornerSamples, ...getAllEdgeSamples(edgeSampler.values())])),
    ),
  );
};

/** 采样屏幕四个角点。 */
const pickCorners = (pickSample: SamplePicker) =>
  (Object.keys(CORNER_POINTS) as CornerKey[]).reduce(
    (result, corner) => {
      const point = CORNER_POINTS[corner];
      result[corner] = pickSample(point.xRatio, point.yRatio);
      return result;
    },
    {} as Record<CornerKey, ViewerRangeSample>,
  );

/** 根据有效采样点创建最小包围经纬度范围。 */
const createRangeFromSamples = (samples: ViewerRangeSample[]): GeoRange | undefined =>
  samples.reduce<GeoRange | undefined>((range, sample) => {
    if (!isValidViewerRangeSample(sample)) return range;
    if (!range) {
      return {
        minLon: sample.lon,
        minLat: sample.lat,
        maxLon: sample.lon,
        maxLat: sample.lat,
      };
    }

    return {
      minLon: Math.min(range.minLon, sample.lon),
      minLat: Math.min(range.minLat, sample.lat),
      maxLon: Math.max(range.maxLon, sample.lon),
      maxLat: Math.max(range.maxLat, sample.lat),
    };
  }, undefined);

/** 将经纬度范围限制在全球合法边界内。 */
const clampRange = (range: GeoRange): GeoRange => ({
  minLon: Math.max(range.minLon, WORLD_RANGE.minLon),
  minLat: Math.max(range.minLat, WORLD_RANGE.minLat),
  maxLon: Math.min(range.maxLon, WORLD_RANGE.maxLon),
  maxLat: Math.min(range.maxLat, WORLD_RANGE.maxLat),
});

/** 确保存在命中点时，经纬度范围至少具有极小的正面积。 */
const ensureMinimumRange = (range: GeoRange): GeoRange => {
  const [minLon, maxLon] = ensureMinimumAxisSpan(range.minLon, range.maxLon, WORLD_RANGE.minLon, WORLD_RANGE.maxLon);
  const [minLat, maxLat] = ensureMinimumAxisSpan(range.minLat, range.maxLat, WORLD_RANGE.minLat, WORLD_RANGE.maxLat);

  return { minLon, minLat, maxLon, maxLat };
};

/** 将单个坐标轴扩展为不小于最小跨度，并保持在合法边界内。 */
const ensureMinimumAxisSpan = (min: number, max: number, worldMin: number, worldMax: number): [number, number] => {
  if (max - min >= MINIMUM_RANGE_SPAN) return [min, max];

  const center = Math.min(Math.max((min + max) / 2, worldMin), worldMax);
  let nextMin = Math.max(center - MINIMUM_RANGE_SPAN / 2, worldMin);
  let nextMax = Math.min(center + MINIMUM_RANGE_SPAN / 2, worldMax);

  if (nextMax - nextMin < MINIMUM_RANGE_SPAN) {
    if (nextMin === worldMin) nextMax = worldMin + MINIMUM_RANGE_SPAN;
    else nextMin = worldMax - MINIMUM_RANGE_SPAN;
  }

  return [nextMin, nextMax];
};

/** 合并两个经纬度范围；目标范围不存在时直接返回源范围。 */
const mergeRanges = (source: GeoRange, target?: GeoRange) => {
  if (!target) return source;

  return {
    minLon: Math.min(source.minLon, target.minLon),
    minLat: Math.min(source.minLat, target.minLat),
    maxLon: Math.max(source.maxLon, target.maxLon),
    maxLat: Math.max(source.maxLat, target.maxLat),
  };
};

/** 使用缺失角点相邻的两条边共同推断视野边界。 */
const inferRangeFromMissingCorners = (
  range: GeoRange,
  missingCorners: CornerKey[],
  edgeSampler: ReturnType<typeof createEdgeSampler>,
  pickSample: SamplePicker,
): void => {
  missingCorners.forEach((corner) => {
    CORNER_EDGES[corner].forEach((edge) => {
      const pair = getDirectionPairFromEdge(edgeSampler.get(edge), corner, pickSample);
      if (pair) applyDirectionPairToRange(range, pair);
    });
  });
};

/** 四个角均缺失时，根据实际命中的上、右、下、左边分别推断视野边界。 */
const inferRangeFromHitEdges = (range: GeoRange, edgeSampler: ReturnType<typeof createEdgeSampler>): void => {
  const topRange = createRangeFromSamples(edgeSampler.get("top").samples);
  const rightRange = createRangeFromSamples(edgeSampler.get("right").samples);
  const bottomRange = createRangeFromSamples(edgeSampler.get("bottom").samples);
  const leftRange = createRangeFromSamples(edgeSampler.get("left").samples);

  range.minLon = leftRange?.minLon ?? WORLD_RANGE.minLon;
  range.maxLon = rightRange?.maxLon ?? WORLD_RANGE.maxLon;
  range.minLat = bottomRange?.minLat ?? WORLD_RANGE.minLat;
  range.maxLat = topRange?.maxLat ?? WORLD_RANGE.maxLat;
};

/** 创建带缓存的屏幕边缘采样器。 */
const createEdgeSampler = (corners: Record<CornerKey, ViewerRangeSample>, pickSample: SamplePicker) => {
  const cache = new Map<EdgeKey, EdgeSamples>();

  return {
    /** 获取指定边缘的采样结果，并复用已缓存结果。 */
    get(edgeKey: EdgeKey) {
      const cached = cache.get(edgeKey);
      if (cached) return cached;

      const edge = EDGES[edgeKey];
      const result: EdgeSamples = {
        config: edge,
        samples: Array.from({ length: EDGE_SAMPLE_COUNT }, (_, index) => {
          if (index === 0) return corners[edge.startCorner];
          if (index === EDGE_SAMPLE_COUNT - 1) {
            return corners[edge.endCorner];
          }

          const point = interpolateEdgePoint(edge, index / (EDGE_SAMPLE_COUNT - 1));
          return pickSample(point.xRatio, point.yRatio);
        }),
        refinedSamples: [],
        refinedSampleByT: new Map<string, ViewerRangeSample>(),
        directionPairByCorner: {},
      };
      cache.set(edgeKey, result);
      return result;
    },
    /** 返回当前已经采样的全部边缘结果。 */
    values() {
      return Array.from(cache.values());
    },
  };
};

/** 从边缘采样中获取用于判断范围扩展方向的相邻有效点。 */
const getDirectionPairFromEdge = (
  edgeSamples: EdgeSamples,
  corner: CornerKey,
  pickSample: SamplePicker,
): DirectionPair | undefined => {
  if (corner in edgeSamples.directionPairByCorner) {
    return edgeSamples.directionPairByCorner[corner] || undefined;
  }

  const fromStart = edgeSamples.config.startCorner === corner;
  const orderedSamples = fromStart ? edgeSamples.samples : [...edgeSamples.samples].reverse();
  const validSamples = orderedSamples.filter(isValidViewerRangeSample);

  if (validSamples.length >= 2) {
    const pair = { near: validSamples[0], inner: validSamples[1] };
    edgeSamples.directionPairByCorner[corner] = pair;
    return pair;
  }

  if (validSamples.length === 1) {
    const refined = refineSingleEdgeHit(edgeSamples, validSamples[0], fromStart, pickSample);
    if (refined) {
      const pair = { near: validSamples[0], inner: refined };
      edgeSamples.directionPairByCorner[corner] = pair;
      return pair;
    }
  }

  edgeSamples.directionPairByCorner[corner] = null;
  return undefined;
};

/** 根据采样点方向将缺失视野边界扩展到全球边界。 */
const applyDirectionPairToRange = (range: GeoRange, pair: DirectionPair) => {
  const lonDelta = normalizeLonDelta(pair.near.lon - pair.inner.lon);
  const latDelta = pair.near.lat - pair.inner.lat;

  if (Math.abs(lonDelta) >= Math.abs(latDelta)) {
    if (lonDelta < 0) range.minLon = WORLD_RANGE.minLon;
    if (lonDelta > 0) range.maxLon = WORLD_RANGE.maxLon;
    return;
  }

  if (latDelta < 0) range.minLat = WORLD_RANGE.minLat;
  if (latDelta > 0) range.maxLat = WORLD_RANGE.maxLat;
};

/** 汇总边缘的基础采样点与细化采样点。 */
const getAllEdgeSamples = (edges: EdgeSamples[]) => edges.flatMap((edge) => [...edge.samples, ...edge.refinedSamples]);

/** 在仅命中一个有效点时，向远离缺失角点的内侧执行半步细化采样。 */
const refineSingleEdgeHit = (
  edgeSamples: EdgeSamples,
  validSample: ValidViewerRangeSample,
  fromStart: boolean,
  pickSample: SamplePicker,
): ValidViewerRangeSample | undefined => {
  const baseT = edgeSamples.samples.findIndex((sample) => sample === validSample) / (EDGE_SAMPLE_COUNT - 1);
  const innerT = fromStart ? Math.min(1, baseT + HALF_EDGE_STEP) : Math.max(0, baseT - HALF_EDGE_STEP);
  if (innerT === baseT) return undefined;

  const cacheKey = innerT.toFixed(6);
  const cached = edgeSamples.refinedSampleByT.get(cacheKey);
  if (cached) return isValidViewerRangeSample(cached) ? cached : undefined;

  const point = interpolateEdgePoint(edgeSamples.config, innerT);
  const sample = pickSample(point.xRatio, point.yRatio);
  edgeSamples.refinedSampleByT.set(cacheKey, sample);
  edgeSamples.refinedSamples.push(sample);
  return isValidViewerRangeSample(sample) ? sample : undefined;
};

/** 按比例在线性边缘上插值屏幕采样点。 */
const interpolateEdgePoint = (edge: EdgeConfig, t: number): RatioPoint => ({
  xRatio: edge.start.xRatio + (edge.end.xRatio - edge.start.xRatio) * t,
  yRatio: edge.start.yRatio + (edge.end.yRatio - edge.start.yRatio) * t,
});

/** 将经度差归一化到 [-180, 180]。 */
const normalizeLonDelta = (delta: number) => {
  if (delta > 180) return delta - 360;
  if (delta < -180) return delta + 360;
  return delta;
};
