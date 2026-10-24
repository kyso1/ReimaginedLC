import { cpSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import preact from '@preact/preset-vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

const MOCK = 'http://127.0.0.1:47616';

// No modo `client` (npm run dev:client) cada build é copiado para a pasta de plugins do Pengu.
function copyToPengu(enabled: boolean): Plugin {
  return {
    name: 'rlc-copy-to-pengu',
    closeBundle() {
      if (!enabled) return;
      const target = join(process.env.PENGU_DIR ?? 'C:\\Program Files\\Pengu Loader', 'plugins', 'ReimaginedLC');
      // Chunks têm hash no nome: os do build anterior saem antes da cópia para não se acumular na pasta do plugin.
      try {
        for (const f of readdirSync(target)) if (f.endsWith('.js')) rmSync(join(target, f));
      } catch {}
      cpSync('dist/ReimaginedLC', target, { recursive: true });
      console.log(`copiado para ${target}`);
    },
  };
}

type Ctx = { getModuleInfo(id: string): { importedIds: readonly string[] } | null };
let reach: Set<string> | null = null;
/** Módulos alcançáveis do src/index.ts só por import estático (o que a abertura carrega de qualquer jeito). */
function fromEntry(ctx: Ctx): Set<string> {
  if (reach) return reach;
  const entry = resolve('src/index.ts');
  const start = [entry, entry.replaceAll('\\', '/')].find((id) => ctx.getModuleInfo(id));
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const dep of ctx.getModuleInfo(id)?.importedIds ?? []) walk(dep);
  };
  if (start) walk(start);
  return (reach = seen);
}

export default defineConfig(({ mode }) => ({
  plugins: [preact(), copyToPengu(mode === 'client')],
  define: { __RLC_VERSION__: JSON.stringify(pkg.version) },
  build: {
    target: 'chrome108',
    outDir: 'dist/ReimaginedLC',
    emptyOutDir: true,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
    // Modo lib deixa ES sem minificar (build.minify é ignorado): minifica direto no Rolldown.
    rolldownOptions: {
      output: {
        minify: true,
        // Tudo que a abertura usa num chunk só (`core`); as telas sob demanda ficam em chunks próprios.
        codeSplitting: { groups: [{ debugName: 'core', name: (id, ctx) => (fromEntry(ctx).has(id) ? 'core' : null) }] },
      },
    },
  },
  server: {
    proxy: Object.fromEntries(
      ['/lol-', '/system', '/riotclient', '/fe'].map((prefix) => [prefix, { target: MOCK, changeOrigin: true }]),
    ),
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
}));
