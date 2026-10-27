import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { fakeLcu } from '../test/fixtures';
import { background, DEFAULT_BG } from '../theme/background';
import { resetHelper } from '../theme/wallpapers';
import { DEFAULT_PREFS, prefs } from './prefs';
import { LOCAL_RETRY_MS, useBackground, type CustomBg } from './useBackground';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  resetHelper();
  background.value = DEFAULT_BG;
  prefs.value = { ...DEFAULT_PREFS };
});

function Probe({ out }: { out: (r: CustomBg | null) => void }) {
  out(useBackground(fakeLcu(), 'home'));
  return null;
}

test('fundo do auxiliar que falhou: procura o auxiliar de novo (código novo) e tenta outra vez com URL nova', async () => {
  vi.useFakeTimers();
  let token = 'a'.repeat(64);
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/v1/status')) return new Response(JSON.stringify({ app: 'reimaginedlc-fundos', version: '2' }));
    if (url.endsWith('/v1/token')) return new Response(JSON.stringify({ token }));
    throw new TypeError('recusado');
  });
  prefs.value = { ...DEFAULT_PREFS, wallpapers: true };
  background.value = { ...DEFAULT_BG, global: { kind: 'local', id: 'e0123456789abcdef', mime: 'video/mp4' } };
  let last: CustomBg | null = null;
  const root = document.createElement('div');
  await act(async () => render(<Probe out={(r) => (last = r)} />, root));
  for (let i = 0; i < 5; i++) await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const first = last!.src;
  expect(first).toContain(`k=${token}`);
  // O auxiliar reiniciou: código novo.
  token = 'b'.repeat(64);
  await act(async () => last!.retry!());
  await act(async () => void (await vi.advanceTimersByTimeAsync(LOCAL_RETRY_MS[0]! + 10)));
  for (let i = 0; i < 5; i++) await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(last!.src).not.toBe(first);
  expect(last!.src).toContain(`k=${token}`);
  render(null, root);
});

test('vídeo do Wallpaper Engine leva a prévia; nova tentativa não pisca o fundo do tema', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/v1/status')) return new Response(JSON.stringify({ app: 'reimaginedlc-fundos', version: '2' }));
    if (url.endsWith('/v1/token')) return new Response(JSON.stringify({ token: 'c'.repeat(64) }));
    throw new TypeError('recusado');
  });
  prefs.value = { ...DEFAULT_PREFS, wallpapers: true };
  background.value = { ...DEFAULT_BG, global: { kind: 'local', id: 'e0123456789abcdef', mime: 'video/mp4' } };
  const seen: Array<CustomBg | null> = [];
  const root = document.createElement('div');
  await act(async () => render(<Probe out={(r) => seen.push(r)} />, root));
  for (let i = 0; i < 5; i++) await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const first = seen.at(-1)!;
  expect(first.poster).toContain('/v1/thumb/e0123456789abcdef');
  const from = seen.length;
  await act(async () => first.retry!());
  await act(async () => void (await vi.advanceTimersByTimeAsync(LOCAL_RETRY_MS[0]! + 10)));
  for (let i = 0; i < 5; i++) await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(seen.at(-1)!.src).not.toBe(first.src);
  expect(seen.slice(from)).not.toContain(null);
  render(null, root);
});

test('vídeo da pasta do usuário não tem prévia', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/v1/status')) return new Response(JSON.stringify({ app: 'reimaginedlc-fundos', version: '2' }));
    if (url.endsWith('/v1/token')) return new Response(JSON.stringify({ token: 'c'.repeat(64) }));
    throw new TypeError('recusado');
  });
  prefs.value = { ...DEFAULT_PREFS, wallpapers: true };
  background.value = { ...DEFAULT_BG, global: { kind: 'local', id: 'u0123456789abcdef', mime: 'video/mp4' } };
  let last: CustomBg | null = null;
  const root = document.createElement('div');
  await act(async () => render(<Probe out={(r) => (last = r)} />, root));
  await vi.waitFor(() => expect(last).not.toBeNull());
  expect(last!.poster).toBeUndefined();
  render(null, root);
});
