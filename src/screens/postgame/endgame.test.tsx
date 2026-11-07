import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { eogBlock, eogPlayer, fakeLcu, ready } from '../../test/fixtures';
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

test('honra: aliados e inimigos; cada clique gasta um voto; sem votos, a cédula é enviada', async () => {
  const lcu = withValues({
    honorBallot: ready({
      eligibleAllies: [ally(), ally({ puuid: 'p2', summonerId: 42, championName: 'Yasuo', summonerName: 'Zeca' })],
      eligibleOpponents: [ally({ puuid: 'e1', summonerId: 7, championName: 'Zed', summonerName: 'Rival' })],
      votePool: { votes: 2 },
      honoredPlayers: [],
      gameId: 777,
    }),
  });
  lcu.name = async (p) => (p === 'p1' ? 'Fulano' : null);
  act(() => render(<Honor lcu={lcu} />, root));
  await settle();
  const cards = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-honor-card')];
  expect(cards()).toHaveLength(3);
  expect(cards()[0]!.textContent).toContain('Fulano');
  expect(root.querySelector('.rlc-honor-team[data-side="enemy"]')!.textContent).toContain('Rival');
  await act(async () => cards()[2]!.click());
  await settle();
  expect(JSON.parse(calls('/lol-honor/v1/honor')[0]![1].body)).toEqual({ recipientPuuid: 'e1', honorType: 'HEART' });
  expect(cards()[2]!.dataset.voted).toBe('true');
  expect(root.querySelector('.rlc-honor-votes')!.textContent).toBe('1 voto(s) restante(s)');
  expect(calls('/lol-honor/v1/ballot')).toHaveLength(0);
  await act(async () => cards()[1]!.click());
  await settle();
  expect(cards()[0]!.disabled).toBe(true);
  await act(async () => void (await new Promise((r) => setTimeout(r, 900))));
  expect(calls('/lol-honor/v1/ballot')).toHaveLength(1);
  expect(root.querySelectorAll('.rlc-honor-card')).toHaveLength(0);
});

