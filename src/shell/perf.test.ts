import { signal } from '@preact/signals';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { freezeRiot, isLite, liteAuto, measureFps, probeLite, readPotato, weakHardware, writePotato } from './perf';

let riot: HTMLElement;
let ours: HTMLElement;

/** Vídeo do jsdom com play/pause de verdade no estado `paused` e o evento `play`. */
function video(playing: boolean, parent: HTMLElement = riot): HTMLVideoElement {
  const v = document.createElement('video');
  let paused = !playing;
  Object.defineProperty(v, 'paused', { get: () => paused });
  v.pause = vi.fn(() => void (paused = true));
  v.play = vi.fn(() => {
    paused = false;
    v.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  parent.append(v);
  return v;
}
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  riot = document.body.appendChild(document.createElement('section'));
  ours = document.body.appendChild(document.createElement('div'));
  liteAuto.value = false;
});
afterEach(() => {
  riot.remove();
  ours.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('congela: pausa só os vídeos da Riot que tocavam e retoma só esses', () => {
  const a = video(true);
  const b = video(false);
  const mine = video(true, ours);
  const stop = freezeRiot(riot, ours);
  expect(riot.dataset.rlcFrozen).toBe('');
  expect(a.paused).toBe(true);
  expect(b.pause).not.toHaveBeenCalled();
  expect(mine.paused).toBe(false);
  stop();
  expect(riot.dataset.rlcFrozen).toBeUndefined();
  expect(a.paused).toBe(false);
  expect(b.play).not.toHaveBeenCalled();
});

test('vídeo da Riot que começa a tocar depois também é pausado', () => {
  const stop = freezeRiot(riot, ours);
  const late = video(false);
  void late.play();
  expect(late.paused).toBe(true);
  stop();
  expect(late.paused).toBe(false);
});

test('com a página da Riot aberta pela nossa loja, a Riot volta a renderizar', async () => {
  const a = video(true);
  const stop = freezeRiot(riot, ours);
  const frame = ours.appendChild(document.createElement('div'));
  frame.className = 'rlc-sto-riot';
  await flush();
  expect(riot.dataset.rlcFrozen).toBeUndefined();
  expect(a.paused).toBe(false);
  frame.remove();
  await flush();
  expect(riot.dataset.rlcFrozen).toBe('');
  expect(a.paused).toBe(true);
  stop();
});

test('modo leve: on/off fixam, auto segue a detecção', () => {
  expect(isLite('on', false)).toBe(true);
  expect(isLite('off', true)).toBe(false);
  expect(isLite('auto', false)).toBe(false);
  expect(isLite('auto', true)).toBe(true);
});

test('hardware fraco: até 4 núcleos ou até 4 GB', () => {
  expect(weakHardware({ hardwareConcurrency: 4 })).toBe(true);
  expect(weakHardware({ hardwareConcurrency: 12, deviceMemory: 4 })).toBe(true);
  expect(weakHardware({ hardwareConcurrency: 12, deviceMemory: 8 })).toBe(false);
});

test('auto: hardware fraco liga sem medir', () => {
  const measure = vi.fn(async () => 60);
  probeLite(signal(true), { hardwareConcurrency: 2 }, measure);
  expect(liteAuto.value).toBe(true);
  expect(measure).not.toHaveBeenCalled();
});

test('auto: mede uma vez só com foco; abaixo de 40 quadros liga', async () => {
  const focused = signal(false);
  const measure = vi.fn(async () => 30);
  probeLite(focused, { hardwareConcurrency: 12, deviceMemory: 8 }, measure);
  expect(measure).not.toHaveBeenCalled();
  focused.value = true;
  await flush();
  expect(measure).toHaveBeenCalledTimes(1);
  expect(liteAuto.value).toBe(true);
  focused.value = false;
  focused.value = true;
  await flush();
  expect(measure).toHaveBeenCalledTimes(1);
});

test('auto: quadros suficientes deixam desligado', async () => {
  probeLite(signal(true), { hardwareConcurrency: 12, deviceMemory: 8 }, async () => 60);
  await flush();
  expect(liteAuto.value).toBe(false);
});

test('measureFps conta quadros no intervalo', async () => {
  let t = 0;
  const fps = await measureFps(1000, (fn) => setTimeout(() => ((t += 20), fn()), 0), () => t);
  expect(Math.round(fps)).toBe(50);
});

test('modo de baixo consumo da Riot: lê e grava como o client oficial', async () => {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ data: { potatoModeEnabled: true }, schemaVersion: 3 }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  expect(await readPotato()).toBe(true);
  expect(fetchMock).toHaveBeenLastCalledWith('/lol-settings/v1/local/lol-user-experience');
  await writePotato(false);
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  expect(url).toBe('/lol-settings/v1/local/lol-user-experience');
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ schemaVersion: 3, data: { potatoModeEnabled: false } });
});

test('modo de baixo consumo: sem o campo conta como desligado; falha da LCU é null', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: {}, schemaVersion: 3 }), { status: 200 })));
  expect(await readPotato()).toBe(false);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
  expect(await readPotato()).toBe(null);
});
