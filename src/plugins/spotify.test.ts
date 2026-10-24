import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Lcu } from '../lcu';
import { DEFAULT_PREFS, prefs } from '../shell/prefs';
import { fakeLcu, ready } from '../test/fixtures';
import { api, challengeOf, disconnectSpotify, randomString, readCallback, redirectFor, spotifyConfig, spotifyTrack, startSpotify, statusText, trackOf, type SpotifyTrack } from './spotify';

let calls: Array<[string, string, unknown]>;
let stop: (() => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  prefs.value = DEFAULT_PREFS;
  disconnectSpotify();
});

afterEach(() => {
  stop?.();
  stop = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('PKCE: desafio S256 em base64url sem preenchimento (conferido com o node:crypto)', async () => {
  const v = randomString();
  expect(await challengeOf(v)).toBe(createHash('sha256').update(v).digest('base64url'));
  expect(v).toMatch(/^[\w-]{64}$/);
});

test('redirecionamento: loopback sem porta ganha a porta da página; o resto fica igual', () => {
  expect(redirectFor('https://127.0.0.1/rlc-spotify', 'https://127.0.0.1:54151')).toBe('https://127.0.0.1:54151/rlc-spotify');
  expect(redirectFor('http://127.0.0.1/cb', 'https://127.0.0.1:54151')).toBe('http://127.0.0.1/cb');
  expect(redirectFor('http://127.0.0.1:8888/cb', 'https://127.0.0.1:54151')).toBe('http://127.0.0.1:8888/cb');
});

test('volta do login: código só com o state certo; erro do Spotify passa', () => {
  expect(readCallback('https://127.0.0.1:5/rlc-spotify?code=abc&state=s1', 's1')).toEqual({ code: 'abc' });
  expect(readCallback('https://127.0.0.1:5/rlc-spotify?code=abc&state=outro', 's1')).toBeNull();
  expect(readCallback('https://127.0.0.1:5/rlc-spotify?error=access_denied&state=s1', 's1')).toEqual({ error: 'access_denied' });
  expect(readCallback('lixo', 's1')).toBeNull();
});

test('faixa: artistas juntos, capa pequena nítida, volume só se o dispositivo deixa', () => {
  const t = trackOf(
    {
      is_playing: true,
      progress_ms: 1000,
      device: { volume_percent: 40, supports_volume: true },
      item: { name: 'Song', duration_ms: 200000, artists: [{ name: 'A' }, { name: 'B' }], album: { name: 'Al', images: [{ url: 'big', width: 640 }, { url: 'mid', width: 300 }, { url: 'tiny', width: 64 }] } },
    },
    7,
  );
  expect(t).toEqual({ name: 'Song', artists: 'A, B', album: 'Al', art: 'tiny', playing: true, progressMs: 1000, durationMs: 200000, volume: 40, at: 7 });
  expect(trackOf({ item: null })).toBeNull();
  expect(trackOf({ item: { name: 'x' }, device: { supports_volume: false, volume_percent: 10 } })?.volume).toBeNull();
});

test('api: 401 renova o token e repete; 429 espera o Retry-After', async () => {
  spotifyConfig.value = { clientId: 'cid', refresh: 'r1' };
  let player = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/api/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
      player++;
      if (player === 1) return new Response('', { status: 401 });
      if (player === 3) return new Response('', { status: 429, headers: { 'Retry-After': '10' } });
      return new Response('{}', { status: 200 });
    }),
  );
  const tokens = () => vi.mocked(fetch).mock.calls.filter(([u]) => String(u).endsWith('/api/token')).length;
  expect((await api('GET', '/me/player', () => 0))?.status).toBe(200);
  expect(tokens()).toBe(2);
  expect(await api('GET', '/me/player', () => 0)).toBeNull();
  // Esperando: nem chama a rede.
  expect(await api('GET', '/me/player', () => 9000)).toBeNull();
  expect(player).toBe(3);
  expect((await api('GET', '/me/player', () => 10000))?.status).toBe(200);
});

test('recado do chat: põe a música e volta o recado anterior ao desligar', () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([init?.method ?? 'GET', url, init?.body ? JSON.parse(String(init.body)) : undefined]);
      return new Response('', { status: 200 });
    }),
  );
  const lcu = fakeLcu();
  lcu.chatMe.value = ready({ statusMessage: 'gg' }) as Lcu['chatMe']['value'];
  prefs.value = { ...DEFAULT_PREFS, spotify: true, spotifyStatus: true };
  stop = startSpotify(lcu);
  spotifyConfig.value = { clientId: 'cid', refresh: 'r1' };
  const track: SpotifyTrack = { name: 'Song', artists: 'A', album: '', art: null, playing: true, progressMs: 0, durationMs: 1, volume: null, at: 0 };
  spotifyTrack.value = track;
  const chat = () => calls.filter(([, u]) => u === '/lol-chat/v1/me').map(([, , b]) => b);
  expect(chat()).toEqual([{ statusMessage: statusText(track) }]);
  expect(spotifyConfig.value.prevStatus).toBe('gg');
  lcu.chatMe.value = ready({ statusMessage: statusText(track) }) as Lcu['chatMe']['value'];
  expect(chat()).toHaveLength(1);
  prefs.value = { ...prefs.value, spotifyStatus: false };
  expect(chat()).toEqual([{ statusMessage: statusText(track) }, { statusMessage: 'gg' }]);
  expect(spotifyConfig.value.prevStatus).toBeUndefined();
});
