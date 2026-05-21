import type { CesiumSDK } from '../CesiumSDK';

/**
 * 插件接口定义
 */
export interface ISDKPlugin {
  /** 插件唯一名称 */
  readonly name: string;
  /** 安装插件 */
  install(sdk: CesiumSDK): void | Promise<void>;
  /** 销毁插件 */
  destroy(): void | Promise<void>;
}
