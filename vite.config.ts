import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 200000,
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'node',
  },
} as any);
