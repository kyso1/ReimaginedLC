import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { DEFAULT_PREFS, prefs } from '../../shell/prefs';
import { fakeLcu, friend, ready } from '../../test/fixtures';
import { ChatDock, ChatWindow, messageTime } from './Chat';
import { ContextChat, roomChatOpen } from './ContextChat';
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

test('doca: conversas recentes primeiro, ponto de não lida, clicar ativa e — minimiza', () => {
  const lcu = withValues({
    conversations: ready([
      { id: 'a', gameName: 'Zeca', unreadMessageCount: 0, type: 'chat', lastMessage: { timestamp: '2026-10-01T10:00:00Z', body: 'velha' } },
      { id: 'b', gameName: 'Fulana', unreadMessageCount: 2, type: 'chat', lastMessage: { timestamp: '2026-10-05T10:00:00Z', body: 'bora?' } },
      { id: 'sala@lol-pre-game', unreadMessageCount: 0, type: 'customGame' },
    ]),
  });
  const onActivate = vi.fn();
  const onClose = vi.fn();
  act(() => render(<ChatDock lcu={lcu} open active="a" onActivate={onActivate} onClose={onClose} />, root));
  const items = [...root.querySelectorAll('.rlc-chat-item')];
  expect(items.map((t) => t.querySelector('b')!.textContent)).toEqual(['Fulana', 'Zeca']);
  expect(items[0]!.textContent).toContain('bora?');
  expect(items[0]!.getAttribute('data-unread')).toBe('true');
  expect(items[1]!.getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelector('.rlc-chat-window')!.getAttribute('aria-label')).toBe('Zeca');
  act(() => (items[0] as HTMLButtonElement).click());
  expect(onActivate).toHaveBeenCalledWith('b');
  // Só a conversa aberta tem botão de fechar; a lista não repete um.
  expect(root.querySelector('.rlc-chat-list .rlc-winbtn')).toBeNull();
});

test('doca: clicar na conversa aberta só a fecha; o X tira da lista (DELETE), e some com mensagem não lida', async () => {
  const lcu = withValues({
    conversations: ready([
      { id: 'a@pvp.net', gameName: 'Zeca', unreadMessageCount: 0, type: 'chat' },
      { id: 'b@pvp.net', gameName: 'Fulana', unreadMessageCount: 2, type: 'chat' },
      { id: 'c@pvp.net', gameName: 'Beltrano', unreadMessageCount: 1, isMuted: true, type: 'chat' },
    ]),
  });
  const onActivate = vi.fn();
  act(() => render(<ChatDock lcu={lcu} open active="a@pvp.net" onActivate={onActivate} onClose={vi.fn()} />, root));
  const item = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-chat-item')].find((b) => b.textContent!.includes(name))!;
  act(() => item('Zeca').click());
  expect(onActivate).toHaveBeenLastCalledWith(null);
  act(() => item('Fulana').click());
  expect(onActivate).toHaveBeenLastCalledWith('b@pvp.net');
  const removes = [...root.querySelectorAll('.rlc-chat-remove')].map((b) => b.getAttribute('aria-label'));
  expect(removes).toEqual(['Remover conversa: Zeca', 'Remover conversa: Beltrano']);
  await act(async () => btn('Remover conversa: Zeca')!.click());
  expect(onActivate).toHaveBeenLastCalledWith(null);
  expect(calls('/lol-chat/v1/conversations/a%40pvp.net').map((c) => c[1]?.method)).toEqual(['DELETE']);
});

