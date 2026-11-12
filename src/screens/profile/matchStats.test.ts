import { expect, test } from 'vitest';
import type { Game, Participant, Timeline } from './data';
import { diffAt, killsPerMinute, kills, laneOpponent, metricSeries, objectives, roles, teamShare, teamSummaries, twoTeams } from './matchStats';

const part = (id: number, team: number, stats: Record<string, number | boolean> = {}, over: Partial<Participant> = {}): Participant => ({ participantId: id, teamId: team, championId: id, stats, ...over });
const teamOf = { 1: 100, 2: 100, 6: 200, 7: 200 };
// Posições típicas de Summoner's Rift: topo (x pequeno, y grande), meio (diagonal), robô (x grande, y pequeno).
const TOP = { x: 1500, y: 11000 };
const MID = { x: 7000, y: 7400 };
const BOT = { x: 12000, y: 1800 };
const frame = (min: number, pos: Record<number, { x: number; y: number }>, extra: Record<number, Partial<Timeline['frames'][number]['participantFrames'][string]>> = {}, events: Timeline['frames'][number]['events'] = []) => ({
  timestamp: min * 60000,
  events,
  participantFrames: Object.fromEntries(Object.entries(pos).map(([id, position]) => [id, { participantId: Number(id), totalGold: 500 + min * 300, xp: min * 400, level: 1 + min, minionsKilled: min * 7, jungleMinionsKilled: 0, position, ...extra[Number(id)] }])),
});

test('objetivos: estrutura vai para o time contrário ao dono; dragão com elemento, ancião à parte; quem levou é o time de quem matou', () => {
  const tl: Timeline = {
    frames: [
      frame(0, {}),
      frame(1, {}, {}, [
        { type: 'BUILDING_KILL', timestamp: 70000, teamId: 100, buildingType: 'TOWER_BUILDING', laneType: 'BOT_LANE', killerId: 0 },
        { type: 'ELITE_MONSTER_KILL', timestamp: 80000, killerId: 2, monsterType: 'DRAGON', monsterSubType: 'EARTH_DRAGON' },
        { type: 'ELITE_MONSTER_KILL', timestamp: 90000, killerId: 7, monsterType: 'DRAGON', monsterSubType: 'ELDER_DRAGON' },
        { type: 'ELITE_MONSTER_KILL', timestamp: 95000, killerId: 6, monsterType: 'HORDE' },
        { type: 'BUILDING_KILL', timestamp: 99000, teamId: 200, buildingType: 'INHIBITOR_BUILDING', killerId: 1 },
        { type: 'CHAMPION_KILL', timestamp: 100000, killerId: 1, victimId: 6 },
      ]),
    ],
  };
  expect(objectives(tl, teamOf)).toEqual([
    { t: 70000, kind: 'tower', team: 200, sub: 'BOT_LANE' },
    { t: 80000, kind: 'dragon', team: 100, sub: 'EARTH_DRAGON' },
    { t: 90000, kind: 'elder', team: 200, sub: undefined },
    { t: 95000, kind: 'grubs', team: 200, sub: undefined },
    { t: 99000, kind: 'inhibitor', team: 100, sub: undefined },
  ]);
});

test('abates: execução (sem matador) conta para o time contrário ao da vítima; por minuto no tamanho da linha do tempo', () => {
  const tl: Timeline = {
    frames: [
      frame(0, {}, {}, [{ type: 'CHAMPION_KILL', timestamp: 30000, killerId: 1, victimId: 6, position: { x: 1, y: 2 }, assistingParticipantIds: [2] }]),
      frame(1, {}, {}, [
        { type: 'CHAMPION_KILL', timestamp: 65000, killerId: 0, victimId: 1 },
        { type: 'CHAMPION_KILL', timestamp: 70000, killerId: 7, victimId: 2 },
      ]),
      frame(2, {}),
    ],
  };
  const list = kills(tl, teamOf);
  expect(list.map((k) => [k.killer, k.victim, k.team])).toEqual([
    [1, 6, 100],
    [0, 1, 200],
    [7, 2, 200],
  ]);
  expect(list[0]!.assists).toEqual([2]);
  expect(killsPerMinute(list, 3)).toEqual({ blue: [1, 0, 0], red: [0, 2, 0] });
});

