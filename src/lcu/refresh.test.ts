import { afterEach, expect, test, vi } from 'vitest';
import { REFRESH_BATCH_MS, refreshOnPrefix } from './index';

afterEach(() => vi.useRealTimers());

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
