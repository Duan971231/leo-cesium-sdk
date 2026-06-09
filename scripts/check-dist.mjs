import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const allowConsole = process.argv.includes('--allow-console');

const requiredFiles = [
  'dist/cesium-sdk.es.js',
  'dist/cesium-sdk.cjs',
  'dist/index.d.ts',
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    failures.push(`Missing required build output: ${file}`);
  }
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const declaredEntries = [
  packageJson.main,
  packageJson.module,
  packageJson.types,
  packageJson.exports?.['.']?.import,
  packageJson.exports?.['.']?.require,
  packageJson.exports?.['.']?.types,
].filter(Boolean);

for (const entry of declaredEntries) {
  const normalized = String(entry).replace(/^\.\//, '');
  if (!existsSync(normalized)) {
    failures.push(`Declared package entry does not exist: ${entry}`);
  }
}

for (const bundle of ['dist/cesium-sdk.es.js', 'dist/cesium-sdk.cjs']) {
  if (!existsSync(bundle)) continue;
  const content = await readFile(bundle, 'utf8');
  if (!content.includes('cesium')) {
    failures.push(`Bundle does not reference external cesium import: ${bundle}`);
  }
  if (content.includes('class Viewer') && content.includes('class Cartesian3')) {
    failures.push(`Bundle may contain Cesium implementation code: ${bundle}`);
  }
  if (!allowConsole && /\bconsole\./.test(content)) {
    failures.push(`Bundle contains console calls: ${bundle}`);
  }
  if (/\bdebugger\b/.test(content)) {
    failures.push(`Bundle contains debugger statements: ${bundle}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exitCode = 1;
}
