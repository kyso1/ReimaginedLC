import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { LolLobbyLobbyCustomGame } from '../../lcu/types';
import { fakeLcu, queue, ready } from '../../test/fixtures';
import { CustomBrowser } from './CustomBrowser';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

const game = (over: Partial<LolLobbyLobbyCustomGame>): LolLobbyLobbyCustomGame =>
  ({ id: 1, lobbyName: 'treino', mapId: 11, filledPlayerSlots: 3, maxPlayerSlots: 10, hasPassword: false, ownerDisplayName: 'Zeca', ...over }) as LolLobbyLobbyCustomGame;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(text))!;
const input = (label: string) => root.querySelector<HTMLInputElement | HTMLSelectElement>(`[aria-label="${label}"]`)!;
const type = (el: HTMLInputElement | HTMLSelectElement, value: string) => act(() => {
  el.value = value;
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});

// Campos de escolha: pílula com menu do tema (como a ordenação da loja), não <select> nativo.
const pick = (label: string, option: string) => {
  act(() => { input(label).dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  const opt = [...root.querySelectorAll<HTMLButtonElement>('[role="listbox"] [role="option"]')].find((o) => o.textContent === option)!;
  act(() => opt.click());
};

const setup = (games: LolLobbyLobbyCustomGame[] = []) => {
  const lcu = fakeLcu();
  lcu.customGames.state.value = ready(games);
  lcu.customGames.refresh = vi.fn(async () => {});
  lcu.queues.value = ready([
    queue({ id: 3100, name: 'SR Blind Pick Custom', gameSelectCategory: 'CreateCustom', mapId: 11, gameMode: 'CLASSIC', gameTypeConfig: { id: 1 } as never }),
    queue({ id: 3200, name: 'Howling Abyss Blind Custom', gameSelectCategory: 'CreateCustom', mapId: 12, gameMode: 'ARAM', gameTypeConfig: { id: 1 } as never }),
  ]);
  const onClose = vi.fn();
  act(() => render(<CustomBrowser lcu={lcu} onClose={onClose} />, root));
  return { lcu, onClose };
};

test('ao abrir atualiza a lista; mostra nome literal, jogadores e cadeado', () => {
  const { lcu } = setup([game({ lobbyName: '<b>sala</b>' }), game({ id: 2, lobbyName: 'aram', hasPassword: true })]);
  expect(lcu.customGames.refresh).toHaveBeenCalledOnce();
  const rows = root.querySelectorAll('.rlc-room');
  expect(rows).toHaveLength(2);
  expect(rows[0]!.textContent).toContain('<b>sala</b>');
  expect(rows[0]!.textContent).toContain('3/10');
  expect(rows[1]!.textContent).toContain('🔒');
  expect(root.querySelector('b')).toBeNull();
});

// O client atual devolve id 0 em todas as salas; só o partyId as distingue.
test('selecionar: salas com id 0 se distinguem pelo partyId; só a clicada fica marcada', async () => {
  setup([game({ id: 0, lobbyName: 'a', partyId: 'p-a' } as never), game({ id: 0, lobbyName: 'b', partyId: 'p-b' } as never)]);
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[1]!.click());
  expect([...root.querySelectorAll('.rlc-room')].map((r) => r.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v2/party/p-b/join', expect.anything());
});

test('entrar fica no cabeçalho ao lado de atualizar, sem rodapé próprio', () => {
  setup([game({ id: 1 })]);
  expect(root.querySelector('.rlc-rooms footer')).toBeNull();
  expect(btn('Entrar').closest('header')).not.toBeNull();
});

test('entrar: sala antiga pelo id da sala; com senha pede e envia a senha', async () => {
  setup([game({ id: 7 }), game({ id: 8, hasPassword: true })]);
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[0]!.click());
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v1/custom-games/7/join', expect.objectContaining({ method: 'POST', body: '{"asSpectator":false}' }));
  await settle();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[1]!.click());
  type(input('Senha da sala') as HTMLInputElement, 'abc');
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v1/custom-games/8/join', expect.objectContaining({ body: '{"asSpectator":false,"password":"abc"}' }));
});

test('entrar: sala com partyId (client atual) entra pelo grupo, senha como lobbyPassword', async () => {
  setup([game({ id: 9, hasPassword: true, partyId: 'p-9' } as never)]);
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[0]!.click());
  type(input('Senha da sala') as HTMLInputElement, 'xyz');
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v2/party/p-9/join', expect.objectContaining({ method: 'POST', body: '{"asSpectator":false,"lobbyPassword":"xyz"}' }));
});

test('sem salas mostra o aviso', () => {
  setup([]);
  expect(root.textContent).toContain('Nenhuma sala aberta');
});

test('criar: nome vazio desabilita; cria com o corpo da fila escolhida e fecha', async () => {
  const { onClose } = setup();
  expect(btn('Criar').disabled).toBe(true);
  type(input('Nome da sala') as HTMLInputElement, 'Minha sala');
  pick('Modo', 'Howling Abyss Blind Custom');
  pick('Tamanho do time', '3x3');
  act(() => btn('Criar').click());
  const [, init] = fetchMock.mock.calls.find((c) => c[0] === '/lol-lobby/v2/lobby')!;
  expect(JSON.parse(init.body)).toEqual({
    queueId: 3200, isCustom: true,
    customGameLobby: { lobbyName: 'Minha sala', lobbyPassword: '', configuration: { gameMode: 'ARAM', mapId: 12, mutators: { id: 1 }, spectatorPolicy: 'NotAllowed', teamSize: 3 } },
  });
  await settle();
  expect(onClose).toHaveBeenCalledOnce();
});

test('criar: campos com rótulo visível; escolhas em menu de pílula, sem <select> nativo; espectadores sem prefixo', () => {
  setup();
  expect(root.querySelector('select')).toBeNull();
  const labels = [...root.querySelectorAll('.rlc-create .rlc-field > span')].map((l) => l.textContent);
  expect(labels).toEqual(['Nome da sala', 'Senha (opcional)', 'Modo', 'Tamanho do time', 'Espectadores']);
  const spec = input('Espectadores');
  expect(spec.textContent).toBe('Ninguém');
  act(() => { spec.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(spec.getAttribute('aria-expanded')).toBe('true');
  expect([...root.querySelectorAll('[role="option"]')].map((o) => o.textContent)).toEqual(['Ninguém', 'Só do lobby', 'Todos']);
  act(() => (root.querySelectorAll<HTMLButtonElement>('[role="option"]')[2]!).click());
  expect(spec.textContent).toBe('Todos');
  expect(root.querySelector('[role="listbox"]')).toBeNull();
});
