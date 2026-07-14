import { ErrorCode, SDKError } from "@/common/SDKError";
import type { HexLevelGenerationOptions, HexLevelOption, HexLevelsInput } from "../types/public";
import type { HexLevel } from "../types/internal";
import { DEFAULT_BASE_SIZE_METERS, DEFAULT_CAMERA_HEIGHT_THRESHOLDS, DEFAULT_SIZE_MULTIPLIER } from "./defaults";

const invalidLevels = (message: string): never => {
  throw new SDKError(ErrorCode.INVALID_OPTIONS, `levels ${message}`);
};

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const validateThresholds = (thresholds: readonly number[]): void => {
  if (
    thresholds.some(
      (height, index) => !isPositiveFiniteNumber(height) || (index > 0 && height <= thresholds[index - 1]),
    )
  ) {
    invalidLevels("cameraHeightThresholds must contain ascending positive finite numbers");
  }
};

const generateLevels = (options: HexLevelGenerationOptions = {}): readonly HexLevel[] => {
  const baseSizeMeters = options.baseSizeMeters ?? DEFAULT_BASE_SIZE_METERS;
  const sizeMultiplier = options.sizeMultiplier ?? DEFAULT_SIZE_MULTIPLIER;
  const thresholds = options.cameraHeightThresholds ?? DEFAULT_CAMERA_HEIGHT_THRESHOLDS;

  if (!isPositiveFiniteNumber(baseSizeMeters)) {
    invalidLevels("baseSizeMeters must be greater than 0");
  }
  if (!isPositiveFiniteNumber(sizeMultiplier)) {
    invalidLevels("sizeMultiplier must be greater than 0");
  }
  if (!Array.isArray(thresholds)) {
    invalidLevels("cameraHeightThresholds must be an array");
  }
  validateThresholds(thresholds);

  const boundaries = [0, ...thresholds, Number.POSITIVE_INFINITY];
  return Object.freeze(
    boundaries.slice(0, -1).map((minCameraHeight, index) => {
      const sideLengthMeters = baseSizeMeters * Math.pow(sizeMultiplier, index);
      if (!isPositiveFiniteNumber(sideLengthMeters)) {
        return invalidLevels("generated sideLengthMeters must be finite");
      }

      return Object.freeze({
        level: index + 1,
        sideLengthMeters,
        minCameraHeight,
        maxCameraHeight: boundaries[index + 1],
      });
    }),
  );
};

const normalizeExplicitLevels = (options: readonly HexLevelOption[]): readonly HexLevel[] => {
  if (options.length === 0) invalidLevels("must not be empty");

  const levels = options.map((option) => {
    if (!option || typeof option !== "object") {
      invalidLevels("must contain objects");
    }
    if (!Number.isInteger(option.level) || option.level <= 0) {
      invalidLevels("level must be a positive integer");
    }
    if (!isPositiveFiniteNumber(option.sideLengthMeters)) {
      invalidLevels("sideLengthMeters must be greater than 0");
    }
    if (!Number.isFinite(option.minCameraHeight) || option.minCameraHeight < 0) {
      invalidLevels("minCameraHeight must be 0 or greater");
    }
    if (
      (option.maxCameraHeight !== Number.POSITIVE_INFINITY && !Number.isFinite(option.maxCameraHeight)) ||
      option.maxCameraHeight <= option.minCameraHeight
    ) {
      invalidLevels("maxCameraHeight must be greater than minCameraHeight");
    }

    return Object.freeze({ ...option });
  });

  const levelNumbers = new Set(levels.map((level) => level.level));
  if (levelNumbers.size !== levels.length) {
    invalidLevels("level values must be unique");
  }

  levels.sort((a, b) => a.minCameraHeight - b.minCameraHeight);
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index].minCameraHeight < levels[index - 1].maxCameraHeight) {
      invalidLevels("camera height ranges must not overlap");
    }
  }

  return Object.freeze(levels);
};

export const normalizeHexLevels = (input?: HexLevelsInput): readonly HexLevel[] => {
  if (input === undefined) return generateLevels();
  if (Array.isArray(input)) return normalizeExplicitLevels(input);
  if (!input || typeof input !== "object") {
    return invalidLevels("must be an array or a generation options object");
  }
  return generateLevels(input as HexLevelGenerationOptions);
};

export const findHexLevelByCameraHeight = (height: number, levels: readonly HexLevel[]): HexLevel | undefined =>
  levels.find((level) => height >= level.minCameraHeight && height < level.maxCameraHeight);
