import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath, URL } from "node:url";

import * as Cesium from "cesium";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "silent",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  server: { middlewareMode: true },
});

const levelModule = await server.ssrLoadModule("/src/tools/hex/level/normalize.ts");
const rangeModule = await server.ssrLoadModule("/src/util/range/index.ts");
const viewerUtilModule = await server.ssrLoadModule("/src/util/viewer/index.ts");
const chunkModule = await server.ssrLoadModule("/src/tools/hex/calculation/chunks.ts");
const geometryModule = await server.ssrLoadModule("/src/tools/hex/calculation/geometry.ts");
const workerModule = await server.ssrLoadModule("/src/tools/hex/worker/protocol.ts");
const cacheModule = await server.ssrLoadModule("/src/tools/hex/renderer/cache.ts");
const rendererModule = await server.ssrLoadModule("/src/tools/hex/renderer/HexRenderer.ts");

after(async () => {
  await server.close();
});

test("默认输入生成覆盖全部非负高度的 levels", () => {
  const levels = levelModule.normalizeHexLevels();

  assert.equal(levels.length, 7);
  assert.deepEqual(levels[0], {
    level: 1,
    sideLengthMeters: 50,
    minCameraHeight: 0,
    maxCameraHeight: 5000,
  });
  assert.equal(levels.at(-1).maxCameraHeight, Number.POSITIVE_INFINITY);
  assert.ok(Object.isFrozen(levels));
  assert.ok(levels.every(Object.isFrozen));
});

test("生成配置按阈值和倍率创建 levels", () => {
  const levels = levelModule.normalizeHexLevels({
    baseSizeMeters: 100,
    sizeMultiplier: 2,
    cameraHeightThresholds: [1000, 3000],
  });

  assert.deepEqual(
    levels.map((level) => [level.level, level.sideLengthMeters, level.minCameraHeight, level.maxCameraHeight]),
    [
      [1, 100, 0, 1000],
      [2, 200, 1000, 3000],
      [3, 400, 3000, Number.POSITIVE_INFINITY],
    ],
  );
});

test("显式 levels 会排序并拒绝重复或重叠区间", () => {
  const levels = levelModule.normalizeHexLevels([
    {
      level: 2,
      sideLengthMeters: 200,
      minCameraHeight: 1000,
      maxCameraHeight: 2000,
    },
    {
      level: 1,
      sideLengthMeters: 100,
      minCameraHeight: 0,
      maxCameraHeight: 1000,
    },
  ]);

  assert.deepEqual(
    levels.map((level) => level.level),
    [1, 2],
  );
  assert.throws(
    () =>
      levelModule.normalizeHexLevels([
        {
          level: 1,
          sideLengthMeters: 100,
          minCameraHeight: 0,
          maxCameraHeight: 2000,
        },
        {
          level: 1,
          sideLengthMeters: 200,
          minCameraHeight: 1000,
          maxCameraHeight: 3000,
        },
      ]),
    (error) => error.code === "INVALID_OPTIONS",
  );
});

test("相机高度使用左闭右开区间匹配 level", () => {
  const levels = levelModule.normalizeHexLevels({
    cameraHeightThresholds: [1000],
  });

  assert.equal(levelModule.findHexLevelByCameraHeight(999.99, levels).level, 1);
  assert.equal(levelModule.findHexLevelByCameraHeight(1000, levels).level, 2);
  assert.equal(levelModule.findHexLevelByCameraHeight(-1, levels), undefined);
});

test("rangeUtil 校验、相交并支持容差比较", () => {
  const source = { minLon: 0, minLat: 0, maxLon: 10, maxLat: 10 };
  const target = { minLon: 5, minLat: -5, maxLon: 15, maxLat: 5 };

  assert.equal(rangeModule.rangeUtil.isValidGeoRange(source), true);
  assert.equal(
    rangeModule.rangeUtil.isValidGeoRange({ ...source, maxLon: source.minLon }),
    false,
  );
  assert.deepEqual(rangeModule.rangeUtil.intersectGeoRanges(source, target), {
    minLon: 5,
    minLat: 0,
    maxLon: 10,
    maxLat: 5,
  });
  assert.equal(
    rangeModule.rangeUtil.areGeoRangesEqual(
      source,
      { ...source, maxLon: 10.01 },
      0.01,
    ),
    true,
  );
});

test("viewerUtil 通过统一范围类型返回像素采样范围", () => {
  const viewer = {
    camera: {
      getPickRay: (pixel) => ({ pixel }),
    },
    scene: {
      canvas: { clientWidth: 101, clientHeight: 51 },
      globe: {
        pick: (ray) =>
          Cesium.Cartesian3.fromDegrees(
            ray.pixel.x / 5 - 10,
            5 - ray.pixel.y / 5,
          ),
      },
      mode: Cesium.SceneMode.SCENE3D,
    },
  };

  const utilRange = viewerUtilModule.viewerUtil.getViewerRange(viewer);

  assert.equal(
    rangeModule.rangeUtil.areGeoRangesEqual(
      utilRange,
      { minLon: -10, minLat: -5, maxLon: 10, maxLat: 5 },
      1e-12,
    ),
    true,
  );
  assert.deepEqual(viewerUtilModule.getViewerRange(viewer), utilRange);
});

