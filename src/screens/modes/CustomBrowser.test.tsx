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

test('entrar em sala sem senha envia corpo vazio; com senha pede e envia a senha', async () => {
  setup([game({ id: 7 }), game({ id: 8, hasPassword: true })]);
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[0]!.click());
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v1/custom-games/7/join', expect.objectContaining({ method: 'POST', body: '{}' }));
  await settle();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-room')[1]!.click());
  type(input('Senha da sala') as HTMLInputElement, 'abc');
  act(() => btn('Entrar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v1/custom-games/8/join', expect.objectContaining({ body: '{"password":"abc"}' }));
});

test('sem salas mostra o aviso', () => {
  setup([]);
  expect(root.textContent).toContain('Nenhuma sala aberta');
});

test('criar: nome vazio desabilita; cria com o corpo da fila escolhida e fecha', async () => {
  const { onClose } = setup();
  expect(btn('Criar').disabled).toBe(true);
  type(input('Nome da sala') as HTMLInputElement, 'Minha sala');
  type(input('Modo'), '3200');
  type(input('Tamanho do time'), '3');
  act(() => btn('Criar').click());
  const [, init] = fetchMock.mock.calls.find((c) => c[0] === '/lol-lobby/v2/lobby')!;
  expect(JSON.parse(init.body)).toEqual({
    queueId: 3200, isCustom: true,
    customGameLobby: { lobbyName: 'Minha sala', lobbyPassword: '', configuration: { gameMode: 'ARAM', mapId: 12, mutators: { id: 1 }, spectatorPolicy: 'NotAllowed', teamSize: 3 } },
  });
  await settle();
  expect(onClose).toHaveBeenCalledOnce();
});
