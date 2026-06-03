export enum ErrorCode {
  VIEWER_NOT_INITIALIZED = 'VIEWER_NOT_INITIALIZED',
  VIEWER_ALREADY_EXISTS = 'VIEWER_ALREADY_EXISTS',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  LAYER_NOT_FOUND = 'LAYER_NOT_FOUND',
  LAYER_ALREADY_EXISTS = 'LAYER_ALREADY_EXISTS',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  ENTITY_ALREADY_EXISTS = 'ENTITY_ALREADY_EXISTS',
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_ALREADY_INSTALLED = 'PLUGIN_ALREADY_INSTALLED',
  COORDINATE_TRANSFORM_FAILED = 'COORDINATE_TRANSFORM_FAILED',
  RESOURCE_DISPOSED = 'RESOURCE_DISPOSED',
  UNKNOWN = 'UNKNOWN',
}

export class SDKError extends Error {
  readonly code: ErrorCode;
  readonly detail?: unknown;

  constructor(code: ErrorCode, message: string, detail?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'SDKError';
    this.code = code;
    this.detail = detail;
  }
}