test('fim de jogo mostra quem te honrou, com o inimigo marcado', async () => {
  const eog = eogBlock(true, me());
  eog.teams[1]!.players[0]!.puuid = 'foe';
  const lcu = postgame(eog);
  (lcu.honorRecognition as { value: unknown }).value = ready([{ senderPuuid: 'foe', honorCategory: 'HEART', voterRelationship: 'STRANGER' }, { senderPuuid: '', honorCategory: 'HEART', voterRelationship: '' }]);
  act(() => render(<PostGame lcu={lcu} />, root));
  await settle();
  const row = root.querySelector('.rlc-pg-honors')!;
  expect(row.querySelector('small')!.textContent).toBe('Honrado por 2');
  expect([...row.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['BeltranoInimigo', 'Anônimo']);
});

test('honra sem cédula mostra aguardando', () => {
  act(() => render(<Honor lcu={withValues({ honorBallot: ready(null) })} />, root));
  expect(root.textContent).toContain('Aguardando');
});

// Respostas da LCU por URL; o resto responde 204 (getJson vira null).
const routes = (map: Record<string, unknown>) =>
  fetchMock.mockImplementation(async (url: string) => (url in map ? new Response(JSON.stringify(map[url]), { status: 200 }) : new Response(null, { status: 204 })));
const me = () =>
  eogPlayer({
    puuid: 'me', isLocalPlayer: true,
    stats: { CHAMPIONS_KILLED: 8, NUM_DEATHS: 2, ASSISTS: 11, MINIONS_KILLED: 190, NEUTRAL_MINIONS_KILLED: 24, TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: 31000, GOLD_EARNED: 12500, VISION_SCORE: 42 },
  });
const session = (gameMode = 'CLASSIC') => ({ gameData: { gameId: 3200000001, queue: { id: 420, description: 'Ranqueada Solo/Duo', gameMode } } });
const postgame = (eog: unknown, gameMode = 'CLASSIC') => withValues({ endOfGame: ready(eog), gameflowSession: ready(session(gameMode)) });

test('pós-jogo: manchete Vitória, campeão, fila, duração, seus números e o pódio na partida', async () => {
  const eog = eogBlock(true, me());
  // Pódio só faz sentido com mais de três jogadores.
  eog.teams[1]!.players.push(eogPlayer({ teamId: 200 }), eogPlayer({ teamId: 200, stats: { VISION_SCORE: 60 } }));
  act(() => render(<PostGame lcu={postgame(eog)} />, root));
  await settle();
  expect(root.querySelector('.rlc-postgame')!.getAttribute('data-result')).toBe('win');
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('Vitória');
  const head = root.querySelector('.rlc-pg-head')!.textContent!;
  for (const text of ['Ahri', 'Ranqueada Solo/Duo', '28:41', '8/2/11', '214', '31.000', '42']) expect(head).toContain(text);
  // Primeiro em KDA, farm e dano; segundo em visão.
  expect([...root.querySelectorAll('.rlc-pg-numbers small')].map((s) => s.textContent)).toEqual(['1º da partida', '1º da partida', '1º da partida', '2º da partida']);
  expect(root.querySelector<HTMLElement>('.rlc-pg-bg')!.style.backgroundImage).toContain('/s/ahri.jpg');
});

test('pós-jogo: placar do perfil já aberto, sua linha marcada; Gráficos mostra dano por jogador', async () => {
  act(() => render(<PostGame lcu={postgame(eogBlock(false, me()))} />, root));
  await settle();
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('Derrota');
  const board = root.querySelector('.rlc-pg-board')!;
  expect(board.querySelectorAll('table.rlc-md-board')).toHaveLength(2);
  expect(board.textContent).toContain('Zeca');
  expect(board.textContent).toContain('Beltrano');
  const mine = board.querySelector('tr[data-me="true"]')!;
  expect(mine.textContent).toContain('Fulano');
  // Sete encaixes de item por jogador, como no histórico.
  expect(mine.querySelectorAll('.rlc-md-item')).toHaveLength(7);
  act(() => btn('Gráficos')!.click());
  expect(root.querySelectorAll('.rlc-md-bars li')).toHaveLength(3);
});

test('pós-jogo: destaques marcam o melhor do time vencedor e os maiores números', async () => {
  act(() => render(<PostGame lcu={postgame(eogBlock(false, me()))} />, root));
  await settle();
  const marks = [...root.querySelectorAll('.rlc-pg-marks li')].map((li) => li.textContent);
  expect(marks[0]).toBe('Melhor da partidaBeltrano');
  expect(marks[1]).toBe('Mais danoFulano');
});

test('pós-jogo: progresso com XP da conta, PDL do aviso desta partida e maestria', async () => {
  routes({
    '/lol-ranked/v1/current-lp-change-notification': { gameId: 3200000001, queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', division: 'II', leaguePoints: 61, leaguePointsDelta: 21 },
    '/lol-end-of-game/v1/champion-mastery-updates': { level: 7, pointsGained: 1240, hasLeveledUp: false, pointsSinceLastLevelBeforeGame: 2000, pointsUntilNextLevelAfterGame: 6760, grade: 'S' },
  });
  act(() => render(<PostGame lcu={postgame(eogBlock(true, me()))} />, root));
  await settle();
  const progress = root.querySelector('.rlc-pg-progress')!.textContent!;
  for (const text of ['nível 212', '+240 XP', 'Ouro II 61 PdL', '+21 PdL', 'nível 7 · S', '+1.240 pontos']) expect(progress).toContain(text);
  const meters = [...root.querySelectorAll<HTMLElement>('.rlc-pg-meter i')].map((i) => i.style.width);
  expect(meters).toEqual(['60%', '61%', '32.4%']);
});

test('pós-jogo: aviso de PDL de outra partida não aparece', async () => {
  routes({ '/lol-ranked/v1/current-lp-change-notification': { gameId: 1, tier: 'GOLD', division: 'II', leaguePoints: 40, leaguePointsDelta: -18 } });
  act(() => render(<PostGame lcu={postgame(eogBlock(true, me()))} />, root));
  await settle();
  expect(root.textContent).not.toContain('-18');
});

test('pós-jogo: a partida do histórico, quando chega, vale no placar', async () => {
  routes({
    '/lol-match-history/v1/games/3200000001': {
      gameId: 3200000001, queueId: 420, gameDuration: 1721, gameCreation: 0,
      participants: [
        { participantId: 1, teamId: 100, championId: 103, stats: { kills: 8, deaths: 2, assists: 11, win: true } },
        { participantId: 6, teamId: 200, championId: 238, stats: { win: false } },
      ],
      participantIdentities: [
        { participantId: 1, player: { gameName: 'Fulano', puuid: 'me' } },
        { participantId: 6, player: { gameName: 'Ciclano' } },
      ],
    },
  });
  act(() => render(<PostGame lcu={postgame(eogBlock(true, me()))} />, root));
  await settle();
  expect(root.querySelector('.rlc-pg-board')!.textContent).toContain('Ciclano');
});

test('pós-jogo: ações para todos os outros jogadores num menu solto (o placar não corta) e cartão no nome', async () => {
  root.id = 'rlc-root';
  const eog = eogBlock(false, me());
  eog.teams[0]!.players[1]!.summonerId = 77;
  act(() => render(<PostGame lcu={postgame(eog)} />, root));
  await settle();
  const cells = [...root.querySelectorAll('.rlc-pg-board .rlc-md-name')];
  // Eu sem menu; todos os outros com menu e com o cartão ao passar o mouse no nome.
  expect(cells.map((td) => !!td.querySelector('.rlc-col-menu'))).toEqual([false, true, true]);
  expect(cells.every((td) => !!td.querySelector('.rlc-phover'))).toBe(true);
  act(() => cells[1]!.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  const menu = root.querySelector(':scope > .rlc-menu[data-floating]')!;
  expect([...menu.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Ver perfil', 'Convidar para jogar', 'Adicionar', 'Denunciar']);
  root.removeAttribute('id');
});
