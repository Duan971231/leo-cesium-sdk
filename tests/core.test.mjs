import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CesiumSDK,
  CameraManager,
  ConfigStore,
  EntityManager,
  ErrorCode,
  EventEmitter,
  ImageryLayer,
  LayerManager,
  PluginManager,
  PointGraphic,
  PolygonGraphic,
  PolylineGraphic,
  SDKError,
  ValidationUtil,
  Viewpoint,
} from '../dist/cesium-sdk.es.js';

const assertSDKError = async (fn, code) => {
  await assert.rejects(fn, (error) => {
    assert.equal(error instanceof SDKError, true);
    assert.equal(error.code, code);
    return true;
  });
};

const assertThrowsSDKError = (fn, code) => {
  assert.throws(fn, (error) => {
    assert.equal(error instanceof SDKError, true);
    assert.equal(error.code, code);
    return true;
  });
};

test('CesiumSDK is disposed permanently after destroy', async () => {
  const sdk = new CesiumSDK('container-id');

  await sdk.destroy();

  assert.equal(sdk.initialized, false);
  assert.equal(sdk.disposed, true);
  await assertSDKError(() => sdk.ready(), ErrorCode.RESOURCE_DISPOSED);
  assertThrowsSDKError(() => sdk.layer, ErrorCode.RESOURCE_DISPOSED);
});

test('CesiumSDK disables Cesium Ion default base layer by default', () => {
  const sdk = new CesiumSDK('container-id');

  assert.equal(sdk.viewer.options.baseLayer, false);
});

test('EventEmitter keeps dispatching when one listener fails', () => {
  const emitter = new EventEmitter();
  const calls = [];

  emitter.on('change', () => {
    calls.push('first');
    throw new Error('listener failed');
  });
  emitter.on('change', () => {
    calls.push('second');
  });

  emitter.emit('change', undefined);

  assert.deepEqual(calls, ['first', 'second']);
});

test('ConfigStore writes CESIUM_BASE_URL through globalThis', () => {
  const previous = globalThis.CESIUM_BASE_URL;
  try {
    const store = new ConfigStore({ cesiumBaseUrl: '/cesium-assets' });

    assert.equal(globalThis.CESIUM_BASE_URL, '/cesium-assets');
    assert.equal(store.get('cesiumBaseUrl'), '/cesium-assets');
  } finally {
    if (previous === undefined) {
      delete globalThis.CESIUM_BASE_URL;
    } else {
      globalThis.CESIUM_BASE_URL = previous;
    }
  }
});

test('Viewpoint validates coordinate and angle input', () => {
  assert.doesNotThrow(() => {
    new Viewpoint({
      longitude: 116.391,
      latitude: 39.907,
      height: 1000,
      heading: 0,
      pitch: -45,
    });
  });

  assertThrowsSDKError(
    () => new Viewpoint({ longitude: 181, latitude: 39, height: 1000 }),
    ErrorCode.INVALID_OPTIONS,
  );
  assertThrowsSDKError(
    () => new Viewpoint({ longitude: 116, latitude: 39, height: Number.NaN }),
    ErrorCode.INVALID_OPTIONS,
  );
});

test('ValidationUtil exposes shared validation helpers', () => {
  assert.doesNotThrow(() => {
    ValidationUtil.id('item-1', 'Item id');
    ValidationUtil.coordinate({ longitude: 116, latitude: 39, height: 0 });
    ValidationUtil.positions(
      [
        { longitude: 116, latitude: 39 },
        { longitude: 117, latitude: 39 },
      ],
      2,
      'Line',
    );
    ValidationUtil.opacity(0.5);
    ValidationUtil.cssColor('#ffffff', 'Color');
  });

  assertThrowsSDKError(() => ValidationUtil.id('', 'Item id'), ErrorCode.INVALID_OPTIONS);
  assertThrowsSDKError(
    () => ValidationUtil.coordinate({ longitude: 116, latitude: 91 }),
    ErrorCode.INVALID_OPTIONS,
  );
});

