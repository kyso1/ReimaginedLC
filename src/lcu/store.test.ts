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

test('evento que chegar antes do GET não é sobrescrito pela resposta', async () => {
  const { socket, emit } = fakeSocket();
  let resolve: (value: Response) => void;
  const get = new Promise<Response>((r) => { resolve = r; });
  const store = createStore<string>('/phase', socket, async () => get);
  expect(store.value).toEqual({ status: 'loading', data: null });
  emit('/phase', 'Update', 'ChampSelect');
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
  resolve!(res(200, 'None'));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
});

test('GET que falha após evento não sobrescreve o data do evento', async () => {
  const { socket, emit } = fakeSocket();
  let resolve: (value: Response) => void;
  const get = new Promise<Response>((r) => { resolve = r; });
  const store = createStore<string>('/phase', socket, async () => get);
  emit('/phase', 'Update', 'ChampSelect');
  resolve!(res(500));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
});

test('204 No Content é estado válido sem dados', async () => {
  const { socket } = fakeSocket();
  const store = createStore<string>('/phase', socket, async () => new Response(null, { status: 204 }));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: null });
});

test('evento durante leitura do corpo não é sobrescrito', async () => {
  const { socket, emit } = fakeSocket();
  let resolveBody: (value: string) => void;
  const bodyPromise = new Promise<string>((r) => { resolveBody = r; });
  const get = async () => ({ ok: true, status: 200, text: () => bodyPromise } as unknown as Response);
  const store = createStore<string>('/phase', socket, get);
  await settle();
  emit('/phase', 'Update', 'ChampSelect');
  resolveBody!(JSON.stringify('None'));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
});

test('erro ao ler corpo após evento mantém o data do evento', async () => {
  const { socket, emit } = fakeSocket();
  let rejectBody: (error: Error) => void;
  const bodyPromise = new Promise<string>((_, r) => { rejectBody = r; });
  const get = async () => ({ ok: true, status: 200, text: () => bodyPromise } as unknown as Response);
  const store = createStore<string>('/phase', socket, get);
  await settle();
  emit('/phase', 'Update', 'ChampSelect');
  rejectBody!(new Error('erro ao ler'));
  await settle();
  expect(store.value).toEqual({ status: 'ready', data: 'ChampSelect' });
});

test('refresh exposto refaz o GET e atualiza o estado', async () => {
  const { socket } = fakeSocket();
  const get = vi.fn().mockResolvedValueOnce(res(200, [1])).mockResolvedValueOnce(res(200, [1, 2]));
  const store = createStore<number[]>('/games', socket, get);
  await settle();
  await store.refresh();
  expect(store.value).toEqual({ status: 'ready', data: [1, 2] });
});
