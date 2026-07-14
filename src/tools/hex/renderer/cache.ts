import type { HexCachedChunk } from "../types/internal";

interface ChunkKeyParts {
  readonly level: number;
  readonly lonIndex: number;
  readonly latIndex: number;
}

const parseChunkKey = (key: string): ChunkKeyParts | undefined => {
  const [level, lonIndex, latIndex] = key.split("_").map(Number);
  if (![level, lonIndex, latIndex].every(Number.isFinite)) return undefined;
  return { level, lonIndex, latIndex };
};

export const isChunkNearVisible = (key: string, visibleKeys: ReadonlySet<string>, padding: number): boolean => {
  if (visibleKeys.has(key)) return true;

  const chunk = parseChunkKey(key);
  if (!chunk) return false;

  for (const visibleKey of visibleKeys) {
    const visibleChunk = parseChunkKey(visibleKey);
    if (!visibleChunk || visibleChunk.level !== chunk.level) continue;
    if (
      Math.abs(chunk.lonIndex - visibleChunk.lonIndex) <= padding &&
      Math.abs(chunk.latIndex - visibleChunk.latIndex) <= padding
    ) {
      return true;
    }
  }

  return false;
};

export const getCacheOverflowKeys = (
  cache: ReadonlyMap<string, HexCachedChunk>,
  visibleKeys: ReadonlySet<string>,
  maximum: number,
): readonly string[] => {
  const overflowCount = cache.size - maximum;
  if (overflowCount <= 0) return [];

  return Array.from(cache.entries())
    .filter(([key]) => !visibleKeys.has(key))
    .sort(([, source], [, target]) => source.lastUsedFrame - target.lastUsedFrame)
    .slice(0, overflowCount)
    .map(([key]) => key);
};
