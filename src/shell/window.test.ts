import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { resetHelper } from '../theme/wallpapers';
import { shown as enabled } from './layer';
import { DEFAULT_PREFS, prefs } from './prefs';
import { canMaximize, isMaximized, riotSize, SETTLE_MS, startWindow, toggleMaximize } from './window';

const BASE = 'http://127.0.0.1:38611';
let calls: string[] = [];
let urls: string[] = [];
let stop: () => void = () => {};
const settle = () => new Promise((r) => setTimeout(r, 0));
async function flush() {
  for (let i = 0; i < 6; i++) await settle();
}

beforeEach(() => {
  calls = [];
  urls = [];
  resetHelper();
  isMaximized.value = false;
  prefs.value = { ...DEFAULT_PREFS };
  enabled.value = true;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (url === `${BASE}/v1/status`) return new Response(JSON.stringify({ app: 'reimaginedlc-fundos', version: '2' }));
    if (url === `${BASE}/v1/token`) return new Response(JSON.stringify({ token: 'b'.repeat(64) }));
    if (url.startsWith(`${BASE}/v1/window/`) && init?.method === 'POST') {
      urls.push(url);
      calls.push(url.slice(BASE.length).split('?')[0]!);
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

describe('tela cheia', () => {
  let full: Element | null = null;
  const exit = vi.fn(async () => {});
  const leave = () => {
    full = null;
    document.dispatchEvent(new Event('fullscreenchange'));
  };
  beforeEach(() => {
    full = null;
    exit.mockReset();
    exit.mockImplementation(async () => {});
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => full });
    document.exitFullscreen = exit as never;
  });
  afterEach(() => {
    full = null;
  });

  test('trocar para a Riot em tela cheia: só devolve o tamanho depois que a tela cheia saiu e assentou', async () => {
    prefs.value = { ...DEFAULT_PREFS, maximized: true };
    stop = startWindow();
    await flush();
    expect(calls).toEqual(['/v1/window/maximize']);
    full = document.documentElement;
    enabled.value = false;
    await flush();
    // Ainda em tela cheia: mexer na janela agora seria desfeito pelo Chromium (ou travaria tudo).
    expect(calls).toEqual(['/v1/window/maximize']);
    leave();
    await flush();
    expect(calls).toEqual(['/v1/window/maximize']);
    await new Promise((r) => setTimeout(r, SETTLE_MS + 50));
    await flush();
    expect(calls.at(-1)).toBe('/v1/window/restore');
    expect(isMaximized.value).toBe(false);
  });

  test('a tela cheia não sai: não mexe na janela', async () => {
    vi.useFakeTimers();
    try {
      isMaximized.value = true;
      prefs.value = { ...DEFAULT_PREFS, maximized: true };
      full = document.documentElement;
      enabled.value = false;
      stop = startWindow();
      await vi.advanceTimersByTimeAsync(5000);
      expect(calls).not.toContain('/v1/window/restore');
      expect(isMaximized.value).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  test('botão de maximizar em tela cheia: sai dela e maximiza', async () => {
    stop = startWindow();
    await flush();
    full = document.documentElement;
    exit.mockImplementation(async () => leave());
    toggleMaximize();
    await new Promise((r) => setTimeout(r, SETTLE_MS + 50));
    await flush();
    expect(exit).toHaveBeenCalled();
    expect(calls).toEqual(['/v1/window/maximize']);
  });

  test('preferência lembrada não tira da tela cheia (mudar outra preferência reavalia o efeito)', async () => {
    full = document.documentElement;
    prefs.value = { ...DEFAULT_PREFS, maximized: true };
    stop = startWindow();
    await flush();
    prefs.value = { ...prefs.value, video: !prefs.value.video };
    await flush();
    expect(exit).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});

test('restaurar manda o tamanho da janela da Riot (para quando o auxiliar perdeu o de antes)', async () => {
  document.documentElement.style.setProperty('zoom', '1.25');
  try {
    expect(riotSize()).toEqual([1600, 900]);
    stop = startWindow();
    await flush();
    toggleMaximize();
    await flush();
    toggleMaximize();
    await flush();
    expect(urls.at(-1)).toBe(`${BASE}/v1/window/restore?w=1600&h=900`);
  } finally {
    document.documentElement.style.removeProperty('zoom');
  }
});