test('doca: o X do canto existe sem conversa aberta; clicar fora esconde, dentro e na coluna de amigos não', () => {
  const lcu = withValues({ conversations: ready([{ id: 'a', gameName: 'Zeca', unreadMessageCount: 0, type: 'chat' }]) });
  const onClose = vi.fn();
  const side = document.body.appendChild(document.createElement('aside'));
  side.className = 'rlc-rc';
  const outside = document.body.appendChild(document.createElement('div'));
  act(() => render(<ChatDock lcu={lcu} open active={null} onActivate={vi.fn()} onClose={onClose} />, root));
  act(() => btn('Fechar conversa', root.querySelector('.rlc-chat-window')!)!.click());
  expect(onClose).toHaveBeenCalledTimes(1);
  const down = (el: Element) => act(() => void el.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  down(root.querySelector('.rlc-chat-item')!);
  down(side);
  expect(onClose).toHaveBeenCalledTimes(1);
  down(outside);
  expect(onClose).toHaveBeenCalledTimes(2);
  act(() => render(<ChatDock lcu={lcu} open={false} active={null} onActivate={vi.fn()} onClose={onClose} />, root));
  down(outside);
  expect(onClose).toHaveBeenCalledTimes(2);
  side.remove();
  outside.remove();
});

test('doca: fechar a conversa aberta fecha o chat todo', () => {
  const lcu = withValues({ conversations: ready([{ id: 'a', gameName: 'Zeca', unreadMessageCount: 0, type: 'chat' }]) });
  const onActivate = vi.fn();
  const onClose = vi.fn();
  act(() => render(<ChatDock lcu={lcu} open active="a" onActivate={onActivate} onClose={onClose} />, root));
  act(() => btn('Fechar conversa', root.querySelector('.rlc-chat-window')!)!.click());
  expect(onClose).toHaveBeenCalledOnce();
  expect(onActivate).not.toHaveBeenCalled();
});

test('chat de contexto: acha a conversa pelo id da sala e começa aberto; recolhido à mão fica recolhido na sala, sala nova abre', async () => {
  fetchMock.mockImplementation(async (url: string) => (url.endsWith('/messages') ? new Response(JSON.stringify([msg('m1', 'mid?')]), { status: 200 }) : new Response(null, { status: 204 })));
  const lcu = withValues({ conversations: ready([{ id: 'abc-123@champ-select.pvp.net', unreadMessageCount: 3, type: 'championSelect' }, { id: 'nova-9@champ-select.pvp.net', unreadMessageCount: 0, type: 'championSelect' }, { id: 'zeca@pvp.net', unreadMessageCount: 1, type: 'chat' }]) });
  act(() => render(<ContextChat key="abc-123" lcu={lcu} roomId="abc-123" />, root));
  await settle();
  expect(root.querySelector('.rlc-ctx')!.getAttribute('data-open')).toBe('true');
  expect(root.querySelector('.rlc-chat-msgs')!.textContent).toContain('mid?');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-ctx-toggle')!.click());
  expect(root.querySelector('.rlc-ctx-count')!.textContent).toBe('3');
  // Sai da tela e volta (o App desmonta o chat): a mesma sala continua recolhida.
  act(() => render(null, root));
  act(() => render(<ContextChat key="abc-123" lcu={lcu} roomId="abc-123" />, root));
  expect(root.querySelector('.rlc-ctx')!.getAttribute('data-open')).toBeNull();
  act(() => render(<ContextChat key="nova-9" lcu={lcu} roomId="nova-9" />, root));
  expect(root.querySelector('.rlc-ctx')!.getAttribute('data-open')).toBe('true');
});

test('chat de contexto: roomChatOpen acompanha abrir, recolher, esconder e sair da sala (o lobby sobe o nome da vaga 1 por ele)', async () => {
  const lcu = withValues({ conversations: ready([{ id: 'sala-7@lol-lobby.pvp.net', unreadMessageCount: 0, type: 'customGame' }]) });
  act(() => render(<ContextChat key="sala-7" lcu={lcu} roomId="sala-7" />, root));
  await settle();
  expect(roomChatOpen.value).toBe(true);
  act(() => root.querySelector<HTMLButtonElement>('.rlc-ctx-toggle')!.click());
  expect(roomChatOpen.value).toBe(false);
  act(() => root.querySelector<HTMLButtonElement>('.rlc-ctx-toggle')!.click());
  expect(roomChatOpen.value).toBe(true);
  act(() => render(<ContextChat key="sala-7" lcu={lcu} roomId="sala-7" hidden />, root));
  expect(roomChatOpen.value).toBe(false);
  act(() => render(<ContextChat key="sala-7" lcu={lcu} roomId="sala-7" />, root));
  expect(roomChatOpen.value).toBe(true);
  act(() => render(null, root));
  expect(roomChatOpen.value).toBe(false);
});

test('som de mensagem: só mensagem nova de outra pessoa; nem minha, nem de sistema, nem histórico, nem da conversa à vista com foco', () => {
  const play = vi.fn().mockResolvedValue(undefined);
  const srcs: string[] = [];
  vi.stubGlobal('Audio', vi.fn(function (this: { play: typeof play; volume: number }, src: string) { srcs.push(src); this.play = play; this.volume = 1; }));
  const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  const lcu = withValues({ chatMe: ready({ puuid: 'me', id: 'me-id', pid: 'me-pid' }) });
  act(() => render(<ChatDock lcu={lcu} open active="zeca@pvp.net" onActivate={() => {}} onClose={() => {}} />, root));
  const room = '/lol-chat/v1/conversations/sala@champ-select.pvp.net/messages/';
  act(() => emit(`${room}a`, 'Create', { ...msg('a', 'eu', ''), fromPid: 'me-pid' }));
  act(() => emit(`${room}b`, 'Create', { ...msg('b', 'joined_room', 'x'), type: 'system' }));
  act(() => emit(`${room}c`, 'Create', { ...msg('c', 'velha', 'x'), isHistorical: true }));
  act(() => emit(`${room}d`, 'Update', msg('d', 'editada', 'x')));
  act(() => emit('/lol-chat/v1/conversations/zeca@pvp.net/messages/e', 'Create', msg('e', 'à vista')));
  expect(play).not.toHaveBeenCalled();
  act(() => emit(`${room}f`, 'Create', { ...msg('f', 'mid?', 'x'), type: 'groupchat' }));
  // O mesmo evento com o id codificado não toca de novo.
  act(() => emit('/lol-chat/v1/conversations/sala%40champ-select.pvp.net/messages/f', 'Create', { ...msg('f', 'mid?', 'x'), type: 'groupchat' }));
  expect(play).toHaveBeenCalledTimes(1);
  expect(srcs).toEqual(['/fe/lol-social/sounds/sfx-soc-notif-chat-rcvd.ogg']);
  // Sem foco na janela, a conversa à vista também avisa; com a pref desligada, nada.
  focus.mockReturnValue(false);
  act(() => emit('/lol-chat/v1/conversations/zeca@pvp.net/messages/g', 'Create', msg('g', 'oi?')));
  expect(play).toHaveBeenCalledTimes(2);
  prefs.value = { ...DEFAULT_PREFS, chatSound: false };
  act(() => emit('/lol-chat/v1/conversations/zeca@pvp.net/messages/h', 'Create', msg('h', 'oi??')));
  expect(play).toHaveBeenCalledTimes(2);
  prefs.value = DEFAULT_PREFS;
  focus.mockRestore();
});

test('som de mensagem: a minha que volta só com o puuid ofuscado (seleção) não toca', () => {
  const play = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('Audio', vi.fn(function (this: { play: typeof play }) { this.play = play; }));
  fetchMock.mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
  const lcu = withValues({ chatMe: ready({ puuid: 'me' }), conversations: ready([{ id: 'sala@champ-select.pvp.net', unreadMessageCount: 0, type: 'championSelect' }]) });
  act(() => render(<><ContextChat lcu={lcu} roomId="sala" /><ChatDock lcu={lcu} open={false} active={null} onActivate={() => {}} onClose={() => {}} /></>, root));
  const input = root.querySelector<HTMLInputElement>('.rlc-ctx .rlc-chat-input')!;
  type(input, 'mid');
  key(input, 'Enter');
  act(() => emit('/lol-chat/v1/conversations/sala@champ-select.pvp.net/messages/z', 'Create', { ...msg('z', 'mid', ''), fromObfuscatedPuuid: 'ofusc' }));
  expect(play).not.toHaveBeenCalled();
});

test('chat de contexto sem sala correspondente não aparece', () => {
  act(() => render(<ContextChat lcu={withValues({ conversations: ready([]) })} roomId="nada" />, root));
  expect(root.querySelector('.rlc-ctx')).toBeNull();
});

test('chat de contexto: sala sem conversa e com credenciais entra na sala uma vez', () => {
  const join = { type: 'customGame' as const, password: 'pw', mucJwtDto: { jwt: 'j', targetRegion: 'br1' } };
  act(() => render(<ContextChat lcu={withValues({ conversations: ready([]) })} roomId="sala-1" join={join} />, root));
  const posts = calls('/lol-chat/v1/conversations');
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0]![1].body)).toMatchObject({ id: 'sala-1', type: 'customGame', password: 'pw', targetRegion: 'br1' });
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

