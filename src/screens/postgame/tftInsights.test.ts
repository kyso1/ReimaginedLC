import { beforeEach, expect, test } from 'vitest';
import { setLocale } from '../../i18n';
import type { TftEogPlayer, TftMatch, TftPlayer } from '../profile/tft';
import { boardValue, compHistory, compKey, contested, eliminationOrder, hasAny, itemCount, roundLabel, top4Streak, topBy, topUsed, toNextDivision, traitProgress } from './tftInsights';

beforeEach(() => setLocale('pt_BR'));

const piece = (championId: string, price: number, level: number, items = 0) => ({ championId, price, level, items: Array.from({ length: items }, () => ({ nameId: 'DA_X' })) });
const eog = (puuid: string, rank: number, boardPieces: ReturnType<typeof piece>[]): TftEogPlayer => ({ puuid, rank, boardPieces });

test('valor do tabuleiro: custo × cópias (1★ 1, 2★ 3, 3★ 9) e contagem de itens', () => {
  const b = [piece('A', 1, 3, 2), piece('B', 4, 2, 1), piece('C', 5, 1)];
  expect(boardValue(b)).toBe(9 + 12 + 5);
  expect(itemCount(b)).toBe(3);
  expect(boardValue(undefined)).toBe(0);
});

test('maior do lobby: empate fica com o mais bem colocado', () => {
  const ps = [eog('x', 5, [piece('A', 2, 2)]), eog('y', 2, [piece('B', 6, 1)]), eog('z', 1, [piece('C', 1, 1)])];
  expect(topBy(ps, (p) => boardValue(p.boardPieces))!.puuid).toBe('y');
});

test('unidades disputadas: jogadores e cópias somadas dos outros, sem contar você', () => {
  const me = eog('me', 1, [piece('Vi', 4, 2), piece('Vi', 4, 1), piece('Yi', 3, 3), piece('Solo', 5, 1)]);
  const others = [me, eog('a', 2, [piece('Vi', 4, 2), piece('Yi', 3, 1)]), eog('b', 3, [piece('Vi', 4, 1), piece('Vi', 4, 1)])];
  expect(contested(me, others)).toEqual([
    { id: 'Vi', players: 2, copies: 5 },
    { id: 'Yi', players: 1, copies: 1 },
  ]);
});

test('progresso do traço: próximo estágio e quanto falta; no máximo, next nulo', () => {
  const tiers = [{ min: 2, style: 1 }, { min: 3, style: 2 }, { min: 5, style: 3 }];
  expect(traitProgress({ name: 'x', num_units: 3, style: 2 }, tiers)).toEqual({ have: 3, next: 5, missing: 2, max: 5 });
  expect(traitProgress({ name: 'x', num_units: 1, style: 0 }, tiers)).toMatchObject({ next: 2, missing: 1 });
  expect(traitProgress({ name: 'x', num_units: 6, style: 3 }, tiers)).toMatchObject({ next: null, missing: 0 });
  expect(traitProgress({ name: 'x', num_units: 2, style: 1 }, undefined)).toMatchObject({ next: null });
});

test('rodada: "rodada N" (estágio-rodada não é seguro pelo last_round); vazio sem dado', () => {
  expect(roundLabel(26)).toBe('rodada 26');
  expect(roundLabel(undefined)).toBe('');
  setLocale('en_US');
  expect(roundLabel(30)).toBe('round 30');
});

test('ordem de eliminação e filtro de campos zerados', () => {
  const ps: TftPlayer[] = [
    { placement: 1, total_damage_to_players: 0, players_eliminated: 0 },
    { placement: 8, total_damage_to_players: 0 },
    { placement: 3, players_eliminated: 2 },
  ];
  expect(eliminationOrder(ps).map((p) => p.placement)).toEqual([8, 3, 1]);
  expect(hasAny(ps, (p) => p.total_damage_to_players)).toBe(false);
  expect(hasAny(ps, (p) => p.players_eliminated)).toBe(true);
});

test('sequência de top 4 a partir da mais recente', () => {
  expect(top4Streak([1, 4, 2, 7, 1])).toBe(3);
  expect(top4Streak([5, 1])).toBe(0);
  expect(top4Streak([2, 3])).toBe(2);
  expect(top4Streak([])).toBe(0);
});

const tr = (name: string, num_units: number, style: number) => ({ name, num_units, style });
const game = (gameId: number, placement: number, traits: ReturnType<typeof tr>[], units: string[] = []): TftMatch => ({
  gameId, gameCreation: 0, participants: [{ puuid: 'me', placement, traits, units: units.map((character_id) => ({ character_id, itemNames: ['DA_IE'] })) }],
});

test('comp: os dois traços principais; repetições e média por comp igual e por traços ativos', () => {
  const now = { placement: 1, traits: [tr('Blossom', 3, 1), tr('Adaptor', 4, 4), tr('Brawler', 2, 1)] };
  const key = compKey(now)!;
  expect(key).toEqual(['Adaptor', 'Blossom']);
  expect(compKey({ placement: 1, traits: [tr('A', 2, 1), tr('B', 1, 0)] })).toBeNull();
  // Traço de unidade única (Caustic) aparece em ouro mas não define a comp.
  expect(compKey({ placement: 1, traits: [{ ...tr('Caustic', 1, 3), tier_total: 1 }, tr('Adaptor', 4, 4), tr('Blossom', 3, 1)] })).toEqual(['Adaptor', 'Blossom']);
  const ms = [
    game(1, 2, [tr('Adaptor', 4, 3), tr('Blossom', 3, 2)]),
    game(2, 4, [tr('Blossom', 5, 3), tr('Adaptor', 3, 2)]),
    // Os dois ativos, mas a comp principal é outra.
    game(3, 7, [tr('Sniper', 6, 4), tr('Duelist', 4, 3), tr('Adaptor', 2, 1), tr('Blossom', 2, 1)]),
    game(4, 8, [tr('Sniper', 6, 4), tr('Adaptor', 1, 0)]),
  ];
  expect(compHistory(ms, 'me', key)).toEqual({ same: { games: 2, avg: 3 }, traits: { games: 3, avg: 13 / 3 } });
});

test('mais usados contam uma vez por partida', () => {
  const ms = [game(1, 1, [], ['Vi', 'Vi', 'Yi']), game(2, 2, [], ['Vi']), game(3, 3, [], ['Ahri'])];
  expect(topUsed(ms, 'me', (p) => (p.units ?? []).map((u) => u.character_id))).toEqual([
    ['Vi', 2],
    ['Yi', 1],
    ['Ahri', 1],
  ]);
});

test('PdL até a próxima divisão: 100 por divisão, troca de elo no I, sem divisão no topo', () => {
  expect(toNextDivision('DIAMOND', 'II', 49, 49)).toEqual({ need: 51, games: 2, tier: 'DIAMOND', division: 'I' });
  expect(toNextDivision('GOLD', 'I', 90, -20)).toEqual({ need: 10, games: null, tier: 'PLATINUM', division: 'IV' });
  expect(toNextDivision('DIAMOND', 'I', 0, 10)).toMatchObject({ tier: 'MASTER', need: 100, games: 10 });
  expect(toNextDivision('MASTER', 'I', 200, 30)).toBeNull();
  expect(toNextDivision(undefined, undefined, 0, 0)).toBeNull();
});
