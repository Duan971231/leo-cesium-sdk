import { rangeUtil } from "@/util/range";
import { calculateLongitudeSpan } from "./geometry";
import type { HexChunkDescriptor, HexLevel } from "../types/internal";
import type { HexRange } from "../types/public";

export interface HexChunkLayout {
  readonly centerLon: number;
  readonly centerLat: number;
  readonly longitudeSpan: number;
  readonly longitudeStep: number;
  readonly latitudeStep: number;
  readonly chunks: readonly HexChunkDescriptor[];
}

export const createVisibleChunkLayout = (
  sourceRange: HexRange,
  visibleRange: HexRange,
  level: HexLevel,
  chunkSize: number,
  chunkHeight: number,
): HexChunkLayout => {
  const centerLon = (sourceRange.minLon + sourceRange.maxLon) / 2;
  const centerLat = (sourceRange.minLat + sourceRange.maxLat) / 2;
  const longitudeSpan = calculateLongitudeSpan(centerLat, level.sideLengthMeters);
  const longitudeStep = longitudeSpan * 3 * chunkSize;
  const latitudeStep = longitudeSpan * Math.sqrt(3) * chunkHeight;
  const renderRange = rangeUtil.intersectGeoRanges(sourceRange, visibleRange);

  if (!renderRange) {
    return {
      centerLon,
      centerLat,
      longitudeSpan,
      longitudeStep,
      latitudeStep,
      chunks: [],
    };
  }

  const minLonIndex = Math.floor((renderRange.minLon - centerLon) / longitudeStep);
  const maxLonIndex = Math.floor((renderRange.maxLon - centerLon) / longitudeStep);
  const minLatIndex = Math.floor((renderRange.minLat - centerLat) / latitudeStep);
  const maxLatIndex = Math.ceil((renderRange.maxLat - centerLat) / latitudeStep);
  const chunks: HexChunkDescriptor[] = [];

  for (let lonIndex = minLonIndex; lonIndex <= maxLonIndex; lonIndex += 1) {
    for (let latIndex = minLatIndex; latIndex <= maxLatIndex; latIndex += 1) {
      chunks.push({
        key: `${level.level}_${lonIndex}_${latIndex}`,
        lonIndex,
        latIndex,
      });
    }
  }

  return {
    centerLon,
    centerLat,
    longitudeSpan,
    longitudeStep,
    latitudeStep,
    chunks,
  };
};
