import * as Cesium from 'cesium';
import { LogLevel } from './Logger';

export interface SDKConfig {
  /** Cesium Ion access token */
  ionAccessToken?: string;
  cesiumBaseUrl?: string;
  logLevel?: LogLevel;
  [key: string]: unknown;
}

export class ConfigStore {
  private readonly config: SDKConfig;

  constructor(initialConfig?: SDKConfig) {
    this.config = { ...initialConfig };
    this.applyConfig();
  }

  get<K extends keyof SDKConfig>(key: K): SDKConfig[K] {
    return this.config[key];
  }

  set<K extends keyof SDKConfig>(key: K, value: SDKConfig[K]): void {
    this.config[key] = value;
    this.applyConfig();
  }

  getAll(): Readonly<SDKConfig> {
    return Object.freeze({ ...this.config });
  }

  merge(partial: Partial<SDKConfig>): void {
    Object.assign(this.config, partial);
    this.applyConfig();
  }

  private applyConfig(): void {
    if (this.config.ionAccessToken) {
      Cesium.Ion.defaultAccessToken = this.config.ionAccessToken;
    }
    if (this.config.cesiumBaseUrl) {
      (globalThis as unknown as Record<string, unknown>).CESIUM_BASE_URL = this.config.cesiumBaseUrl;
    }
  }
}
