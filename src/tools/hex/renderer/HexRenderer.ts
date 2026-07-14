import * as Cesium from "cesium";

import { ErrorCode, SDKError } from "@/common/SDKError";
import { Logger } from "@/common/Logger";
import { rangeUtil } from "@/util/range";
import { viewerUtil } from "@/util/viewer";
import { findHexLevelByCameraHeight, normalizeHexLevels } from "../level/normalize";
import type { HexLevel, HexLevelCache, HexWorkerResponse, HexWorkerSuccessResponse } from "../types/internal";
import type { HexLevelOption, HexRange, HexRendererOptions } from "../types/public";
import { createHexWorker } from "../worker/create";
import { getCacheOverflowKeys, isChunkNearVisible } from "./cache";

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_CHUNK_SIZE = 32;
const DEFAULT_CACHE_PADDING = 1;
const DEFAULT_MAX_CHUNKS = 64;
const DEFAULT_RANGE_PADDING = 0.01;
const CAMERA_UPDATE_INTERVAL = 1000 / 30;
const DEFAULT_SOURCE_RANGE: Readonly<HexRange> = Object.freeze({
  minLon: -179.66312,
  minLat: -85.585595,
  maxLon: 179.66312,
  maxLat: 85.585595,
});

const logger = new Logger("HexRenderer");

const invalidOption = (message: string): never => {
  throw new SDKError(ErrorCode.INVALID_OPTIONS, message);
};

const readPositiveNumber = (value: number | undefined, fallback: number, label: string): number => {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result <= 0) {
    invalidOption(`${label} must be greater than 0`);
  }
  return result;
};

const readNonNegativeNumber = (value: number | undefined, fallback: number, label: string): number => {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result < 0) {
    invalidOption(`${label} must be 0 or greater`);
  }
  return result;
};

const readInteger = (value: number | undefined, fallback: number, label: string, minimum: number): number => {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < minimum) {
    invalidOption(`${label} must be an integer greater than or equal to ${minimum}`);
  }
  return result;
};

const isWorkerLike = (value: unknown): value is Worker =>
  !!value &&
  typeof value === "object" &&
  typeof (value as Worker).postMessage === "function" &&
  typeof (value as Worker).terminate === "function";

export class HexRenderer {
  private readonly viewer: Cesium.Viewer;
  private readonly levels: readonly HexLevel[];
  private readonly lineColor: Cesium.Color;
  private readonly lineWidth: number;
  private readonly chunkSize: number;
  private readonly chunkHeight: number;
  private readonly cachePaddingChunks: number;
  private readonly maxChunksPerLevel: number;
  private readonly rangePaddingDegree: number;
  private readonly worker: Worker;
  private readonly levelCaches = new Map<number, HexLevelCache>();
  private sourceRange: HexRange;
  private visibleRange: HexRange;
  private currentLevel: HexLevel | undefined;
  private requestId = 0;
  private latestRequestId = 0;
  private drawFrame = 0;
  private cameraUpdateTimer: ReturnType<typeof setTimeout> | undefined;
  private originalCameraPercentageChanged: number | undefined;
  private cameraListenerAdded = false;
  private destroyed = false;