test('LayerManager validates input, snapshots collections, and avoids generated id reuse', () => {
  const addedProviders = [];
  const removedLayers = [];
  const viewer = {
    imageryLayers: {
      addImageryProvider(provider) {
        const layer = { provider, alpha: 1, show: true };
        addedProviders.push(provider);
        return layer;
      },
      remove(layer) {
        removedLayers.push(layer);
        return true;
      },
    },
    flyTo: async () => undefined,
  };
  const provider = {};
  const manager = new LayerManager(viewer);

  assertThrowsSDKError(
    () => manager.addImageryLayer(provider, { id: 'bad-opacity', opacity: 2 }),
    ErrorCode.INVALID_OPTIONS,
  );

  const first = manager.addImageryLayer(provider);
  assert.equal(first.id, 'imagery_0');
  assert.equal(manager.remove(first.id), true);
  const second = manager.addImageryLayer(provider);
  assert.equal(second.id, 'imagery_1');

  const snapshot = manager.getAll();
  snapshot.clear();

  assert.equal(manager.count, 1);
  assert.equal(addedProviders.length, 2);
  assert.equal(removedLayers.length, 1);
});

test('ImageryLayer validates opacity on construction and mutation', () => {
  assertThrowsSDKError(
    () => new ImageryLayer('layer', {}, { opacity: -1 }),
    ErrorCode.INVALID_OPTIONS,
  );

  const layer = new ImageryLayer('layer', {}, { opacity: 0.5 });

  assert.equal(layer.opacity, 0.5);
  assertThrowsSDKError(() => {
    layer.opacity = Number.POSITIVE_INFINITY;
  }, ErrorCode.INVALID_OPTIONS);
});

test('Removed layers and graphics reject further resource access', () => {
  const removedLayers = [];
  const imageryLayer = new ImageryLayer('layer', {}, { opacity: 0.5 });
  imageryLayer._attach({
    imageryLayers: {
      addImageryProvider() {
        return { alpha: 1, show: true };
      },
      remove(layer) {
        removedLayers.push(layer);
        return true;
      },
    },
  });
  imageryLayer.remove();

  assertThrowsSDKError(() => imageryLayer.opacity, ErrorCode.RESOURCE_DISPOSED);
  assertThrowsSDKError(() => {
    imageryLayer.visible = false;
  }, ErrorCode.RESOURCE_DISPOSED);

  const point = new PointGraphic('point', { longitude: 116, latitude: 39 });
  point._attach({
    entities: {
      add(entity) {
        return entity;
      },
      remove() {
        return true;
      },
    },
  });
  point.remove();

  assertThrowsSDKError(() => point.getPosition(), ErrorCode.RESOURCE_DISPOSED);
  assertThrowsSDKError(
    () => point.setPosition({ longitude: 117, latitude: 40 }),
    ErrorCode.RESOURCE_DISPOSED,
  );
  assert.equal(removedLayers.length, 1);
});

test('EntityManager validates ids, coordinates, geometry counts, styles, and snapshots', () => {
  const addedEntities = [];
  const viewer = {
    entities: {
      add(entity) {
        addedEntities.push(entity);
        return entity;
      },
      remove() {
        return true;
      },
    },
    flyTo: async () => undefined,
  };
  const manager = new EntityManager(viewer);

  assertThrowsSDKError(
    () => manager.addPoint('', { longitude: 116, latitude: 39 }),
    ErrorCode.INVALID_OPTIONS,
  );
  assertThrowsSDKError(
    () => manager.addPoint('bad-point', { longitude: 200, latitude: 39 }),
    ErrorCode.INVALID_OPTIONS,
  );
  assertThrowsSDKError(
    () => manager.addPolyline('bad-line', [{ longitude: 116, latitude: 39 }]),
    ErrorCode.INVALID_OPTIONS,
  );
  assertThrowsSDKError(
    () =>
      manager.addPolygon('bad-polygon', [
        { longitude: 116, latitude: 39 },
        { longitude: 117, latitude: 39 },
      ]),
    ErrorCode.INVALID_OPTIONS,
  );
  assertThrowsSDKError(
    () => manager.addPoint('bad-style', { longitude: 116, latitude: 39 }, { color: 'not-a-color' }),
    ErrorCode.INVALID_OPTIONS,
  );

  manager.addPoint('valid-point', { longitude: 116, latitude: 39 });
  const snapshot = manager.getAll();
  snapshot.clear();

  assert.equal(manager.count, 1);
  assert.equal(addedEntities.length, 1);
});

