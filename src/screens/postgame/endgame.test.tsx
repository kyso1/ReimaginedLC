import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { Honor } from '../honor/Honor';
import { InGame } from '../ingame/InGame';
import { PostGame } from './PostGame';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
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
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text);
const calls = (url: string) => fetchMock.mock.calls.filter((c) => c[0] === url);
const withValues = (values: Partial<Record<keyof Lcu, unknown>>) => {
  const lcu = fakeLcu();
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  return lcu;
};

const gameflow = { gameData: { queue: { description: 'Normal (Escolha)' }, playerChampionSelections: [] }, map: { name: "Summoner's Rift" } };

test('partida: texto por fase, mapa e fila', () => {
  for (const [phase, text] of [['GameStart', 'Abrindo a partida'], ['InProgress', 'Partida em andamento'], ['WaitingForStats', 'Carregando resultados']] as const) {
    act(() => render(<InGame lcu={withValues({ gameflowPhase: ready(phase), gameflowSession: ready(gameflow) })} />, root));
    expect(root.textContent).toContain(text);
    expect(root.textContent).toContain("Summoner's Rift");
    expect(root.textContent).toContain('Normal (Escolha)');
    expect(btn('Reconectar')).toBeUndefined();
  }
});

test('partida: Reconnect mostra Reconectar e chama a LCU', () => {
  act(() => render(<InGame lcu={withValues({ gameflowPhase: ready('Reconnect'), gameflowSession: ready(gameflow) })} />, root));
  act(() => btn('Reconectar')!.click());
  expect(calls('/lol-gameflow/v1/reconnect')).toHaveLength(1);
});

const ally = (over = {}) => ({ puuid: 'p1', summonerName: '', championName: 'Ahri', championId: 103, skinSplashPath: '/s/ahri.jpg', role: '', botPlayer: false, ...over });

test('honra: um cartão por aliado; clique honra pelo puuid; Pular esconde os cartões', async () => {
  const lcu = withValues({ honorBallot: ready({ eligibleAllies: [ally(), ally({ puuid: 'p2', championName: 'Yasuo', summonerName: 'Zeca' })], eligibleOpponents: [] }) });
  lcu.name = async (p) => (p === 'p1' ? 'Fulano' : null);
  act(() => render(<Honor lcu={lcu} />, root));
  await settle();
  const cards = root.querySelectorAll('.rlc-honor-card');
  expect(cards).toHaveLength(2);
  expect(cards[0]!.textContent).toContain('Fulano');
  expect(cards[0]!.textContent).toContain('Ahri');
  expect(cards[1]!.textContent).toContain('Zeca');
  act(() => (cards[1] as HTMLButtonElement).click());
  expect(JSON.parse(calls('/lol-honor-v2/v1/honor-player')[0]![1].body)).toEqual({ recipientPuuid: 'p2', honorType: 'HEART' });
  act(() => btn('Pular')!.click());
  expect(root.querySelectorAll('.rlc-honor-card')).toHaveLength(0);
});

test('honra sem cédula mostra aguardando', () => {
  act(() => render(<Honor lcu={withValues({ honorBallot: ready(null) })} />, root));
  expect(root.textContent).toContain('Aguardando');
});

const player = (over: Record<string, unknown> = {}) => ({
  puuid: 'me', riotIdGameName: 'Fulano', summonerName: '', championId: 103, skinSplashPath: '/s/ahri.jpg', items: [],
  stats: { CHAMPIONS_KILLED: 8, NUM_DEATHS: 2, ASSISTS: 11, MINIONS_KILLED: 190, NEUTRAL_MINIONS_KILLED: 24, TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: 31000, GOLD_EARNED: 12500 },
  ...over,
});
const eog = (win: boolean) => ({
  gameLength: 1721, queueType: 'NORMAL', gameMode: 'CLASSIC', localPlayer: player(),
  teams: [
    { isPlayerTeam: true, isWinningTeam: win, players: [player(), player({ puuid: 'a', riotIdGameName: 'Zeca', stats: { TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: 40000 } })] },
    { isPlayerTeam: false, isWinningTeam: !win, players: [player({ puuid: 'e', riotIdGameName: 'Beltrano' })] },
  ],
});

test('pós-jogo: vitória, KDA, farm, dano, ouro, duração; barra relativa ao maior dano', () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready(eog(true)) })} />, root));
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('Vitória');
  expect(root.textContent).toContain('8/2/11');
  expect(root.textContent).toContain('214');
  expect(root.textContent).toContain('31.000');
  expect(root.textContent).toContain('12.500');
  expect(root.textContent).toContain('28:41');
  expect(root.querySelector<HTMLElement>('.rlc-pg-bar > b')!.style.width).toBe('77.5%');
  expect(root.querySelector<HTMLElement>('.rlc-pg-bg')!.style.backgroundImage).toContain('/s/ahri.jpg');
});

test('pós-jogo: derrota e placar completo na gaveta', () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready(eog(false)) })} />, root));
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('Derrota');
  expect(root.querySelector('.rlc-pg-board')).toBeNull();
  act(() => btn('Ver placar completo')!.click());
  const board = root.querySelector('.rlc-pg-board')!;
  expect(board.textContent).toContain('Zeca');
  expect(board.textContent).toContain('Beltrano');
});

test('pós-jogo: Jogar de novo e Sair', async () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready(eog(true)) })} />, root));
  act(() => btn('Jogar de novo')!.click());
  expect(calls('/lol-lobby/v2/play-again')).toHaveLength(1);
  await settle();
  act(() => btn('Sair')!.click());
  await settle();
  expect(calls('/lol-end-of-game/v1/state/dismiss-stats')).toHaveLength(1);
  expect(calls('/lol-lobby/v2/play-again-decline')).toHaveLength(1);
});

test('pós-jogo sem dados mostra traço e mantém os botões', () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready(null) })} />, root));
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('—');
  expect(btn('Jogar de novo')).toBeDefined();
  expect(btn('Sair')).toBeDefined();
});

test('Sair envia a recusa mesmo se dismiss-stats falhar', async () => {
  window.Toast = { success: vi.fn(), error: vi.fn() };
  fetchMock.mockImplementation(async (url: string) => (url === '/lol-end-of-game/v1/state/dismiss-stats' ? new Response('{"message":"x"}', { status: 404 }) : new Response(null, { status: 204 })));
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready(eog(true)) })} />, root));
  act(() => btn('Sair')!.click());
  await settle();
  expect(calls('/lol-lobby/v2/play-again-decline')).toHaveLength(1);
  delete window.Toast;
});

test('dados parciais do pós-jogo não quebram nem mostram NaN', () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready({ localPlayer: player(), teams: [{ isPlayerTeam: true, isWinningTeam: true }] }) })} />, root));
  expect(root.textContent).not.toContain('NaN');
  act(() => btn('Ver placar completo')!.click());
  expect(root.querySelector('.rlc-pg-board')).not.toBeNull();
});
