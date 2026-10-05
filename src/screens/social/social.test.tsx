import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, friend, ready } from '../../test/fixtures';
import { ChatTabs, ChatWindow, messageTime } from './Chat';
import { ContextChat } from './ContextChat';
import { AddFriend, FriendRequests, StatusEditor } from './FriendTools';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let emit: (uri: string, type: string, data: unknown) => void;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string, scope: ParentNode = root) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
const calls = (url: string) => fetchMock.mock.calls.filter((c) => c[0] === url);
const type = (el: HTMLInputElement | HTMLSelectElement, value: string) =>
  act(() => {
    el.value = value;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
const key = (el: HTMLElement, k: string) => act(() => void el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));

function withValues(values: Partial<Record<keyof Lcu, unknown>> = {}) {
  const lcu = fakeLcu();
  const listeners: Array<{ prefix: string; fn: (u: string, t: string, d: unknown) => void }> = [];
  lcu.events = { onPrefix: (prefix, fn) => (listeners.push({ prefix, fn }), () => {}) };
  emit = (uri, t, d) => listeners.filter((l) => uri.startsWith(l.prefix)).forEach((l) => l.fn(uri, t, d));
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  return lcu;
}
const msg = (id: string, body: string, fromPuuid = 'zeca', timestamp = '2026-10-05T14:20:00.000Z') => ({ id, body, fromPuuid, timestamp, type: 'chat' });

test('janela de chat: carrega o histórico, recebe mensagem nova por evento e envia com Enter', async () => {
  fetchMock.mockImplementation(async (url: string) => (url === '/lol-chat/v1/conversations/zeca%40pvp.net/messages' ? new Response(JSON.stringify([msg('m1', 'bora uma?')]), { status: 200 }) : new Response(null, { status: 204 })));
  const lcu = withValues({ chatMe: ready({ puuid: 'me' }) });
  act(() => render(<ChatWindow lcu={lcu} conversationId="zeca@pvp.net" title="Zeca" onClose={() => {}} />, root));
  await settle();
  expect(root.querySelector('.rlc-chat-msgs')!.textContent).toContain('bora uma?');
  act(() => emit('/lol-chat/v1/conversations/zeca@pvp.net/messages/m2', 'Create', msg('m2', '<b>5 min</b>', 'me')));
  const mine = [...root.querySelectorAll('.rlc-chat-msg[data-mine="true"]')];
  expect(mine.map((m) => m.textContent)).toEqual([expect.stringContaining('<b>5 min</b>')]);
  expect(root.querySelector('.rlc-chat-msgs b')).toBeNull();
  const input = root.querySelector<HTMLInputElement>('.rlc-chat-input')!;
  type(input, 'fechou');
  key(input, 'Enter');
  expect(JSON.parse(calls('/lol-chat/v1/conversations/zeca%40pvp.net/messages').find((c) => c[1]?.method === 'POST')![1].body)).toEqual({ body: 'fechou', type: 'chat' });
});

test('abas: uma por conversa aberta, ponto de não lida, clicar ativa e ✕ fecha', () => {
  const lcu = withValues({ conversations: ready([{ id: 'a', gameName: 'Zeca', unreadMessageCount: 0, type: 'chat' }, { id: 'b', gameName: 'Fulana', unreadMessageCount: 2, type: 'chat' }]) });
  const onActivate = vi.fn();
  const onClose = vi.fn();
  act(() => render(<ChatTabs lcu={lcu} open={['a', 'b']} active="a" onActivate={onActivate} onClose={onClose} />, root));
  const tabs = [...root.querySelectorAll('.rlc-chat-tab')];
  expect(tabs.map((t) => t.querySelector('.rlc-chat-tab-name')!.textContent)).toEqual(['Zeca', 'Fulana']);
  expect(tabs[1]!.getAttribute('data-unread')).toBe('true');
  expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
  act(() => (tabs[1]!.querySelector('.rlc-chat-tab-name') as HTMLButtonElement).click());
  expect(onActivate).toHaveBeenCalledWith('b');
  act(() => btn('Fechar conversa', tabs[0]!)!.click());
  expect(onClose).toHaveBeenCalledWith('a');
});

test('chat de contexto: acha a conversa pelo id da sala, recolhido mostra não lidas, aberto mostra mensagens', async () => {
  fetchMock.mockImplementation(async (url: string) => (url.endsWith('/messages') ? new Response(JSON.stringify([msg('m1', 'mid?')]), { status: 200 }) : new Response(null, { status: 204 })));
  const lcu = withValues({ conversations: ready([{ id: 'abc-123@champ-select.pvp.net', unreadMessageCount: 3, type: 'championSelect' }, { id: 'zeca@pvp.net', unreadMessageCount: 1, type: 'chat' }]) });
  act(() => render(<ContextChat lcu={lcu} roomId="abc-123" defaultOpen={false} />, root));
  expect(root.querySelector('.rlc-ctx-count')!.textContent).toBe('3');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-ctx-toggle')!.click());
  await settle();
  expect(root.querySelector('.rlc-chat-msgs')!.textContent).toContain('mid?');
});

test('chat de contexto sem sala correspondente não aparece', () => {
  act(() => render(<ContextChat lcu={withValues({ conversations: ready([]) })} roomId="nada" defaultOpen />, root));
  expect(root.querySelector('.rlc-ctx')).toBeNull();
});

test('pedidos: recebido aceita e recusa, enviado cancela', async () => {
  const lcu = withValues({ friendRequests: ready([{ puuid: 'p-in', gameName: 'Beltrano', tagLine: 'BR', direction: 'in' }, { puuid: 'p-out', gameName: 'Ciclano', tagLine: 'BR', direction: 'out' }]) });
  act(() => render(<FriendRequests lcu={lcu} />, root));
  const rows = root.querySelectorAll('.rlc-req');
  expect(rows[0]!.textContent).toContain('Beltrano');
  act(() => btn('Aceitar', rows[0]!)!.click());
  expect(JSON.parse(calls('/lol-chat/v2/friend-requests/p-in')[0]![1].body)).toEqual({ direction: 'both' });
  await settle();
  act(() => btn('Recusar', rows[0]!)!.click());
  expect(calls('/lol-chat/v2/friend-requests/p-in')[1]![1].method).toBe('DELETE');
  await settle();
  act(() => btn('Cancelar', rows[1]!)!.click());
  expect(calls('/lol-chat/v2/friend-requests/p-out')[0]![1].method).toBe('DELETE');
});

test('adicionar amigo por Riot ID: exige Nome#TAG e envia o pedido', async () => {
  act(() => render(<AddFriend />, root));
  const input = root.querySelector<HTMLInputElement>('input')!;
  type(input, 'Zeca');
  expect(btn('Adicionar')!.disabled).toBe(true);
  type(input, ' Zeca Silva#NA1 ');
  act(() => btn('Adicionar')!.click());
  expect(JSON.parse(calls('/lol-chat/v2/friend-requests')[0]![1].body)).toEqual({ gameName: 'Zeca Silva', tagLine: 'NA1', direction: 'out' });
  await settle();
  expect(input.value).toBe('');
});

test('status: disponibilidade e mensagem', () => {
  act(() => render(<StatusEditor lcu={withValues({ chatMe: ready({ availability: 'chat', statusMessage: 'oi' }) })} />, root));
  type(root.querySelector('select')!, 'away');
  expect(JSON.parse(calls('/lol-chat/v1/me')[0]![1].body)).toEqual({ availability: 'away' });
  const input = root.querySelector<HTMLInputElement>('input')!;
  expect(input.value).toBe('oi');
  type(input, 'jogando ranked');
  key(input, 'Enter');
  expect(JSON.parse(calls('/lol-chat/v1/me')[1]![1].body)).toEqual({ statusMessage: 'jogando ranked' });
});

test('amigos fixture continua válido', () => {
  expect(friend().availability).toBe('chat');
});

test('hora da mensagem: só a hora hoje; dia e hora nos outros dias', () => {
  const now = new Date('2026-10-05T15:00:00.000Z');
  expect(messageTime('2026-10-05T14:20:00.000Z', now)).not.toContain('/');
  expect(messageTime('2026-10-02T15:00:00.000Z', now)).toContain('02/10');
  expect(messageTime('lixo', now)).toBe('');
});

test('mensagens de sistema de entrada e saída da sala ficam de fora', async () => {
  const sys = (id: string, body: string) => ({ ...msg(id, body), type: 'system' });
  fetchMock.mockImplementation(async (url: string) => (url === '/lol-chat/v1/conversations/zeca%40pvp.net/messages' ? new Response(JSON.stringify([msg('m1', 'oi'), sys('s1', 'joined_room'), sys('s2', 'left_room')]), { status: 200 }) : new Response(null, { status: 204 })));
  const lcu = withValues({ chatMe: ready({ puuid: 'me' }) });
  act(() => render(<ChatWindow lcu={lcu} conversationId="zeca@pvp.net" title="Zeca" onClose={() => {}} />, root));
  await settle();
  expect([...root.querySelectorAll('.rlc-chat-text')].map((e) => e.textContent)).toEqual(['oi']);
});