  constructor(viewer: Cesium.Viewer, options: HexRendererOptions = {}) {
    if (!viewer?.camera || !viewer.scene?.primitives || viewer.isDestroyed()) {
      invalidOption("viewer is required");
    }
    if (!options || typeof options !== "object") {
      invalidOption("options are required");
    }
    const sourceRange = options.sourceRange === undefined ? DEFAULT_SOURCE_RANGE : options.sourceRange;
    // if (!rangeUtil.isValidGeoRange(sourceRange)) {
    //   invalidOption("sourceRange must be a valid longitude and latitude range");
    // }
    if (options.lineColor !== undefined && !(options.lineColor instanceof Cesium.Color)) {
      invalidOption("lineColor must be a Cesium.Color");
    }
    if (
      options.workerUrl !== undefined &&
      !(
        (typeof options.workerUrl === "string" && options.workerUrl.trim().length > 0) ||
        options.workerUrl instanceof URL
      )
    ) {
      invalidOption("workerUrl must be a non-empty string or URL");
    }
    if (options.workerFactory !== undefined && typeof options.workerFactory !== "function") {
      invalidOption("workerFactory must be a function");
    }
    if (options.workerFactory !== undefined && options.workerUrl !== undefined) {
      invalidOption("workerFactory and workerUrl cannot be used together");
    }

    this.viewer = viewer;
    this.levels = normalizeHexLevels(options.levels);
    this.lineColor = Cesium.Color.clone(options.lineColor ?? Cesium.Color.fromCssColorString("#aaa").withAlpha(0.5));
    this.lineWidth = readPositiveNumber(options.lineWidth, DEFAULT_LINE_WIDTH, "lineWidth");
    this.chunkSize = readInteger(options.chunkSize, DEFAULT_CHUNK_SIZE, "chunkSize", 1);
    this.chunkHeight = readInteger(options.chunkHeight, this.chunkSize, "chunkHeight", 1);
    this.cachePaddingChunks = readInteger(options.cachePaddingChunks, DEFAULT_CACHE_PADDING, "cachePaddingChunks", 0);
    this.maxChunksPerLevel = readInteger(options.maxChunksPerLevel, DEFAULT_MAX_CHUNKS, "maxChunksPerLevel", 1);
    this.rangePaddingDegree = readNonNegativeNumber(
      options.rangePaddingDegree,
      DEFAULT_RANGE_PADDING,
      "rangePaddingDegree",
    );
    this.sourceRange = { ...sourceRange };
    this.visibleRange = viewerUtil.getViewerRange(viewer);
    this.currentLevel = findHexLevelByCameraHeight(viewer.camera.positionCartographic.height, this.levels);
    const worker = createHexWorker(options.workerUrl, options.workerFactory);
    if (!isWorkerLike(worker)) {
      invalidOption("workerFactory must return a Worker");
    }
    this.worker = worker;
    this.worker.onmessage = this.handleWorkerMessage;
    this.worker.onerror = this.handleWorkerError;

    if (options.autoListenCamera !== false) this.addCameraListener();
    this.requestDraw();
  }

  getLevels(): readonly Readonly<HexLevelOption>[] {
    this.assertActive();
    return Object.freeze(this.levels.map((level) => Object.freeze({ ...level })));
  }

  setSourceRange(sourceRange: HexRange): this {
    this.assertActive();
    if (!rangeUtil.isValidGeoRange(sourceRange)) {
      invalidOption("sourceRange must be a valid longitude and latitude range");
    }
    if (rangeUtil.areGeoRangesEqual(this.sourceRange, sourceRange)) return this;

    this.clearCaches();
    this.sourceRange = { ...sourceRange };
    this.visibleRange = viewerUtil.getViewerRange(this.viewer);
    this.requestDraw();
    return this;
  }

  refresh(): this {
    this.assertActive();
    this.updateCameraState(true);
    return this;
  }

  destroy(): void {
    if (this.destroyed) return;

    this.removeCameraListener();
    if (this.cameraUpdateTimer !== undefined) {
      clearTimeout(this.cameraUpdateTimer);
      this.cameraUpdateTimer = undefined;
    }
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.clearCaches();
    this.destroyed = true;
  }

  private assertActive(): void {
    if (this.destroyed || this.viewer.isDestroyed()) {
      throw new SDKError(ErrorCode.RESOURCE_DISPOSED, "HexRenderer has been destroyed");
    }
  }

  private addCameraListener(): void {
    this.originalCameraPercentageChanged = this.viewer.camera.percentageChanged;
    this.viewer.camera.percentageChanged = 0.001;
    this.viewer.camera.changed.addEventListener(this.handleCameraChange);
    this.cameraListenerAdded = true;
  }

  private removeCameraListener(): void {
    if (!this.cameraListenerAdded || this.viewer.isDestroyed()) return;
    this.viewer.camera.changed.removeEventListener(this.handleCameraChange);
    if (this.originalCameraPercentageChanged !== undefined) {
      this.viewer.camera.percentageChanged = this.originalCameraPercentageChanged;
    }
    this.cameraListenerAdded = false;
  }

  private readonly handleCameraChange = (): void => {
    if (this.destroyed || this.viewer.isDestroyed() || this.cameraUpdateTimer !== undefined) return;

    this.cameraUpdateTimer = setTimeout(() => {
      this.cameraUpdateTimer = undefined;
      if (!this.destroyed) this.updateCameraState(false);
    }, CAMERA_UPDATE_INTERVAL);
  };

  private updateCameraState(force: boolean): void {
    const nextLevel = findHexLevelByCameraHeight(this.viewer.camera.positionCartographic.height, this.levels);
    const nextRange = viewerUtil.getViewerRange(this.viewer);
    const levelChanged = nextLevel?.level !== this.currentLevel?.level;
    const rangeChanged = !rangeUtil.areGeoRangesEqual(
      this.visibleRange,
      nextRange,
      this.rangePaddingDegree,
    );

    this.currentLevel = nextLevel;
    this.visibleRange = nextRange;
    if (force || levelChanged || rangeChanged) this.requestDraw();
  }

