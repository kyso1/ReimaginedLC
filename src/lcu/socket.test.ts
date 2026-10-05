import { expect, test, vi } from 'vitest';
import { backoff, connect } from './socket';

class FakeWS {
  static instances: FakeWS[] = [];
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((m: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string, public protocol: string) {
    FakeWS.instances.push(this);
  }
  send(s: string) { this.sent.push(s); }
  close() { this.onclose?.(); }
}

const setup = () => {
  FakeWS.instances = [];
  const waits: Array<{ fn: () => void; ms: number }> = [];
  const socket = connect('ws://x/', FakeWS as unknown as typeof WebSocket, (fn, ms) => waits.push({ fn, ms }));
  return { socket, waits, last: () => FakeWS.instances[FakeWS.instances.length - 1]! };
};

const event = (uri: string, data: unknown, eventType = 'Update') => ({ data: JSON.stringify([8, 'OnJsonApiEvent', { uri, eventType, data }]) });

test('backoff cresce de 1 s até o teto de 30 s', () => {
  expect([0, 1, 2, 3, 4, 5, 6].map(backoff)).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
});

test('ao abrir, inscreve-se em OnJsonApiEvent com o subprotocolo wamp', () => {
  const { last } = setup();
  expect(last().protocol).toBe('wamp');
  last().onopen!();
  expect(last().sent).toEqual([JSON.stringify([5, 'OnJsonApiEvent'])]);
});

test('entrega o evento só a quem assinou aquela URI', () => {
  const { socket, last } = setup();
  const a = vi.fn();
  const b = vi.fn();
  socket.subscribe('/a', a);
  socket.subscribe('/b', b);
  last().onopen!();
  last().onmessage!(event('/a', { x: 1 }, 'Create'));
  expect(a).toHaveBeenCalledWith('Create', { x: 1 });
  expect(b).not.toHaveBeenCalled();
});

test('cancelar a assinatura para de receber', () => {
  const { socket, last } = setup();
  const a = vi.fn();
  const off = socket.subscribe('/a', a);
  off();
  last().onmessage!(event('/a', 1));
  expect(a).not.toHaveBeenCalled();
});

test('ignora mensagem vazia, JSON inválido e formato inesperado', () => {
  const { socket, last } = setup();
  const a = vi.fn();
  socket.subscribe('/a', a);
  for (const data of ['', '{nao json', JSON.stringify([5, 'x']), JSON.stringify([8, 'OnJsonApiEvent']), JSON.stringify({ uri: '/a' }), JSON.stringify([8, 'OnJsonApiEvent', { eventType: 'Update' }])]) {
    expect(() => last().onmessage!({ data })).not.toThrow();
  }
  expect(a).not.toHaveBeenCalled();
});

test('reconecta com espera crescente e avisa quem pediu', () => {
  const { socket, waits, last } = setup();
  const again = vi.fn();
  socket.onReconnect(again);
  last().onopen!();
  expect(again).not.toHaveBeenCalled();

  last().onclose!();
  expect(waits[0]!.ms).toBe(1000);
  waits[0]!.fn();
  last().onclose!();
  expect(waits[1]!.ms).toBe(2000);
  waits[1]!.fn();
  last().onopen!();
  expect(again).toHaveBeenCalledTimes(1);
  expect(last().sent).toEqual([JSON.stringify([5, 'OnJsonApiEvent'])]);

  last().onclose!();
  expect(waits[2]!.ms).toBe(1000);
});

test('close encerra sem reconectar', () => {
  const { socket, waits } = setup();
  socket.close();
  expect(waits).toHaveLength(0);
});

test('close durante espera de reconexão não abre novo socket', () => {
  const { socket, waits, last } = setup();
  last().onopen!();
  last().onclose!();
  expect(waits).toHaveLength(1);
  socket.close();
  waits[0]!.fn();
  expect(FakeWS.instances).toHaveLength(1);
});

test('ouvinte que lança não impede outros ouvintes', () => {
  const { socket, last } = setup();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const a = vi.fn(() => { throw new Error('erro'); });
  const b = vi.fn();
  socket.subscribe('/a', a);
  socket.subscribe('/a', b);
  last().onopen!();
  expect(() => last().onmessage!(event('/a', { x: 1 }))).not.toThrow();
  expect(a).toHaveBeenCalledWith('Update', { x: 1 });
  expect(b).toHaveBeenCalledWith('Update', { x: 1 });
  expect(error).toHaveBeenCalledOnce();
  error.mockRestore();
});

test('reconecta na primeira abertura bem-sucedida após falhas', () => {
  const { socket, waits, last } = setup();
  const again = vi.fn();
  socket.onReconnect(again);
  last().onclose!();
  expect(waits).toHaveLength(1);
  waits[0]!.fn();
  last().onopen!();
  expect(again).toHaveBeenCalledTimes(1);
});

test('assinatura por prefixo recebe a URI completa de cada evento que começa com o prefixo', () => {
  const { socket, last } = setup();
  const fn = vi.fn();
  const off = socket.subscribePrefix('/lol-chat/v1/conversations/a@x/messages/', fn);
  last().onopen!();
  last().onmessage!(event('/lol-chat/v1/conversations/a@x/messages/m1', { id: 'm1' }, 'Create'));
  last().onmessage!(event('/lol-chat/v1/conversations/b@x/messages/m2', { id: 'm2' }, 'Create'));
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith('/lol-chat/v1/conversations/a@x/messages/m1', 'Create', { id: 'm1' });
  off();
  last().onmessage!(event('/lol-chat/v1/conversations/a@x/messages/m3', { id: 'm3' }, 'Create'));
  expect(fn).toHaveBeenCalledTimes(1);
});
