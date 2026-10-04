import { cpSync } from 'node:fs';
import { join } from 'node:path';
import preact from '@preact/preset-vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const MOCK = 'http://127.0.0.1:47616';

// No modo `client` (npm run dev:client) cada build é copiado para a pasta de plugins do Pengu.
function copyToPengu(enabled: boolean): Plugin {
  return {
    name: 'rlc-copy-to-pengu',
    closeBundle() {
      if (!enabled) return;
      const target = join(process.env.PENGU_DIR ?? 'C:\\Program Files\\Pengu Loader', 'plugins', 'ReimaginedLC');
      cpSync('dist/ReimaginedLC', target, { recursive: true });
      console.log(`copiado para ${target}`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [preact(), copyToPengu(mode === 'client')],
  build: {
    target: 'chrome108',
    outDir: 'dist/ReimaginedLC',
    emptyOutDir: true,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
  },
  server: {
    proxy: Object.fromEntries(
      ['/lol-', '/system', '/riotclient', '/fe'].map((prefix) => [prefix, { target: MOCK, changeOrigin: true }]),
    ),
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
}));
