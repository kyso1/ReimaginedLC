import { defineConfig } from 'vitest/config';

// Carregador: um arquivo só, sem Preact. `npm run build:loader` → dist-loader/ReimaginedLC/index.js.
export default defineConfig({
  build: {
    target: 'chrome108',
    outDir: 'dist-loader/ReimaginedLC',
    emptyOutDir: true,
    lib: { entry: 'loader/index.ts', formats: ['es'], fileName: () => 'index.js' },
  },
  test: { environment: 'node', include: ['loader/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
