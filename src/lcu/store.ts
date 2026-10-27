import { signal, type Signal } from '@preact/signals';
import type { LcuSocket } from './socket';

export type StoreState<T> = { status: 'loading' | 'ready' | 'unavailable'; data: T | null };

/** Esperas entre novas leituras de um recurso que falhou (a API do client pode ainda estar subindo). */
export const RETRY_MS = [1000, 2000, 4000, 8000, 15000, 30000];

/**
 * Estado de um recurso da LCU: um GET inicial e depois os eventos daquela URI.
 * 404 no GET é estado válido (o recurso não existe agora), não erro.
 * GET que falha (client ainda subindo, erro do servidor) tenta de novo com espera crescente até dar certo: sem isso, um
 * recurso que não muda (fase do pós-jogo ao reabrir o client) ficava indisponível até a conexão cair.
 */
export function createStore<T>(
  uri: string,
  socket: LcuSocket,
  get: (uri: string) => Promise<Response> = (u) => fetch(u),
  wait: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
): Signal<StoreState<T>> & { refresh: () => Promise<void> } {
  const state = signal<StoreState<T>>({ status: 'loading', data: null });
  // Discard GET responses and events older than the latest event; counter incremented by all updates.
  let updateCounter = 0;
  let failures = 0;

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
    if (counter !== updateCounter) return;
    state.value = outcome;
    if (outcome.status === 'unavailable') {
      const ms = RETRY_MS[Math.min(failures++, RETRY_MS.length - 1)]!;
      // Um evento ou outra leitura no meio do caminho já resolveu: a nova tentativa só vale se nada mudou.
      wait(() => counter === updateCounter && void refresh(), ms);
    } else failures = 0;
  };

  socket.subscribe(uri, (eventType, data) => {
    ++updateCounter;
    state.value = { status: 'ready', data: eventType === 'Delete' ? null : (data as T) };
  });
  socket.onReconnect(() => void refresh());
  void refresh();
  return Object.assign(state, { refresh });
}

/**
 * Lista cujo item muda na URI dele (`/lol-chat/v1/friends/{id}`): a LCU não manda evento na lista quando um amigo
 * muda de status, só no item. Cria, atualiza e apaga o item na lista pelo `id`.
 */
export function createListStore<T extends { id: string }>(uri: string, socket: LcuSocket, get?: (uri: string) => Promise<Response>): Signal<StoreState<T[]>> & { refresh: () => Promise<void> } {
  const store = createStore<T[]>(uri, socket, get);
  socket.subscribePrefix(`${uri}/`, (itemUri, eventType, data) => {
    const id = decodeURIComponent(itemUri.slice(uri.length + 1));
    // Sub-recursos do item (`/friends/{id}/...`) não são o item.
    if (!id || id.includes('/')) return;
    const list = store.peek().data;
    if (!list) return;
    const rest = list.filter((x) => x.id !== id);
    if (eventType === 'Delete') {
      if (rest.length !== list.length) store.value = { status: 'ready', data: rest };
    } else if (data && typeof data === 'object' && (data as T).id === id) {
      // Só o próprio item: URIs irmãs (`/conversations/active`, `/notify`) não são itens da lista.
      const i = list.findIndex((x) => x.id === id);
      const next = [...list];
      if (i >= 0) next[i] = data as T;
      else next.push(data as T);
      store.value = { status: 'ready', data: next };
    }
  });
  return store;
}
