import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RESIZE_SETTLE_MS, startFullscreen, toggleFullscreen } from './fullscreen';
import { shown as enabled } from './layer';
import { DEFAULT_PREFS, prefs } from './prefs';

let full: Element | null = null;
let stop: () => void = () => {};
const req = vi.fn(async () => {
  full = document.documentElement;
  document.dispatchEvent(new Event('fullscreenchange'));
});
const exit = vi.fn(async () => {
  full = null;
  document.dispatchEvent(new Event('fullscreenchange'));
});

beforeEach(() => {
  full = null;
  req.mockClear();
  exit.mockClear();
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => full });
  document.documentElement.requestFullscreen = req as never;
  document.exitFullscreen = exit as never;
  prefs.value = { ...DEFAULT_PREFS, fullscreen: true };
  enabled.value = true;
});
afterEach(() => {
  stop();
  prefs.value = { ...DEFAULT_PREFS };
});

const settle = () => new Promise((r) => setTimeout(r, 0));
const click = () => document.dispatchEvent(new Event('pointerdown'));

test('lembrada: entra no primeiro clique (o gesto que o Chromium exige), não antes', async () => {
  prefs.value = { ...prefs.value, fullscreenOn: true };
  stop = startFullscreen();
  expect(req).not.toHaveBeenCalled();
  click();
  await settle();
  expect(req).toHaveBeenCalledTimes(1);
  click();
  expect(req).toHaveBeenCalledTimes(1);
});

test('trocar para o client da Riot sai da tela cheia sem esquecer; voltar entra de novo no próximo gesto', async () => {
  stop = startFullscreen();
  toggleFullscreen();
  await settle();
  expect(full).not.toBeNull();
  expect(prefs.value.fullscreenOn).toBe(true);
  enabled.value = false;
  await settle();
  expect(exit).toHaveBeenCalled();
  expect(prefs.value.fullscreenOn).toBe(true);
  enabled.value = true;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F12' }));
  await settle();
  expect(full).not.toBeNull();
});

test('sair pelo botão (ou Esc) desliga de vez; opção desligada não arma nada', async () => {
  stop = startFullscreen();
  toggleFullscreen();
  await settle();
  toggleFullscreen();
  await settle();
  expect(prefs.value.fullscreenOn).toBe(false);
  click();
  await settle();
  expect(req).toHaveBeenCalledTimes(1);
  prefs.value = { ...prefs.value, fullscreen: false, fullscreenOn: true };
  click();
  await settle();
  expect(req).toHaveBeenCalledTimes(1);
});

test('evento sem ativação do usuário (o próprio atalho simulado, por exemplo) não gasta a espera pelo gesto', async () => {
  prefs.value = { ...prefs.value, fullscreenOn: true };
  const act = { isActive: false };
  Object.defineProperty(navigator, 'userActivation', { configurable: true, get: () => act });
  stop = startFullscreen();
  click();
  await settle();
  expect(req).not.toHaveBeenCalled();
  act.isActive = true;
  click();
  await settle();
  expect(req).toHaveBeenCalledTimes(1);
  delete (navigator as { userActivation?: unknown }).userActivation;
});

test('janela encolhida ainda em tela cheia (estado que travava tudo): sai sem esquecer e volta no próximo clique', async () => {
  vi.useFakeTimers();
  const size = (w: number, h: number) => {
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: w });
    Object.defineProperty(window, 'outerHeight', { configurable: true, value: h });
  };
  // O client informa como "tela" o tamanho da própria janela: não dá para comparar com `screen`.
  Object.defineProperty(window.screen, 'width', { configurable: true, get: () => window.outerWidth });
  Object.defineProperty(window.screen, 'height', { configurable: true, get: () => window.outerHeight });
  try {
    size(1600, 900);
    stop = startFullscreen();
    toggleFullscreen();
    await vi.advanceTimersByTimeAsync(0);
    // Entrando: a janela cresce em passos; só o tamanho final conta.
    window.dispatchEvent(new Event('resize'));
    size(1920, 1080);
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(RESIZE_SETTLE_MS + 50);
    expect(exit).not.toHaveBeenCalled();
    // Alguém devolveu a janela a 1600x900 com ela em tela cheia.
    size(1600, 900);
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(RESIZE_SETTLE_MS + 50);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(full).toBeNull();
    expect(prefs.value.fullscreenOn).toBe(true);
    click();
    await vi.advanceTimersByTimeAsync(0);
    expect(req).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});
