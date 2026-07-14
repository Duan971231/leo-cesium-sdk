import bundledWorkerUrl from "./hex-renderer?worker&url";
import type { HexWorkerFactory } from "../types/public";

const DEFAULT_WORKER_PATH = "blitz_workers/hex-renderer.js";

const isSourceWorkerUrl = (url: string): boolean => url.includes("worker_file&type=");

/**
 * 创建 HexRenderer 使用的 module Worker。
 *
 * SDK 源码开发时直接使用 Vite 提供的 Worker URL；发布产物默认从页面基址下的
 * `blitz_workers/hex-renderer.js` 加载，宿主也可以传入构建工具生成的完整 URL。
 */
export const createHexWorker = (workerUrl?: string | URL, workerFactory?: HexWorkerFactory): Worker => {
  if (workerFactory) return workerFactory();

  const resolvedUrl =
    workerUrl ??
    (isSourceWorkerUrl(bundledWorkerUrl) ? bundledWorkerUrl : new URL(DEFAULT_WORKER_PATH, document.baseURI));

  return new Worker(resolvedUrl, {
    name: "HexRenderer",
    type: "module",
  });
};
