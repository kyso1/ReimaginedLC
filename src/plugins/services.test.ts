import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DEFAULT_PREFS, prefs } from '../shell/prefs';
import { fakeLcu, readyCheck, ready } from '../test/fixtures';
import type { Lcu } from '../lcu';
import { chooseAvailability, MIN_GAP_MS, SETTLE_MS, startAppearOffline } from './appearOffline';
import { startAutoAccept } from './autoAccept';

let calls: Array<[string, string, unknown]>;
let stop: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push([init?.method ?? 'GET', url, init?.body ? JSON.parse(String(init.body)) : undefined]);
    return new Response('', { status: 200 });
  }));
  prefs.value = DEFAULT_PREFS;
});

afterEach(() => {
  stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const check = (lcu: Lcu, state: string, playerResponse = 'None') => void (lcu.readyCheck.value = ready(readyCheck({ state, playerResponse } as Parameters<typeof readyCheck>[0])) as Lcu['readyCheck']['value']);
const me = (lcu: Lcu, availability: string) => void (lcu.chatMe.value = ready({ availability }) as Lcu['chatMe']['value']);

test('auto-aceite: desligado não aceita; ligado aceita depois do atraso', () => {
  const lcu = fakeLcu();
  stop = startAutoAccept(lcu);
  check(lcu, 'InProgress');
  vi.advanceTimersByTime(20_000);
  expect(calls).toEqual([]);
  check(lcu, 'Invalid');
  prefs.value = { ...DEFAULT_PREFS, autoAccept: true, acceptDelay: 2 };
  check(lcu, 'InProgress');
  vi.advanceTimersByTime(1999);
  expect(calls).toEqual([]);
  vi.advanceTimersByTime(1);
  expect(calls).toEqual([['POST', '/lol-matchmaking/v1/ready-check/accept', undefined]]);
});

test('auto-aceite: recusado não é aceito de novo; o próximo ready check é', () => {
  const lcu = fakeLcu();
  prefs.value = { ...DEFAULT_PREFS, autoAccept: true, acceptDelay: 3 };
  stop = startAutoAccept(lcu);
  check(lcu, 'InProgress');
  vi.advanceTimersByTime(1000);
  check(lcu, 'InProgress', 'Declined');
  vi.advanceTimersByTime(10_000);
  expect(calls).toEqual([]);
  // A LCU às vezes manda o estado "None" de novo no mesmo ready check: continua sem aceitar.
  check(lcu, 'InProgress');
  vi.advanceTimersByTime(10_000);
  expect(calls).toEqual([]);
  check(lcu, 'Invalid');
  check(lcu, 'InProgress');
  vi.advanceTimersByTime(3000);
  expect(calls).toHaveLength(1);
});

test('aparecer offline: reafirma quando a LCU troca o status, sem laço', () => {
  const lcu = fakeLcu();
  me(lcu, 'chat');
  prefs.value = { ...DEFAULT_PREFS, appearOffline: true };
  stop = startAppearOffline(lcu);
  vi.advanceTimersByTime(SETTLE_MS);
  expect(calls).toEqual([['PUT', '/lol-chat/v1/me', { availability: 'offline' }]]);
  me(lcu, 'offline');
  vi.advanceTimersByTime(60_000);
  expect(calls).toHaveLength(1);
  // Entrou em partida: a LCU põe "dnd". Reafirma, mas respeitando o intervalo mínimo.
  me(lcu, 'dnd');
  me(lcu, 'away');
  vi.advanceTimersByTime(SETTLE_MS);
  expect(calls).toHaveLength(2);
  // A LCU insiste: cada troca gera no máximo um envio por intervalo.
  me(lcu, 'dnd');
  vi.advanceTimersByTime(MIN_GAP_MS - 1);
  expect(calls).toHaveLength(2);
  vi.advanceTimersByTime(1);
  expect(calls).toHaveLength(3);
});

test('aparecer offline: desligar volta para chat; desligado de início não mexe', () => {
  const lcu = fakeLcu();
  me(lcu, 'chat');
  stop = startAppearOffline(lcu);
  vi.advanceTimersByTime(10_000);
  expect(calls).toEqual([]);
  prefs.value = { ...DEFAULT_PREFS, appearOffline: true };
  me(lcu, 'offline');
  prefs.value = { ...DEFAULT_PREFS, appearOffline: false };
  expect(calls).toEqual([['PUT', '/lol-chat/v1/me', { availability: 'chat' }]]);
});

test('aparecer offline: escolher outro status no seletor desliga o plugin e vai para ele, sem voltar a offline', async () => {
  const lcu = fakeLcu();
  me(lcu, 'offline');
  prefs.value = { ...DEFAULT_PREFS, appearOffline: true };
  stop = startAppearOffline(lcu);
  await chooseAvailability('away');
  expect(prefs.value.appearOffline).toBe(false);
  expect(calls).toEqual([['PUT', '/lol-chat/v1/me', { availability: 'away' }]]);
  me(lcu, 'away');
  vi.advanceTimersByTime(60_000);
  expect(calls).toHaveLength(1);
});

test('seletor sem o plugin: só troca o status', async () => {
  const lcu = fakeLcu();
  me(lcu, 'chat');
  stop = startAppearOffline(lcu);
  await chooseAvailability('mobile');
  await chooseAvailability('offline');
  expect(calls).toEqual([
    ['PUT', '/lol-chat/v1/me', { availability: 'mobile' }],
    ['PUT', '/lol-chat/v1/me', { availability: 'offline' }],
  ]);
  expect(prefs.value.appearOffline).toBe(false);
});