test('rotas pela posição dos minutos 2 a 10; Golpear é selva; no robô o de mais farm é atirador; oponente é a mesma rota do outro lado', () => {
  const game: Game = {
    gameId: 1, queueId: 420, gameDuration: 1800, gameCreation: 0, mapId: 11,
    participants: [
      part(1, 100, { totalMinionsKilled: 200 }, { timeline: { lane: 'JUNGLE' } }),
      part(2, 100, { totalMinionsKilled: 30 }, { spell2Id: 11 }),
      part(3, 100, { totalMinionsKilled: 20 }),
      part(4, 100, { totalMinionsKilled: 180 }),
      part(6, 200, { totalMinionsKilled: 210 }),
      part(7, 200, { totalMinionsKilled: 150 }),
      part(8, 200, { totalMinionsKilled: 25 }),
    ],
    participantIdentities: [],
  };
  const pos = { 1: TOP, 2: MID, 3: BOT, 4: BOT, 6: TOP, 7: BOT, 8: BOT };
  const tl: Timeline = { frames: Array.from({ length: 12 }, (_, m) => frame(m, pos)) };
  const r = roles(game, tl);
  expect(r).toEqual({ 1: 'TOP', 2: 'JUNGLE', 4: 'BOTTOM', 3: 'UTILITY', 6: 'TOP', 7: 'BOTTOM', 8: 'UTILITY' });
  expect(laneOpponent(game, r, game.participants[0])?.participantId).toBe(6);
  // Ninguém do outro lado na selva: sem oponente.
  expect(laneOpponent(game, r, game.participants[1])).toBeUndefined();
});

test('séries e diferença no minuto: farm soma tropas e selva; minuto além da partida é null', () => {
  const tl: Timeline = { frames: [frame(0, { 1: MID, 6: MID }), frame(1, { 1: MID, 6: MID }, { 1: { minionsKilled: 9, jungleMinionsKilled: 2, totalGold: 1000 } })] };
  expect(metricSeries(tl, 1, 'cs')).toEqual([0, 11]);
  expect(metricSeries(tl, 1, 'level')).toEqual([1, 2]);
  expect(diffAt(tl, 1, 6, 1, 'gold')).toBe(1000 - 800);
  expect(diffAt(tl, 1, 6, 1, 'cs')).toBe(11 - 7);
  expect(diffAt(tl, 1, 6, 10, 'gold')).toBeNull();
});

test('parte no time e resumo dos objetivos (firstDargon da LCU, dragões dos eventos)', () => {
  const game: Game = {
    gameId: 1, queueId: 420, gameDuration: 1800, gameCreation: 0,
    participants: [part(1, 100, { totalDamageDealtToChampions: 3000, kills: 4, assists: 2, goldEarned: 9000, win: true }), part(2, 100, { totalDamageDealtToChampions: 1000, kills: 1, goldEarned: 7000, win: true }), part(6, 200, { kills: 2, goldEarned: 8000 })],
    participantIdentities: [],
    teams: [
      { teamId: 100, win: 'Win', towerKills: 7, inhibitorKills: 1, baronKills: 1, riftHeraldKills: 0, hordeKills: 3, firstBlood: true, firstDargon: true },
      { teamId: 200, win: 'Fail', towerKills: 2, firstTower: true },
    ],
  };
  expect(teamShare(game, game.participants[0]!, 'damage')).toBe(0.75);
  expect(teamShare(game, game.participants[0]!, 'kp')).toBeNull();
  const [blue, red] = teamSummaries(game, [
    { t: 1, kind: 'dragon', team: 100, sub: 'FIRE_DRAGON' },
    { t: 2, kind: 'dragon', team: 100, sub: 'WATER_DRAGON' },
    { t: 3, kind: 'atakhan', team: 200 },
  ]);
  expect(blue).toMatchObject({ win: true, kills: 5, gold: 16000, towers: 7, inhibitors: 1, barons: 1, grubs: 3, dragons: ['FIRE_DRAGON', 'WATER_DRAGON'], firsts: ['blood', 'dragon'] });
  expect(red).toMatchObject({ win: false, kills: 2, towers: 2, atakhans: 1, firsts: ['tower'] });
  expect(twoTeams(game)).toBe(true);
  expect(twoTeams({ ...game, gameMode: 'CHERRY' })).toBe(false);
});
