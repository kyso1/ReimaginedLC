import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { resetHelper } from '../theme/wallpapers';
import { enabled } from './layer';
import { DEFAULT_PREFS, prefs } from './prefs';
import { canMaximize, isMaximized, startWindow, toggleMaximize } from './window';

const BASE = 'http://127.0.0.1:38611';
let calls: string[] = [];
let stop: () => void = () => {};
const settle = () => new Promise((r) => setTimeout(r, 0));
async function flush() {
  for (let i = 0; i < 6; i++) await settle();
}

beforeEach(() => {
  calls = [];
  resetHelper();
  isMaximized.value = false;
  prefs.value = { ...DEFAULT_PREFS };
  enabled.value = true;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (url === `${BASE}/v1/status`) return new Response(JSON.stringify({ app: 'reimaginedlc-fundos', version: '2' }));
    if (url === `${BASE}/v1/token`) return new Response(JSON.stringify({ token: 'b'.repeat(64) }));
    if (url.startsWith(`${BASE}/v1/window/`) && init?.method === 'POST') {
      calls.push(url.slice(BASE.length));
      return new Response(JSON.stringify({ ok: true }));
    }
    throw new TypeError('recusado');
  });
});
afterEach(() => {
  stop();
  vi.unstubAllGlobals();
  prefs.value = { ...DEFAULT_PREFS };
});

test('com o auxiliar v2: botão disponível; maximizar guarda a escolha e restaurar volta', async () => {
  stop = startWindow();
  await flush();
  expect(canMaximize.value).toBe(true);
  toggleMaximize();
  await flush();
  expect(prefs.value.maximized).toBe(true);
  expect(isMaximized.value).toBe(true);
  expect(calls).toContain('/v1/window/maximize');
  toggleMaximize();
  await flush();
  expect(prefs.value.maximized).toBe(false);
  expect(calls.at(-1)).toBe('/v1/window/restore');
});

test('lembrada: maximiza sozinha ao abrir; trocar para a Riot devolve o tamanho e voltar maximiza de novo', async () => {
  prefs.value = { ...DEFAULT_PREFS, maximized: true };
  stop = startWindow();
  await flush();
  expect(calls).toEqual(['/v1/window/maximize']);
  enabled.value = false;
  await flush();
  expect(calls.at(-1)).toBe('/v1/window/restore');
  expect(prefs.value.maximized).toBe(true);
  enabled.value = true;
  await flush();
  expect(calls.at(-1)).toBe('/v1/window/maximize');
});