test("viewerUtil 校验 Viewer 并在画布不可用时返回独立的空范围", () => {
  assert.throws(
    () => viewerUtilModule.viewerUtil.getViewerRange(undefined),
    (error) => error.code === "INVALID_OPTIONS",
  );

  const viewer = {
    camera: {},
    scene: {
      canvas: { clientWidth: 0, clientHeight: 0 },
      globe: {},
    },
  };
  const firstRange = viewerUtilModule.viewerUtil.getViewerRange(viewer);
  firstRange.minLon = 1;

  assert.deepEqual(viewerUtilModule.viewerUtil.getViewerRange(viewer), {
    minLon: 0,
    minLat: 0,
    maxLon: 0,
    maxLat: 0,
  });
});

test("chunk 与 geometry 计算只生成范围内的有效线段", () => {
  const sourceRange = {
    minLon: -0.1,
    minLat: -0.1,
    maxLon: 0.1,
    maxLat: 0.1,
  };
  const level = {
    level: 1,
    sideLengthMeters: 1000,
    minCameraHeight: 0,
    maxCameraHeight: Number.POSITIVE_INFINITY,
  };
  const layout = chunkModule.createVisibleChunkLayout(sourceRange, sourceRange, level, 4, 4);
  const lines = geometryModule.createChunkLines(
    layout.centerLon,
    layout.centerLat,
    layout.longitudeSpan,
    4,
    4,
    sourceRange,
  );

  assert.ok(layout.chunks.length > 0);
  assert.ok(lines.length > 0);
  assert.ok(lines.every((line) => line.length >= 4 && line.length % 2 === 0));
});

test("Worker 协议返回全部可见 key 且不重复计算缓存 chunk", () => {
  const request = {
    id: 7,
    sourceRange: {
      minLon: -0.1,
      minLat: -0.1,
      maxLon: 0.1,
      maxLat: 0.1,
    },
    visibleRange: {
      minLon: -0.1,
      minLat: -0.1,
      maxLon: 0.1,
      maxLat: 0.1,
    },
    level: {
      level: 1,
      sideLengthMeters: 1000,
      minCameraHeight: 0,
      maxCameraHeight: Number.POSITIVE_INFINITY,
    },
    chunkSize: 4,
    chunkHeight: 4,
    cachedChunkKeys: [],
  };
  const first = workerModule.calculateHexWorkerResponse(request);
  const cachedKey = first.visibleChunkKeys[0];
  const second = workerModule.calculateHexWorkerResponse({
    ...request,
    cachedChunkKeys: [cachedKey],
  });

  assert.equal(first.id, request.id);
  assert.equal(first.chunks.length, first.visibleChunkKeys.length);
  assert.equal(second.visibleChunkKeys.length, first.visibleChunkKeys.length);
  assert.equal(
    second.chunks.some((chunk) => chunk.key === cachedKey),
    false,
  );
});

test("缓存辅助函数保留邻近 chunk 并按使用时间淘汰", () => {
  const visibleKeys = new Set(["1_0_0"]);
  const cache = new Map([
    ["1_0_0", { lastUsedFrame: 3 }],
    ["1_1_0", { lastUsedFrame: 2 }],
    ["1_3_0", { lastUsedFrame: 1 }],
  ]);

  assert.equal(cacheModule.isChunkNearVisible("1_1_0", visibleKeys, 1), true);
  assert.equal(cacheModule.isChunkNearVisible("1_3_0", visibleKeys, 1), false);
  assert.deepEqual(cacheModule.getCacheOverflowKeys(cache, visibleKeys, 2), ["1_3_0"]);
});

test("HexRenderer 返回 levels 快照并在销毁后拒绝访问", () => {
  const originalWorker = globalThis.Worker;
  const workers = [];

  class FakeWorker {
    onmessage = null;
    onerror = null;
    messages = [];
    terminated = false;

    constructor() {
      workers.push(this);
    }

    postMessage(message) {
      this.messages.push(message);
    }

    terminate() {
      this.terminated = true;
    }
  }

  globalThis.Worker = FakeWorker;
  const viewer = {
    camera: {
      changed: {
        addEventListener() {},
        removeEventListener() {},
      },
      computeViewRectangle: () => ({
        west: -0.1,
        south: -0.1,
        east: 0.1,
        north: 0.1,
      }),
      percentageChanged: 0.5,
      positionCartographic: { height: 1000 },
    },
    isDestroyed: () => false,
    scene: {
      canvas: { clientWidth: 0, clientHeight: 0 },
      globe: { ellipsoid: {} },
      primitives: {
        contains: () => false,
        remove() {},
      },
      requestRender() {},
    },
  };

  try {
    const renderer = new rendererModule.HexRenderer(viewer, {
      autoListenCamera: false,
    });
    const levels = renderer.getLevels();

    assert.equal(workers.length, 1);
    assert.equal(workers[0].messages.length, 1);
    assert.deepEqual(workers[0].messages[0].sourceRange, {
      minLon: -179.66312,
      minLat: -85.585595,
      maxLon: 179.66312,
      maxLat: 85.585595,
    });
    assert.ok(Object.isFrozen(levels));
    assert.notEqual(levels[0], workers[0].messages[0].level);

    renderer.destroy();
    renderer.destroy();
    assert.equal(workers[0].terminated, true);
    assert.throws(
      () => renderer.getLevels(),
      (error) => error.code === "RESOURCE_DISPOSED",
    );
  } finally {
    if (originalWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = originalWorker;
  }
});