test('status recusado pela LCU volta ao valor anterior', async () => {
  window.Toast = { success: vi.fn(), error: vi.fn() };
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'não' }), { status: 500 }));
  act(() => render(<StatusEditor lcu={withValues({ chatMe: ready({ availability: 'chat', statusMessage: '' }) })} />, root));
  const select = root.querySelector('select')!;
  type(select, 'away');
  await settle();
  await settle();
  expect(select.value).toBe('chat');
  delete window.Toast;
});

test('histórico de conversa que não existe mais não mostra erro', async () => {
  window.Toast = { success: vi.fn(), error: vi.fn() };
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
  act(() => render(<ChatWindow lcu={withValues({ chatMe: ready({ puuid: 'me' }) })} conversationId="sumiu@pvp.net" title="Sumiu" onClose={() => {}} />, root));
  await settle();
  expect(window.Toast.error).not.toHaveBeenCalled();
  delete window.Toast;
});

test('cada sequência de mensagens mostra quem mandou: amigo, participante da sala, Riot ID pelo puuid; as minhas como Você', async () => {
  const room = 'sala@lol-pre-game.pvp.net';
  const list = [msg('m1', 'oi', 'zeca'), msg('m2', 'bora', 'zeca'), msg('m3', 'vamo', 'me'), msg('m4', 'top?', 'bia'), msg('m5', 'eu', 'estranho'), { ...msg('s1', 'aviso'), type: 'system' }, msg('m6', 'de novo', 'estranho')].map((m) => ({ ...m, type: m.type === 'chat' ? 'groupchat' : m.type }));
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/messages')
      ? new Response(JSON.stringify(list), { status: 200 })
      : url.endsWith('/participants')
        ? new Response(JSON.stringify([{ puuid: 'bia', id: 'bia@pvp.net', gameName: 'Bia' }]), { status: 200 })
        : new Response(null, { status: 204 }),
  );
  const lcu = withValues({ chatMe: ready({ puuid: 'me' }), friends: ready([friend({ gameName: 'Zeca', puuid: 'zeca' })]) });
  const name = vi.fn(async (p: string) => (p === 'estranho' ? 'Estranho' : null));
  lcu.name = name;
  act(() => render(<ChatWindow lcu={lcu} conversationId={room} title="Sala" onClose={() => {}} />, root));
  await settle();
  await settle();
  const authors = [...root.querySelectorAll('.rlc-chat-msg')].map((m) => m.querySelector('.rlc-chat-author')?.textContent ?? null);
  expect(authors).toEqual(['Zeca', null, 'Você', 'Bia', 'Estranho', null, 'Estranho']);
  expect(root.querySelectorAll('.rlc-chat-msg[data-mine="true"]').length).toBe(1);
  expect(name).toHaveBeenCalledWith('estranho');
  expect(name).not.toHaveBeenCalledWith('zeca');
});

