import { afterEach, expect, test, vi } from 'vitest';
import { getMedia, PERSIST_BYTES, putMedia } from './background';

afterEach(() => vi.unstubAllGlobals());

function fakeStore() {
  const m = new Map<string, unknown>();
  return { has: (k: string) => m.has(k), get: (k: string) => m.get(k), set: (k: string, v: unknown) => void m.set(k, v), remove: (k: string) => void m.delete(k), m };
}

test('fundo sobrevive à troca de origem: cópia no DataStore volta quando o IndexedDB está vazio', async () => {
  const store = fakeStore();
  window.DataStore = store;
  // jsdom sem IndexedDB: só a cópia do DataStore guarda.
  expect(await putMedia('bg-1', new Blob(['oi'], { type: 'image/png' }))).toBe('kept');
  const back = await getMedia('bg-1');
  expect(back?.type).toBe('image/png');
  expect(await back!.text()).toBe('oi');
  delete window.DataStore;
});

test('arquivo maior que o teto da cópia não vai para o DataStore', async () => {
  const store = fakeStore();
  window.DataStore = store;
  const big = new Blob([new Uint8Array(PERSIST_BYTES + 1)], { type: 'video/webm' });
  expect(await putMedia('bg-2', big)).toBe(false);
  expect(store.m.size).toBe(0);
  delete window.DataStore;
});
