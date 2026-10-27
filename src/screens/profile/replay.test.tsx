import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { REPLAY_POLL_MS, ReplayButton } from './ReplayButton';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let config: Record<string, unknown>;
let states: Array<{ state: string; downloadProgress?: number }>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const posts = (path: string) => fetchMock.mock.calls.filter((c) => c[0] === path && c[1]?.method === 'POST');
const GAME = { gameId: 77, queueId: 420, gameType: 'MATCHED_GAME', gameVersion: '16.21.1', gameCreation: 1000, gameDuration: 500 };

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  config = { isReplaysEnabled: true, isReplaysForMatchHistoryEnabled: true, isReplaysForEndOfGameEnabled: true, gameVersion: '16.21.9' };
  states = [{ state: 'download' }];
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-replays/v1/configuration') return new Response(JSON.stringify(config), { status: 200 });
    if (url === '/lol-replays/v1/metadata/77') return new Response(JSON.stringify({ gameId: 77, ...(states.length > 1 ? states.shift() : states[0]) }), { status: 200 });
    if (init?.method === 'POST') return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mount = async (where: 'match-history' | 'end-of-game' = 'match-history', game: Parameters<typeof ReplayButton>[0]['game'] = GAME) => {
  act(() => render(<ReplayButton game={game} where={where} />, root));
  for (let i = 0; i < 4; i++) await settle();
  return () => root.querySelector<HTMLButtonElement>('.rlc-replay');
};

test('registra a partida como o client e oferece Baixar; o clique baixa com o tipo do componente', async () => {
  const btn = await mount();
  expect(JSON.parse(posts('/lol-replays/v2/metadata/77/create')[0]![1].body)).toEqual({ gameVersion: '16.21.1', gameType: 'MATCHED_GAME', queueId: 420, gameEnd: 1500 });
  expect(btn()!.textContent).toBe('Baixar replay');
  states = [{ state: 'downloading', downloadProgress: 40 }, { state: 'watch' }];
  act(() => btn()!.click());
  expect(JSON.parse(posts('/lol-replays/v1/rofls/77/download')[0]![1].body)).toEqual({ componentType: 'replay-button_match-history' });
  for (let i = 0; i < 4; i++) await settle();
  expect(btn()!.textContent).toBe('Baixando replay 40%');
  expect(btn()!.disabled).toBe(true);
  // Baixando: relê o estado até terminar.
  await act(async () => void (await new Promise((r) => setTimeout(r, REPLAY_POLL_MS + 50))));
  await settle();
  expect(btn()!.textContent).toBe('Assistir replay');
  act(() => btn()!.click());
  expect(posts('/lol-replays/v1/rofls/77/watch')).toHaveLength(1);
});

test('fim de jogo: sem versão na partida usa a da configuração; Assistir fica desligado com o jogo aberto', async () => {
  config.isPlayingGame = true;
  states = [{ state: 'watch' }];
  const btn = await mount('end-of-game', { gameId: 77, queueId: 420, gameType: 'MATCHED_GAME' });
  expect(JSON.parse(posts('/lol-replays/v2/metadata/77/create')[0]![1].body)).toEqual({ gameVersion: '16.21.9', gameType: 'MATCHED_GAME', queueId: 420 });
  expect(btn()!.textContent).toBe('Assistir replay');
  expect(btn()!.disabled).toBe(true);
});

test('sem replay possível mostra o motivo, desligado; replays desligados para o lugar escondem o botão', async () => {
  states = [{ state: 'missingOrExpired' }];
  const btn = await mount();
  expect(btn()!.textContent).toBe('Replay indisponível');
  expect(btn()!.disabled).toBe(true);
  render(null, root);
  config.isReplaysForMatchHistoryEnabled = false;
  const hidden = await mount();
  expect(hidden()).toBeNull();
});
