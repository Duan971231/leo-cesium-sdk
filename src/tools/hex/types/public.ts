import type * as Cesium from "cesium";

import type { GeoRange } from "@/util/range";

export type HexRange = GeoRange;

export interface HexLevelOption {
  level: number;
  sideLengthMeters: number;
  minCameraHeight: number;
  maxCameraHeight: number;
}

export interface HexLevelGenerationOptions {
  baseSizeMeters?: number;
  sizeMultiplier?: number;
  cameraHeightThresholds?: readonly number[];
}

export type HexLevelsInput = readonly HexLevelOption[] | HexLevelGenerationOptions;

export type HexWorkerFactory = () => Worker;

export interface HexRendererOptions {
  sourceRange?: HexRange;
  levels?: HexLevelsInput;
  workerFactory?: HexWorkerFactory;
  workerUrl?: string | URL;
  lineColor?: Cesium.Color;
  lineWidth?: number;
  chunkSize?: number;
  chunkHeight?: number;
  cachePaddingChunks?: number;
  maxChunksPerLevel?: number;
  rangePaddingDegree?: number;
  autoListenCamera?: boolean;
}
