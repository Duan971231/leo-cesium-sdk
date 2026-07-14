import type { HexRange } from "../types/public";

const EARTH_RADIUS_METERS = 6_378_137;
const TOP_VERTICES = [3, 2, 1, 6] as const;
const BOTTOM_VERTICES = [3, 4, 5, 6] as const;

export const calculateLongitudeSpan = (latitude: number, distanceMeters: number): number => {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const metersPerDegree = (2 * Math.PI * EARTH_RADIUS_METERS * Math.cos(latitudeRadians)) / 360;
  return distanceMeters / metersPerDegree;
};

const appendVertex = (
  target: number[],
  centerLon: number,
  centerLat: number,
  vertexIndex: number,
  longitudeSpan: number,
): void => {
  const angle = (vertexIndex * Math.PI) / 3;
  target.push(centerLon + Math.cos(angle) * longitudeSpan, centerLat + Math.sin(angle) * longitudeSpan);
};

const prependVertex = (
  target: number[],
  centerLon: number,
  centerLat: number,
  vertexIndex: number,
  longitudeSpan: number,
): void => {
  const angle = (vertexIndex * Math.PI) / 3;
  target.unshift(centerLon + Math.cos(angle) * longitudeSpan, centerLat + Math.sin(angle) * longitudeSpan);
};

const isCenterInRange = (longitude: number, latitude: number, range: HexRange): boolean =>
  longitude >= range.minLon && longitude <= range.maxLon && latitude >= range.minLat && latitude <= range.maxLat;

export const createChunkLines = (
  originLon: number,
  originLat: number,
  longitudeSpan: number,
  chunkSize: number,
  chunkHeight: number,
  sourceRange: HexRange,
): readonly (readonly number[])[] => {
  const lines: number[][] = [];

  for (let rowIndex = 0; rowIndex < chunkHeight; rowIndex += 1) {
    const rowLat = originLat - rowIndex * Math.sqrt(3) * longitudeSpan;
    const topLine: number[] = [];
    const bottomLine: number[] = [];
    let lastVisibleColumn = -1;

    for (let columnIndex = 0; columnIndex < chunkSize; columnIndex += 1) {
      const cellLon = originLon + columnIndex * longitudeSpan * 3;
      if (!isCenterInRange(cellLon, rowLat, sourceRange)) continue;

      lastVisibleColumn = columnIndex;
      TOP_VERTICES.forEach((vertex) => appendVertex(topLine, cellLon, rowLat, vertex, longitudeSpan));
      BOTTOM_VERTICES.forEach((vertex) => prependVertex(bottomLine, cellLon, rowLat, vertex, longitudeSpan));
    }

    if (topLine.length > 0) lines.push([...topLine, ...bottomLine]);

    const nextChunkLon = originLon + chunkSize * longitudeSpan * 3;
    if (lastVisibleColumn === chunkSize - 1 && isCenterInRange(nextChunkLon, rowLat, sourceRange)) {
      const lastCellLon = originLon + lastVisibleColumn * longitudeSpan * 3;
      const joinLine: number[] = [];
      appendVertex(joinLine, lastCellLon, rowLat, 6, longitudeSpan);
      appendVertex(joinLine, nextChunkLon, rowLat, 3, longitudeSpan);
      lines.push(joinLine);
    }
  }

  return lines;
};
