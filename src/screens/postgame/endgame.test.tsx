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

// Formato real de /lol-end-of-game/v1/tft-eog-stats (Set 18), anonimizado e reduzido.
const tftPiece = (championId: string, name: string, level: number, price: number, traits: Array<[string, string]>, items: string[] = []) => ({
  championId, name, level, price,
  icon: `/lol-game-data/assets/ASSETS/Characters/${championId}/${championId}_Square.png`,
  items: items.map((nameId) => ({ id: 0, nameId, name: nameId.replace('DA_', ''), icon: `/i/${nameId}.png` })),
  traits: traits.map(([id, nm]) => ({ id, name: nm })),
});
const tftPlayer = (puuid: string, riotIdGameName: string, rank: number, species: string, boardPieces: unknown[], over = {}) => ({
  puuid, riotIdGameName, riotIdTagLine: 'BR1', summonerName: riotIdGameName, rank, ffaStanding: rank, partnerGroupId: 0, health: 0, iconId: 29, isLocalPlayer: false, isInteractable: true,
  augments: [], setCoreName: 'TFTSet18', playbook: { iconSmall: '', itemId: 0, name: '' },
  companion: { colorName: '', speciesName: species, icon: `/lol-game-data/assets/ASSETS/Loadouts/Companions/Tooltip_Chibi${species}_Tier1.png` },
  boardPieces, ...over,
});
const tftEog = () => {
  const local = tftPlayer('me', 'Fulano', 1, 'Janna', [
    tftPiece('DA_KogMaw18_AD', "Kog'Maw", 3, 3, [['DA_18_Caustic', 'Caustic'], ['DA_18_Adaptor', 'Adaptor']], ['DA_Morellonomicon', 'DA_SpearOfShojin']),
    tftPiece('DA_18_MasterYi_AD', 'Master Yi', 3, 3, [['DA_18_Blossom', 'Blossom'], ['DA_18_Adaptor', 'Adaptor']]),
    tftPiece('DA_Vi18', 'Vi', 2, 4, [['DA_18_Adaptor', 'Adaptor']]),
    // Unidade repetida: o traço conta uma vez só.
    tftPiece('DA_Vi18', 'Vi', 1, 4, [['DA_18_Adaptor', 'Adaptor']]),
  ], { isLocalPlayer: true, augments: [{ id: 0, nameId: 'TFT_Augment_X', name: 'Aumento X', icon: '/a/x.png' }] });
  return {
    gameId: 3200000002, gameLength: 2228, isRanked: true, queueId: 1100, queueType: 'RANKED_TFT', localPlayer: local,
    players: [{ ...local }, tftPlayer('x', 'Zeca', 2, 'Akali', [tftPiece('DA_18_Alistar', 'Alistar', 3, 2, [['DA_18_Blossom', 'Blossom']])])],
  };
};
const tftTraits = [
  { trait_id: 'DA_18_Adaptor', display_name: 'Adaptador', icon_path: '/t/adaptor.png', conditional_trait_sets: [{ min_units: 2, style_name: 'kBronze' }, { min_units: 3, style_name: 'kSilver' }, { min_units: 4, style_name: 'kGold' }] },
  { trait_id: 'DA_18_Caustic', display_name: 'Cáustico', icon_path: '/t/caustic.png', conditional_trait_sets: [{ min_units: 1, style_name: 'kUnique' }] },
  { trait_id: 'DA_18_Blossom', display_name: 'Florescer', icon_path: '/t/blossom.png', conditional_trait_sets: [{ min_units: 2, style_name: 'kBronze' }] },
];

