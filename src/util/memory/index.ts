import * as Cesium from "cesium";

import { Logger } from "@/common/Logger";

const logger = new Logger("MemoryUtil");

export const MemoryUtil = {
  /** 尽力清理 Cesium 全局缓存与解码 Worker；单项失败不会中断后续清理。 */
  cleanupCesiumGlobals(): void {
    this.clearRenderStateCache();
    this.clearRequestScheduler();
    this.clearResourceCache();
    this.destroyDecoderWorkers();
    logger.info("Cesium global caches cleaned up");
  },

  /** 尝试清理 Cesium RenderState 缓存。 */
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

  /** 尝试清理 Cesium RequestScheduler 的内部状态。 */
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

  /** 尝试销毁并移除 Cesium ResourceCache 中的缓存项。 */
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

  /** 尝试销毁 Draco 与 KTX2 解码任务处理器。 */
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

  /** 尝试通过 WEBGL_lose_context 扩展主动释放场景的 WebGL 上下文。 */
  loseWebGLContext(scene: Cesium.Scene): void {
    try {
      const ctx = (scene as unknown as { context: { _gl: WebGLRenderingContext } }).context;
      const ext = ctx._gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    } catch {
      logger.warn("Failed to lose WebGL context");
    }
  },
};
