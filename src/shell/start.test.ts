import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, test } from 'vitest';
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

const realWebSocket = globalThis.WebSocket;
const realFetch = globalThis.fetch;
let actions: unknown[];
let link: HTMLLinkElement;

beforeEach(() => {
  sockets.length = 0;
  actions = [];
  link = Object.assign(document.createElement('link'), { rel: 'riot:plugins:websocket', href: 'ws://127.0.0.1:1/' });
  document.head.append(link);
  globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
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
  globalThis.WebSocket = realWebSocket;
  globalThis.fetch = realFetch;
  delete window.CommandBar;
  document.getElementById('rlc-root')?.remove();
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
