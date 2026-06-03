import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'terser';

const bundles = [
  { file: 'dist/cesium-sdk.es.js', module: true },
  { file: 'dist/cesium-sdk.cjs', module: false },
];

for (const { file, module } of bundles) {
  const code = await readFile(file, 'utf8');
  const result = await minify(code, {
    module,
    toplevel: true,
    compress: {
      drop_console: true,
      drop_debugger: true,
      passes: 2,
    },
    mangle: {
      toplevel: true,
      keep_classnames: false,
      keep_fnames: false,
    },
    format: {
      comments: false,
    },
  });

  if (!result.code) {
    throw new Error(`Failed to minify ${file}`);
  }

  await writeFile(file, result.code, 'utf8');
}
