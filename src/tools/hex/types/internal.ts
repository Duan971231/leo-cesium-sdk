import type * as Cesium from "cesium";

import type { HexRange } from "./public";

export interface HexLevel {
  readonly level: number;
  readonly sideLengthMeters: number;
  readonly minCameraHeight: number;
  readonly maxCameraHeight: number;
}

export interface HexChunkDescriptor {
  readonly key: string;
  readonly lonIndex: number;
  readonly latIndex: number;
}

export interface HexChunkGeometry {
  readonly key: string;
  readonly lines: readonly (readonly number[])[];
}

export interface HexCachedChunk {
  readonly collection: Cesium.PolylineCollection;
  lastUsedFrame: number;
}

export interface HexLevelCache {
  readonly collection: Cesium.PrimitiveCollection;
  readonly chunks: Map<string, HexCachedChunk>;
  readonly level: number;
}

export interface HexWorkerRequest {
  readonly id: number;
  readonly sourceRange: HexRange;
  readonly visibleRange: HexRange;
  readonly level: HexLevel;
  readonly chunkSize: number;
  readonly chunkHeight: number;
  readonly cachedChunkKeys: readonly string[];
}

export interface HexWorkerSuccessResponse {
  readonly id: number;
  readonly level: number;
  readonly visibleChunkKeys: readonly string[];
  readonly chunks: readonly HexChunkGeometry[];
}

export interface HexWorkerErrorResponse {
  readonly id: number;
  readonly error: string;
}

export type HexWorkerResponse = HexWorkerSuccessResponse | HexWorkerErrorResponse;
