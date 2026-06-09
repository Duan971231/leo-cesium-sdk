import { ISDKPlugin } from "./types";
import type { CesiumSDK } from "../CesiumSDK";
import { Logger } from "../common/Logger";
import { SDKError, ErrorCode } from "../common/SDKError";

/**
 * 插件管理器：注册/卸载插件
 */
export class PluginManager {
  private readonly plugins = new Map<string, ISDKPlugin>();
  private readonly sdk: CesiumSDK;
  private readonly logger = new Logger("PluginManager");

  constructor(sdk: CesiumSDK) {
    this.sdk = sdk;
  }

  /**
   * 注册并安装插件
   */
  async register(plugin: ISDKPlugin): Promise<void> {
    this.validatePlugin(plugin);
    if (this.plugins.has(plugin.name)) {
      throw new SDKError(
        ErrorCode.PLUGIN_ALREADY_INSTALLED,
        `Plugin "${plugin.name}" is already installed`,
      );
    }
    await plugin.install(this.sdk);
    this.plugins.set(plugin.name, plugin);
    this.logger.info(`Plugin installed: ${plugin.name}`);
  }

  /**
   * 卸载插件
   */
  async unregister(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    await plugin.destroy();
    this.plugins.delete(name);
    this.logger.info(`Plugin uninstalled: ${name}`);
    return true;
  }

  /**
   * 获取插件
   */
  get<T extends ISDKPlugin = ISDKPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  /**
   * 获取所有已注册插件名称
   */
  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 卸载所有插件
   */
  async destroyAll(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        await plugin.destroy();
      } catch (e) {
        this.logger.error(`Failed to destroy plugin "${name}":`, e);
      }
    }
    this.plugins.clear();
  }

  /**
   * 已注册插件数量
   */
  get count(): number {
    return this.plugins.size;
  }

  private validatePlugin(plugin: ISDKPlugin): void {
    if (!plugin || typeof plugin !== "object") {
      throw new SDKError(ErrorCode.INVALID_OPTIONS, "Plugin is required");
    }
    if (typeof plugin.name !== "string" || plugin.name.trim().length === 0) {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Plugin name must be a non-empty string",
      );
    }
    if (typeof plugin.install !== "function") {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Plugin install must be a function",
      );
    }
    if (typeof plugin.destroy !== "function") {
      throw new SDKError(
        ErrorCode.INVALID_OPTIONS,
        "Plugin destroy must be a function",
      );
    }
  }
}