test('TFT: colocação na manchete, Pequena Lenda, fundo de TFT, composição com traços em emblemas e a classificação com a de cada um', async () => {
  routes({ '/lol-end-of-game/v1/tft-eog-stats': tftEog(), '/lol-game-data/assets/v1/tfttraits.json': tftTraits });
  const lcu = postgame(null, 'TFT');
  (lcu.gameflowSession as { value: unknown }).value = ready({ ...session('TFT'), map: { assets: { 'gameflow-background': 'lol-game-data/assets/tft/gameflow.jpg', 'parties-background': 'lol-game-data/assets/tft/lobby.jpg' } } });
  lcu.game = { ...lcu.game, companions: async () => new Map([['c1', { itemId: 1, name: 'Chibi Janna Previsão', icon: '/lol-game-data/assets/ASSETS/Loadouts/Companions/Tooltip_ChibiJanna_Tier1.png' }]]) };
  act(() => render(<PostGame lcu={lcu} />, root));
  await settle();
  await settle();
  expect(root.querySelector('.rlc-pg-result')!.textContent).toBe('1º');
  expect(root.querySelector('.rlc-postgame')!.getAttribute('data-mode')).toBe('tft');
  expect(root.querySelector<HTMLElement>('.rlc-pg-bg')!.style.backgroundImage).toContain('/lol-game-data/assets/tft/lobby.jpg');
  expect(root.querySelector<HTMLImageElement>('.rlc-pg-who .rlc-pg-legend')!.src).toContain('Tooltip_ChibiJanna');
  expect(root.querySelector('.rlc-pg-who')!.textContent).toContain('37:08');
  // Sua composição: estrelas e itens.
  expect([...root.querySelectorAll('.rlc-pg-stars')].map((s) => s.textContent)).toEqual(['★★★', '★★★', '★★', '★']);
  expect(root.querySelectorAll('.rlc-pg-unititems img')).toHaveLength(2);
  // Traços: Adaptador com 3 unidades diferentes (Vi repetida conta uma vez) é prata; Cáustico único sai ouro; Florescer com 1 de 2 fica de fora.
  const traits = [...root.querySelectorAll('.rlc-pg-traits .rlc-tft-trait')].map((e) => [e.getAttribute('data-style'), e.querySelector('img')!.getAttribute('src'), e.textContent]);
  expect(traits).toEqual([
    ['3', '/t/caustic.png', '1Cáustico'],
    ['2', '/t/adaptor.png', '3Adaptador'],
  ]);
  expect(root.querySelector('.rlc-pg-augs')!.textContent).toContain('Aumento X');
  // Classificação: Pequena Lenda de cada um (a sua com o nome do catálogo), nome, unidades e traços.
  const rows = [...root.querySelectorAll('.rlc-tft-standings > li')];
  expect(rows.map((li) => li.querySelector('.rlc-tft-who')!.textContent)).toEqual(['Fulano', 'Zeca']);
  expect(rows[0]!.getAttribute('data-me')).toBe('true');
  expect(rows.map((li) => li.querySelector<HTMLImageElement>('.rlc-tft-legend')!.getAttribute('src'))).toEqual([
    '/lol-game-data/assets/ASSETS/Loadouts/Companions/Tooltip_ChibiJanna_Tier1.png',
    '/lol-game-data/assets/ASSETS/Loadouts/Companions/Tooltip_ChibiAkali_Tier1.png',
  ]);
  expect(rows[0]!.querySelector('.rlc-tft-legend')!.getAttribute('alt')).toBe('Chibi Janna Previsão');
  expect(rows[1]!.querySelector('.rlc-tft-legend')!.getAttribute('alt')).toBe('Akali');
  expect(rows[1]!.querySelectorAll('.rlc-tft-unit')).toHaveLength(1);
  expect(rows[1]!.querySelector('.rlc-tft-unit img')!.getAttribute('src')).toContain('DA_18_Alistar');
  expect(rows[0]!.querySelectorAll('.rlc-tft-traits .rlc-tft-trait')).toHaveLength(2);
  expect(rows[0]!.querySelector('.rlc-tft-aug')!.getAttribute('src')).toBe('/a/x.png');
  expect(root.textContent).not.toContain('DA_');
});

