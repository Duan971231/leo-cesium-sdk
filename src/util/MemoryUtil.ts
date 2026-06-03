import * as Cesium from "cesium";
import { Logger } from "../common/Logger";

const logger = new Logger("MemoryUtil");

type AnyCesium = Record<string, unknown>;

export const MemoryUtil = {
  cleanupCesiumGlobals(): void {
    this.clearRenderStateCache();
    this.clearRequestScheduler();
    this.clearResourceCache();
    this.destroyDecoderWorkers();
    logger.info("Cesium global caches cleaned up");
  },

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