  private requestDraw(): void {
    const id = ++this.requestId;
    this.latestRequestId = id;

    if (!this.currentLevel) {
      this.setVisibleLevel(undefined);
      return;
    }

    this.setVisibleLevel(this.currentLevel.level);
    const cache = this.levelCaches.get(this.currentLevel.level);
    this.worker.postMessage({
      id,
      sourceRange: this.sourceRange,
      visibleRange: this.visibleRange,
      level: this.currentLevel,
      chunkSize: this.chunkSize,
      chunkHeight: this.chunkHeight,
      cachedChunkKeys: cache ? Array.from(cache.chunks.keys()) : [],
    });
  }

  private readonly handleWorkerMessage = (event: MessageEvent<HexWorkerResponse>): void => {
    if (this.destroyed || this.viewer.isDestroyed() || event.data.id !== this.latestRequestId) return;
    if ("error" in event.data) {
      logger.error(event.data.error);
      return;
    }
    if (event.data.level !== this.currentLevel?.level) return;

    this.drawWorkerResult(event.data);
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    if (!this.destroyed) {
      logger.error(event.message || "Worker failed to load", {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
      });
    }
  };

  private drawWorkerResult(response: HexWorkerSuccessResponse): void {
    this.drawFrame += 1;
    const visibleKeys = new Set(response.visibleChunkKeys);
    const cache = this.getOrCreateLevelCache(response.level);
    cache.collection.show = true;

    cache.chunks.forEach((chunk, key) => {
      chunk.collection.show = visibleKeys.has(key);
      if (chunk.collection.show) chunk.lastUsedFrame = this.drawFrame;
    });

    response.chunks.forEach((chunk) => {
      if (cache.chunks.has(chunk.key)) return;

      const collection = cache.collection.add(new Cesium.PolylineCollection({ show: visibleKeys.has(chunk.key) }));
      chunk.lines.forEach((line) => {
        if (line.length < 4 || line.length % 2 !== 0) return;
        collection.add({
          id: chunk.key,
          positions: Cesium.Cartesian3.fromDegreesArray(Array.from(line)),
          width: this.lineWidth,
          material: Cesium.Material.fromType("Color", {
            color: this.lineColor,
          }),
        });
      });
      cache.chunks.set(chunk.key, {
        collection,
        lastUsedFrame: visibleKeys.has(chunk.key) ? this.drawFrame : 0,
      });
    });

    this.evictCache(cache, visibleKeys);
    this.requestSceneRender();
  }

  private getOrCreateLevelCache(level: number): HexLevelCache {
    const existing = this.levelCaches.get(level);
    if (existing) return existing;

    const cache: HexLevelCache = {
      level,
      collection: this.viewer.scene.primitives.add(new Cesium.PrimitiveCollection()),
      chunks: new Map(),
    };
    this.levelCaches.set(level, cache);
    return cache;
  }

  private evictCache(cache: HexLevelCache, visibleKeys: ReadonlySet<string>): void {
    Array.from(cache.chunks.keys())
      .filter((key) => !visibleKeys.has(key) && !isChunkNearVisible(key, visibleKeys, this.cachePaddingChunks))
      .forEach((key) => this.removeCachedChunk(cache, key));

    const maximum = Math.max(this.maxChunksPerLevel, visibleKeys.size);
    getCacheOverflowKeys(cache.chunks, visibleKeys, maximum).forEach((key) => this.removeCachedChunk(cache, key));
  }

  private removeCachedChunk(cache: HexLevelCache, key: string): void {
    const chunk = cache.chunks.get(key);
    if (!chunk) return;
    if (cache.collection.contains(chunk.collection)) {
      cache.collection.remove(chunk.collection);
    }
    cache.chunks.delete(key);
  }

  private setVisibleLevel(level?: number): void {
    this.levelCaches.forEach((cache) => {
      cache.collection.show = cache.level === level;
    });
    this.requestSceneRender();
  }

  private clearCaches(): void {
    if (!this.viewer.isDestroyed()) {
      this.levelCaches.forEach((cache) => {
        if (this.viewer.scene.primitives.contains(cache.collection)) {
          this.viewer.scene.primitives.remove(cache.collection);
        }
      });
      this.requestSceneRender();
    }
    this.levelCaches.clear();
  }

  private requestSceneRender(): void {
    if (!this.viewer.isDestroyed()) this.viewer.scene.requestRender();
  }
}
