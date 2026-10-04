type Listener = (eventType: string, data: unknown) => void;

export interface LcuSocket {
  subscribe(uri: string, fn: Listener): () => void;
  onReconnect(fn: () => void): () => void;
  close(): void;
}

/** Espera antes da tentativa `attempt` de reconexão: 1 s, 2 s, 4 s... até 30 s. */
export const backoff = (attempt: number): number => Math.min(30000, 1000 * 2 ** attempt);

export function connect(
  url: string,
  WS: typeof WebSocket = WebSocket,
  wait: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
): LcuSocket {
  const listeners = new Map<string, Set<Listener>>();
  const reconnectListeners = new Set<() => void>();
  let ws: WebSocket | null = null;
  let attempt = 0;
  let everOpened = false;
  let closed = false;

  const open = () => {
    const socket = new WS(url, 'wamp');
    ws = socket;
    socket.onopen = () => {
      socket.send(JSON.stringify([5, 'OnJsonApiEvent']));
      attempt = 0;
      if (everOpened) reconnectListeners.forEach((fn) => fn());
      everOpened = true;
    };
    socket.onmessage = (message) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(message.data));
      } catch {
        return;
      }
      if (!Array.isArray(parsed) || parsed[0] !== 8) return;
      const payload = parsed[2] as { uri?: unknown; eventType?: unknown; data?: unknown } | undefined;
      if (!payload || typeof payload.uri !== 'string') return;
      listeners.get(payload.uri)?.forEach((fn) => fn(String(payload.eventType), payload.data));
    };
    socket.onclose = () => {
      if (closed) return;
      wait(open, backoff(attempt++));
    };
  };
  open();

  return {
    subscribe(uri, fn) {
      const set = listeners.get(uri) ?? new Set<Listener>();
      listeners.set(uri, set);
      set.add(fn);
      return () => void set.delete(fn);
    },
    onReconnect(fn) {
      reconnectListeners.add(fn);
      return () => void reconnectListeners.delete(fn);
    },
    close() {
      closed = true;
      ws?.close();
    },
  };
}