test('pós-jogo: Jogar de novo e Sair', async () => {
  act(() => render(<PostGame lcu={postgame(eogBlock(true, me()))} />, root));
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
  fetchMock.mockImplementation(async (url: string) =>
    url === '/lol-end-of-game/v1/state/dismiss-stats' ? new Response('{"message":"x"}', { status: 404 }) : new Response(null, { status: 204 }),
  );
  act(() => render(<PostGame lcu={postgame(eogBlock(true, me()))} />, root));
  act(() => btn('Sair')!.click());
  await settle();
  expect(calls('/lol-lobby/v2/play-again-decline')).toHaveLength(1);
  delete window.Toast;
});

test('dados parciais do pós-jogo não quebram nem mostram NaN', async () => {
  act(() => render(<PostGame lcu={withValues({ endOfGame: ready({ localPlayer: me(), teams: [{ isPlayerTeam: true, isWinningTeam: true }] }) })} />, root));
  await settle();
  expect(root.textContent).not.toContain('NaN');
  expect(root.textContent).not.toContain('undefined');
});

// Histórico de TFT (formato de /lol-match-history/v1/products/tft/{puuid}/matches, reduzido).
const histP = (puuid: string, riotIdGameName: string, placement: number, over = {}) => ({
  puuid, riotIdGameName, placement, level: 8, gold_left: 3, last_round: 30 + 8 - placement, time_eliminated: 1500 + (8 - placement) * 60, missions: { PlayerScore2: 200 - placement },
  total_damage_to_players: 0, players_eliminated: 0, traits: [{ name: 'DA_18_Adaptor', num_units: 3, style: 2 }, { name: 'DA_18_Caustic', num_units: 1, style: 3 }, { name: 'DA_18_Blossom', num_units: 1, style: 0 }],
  units: [{ character_id: 'DA_Vi18', itemNames: ['DA_Morellonomicon'], rarity: 3, tier: 2 }], ...over,
});
const histGame = (gameId: number, place: number, queue_id = 1100, over = {}) => ({ json: { gameId, queue_id, game_datetime: 0, participants: [histP('me', 'Fulano', place, over), histP('x', 'Zeca', place === 1 ? 2 : 1)] } });
const TFT_HISTORY = '/lol-match-history/v1/products/tft/me/matches?begin=0&count=20';
const tftLcu = () => {
  const lcu = postgame(null, 'TFT');
  lcu.game = { ...lcu.game, companions: async () => new Map() };
  return lcu;
};

test('TFT: classificação com fatos do lobby (tabuleiro mais caro, mais itens, disputadas)', async () => {
  const eog = tftEog();
  eog.players[1]!.boardPieces.push(tftPiece('DA_Vi18', 'Vi', 2, 4, [['DA_18_Adaptor', 'Adaptor']]));
  routes({ '/lol-end-of-game/v1/tft-eog-stats': eog, '/lol-game-data/assets/v1/tfttraits.json': tftTraits });
  act(() => render(<PostGame lcu={tftLcu()} />, root));
  await settle();
  await settle();
  const facts = [...root.querySelectorAll('.rlc-pg-lobby .rlc-pg-facts > div')].map((d) => d.textContent);
  // Fulano: 3×9 + 3×9 + 4×3 + 4×1 = 70; Zeca: 2×9 + 4×3 = 30.
  expect(facts).toEqual(['Tabuleiro mais caroFulano70 de ouro', 'Mais itensFulano2 itens', 'Seu tabuleiro70 de ouro1º mais caro do lobby']);
  expect(root.querySelector('.rlc-pg-contested')!.textContent).toContain('Vi1 jogador(es) · 3 cópias');
  expect(root.querySelectorAll('.rlc-tft-standings > li')).toHaveLength(2);
});

