import * as Cesium from "cesium";
import { Logger } from "../common/Logger";

const logger = new Logger("MemoryUtil");

// 内部 Cesium API 类型断言辅助
type AnyCesium = Record<string, unknown>;

/**
 * Cesium 全局静态资源清理
 * 基于 Cesium 1.136.0 内存泄漏分析
 */
export const MemoryUtil = {
  /** 清理所有可清理的全局静态缓存 */
  cleanupCesiumGlobals(): void {
    this.clearRenderStateCache();
    this.clearRequestScheduler();
    this.clearResourceCache();
    this.destroyDecoderWorkers();
    logger.info("Cesium global caches cleaned up");
  },

  /** 清理 RenderState 缓存 */
  clearRenderStateCache(): void {
    try {
      const RS = Cesium as unknown as {
        RenderState?: { clearCache?: () => void };
      };
      RS.RenderState?.clearCache?.();
    } catch {
      logger.warn("Failed to clear RenderState cache");
    }
  },

  /** 清理 RequestScheduler 状态 */
  clearRequestScheduler(): void {
    try {
      const RS = Cesium as unknown as {
        RequestScheduler?: { clearForSpecs?: () => void };
      };
      RS.RequestScheduler?.clearForSpecs?.();
    } catch {
      logger.warn("Failed to clear RequestScheduler");
    }
  },

  /** 清理 ResourceCache */
  clearResourceCache(): void {
    try {
      const RC = Cesium as unknown as {
        ResourceCache?: { cacheEntries?: Map<string, { destroy: () => void }> };
      };
      const cache = RC.ResourceCache?.cacheEntries;
      if (cache) {
        for (const [key, entry] of cache) {
          try {
            entry.destroy();
          } catch {
            // ignore individual entry failures
          }
          cache.delete(key);
        }
      }
    } catch {
      logger.warn("Failed to clear ResourceCache");
    }
  },

  /** 销毁解码 Worker */
  destroyDecoderWorkers(): void {
    try {
      const DL = Cesium as unknown as {
        DracoLoader?: { _decoderTaskProcessor?: { destroy: () => void } };
      };
      DL.DracoLoader?._decoderTaskProcessor?.destroy();
    } catch {
      // ignore
    }
    try {
      const KT = Cesium as unknown as {
        KTX2Transcoder?: { _transcodeTaskProcessor?: { destroy: () => void } };
      };
      KT.KTX2Transcoder?._transcodeTaskProcessor?.destroy();
    } catch {
      // ignore
    }
  },

  /** 丢失 WebGL 上下文（可选的彻底清理） */
  loseWebGLContext(scene: Cesium.Scene): void {
    try {
      const ctx = (
        scene as unknown as { context: { _gl: WebGLRenderingContext } }
      ).context;
      const ext = ctx._gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    } catch {
      logger.warn("Failed to lose WebGL context");
    }
  },
};
