import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
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
      fileName: (format) =>
        format === "es" ? "cesium-sdk.es.js" : "cesium-sdk.cjs",
    },
    rollupOptions: {
      external: ["cesium"],
      output: {
        globals: {
          cesium: "Cesium",
        },
      },
    },
    // sourcemap: true,
    minify: "esbuild",
  },
});
