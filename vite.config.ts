import { defineConfig } from 'vite';

export default defineConfig({
  // Keep local/offline usage unchanged; Pages sets its repository subpath in CI.
  base: process.env.VITE_BASE_PATH || './',
  build: { target: 'es2020', assetsInlineLimit: 8192 },
});
