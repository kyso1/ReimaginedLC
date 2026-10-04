import { readFileSync } from 'node:fs';
import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as apply from '../theme/apply';
import { enabled } from './layer';
import { start } from './start';

const sockets: unknown[] = [];
class FakeSocket {
  constructor() {
    sockets.push(this);
  }
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

const observers: MutationObserver[] = [];
const RealObserver = globalThis.MutationObserver;
const realWebSocket = globalThis.WebSocket;
const realFetch = globalThis.fetch;
let actions: unknown[];
let link: HTMLLinkElement;

beforeEach(() => {
  sockets.length = 0;
  actions = [];
  link = Object.assign(document.createElement('link'), { rel: 'riot:plugins:websocket', href: 'ws://127.0.0.1:1/' });
  document.head.append(link);
  globalThis.MutationObserver = class extends RealObserver {
    constructor(cb: MutationCallback) {
      super(cb);
      observers.push(this);
    }
  };
  globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/lol-gameflow/v1/gameflow-phase')) return new Response('"None"');
    const match = /themes\/([^/]+)\/theme\.json$/.exec(String(input));
    if (!match) return new Response('', { status: 404 });
    try {
      return new Response(readFileSync(`public/themes/${match[1]}/theme.json`, 'utf8'));
    } catch {
      return new Response('', { status: 404 });
    }
  }) as typeof fetch;
  window.CommandBar = { addAction: (a) => void actions.push(a) };
});

afterEach(() => {
  observers.splice(0).forEach((o) => o.disconnect());
  globalThis.MutationObserver = RealObserver;
  globalThis.WebSocket = realWebSocket;
  globalThis.fetch = realFetch;
  delete window.CommandBar;
  const mounted = document.getElementById('rlc-root');
  if (mounted) render(null, mounted); // desmonta o App, que senão segue assinando os signals nos próximos testes
  mounted?.remove();
  document.querySelectorAll('style[data-rlc]').forEach((el) => el.remove());
  link.remove();
});

test('chamar start duas vezes monta uma só camada', async () => {
  await start();
  const oneCall = actions.length;
  expect(oneCall).toBeGreaterThan(1);
  await start();
  expect(document.querySelectorAll('#rlc-root')).toHaveLength(1);
  expect(document.querySelectorAll('style[data-rlc]')).toHaveLength(1);
  expect(sockets).toHaveLength(1);
  expect(actions).toHaveLength(oneCall);
});

test('o client troca os filhos do body: a raiz original volta e o clone some', async () => {
  await start();
  const root = document.getElementById('rlc-root')!;
  const clone = root.cloneNode(true);
  document.body.append(clone);
  root.remove();
  await new Promise((r) => setTimeout(r, 0));
  expect(document.querySelectorAll('#rlc-root')).toHaveLength(1);
  expect(document.getElementById('rlc-root')).toBe(root);
  expect(root.isConnected).toBe(true);
});

test('um elemento qualquer no body não move nem duplica a raiz', async () => {
  await start();
  const root = document.getElementById('rlc-root')!;
  const other = document.body.appendChild(document.createElement('p'));
  await new Promise((r) => setTimeout(r, 0));
  expect(document.querySelectorAll('#rlc-root')).toHaveLength(1);
  expect(document.getElementById('rlc-root')).toBe(root);
  other.remove();
});

test('exceção no corpo do App desliga a camada e devolve a Riot', async () => {
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  window.Toast = { success: vi.fn(), error: vi.fn() };
  const riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'rcp-fe-viewport-root' }));
  await start();
  await new Promise((r) => setTimeout(r, 20));
  enabled.value = true;
  await new Promise((r) => setTimeout(r, 20));
  const root = document.getElementById('rlc-root')!;
  expect(root.dataset.visible).toBe('true');
  expect(riot.style.visibility).toBe('hidden');
  enabled.value = false;
  await new Promise((r) => setTimeout(r, 20));
  vi.spyOn(apply, 'mediaUrl').mockImplementation(() => {
    throw new Error('quebrou');
  });
  enabled.value = true;
  await new Promise((r) => setTimeout(r, 20));
  expect(enabled.value).toBe(false);
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  vi.restoreAllMocks();
  delete window.Toast;
  riot.remove();
  noise.mockRestore();
});
