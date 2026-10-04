import { signal, type Signal } from '@preact/signals';
import type { LcuSocket } from './socket';

export type StoreState<T> = { status: 'loading' | 'ready' | 'unavailable'; data: T | null };

/**
 * Estado de um recurso da LCU: um GET inicial e depois os eventos daquela URI.
 * 404 no GET é estado válido (o recurso não existe agora), não erro.
 */
export function createStore<T>(
  uri: string,
  socket: LcuSocket,
  get: (uri: string) => Promise<Response> = (u) => fetch(u),
): Signal<StoreState<T>> {
  const state = signal<StoreState<T>>({ status: 'loading', data: null });
  // Discard GET responses and events older than the latest event; counter incremented by all updates.
  let updateCounter = 0;

  const refresh = async () => {
    const counter = ++updateCounter;
    let outcome: StoreState<T>;
    try {
      const response = await get(uri);
      if (response.status === 404) outcome = { status: 'ready', data: null };
      else if (!response.ok) outcome = { status: 'unavailable', data: null };
      else {
        const text = await response.text();
        const data = text ? (JSON.parse(text) as T) : null;
        outcome = { status: 'ready', data };
      }
    } catch {
      outcome = { status: 'unavailable', data: null };
    }
    if (counter === updateCounter) state.value = outcome;
  };

  socket.subscribe(uri, (eventType, data) => {
    ++updateCounter;
    state.value = { status: 'ready', data: eventType === 'Delete' ? null : (data as T) };
  });
  socket.onReconnect(() => void refresh());
  void refresh();
  return state;
}
