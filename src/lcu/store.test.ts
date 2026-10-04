import { expect, test, vi } from 'vitest';
import type { LcuSocket } from './socket';
import { createStore } from './store';

function fakeSocket() {
  const listeners = new Map<string, (eventType: string, data: unknown) => void>();
  let reconnect: () => void = () => {};
  const socket: LcuSocket = {
    subscribe: (uri, fn) => { listeners.set(uri, fn); return () => listeners.delete(uri); },
    onReconnect: (fn) => { reconnect = fn; return () => {}; },
    close: () => {},
  };
  return { socket, emit: (uri: string, eventType: string, data: unknown) => listeners.get(uri)?.(eventType, data), reconnect: () => reconnect() };
}

const res = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const settle = () => new Promise((r) => setTimeout(r, 0));

test('começa em loading e fica ready com o GET inicial', async () => {
  const { socket } = fakeSocket();
  const store = createStore<string>('/phase', socket, async () => res(200, 'None'));
  expect(store.value).toEqual({ status: 'loading', data: null });
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: 'None' });
});

test('404 no GET inicial é estado válido, sem dados', async () => {
  const { socket } = fakeSocket();
  const store = createStore('/lobby', socket, async () => res(404, { message: 'x' }));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: null });
});

test('erro do servidor, falha de rede e corpo inválido deixam o store indisponível', async () => {
  const { socket } = fakeSocket();
  const a = createStore('/a', socket, async () => res(500));
  const b = createStore('/b', socket, async () => { throw new Error('rede'); });
  const c = createStore('/c', socket, async () => new Response('nao json', { status: 200 }));
  await settle();
  for (const s of [a, b, c]) expect(s.value).toEqual({ status: 'unavailable', data: null });
});

test('atualiza por evento e zera em Delete', async () => {
  const { socket, emit } = fakeSocket();
  const store = createStore<string>('/phase', socket, async () => res(200, 'None'));
  await settle();
  emit('/phase', 'Update', 'Lobby');
  expect(store.value).toEqual({ status: 'ready', data: 'Lobby' });
  emit('/phase', 'Delete', null);
  expect(store.value).toEqual({ status: 'ready', data: null });
});

test('refaz o GET quando o socket reconecta', async () => {
  const { socket, reconnect } = fakeSocket();
  const get = vi.fn().mockResolvedValueOnce(res(200, 'None')).mockResolvedValueOnce(res(200, 'ChampSelect'));
  const store = createStore<string>('/phase', socket, get);
  await settle();
  reconnect();
  await settle();
  expect(get).toHaveBeenCalledTimes(2);
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
});