test('TFT: aba Partida com traços (3/4, falta 1) e quem caiu quando; dano e eliminações zerados ficam de fora', async () => {
  routes({
    '/lol-end-of-game/v1/tft-eog-stats': tftEog(),
    '/lol-game-data/assets/v1/tfttraits.json': tftTraits,
    [TFT_HISTORY]: { games: [histGame(3200000002, 1), histGame(1, 5)] },
  });
  act(() => render(<PostGame lcu={tftLcu()} />, root));
  await settle();
  await settle();
  act(() => btn('Partida')!.click());
  const prog = [...root.querySelectorAll('.rlc-pg-tprog li')].map((li) => li.textContent);
  expect(prog).toEqual(['Cáustico1estágio máximo', 'Adaptador3/4falta(m) 1 para o próximo estágio', 'Florescer1/2falta(m) 1 para o próximo estágio']);
  const head = [...root.querySelectorAll('.rlc-pg-elim th')].map((th) => th.textContent);
  expect(head).toEqual(['Caiu', 'Jogador', 'Nível', 'Ouro restante', 'Pontuação Riot']);
  const rows = [...root.querySelectorAll('.rlc-pg-elim tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent));
  expect(rows).toEqual([
    ['rodada 3631:00', '2ºZeca⋯', '8', '3', '198'],
    ['Venceu', '1ºFulano', '8', '3', '199'],
  ]);
  expect(root.textContent).not.toContain('DA_');
});

test('TFT: partida ainda fora do histórico mostra carregando e tenta de novo', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  routes({ '/lol-end-of-game/v1/tft-eog-stats': tftEog(), [TFT_HISTORY]: { games: [histGame(1, 5)] } });
  act(() => render(<PostGame lcu={tftLcu()} />, root));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  act(() => btn('Partida')!.click());
  expect(root.querySelector('.rlc-loader')!.textContent).toBe('Carregando detalhes da partida…');
  routes({ '/lol-end-of-game/v1/tft-eog-stats': tftEog(), [TFT_HISTORY]: { games: [histGame(3200000002, 1), histGame(1, 5)] } });
  await act(async () => void (await vi.advanceTimersByTimeAsync(10_000)));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelectorAll('.rlc-pg-elim tbody tr')).toHaveLength(2);
  expect(calls(TFT_HISTORY)).toHaveLength(2);
  vi.useRealTimers();
});

test('TFT: você vs seu histórico (média da fila, top 4 seguidos, comp repetida, PdL até a próxima divisão, mais usados)', async () => {
  routes({
    '/lol-end-of-game/v1/tft-eog-stats': tftEog(),
    '/lol-game-data/assets/v1/tfttraits.json': tftTraits,
    '/lol-ranked/v1/current-lp-change-notification': { gameId: 3200000001, queueType: 'RANKED_TFT', tier: 'DIAMOND', division: 'II', leaguePoints: 49, leaguePointsDelta: 30 },
    [TFT_HISTORY]: { games: [histGame(3200000002, 1), histGame(3, 3), histGame(2, 6), histGame(9, 1, 1090), histGame(1, 2)] },
  });
  act(() => render(<PostGame lcu={tftLcu()} />, root));
  await settle();
  await settle();
  act(() => btn('Você vs seu histórico')!.click());
  const facts = [...root.querySelectorAll('.rlc-pg-vs .rlc-pg-facts > div')].map((d) => d.textContent);
  // A normal (1090) fica fora: média de 3, 6 e 2.
  expect(facts).toEqual(['Esta partida1ºmelhor que sua média', 'Sua média3,7últimas 3', 'Top 4 seguidos2contando esta', 'Até Diamante I51 PdL~2 partida(s) como esta']);
  expect([...root.querySelectorAll('.rlc-pg-vs .rlc-tft-strip li')].map((li) => li.textContent)).toEqual(['1', '3', '6', '2']);
  expect(root.querySelector('.rlc-pg-comp')!.textContent).toContain('Mesma comp: 3× · média 3,7');
  const used = root.querySelector('.rlc-pg-used li[data-here="true"]')!;
  expect(used.textContent).toBe('Vi3×');
});
