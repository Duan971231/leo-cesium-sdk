import { createVisibleChunkLayout } from "../calculation/chunks";
import { createChunkLines } from "../calculation/geometry";
import type { HexChunkGeometry, HexWorkerRequest, HexWorkerSuccessResponse } from "../types/internal";

export const calculateHexWorkerResponse = (request: HexWorkerRequest): HexWorkerSuccessResponse => {
  const layout = createVisibleChunkLayout(
    request.sourceRange,
    request.visibleRange,
    request.level,
    request.chunkSize,
    request.chunkHeight,
  );
  const cachedKeys = new Set(request.cachedChunkKeys);
  const chunks: HexChunkGeometry[] = layout.chunks
    .filter((chunk) => !cachedKeys.has(chunk.key))
    .map((chunk) => ({
      key: chunk.key,
      lines: createChunkLines(
        layout.centerLon + chunk.lonIndex * layout.longitudeStep,
        layout.centerLat + chunk.latIndex * layout.latitudeStep,
        layout.longitudeSpan,
        request.chunkSize,
        request.chunkHeight,
        request.sourceRange,
      ),
    }));

  return {
    id: request.id,
    level: request.level.level,
    visibleChunkKeys: layout.chunks.map((chunk) => chunk.key),
    chunks,
  };
};
