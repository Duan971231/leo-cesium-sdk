# Cesium SDK

Cesium SDK is a framework-agnostic TypeScript wrapper around Cesium. The current package focuses on viewer lifecycle, imagery layers, entity graphics, camera helpers, common utilities, and a lightweight plugin interface.

## Requirements

- Node.js 18+
- Cesium 1.136.x installed by the host application

Cesium is a peer dependency. The host application is responsible for configuring Cesium assets, workers, and access tokens according to its own bundler setup.

## Install

```bash
npm install cesium cesium-sdk
```

## Usage

```typescript
import { CesiumSDK } from "cesium-sdk";

const sdk = new CesiumSDK("cesiumContainer", {
  ionAccessToken: "your-token",
});

await sdk.ready();

sdk.entity.addPoint("beijing", {
  longitude: 116.391,
  latitude: 39.907,
  height: 0,
});

await sdk.camera.flyToPosition({
  longitude: 116.391,
  latitude: 39.907,
  height: 10000,
});

await sdk.destroy();
```

Accessing `sdk.layer`, `sdk.entity`, or `sdk.camera` before `await sdk.ready()` throws an SDK error. This keeps initialization failures explicit.

## Current API Surface

- `CesiumSDK`: SDK entry, initialization, plugin registration, and teardown.
- `ViewerManager`: Cesium viewer creation, lifecycle hooks, and resource cleanup.
- `LayerManager`: imagery layer CRUD.
- `EntityManager`: point, polyline, and polygon graphics.
- `CameraManager`: fly-to helpers, current viewpoint, bookmarks, and target tracking.
- `PluginManager`: plugin install and destroy lifecycle.
- Common utilities: event emitter, config store, logger, dispose pool, coordinate, color, math, and Cesium memory cleanup helpers.

Planned modules such as terrain layers, 3D Tiles layers, drawing, measurement, analysis, and roaming are not part of the current public implementation.

## Build

```bash
npm run typecheck
npm run build
```

The package emits:

- `dist/cesium-sdk.es.js` for ESM imports.
- `dist/cesium-sdk.cjs` for CommonJS require.
- `dist/index.d.ts` for TypeScript declarations.

## Development Notes

- Source files are UTF-8 encoded.
- The SDK intentionally does not bundle Cesium.
- Internal Cesium cleanup helpers may touch private Cesium APIs and should be verified when upgrading Cesium.
