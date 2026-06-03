import type { CesiumSDK } from '../CesiumSDK';

export interface ISDKPlugin {
  readonly name: string;
  install(sdk: CesiumSDK): void | Promise<void>;
  destroy(): void | Promise<void>;
}
