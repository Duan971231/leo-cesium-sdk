export enum LayerType {
  IMAGERY = "imagery",
  TERRAIN = "terrain",
  TILESET_3D = "tileset_3d",
  CUSTOM = "custom",
}

/** 图层类型守卫 */
export const LayerTypeGuard = {
  isImagery(type: LayerType): type is LayerType.IMAGERY {
    return type === LayerType.IMAGERY;
  },
  isTerrain(type: LayerType): type is LayerType.TERRAIN {
    return type === LayerType.TERRAIN;
  },
  isTileset3D(type: LayerType): type is LayerType.TILESET_3D {
    return type === LayerType.TILESET_3D;
  },
};
