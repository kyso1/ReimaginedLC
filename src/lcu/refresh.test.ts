import { afterEach, expect, test, vi } from 'vitest';
import { REFRESH_BATCH_MS, friendRequestsStore, refreshOnPrefix } from './index';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('carteira (endereço com query): eventos do inventário, que vêm sem query, releem uma vez por rajada', async () => {
  vi.useFakeTimers();
  const listeners: Array<[string, (uri: string) => void]> = [];
  const socket = { subscribePrefix: (prefix: string, fn: (uri: string) => void) => (listeners.push([prefix, fn]), () => {}) };
  const store = { refresh: vi.fn(async () => {}) };
  refreshOnPrefix(store, socket as never, '/lol-inventory/');
  const emit = (uri: string) => listeners.filter(([p]) => uri.startsWith(p)).forEach(([, fn]) => fn(uri));
  // Uma compra gera vários avisos: RP, Essência Azul, o item novo.
  emit('/lol-inventory/v1/wallet/RP');
  emit('/lol-inventory/v1/wallet/lol_blue_essence');
  emit('/lol-inventory/v2/inventory/CHAMPION');
  expect(store.refresh).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(REFRESH_BATCH_MS + 10);
  expect(store.refresh).toHaveBeenCalledTimes(1);
});

test('o próprio endereço do store (que já tem evento) não relê de novo', async () => {
  vi.useFakeTimers();
  let fn: ((uri: string) => void) | undefined;
  const store = { refresh: vi.fn(async () => {}) };
  refreshOnPrefix(store, { subscribePrefix: (_p: string, f: (uri: string) => void) => ((fn = f), () => {}) } as never, '/lol-loot/', '/lol-loot/v1/player-loot');
  fn!('/lol-loot/v1/player-loot');
  await vi.advanceTimersByTimeAsync(REFRESH_BATCH_MS + 10);
  expect(store.refresh).not.toHaveBeenCalled();
  fn!('/lol-loot/v1/player-loot/CHAMPION_RENTAL_266');
  await vi.advanceTimersByTimeAsync(REFRESH_BATCH_MS + 10);
  expect(store.refresh).toHaveBeenCalledTimes(1);
});

test('pedidos de amizade: a LCU avisa na v1, e a lista (lida na v2) passa a mostrar o pedido novo', async () => {
  vi.useFakeTimers();
  const prefixes: Array<[string, (uri: string) => void]> = [];
  const socket = { subscribe: () => () => {}, onReconnect: () => () => {}, subscribePrefix: (p: string, fn: (uri: string) => void) => (prefixes.push([p, fn]), () => {}) };
  const zeca = { puuid: 'p-zeca', gameName: 'Zeca', tagLine: 'BR1', direction: 'in' };
  const fetch = vi.fn().mockResolvedValueOnce(new Response('[]')).mockResolvedValueOnce(new Response(JSON.stringify([zeca])));
  vi.stubGlobal('fetch', fetch);
  const store = friendRequestsStore(socket as never);
  await vi.advanceTimersByTimeAsync(0);
  expect(store.value.data).toEqual([]);
  prefixes.filter(([p]) => '/lol-chat/v1/friend-requests/p-zeca'.startsWith(p)).forEach(([, fn]) => fn('/lol-chat/v1/friend-requests/p-zeca'));
  await vi.advanceTimersByTimeAsync(REFRESH_BATCH_MS + 10);
  expect(fetch).toHaveBeenLastCalledWith('/lol-chat/v2/friend-requests');
  expect(store.value.data).toEqual([zeca]);
});
