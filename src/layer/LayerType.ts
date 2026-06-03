export enum LayerType {
  IMAGERY = "imagery",
  CUSTOM = "custom",
}

export const LayerTypeGuard = {
  isImagery(type: LayerType): type is LayerType.IMAGERY {
    return type === LayerType.IMAGERY;
  },
};
