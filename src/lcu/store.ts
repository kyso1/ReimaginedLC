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
  let updateCounter = 0;

  const refresh = async () => {
    const counter = ++updateCounter;
    try {
      const response = await get(uri);
      if (counter !== updateCounter) return;
      if (response.status === 404) state.value = { status: 'ready', data: null };
      else if (!response.ok) state.value = { status: 'unavailable', data: null };
      else {
        const text = await response.text();
        const data = text ? (JSON.parse(text) as T) : null;
        state.value = { status: 'ready', data };
      }
    } catch {
      if (counter !== updateCounter) return;
      state.value = { status: 'unavailable', data: null };
    }
  };

  socket.subscribe(uri, (eventType, data) => {
    ++updateCounter;
    state.value = { status: 'ready', data: eventType === 'Delete' ? null : (data as T) };
  });
  socket.onReconnect(() => void refresh());
  void refresh();
  return state;
}