test('autor sem nome conhecido (seleção com nomes ocultos) aparece como Jogador', async () => {
  fetchMock.mockImplementation(async (url: string) => (url.endsWith('/messages') ? new Response(JSON.stringify([{ ...msg('m1', 'oi', ''), fromObfuscatedPuuid: 'x1', type: 'groupchat' }]), { status: 200 }) : new Response(null, { status: 204 })));
  act(() => render(<ChatWindow lcu={withValues({ chatMe: ready({ puuid: 'me' }) })} conversationId="cs@champ-select.pvp.net" title="Sala" onClose={() => {}} />, root));
  await settle();
  expect(root.querySelector('.rlc-chat-author')!.textContent).toBe('Jogador');
  expect(root.querySelector('.rlc-chat-msg[data-mine]')).toBeNull();
});

test('abrir a conversa marca como ativa (o client zera as não lidas) e fechar solta', async () => {
  const lcu = withValues({ chatMe: ready({ puuid: 'me' }) });
  act(() => render(<ChatWindow lcu={lcu} conversationId="zeca@pvp.net" title="Zeca" onClose={() => {}} />, root));
  await settle();
  const active = () => calls('/lol-chat/v1/conversations/active').map((c) => [c[1]?.method, c[1]?.body]);
  expect(active()).toContainEqual(['PUT', JSON.stringify({ id: 'zeca@pvp.net' })]);
  fetchMock.mockClear();
  act(() => render(null, root));
  expect(active()).toEqual([['DELETE', undefined]]);
});
