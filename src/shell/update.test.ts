import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { checkForUpdate, isNewer, RELEASES_API, update } from './update';

const store = new Map<string, unknown>();
const DAY = 24 * 60 * 60 * 1000;
const release = (tag: string) => new Response(JSON.stringify({ tag_name: tag, html_url: `https://github.com/x/releases/tag/${tag}` }), { status: 200 });

beforeEach(() => {
  setLocale('pt_BR');
  store.clear();
  update.value = null;
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: (k) => void store.delete(k) };
  window.Toast = { success: vi.fn(), error: vi.fn() };
});
afterEach(() => {
  delete window.DataStore;
  delete window.Toast;
});

test('isNewer compara versões semânticas, com ou sem "v"', () => {
  expect(isNewer('0.1.0', 'v0.2.0')).toBe(true);
  expect(isNewer('0.2.0', 'v0.2.0')).toBe(false);
  expect(isNewer('0.10.0', 'v0.9.1')).toBe(false);
  expect(isNewer('1.0.0', '1.0.1')).toBe(true);
  expect(isNewer('0.1.0', 'lixo')).toBe(false);
  expect(isNewer('0.1.0', 'v0.2.0-beta.1')).toBe(false);
});

test('versão nova: avisa uma vez e guarda o resultado; no mesmo dia não consulta de novo', async () => {
  const fetcher = vi.fn(async () => release('v0.2.0'));
  await checkForUpdate('0.1.0', 1000, fetcher);
  expect(fetcher).toHaveBeenCalledWith(RELEASES_API);
  expect(update.value).toEqual({ version: '0.2.0', url: 'https://github.com/x/releases/tag/v0.2.0' });
  expect(window.Toast!.success).toHaveBeenCalledTimes(1);
  update.value = null;
  await checkForUpdate('0.1.0', 1000 + DAY / 2, fetcher);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(update.peek()?.version).toBe('0.2.0');
  expect(window.Toast!.success).toHaveBeenCalledTimes(1);
  await checkForUpdate('0.1.0', 1000 + DAY + 1, fetcher);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(window.Toast!.success).toHaveBeenCalledTimes(1);
});

test('sem versão nova, falha de rede ou resposta estranha: nada aparece, e só tenta de novo no dia seguinte', async () => {
  await checkForUpdate('0.2.0', 1000, async () => release('v0.2.0'));
  expect(update.value).toBeNull();
  store.clear();
  const failing = vi.fn(async () => {
    throw new Error('offline');
  });
  await checkForUpdate('0.1.0', 1000, failing);
  await checkForUpdate('0.1.0', 2000, failing);
  expect(failing).toHaveBeenCalledTimes(1);
  store.clear();
  await checkForUpdate('0.1.0', 1000, async () => new Response('{"tag_name":42,"html_url":"javascript:alert(1)"}', { status: 200 }));
  expect(update.value).toBeNull();
  store.clear();
  await checkForUpdate('0.1.0', 1000, async () => new Response(JSON.stringify({ tag_name: 'v0.3.0', html_url: 'https://evil.example/x' }), { status: 200 }));
  expect(update.value).toBeNull();
  expect(window.Toast!.success).not.toHaveBeenCalled();
});