test('Graphic classes support position and style updates', () => {
  const addedEntities = [];
  const viewer = {
    entities: {
      add(entity) {
        addedEntities.push(entity);
        return entity;
      },
      remove() {
        return true;
      },
    },
    flyTo: async () => undefined,
  };

  const point = new PointGraphic('point', { longitude: 116, latitude: 39 });
  point._attach(viewer);
  point.setPosition({ longitude: 117, latitude: 40, height: 10 });
  point.setStyle({ pixelSize: 16, color: '#ff0000' });

  assert.deepEqual(point.getPosition(), { longitude: 117, latitude: 40, height: 10 });
  assert.equal(point.getStyle().pixelSize, 16);
  assert.equal(point.getStyle().color, '#ff0000');

  const polyline = new PolylineGraphic('line', [
    { longitude: 116, latitude: 39 },
    { longitude: 117, latitude: 40 },
  ]);
  polyline._attach(viewer);
  polyline.setPositions([
    { longitude: 118, latitude: 41 },
    { longitude: 119, latitude: 42 },
  ]);
  polyline.setStyle({ width: 4, color: '#00ff00' });

  assert.deepEqual(polyline.getPositions(), [
    { longitude: 118, latitude: 41 },
    { longitude: 119, latitude: 42 },
  ]);
  assert.equal(polyline.getStyle().width, 4);

  const polygon = new PolygonGraphic('polygon', [
    { longitude: 116, latitude: 39 },
    { longitude: 117, latitude: 39 },
    { longitude: 117, latitude: 40 },
  ]);
  polygon._attach(viewer);
  polygon.setPositions([
    { longitude: 118, latitude: 41 },
    { longitude: 119, latitude: 41 },
    { longitude: 119, latitude: 42 },
  ]);
  polygon.setStyle({ color: '#0000ff', outline: false });

  assert.equal(polygon.getPositions().length, 3);
  assert.equal(polygon.getStyle().color, '#0000ff');
  assert.equal(polygon.getStyle().outline, false);
  assert.equal(addedEntities.length, 3);
});

test('Camera bookmarks are returned as snapshots', () => {
  const manager = new CameraManager({});
  const bookmark = manager.addBookmark('home', 'Home', {
    longitude: 116,
    latitude: 39,
    height: 1000,
  });

  bookmark.name = 'Mutated';
  bookmark.viewpoint.longitude = 0;

  const stored = manager.getBookmark('home');
  assert.equal(stored.name, 'Home');
  assert.equal(stored.viewpoint.longitude, 116);

  const all = manager.getAllBookmarks();
  all[0].viewpoint.latitude = 0;
  assert.equal(manager.getBookmark('home').viewpoint.latitude, 39);
});

test('PluginManager validates plugin shape before install', async () => {
  const manager = new PluginManager({});

  await assertSDKError(() => manager.register(null), ErrorCode.INVALID_OPTIONS);
  await assertSDKError(
    () => manager.register({ name: '', install() {}, destroy() {} }),
    ErrorCode.INVALID_OPTIONS,
  );
  await assertSDKError(
    () => manager.register({ name: 'bad', destroy() {} }),
    ErrorCode.INVALID_OPTIONS,
  );
});
