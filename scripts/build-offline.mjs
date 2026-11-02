import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// A single classic script has no module imports and works directly under file://.
const { build } = await import('vite');
const result = await build({
  configFile: false,
  // The cinematic scene's public assets must resolve beside the generated HTML under file://.
  base: './',
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    write: false,
    minify: true,
    lib: { entry: resolve('src/main.tsx'), name: 'Evergreen', formats: ['iife'] },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const bundle = Array.isArray(result) ? result[0] : result;
const js = bundle.output.find(file => file.type === 'chunk').code;
const css = bundle.output.filter(file => file.type === 'asset' && file.fileName.endsWith('.css')).map(file => file.source).join('\n');
let html = await readFile('index.html', 'utf8');
html = html.replace(/<link rel="icon"[^>]+>/, '')
  .replace('</head>', () => `<style>${css}</style></head>`)
  .replace(/<script type="module"[^>]+><\/script>/, () => `<script>${js.replaceAll('</script', '<\\/script')}</script>`);
await writeFile('dist/离线阅读.html', html);
await copyFile('CASE_MATERIALS.md', 'dist/CASE_MATERIALS.md');
console.log('Offline edition: dist/离线阅读.html (double-click to open)');
