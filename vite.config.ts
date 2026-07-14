import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  base: "./",
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        entryFileNames: "blitz_workers/[name].js",
        chunkFileNames: "blitz_workers/chunks/[name]-[hash].js",
        assetFileNames: "blitz_workers/assets/[name]-[hash][extname]",
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "CesiumSDK",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "cesium-sdk.es.js" : "cesium-sdk.cjs"),
    },
    rollupOptions: {
      external: ["cesium"],
      output: {
        globals: {
          cesium: "Cesium",
        },
      },
    },
    minify: mode === "package" ? false : "esbuild",
  },
}));
