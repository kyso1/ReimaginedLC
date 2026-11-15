import { expect, test } from 'vitest';
import { action, arenaSession, cell, session } from '../../test/fixtures';
import { actingCells, allyWants, arenaBanCells, arenaPickOrder, arenaSubteams, arenaTeamSize, banIntents, banPhase, banSlots, bansByTeam, displayedChampion, flatActions, laneOpponent, myTurn, remainingSeconds, selectPhase, unavailable, watching } from './logic';

test('flatActions achata os grupos de turno', () => {
  const s = session({ actions: [[action({ id: 1 })], [action({ id: 2 }), action({ id: 3 })]] });
  expect(flatActions(s).map((a) => a.id)).toEqual([1, 2, 3]);
});

test('minha ação de banir em andamento é a minha vez de banir', () => {
  const s = session({ actions: [[action({ id: 100, actorCellId: -1, type: 'phase_transition', completed: true })], [action({ id: 0, type: 'ban', isInProgress: true })]] });
  expect(myTurn(s)).toEqual({ action: expect.objectContaining({ id: 0 }), kind: 'ban' });
  expect(selectPhase(s)).toBe('ban');
});

test('ação minha concluída ou de outro jogador não é minha vez', () => {
  const done = session({ actions: [[action({ type: 'pick', isInProgress: true, completed: true })]] });
  expect(myTurn(done)).toBeNull();
  const other = session({ actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] });
  expect(myTurn(other)).toBeNull();
  expect(selectPhase(other)).toBe('waiting');
});

test('minha vez de escolher e fase de finalização', () => {
  expect(selectPhase(session({ actions: [[action({ type: 'pick', isInProgress: true })]] }))).toBe('pick');
  expect(selectPhase(session({ timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: 1, totalTimeInPhase: 1, internalNowInEpochMs: 0, isInfinite: false } as never }))).toBe('finalization');
  expect(selectPhase(session({ timer: { phase: 'PLANNING', adjustedTimeLeftInPhase: 1, totalTimeInPhase: 1, internalNowInEpochMs: 0, isInfinite: false } as never }))).toBe('planning');
  expect(selectPhase(session({ timer: { phase: 'GAME_STARTING', adjustedTimeLeftInPhase: 0, totalTimeInPhase: 0, internalNowInEpochMs: 0, isInfinite: false } as never }))).toBe('none');
});

test('banimentos por time vêm das ações concluídas, com 0 no banimento nulo, somados ao campo bans quando houver', () => {
  const s = session({
    actions: [[action({ type: 'ban', completed: true, championId: 157, isAllyAction: true })], [action({ type: 'ban', completed: true, championId: -1 })], [action({ type: 'ban', completed: true, championId: 266, isAllyAction: false })], [action({ type: 'ban', championId: 10, isInProgress: true })]],
    bans: { myTeamBans: [157, 55], theirTeamBans: [], numBans: 3 } as never,
  });
  expect(bansByTeam(s)).toEqual({ mine: [157, 0, 55], theirs: [266] });
});

test('indisponíveis: banidos e travados por outro; com escolhas repetidas só os banidos', () => {
  const actions = [[action({ type: 'ban', completed: true, championId: 157 })], [action({ actorCellId: 1, type: 'pick', completed: true, championId: 266 }), action({ actorCellId: 0, type: 'pick', completed: true, championId: 103 }), action({ actorCellId: 2, type: 'pick', isInProgress: true, championId: 99 })]];
  expect(unavailable(session({ actions }))).toEqual(new Map([[157, 'banned'], [266, 'picked']]));
  expect(unavailable(session({ actions, allowDuplicatePicks: true }))).toEqual(new Map([[157, 'banned']]));
});

test('aliados querem: intenção do planejamento e destaque da escolha em andamento, sem os meus', () => {
  const s = session({
    myTeam: [cell({ cellId: 0, championPickIntent: 1 }), cell({ cellId: 1, championPickIntent: 157 })],
    actions: [[action({ actorCellId: 2, type: 'pick', isInProgress: true, championId: 266 }), action({ actorCellId: 0, type: 'pick', isInProgress: true, championId: 103 }), action({ actorCellId: 7, type: 'pick', isAllyAction: false, championId: 55 })]],
  });
  expect([...allyWants(s)]).toEqual([157, 266]);
});

test('tempo restante nunca negativo e arredondado para cima', () => {
  expect(remainingSeconds(30000, 1000, 1000)).toBe(30);
  expect(remainingSeconds(30000, 1000, 2500)).toBe(29);
  expect(remainingSeconds(1000, 0, 5000)).toBe(0);
});

test('campeão mostrado: escolhido confirmado, senão a intenção, senão nenhum', () => {
  expect(displayedChampion(cell({ championId: 103 }))).toEqual({ championId: 103, locked: true });
  expect(displayedChampion(cell({ championId: 0, championPickIntent: 103 }))).toEqual({ championId: 103, locked: false });
  expect(displayedChampion(cell())).toBeNull();
});

test('planejamento: a vez é declarar a intenção na ação de escolha, mesmo com o banimento marcado em andamento', () => {
  const planning = { phase: 'PLANNING', adjustedTimeLeftInPhase: 1, totalTimeInPhase: 1, internalNowInEpochMs: 0, isInfinite: false } as never;
  const s = session({ timer: planning, actions: [[action({ id: 0, type: 'ban', isInProgress: true })], [action({ id: 1, type: 'pick' })]] });
  expect(myTurn(s)).toEqual({ action: expect.objectContaining({ id: 1 }), kind: 'intent' });
  expect(selectPhase(s)).toBe('planning');
  expect(actingCells(s).size).toBe(0);
});

test('vagas agindo: banindo ou escolhendo, só ações em andamento', () => {
  const s = session({ actions: [[action({ actorCellId: 0, type: 'ban', isInProgress: true }), action({ actorCellId: 1, type: 'pick', isInProgress: true }), action({ actorCellId: 2, type: 'pick', completed: true })]] });
  expect([...actingCells(s)]).toEqual([[0, 'ban'], [1, 'pick']]);
});

test('adversário de rota: pela posição quando a LCU manda; sem posição, o único inimigo da rota pela recomendação', () => {
  const lanes = { '238': { recommendedPositions: ['MIDDLE'] }, '266': { recommendedPositions: ['TOP'] }, '7': { recommendedPositions: ['MIDDLE', 'BOTTOM'] } };
  // posição mandada: vale mesmo sem campeão ainda (0)
  expect(laneOpponent([cell({ assignedPosition: 'middle', championId: 238 }), cell({ assignedPosition: 'top', championId: 266 })], 'middle', lanes)).toBe(238);
  expect(laneOpponent([cell({ assignedPosition: 'middle', championId: 0 }), cell({ championId: 238 })], 'MIDDLE', lanes)).toBe(0);
  // ranqueada: sem posição; um candidato é o adversário, dois não decidem, nenhum também não
  expect(laneOpponent([cell({ championId: 238 }), cell({ championId: 266 }), cell({ championId: 0 })], 'middle', lanes)).toBe(238);
  expect(laneOpponent([cell({ championId: 238 }), cell({ championId: 7 })], 'middle', lanes)).toBe(0);
  expect(laneOpponent([cell({ championId: 266 })], 'middle', lanes)).toBe(0);
  expect(laneOpponent([cell({ championId: 238 })], '', lanes)).toBe(0);
});

test('fase de banimento: algum ban em andamento durante BAN_PICK; no planejamento não conta', () => {
  const bans = [[action({ id: 1, actorCellId: 5, isAllyAction: false, type: 'ban', isInProgress: true })]];
  expect(banPhase(session({ actions: bans }))).toBe(true);
  expect(banPhase(session({ actions: bans, timer: { phase: 'PLANNING' } as never }))).toBe(false);
  expect(banPhase(session({ actions: [[action({ id: 1, type: 'ban', completed: true, championId: 5 })], [action({ id: 2, type: 'pick', isInProgress: true })]] }))).toBe(false);
});

test('faixa de banimentos: uma vaga por ação, na ordem; inimigo que baniu sem mostrar fica escondido só durante a fase; nulo é "sem banimento"', () => {
  const during = session({ actions: [[
    action({ id: 1, type: 'ban', completed: true, championId: 157 }),
    action({ id: 2, actorCellId: 1, type: 'ban', isInProgress: true, championId: 266 }),
    action({ id: 3, actorCellId: 2, type: 'ban', completed: true, championId: -1 }),
    action({ id: 4, actorCellId: 5, isAllyAction: false, type: 'ban', completed: true, championId: 0 }),
    action({ id: 5, actorCellId: 6, isAllyAction: false, type: 'ban', isInProgress: true }),
  ]] });
  expect(banSlots(during)).toEqual({
    mine: [{ key: 1, id: 157, state: 'done' }, { key: 2, id: 0, state: 'empty' }, { key: 3, id: 0, state: 'none' }],
    theirs: [{ key: 4, id: 0, state: 'hidden' }, { key: 5, id: 0, state: 'empty' }],
  });
  // Fase encerrada: o que ficou sem campeão é banimento nulo.
  const after = session({ actions: [[action({ id: 4, actorCellId: 5, isAllyAction: false, type: 'ban', completed: true, championId: 0 })]] });
  expect(banSlots(after).theirs).toEqual([{ key: 4, id: 0, state: 'none' }]);
  // Banimentos que só vêm em `bans` entram na vaga livre ou no fim, sem repetir.
  const listed = session({ actions: [[action({ id: 4, actorCellId: 5, isAllyAction: false, type: 'ban', completed: true, championId: 0 })]], bans: { myTeamBans: [103], theirTeamBans: [266, 266], numBans: 2 } as never });
  expect(banSlots(listed)).toEqual({ mine: [{ key: -1, id: 103, state: 'done' }], theirs: [{ key: 4, id: 266, state: 'done' }] });
  expect(banSlots(session())).toEqual({ mine: [], theirs: [] });
});

test('intenção de banir dos aliados: destaque em andamento ou já banido, só na fase de banimento', () => {
  const actions = [[
    action({ id: 1, type: 'ban', isInProgress: true, championId: 157 }),
    action({ id: 2, actorCellId: 1, type: 'ban', completed: true, championId: 266 }),
    action({ id: 3, actorCellId: 2, type: 'ban', isInProgress: true }),
    action({ id: 4, actorCellId: 5, isAllyAction: false, type: 'ban', isInProgress: true, championId: 103 }),
  ]];
  expect([...banIntents(session({ actions }))]).toEqual([[0, { championId: 157, done: false }], [1, { championId: 266, done: true }]]);
  expect(banIntents(session({ actions: [[action({ id: 2, actorCellId: 1, type: 'ban', completed: true, championId: 266 })]] })).size).toBe(0);
});

test('quem está escolhendo fora eu: o aliado com o destaque dele; sem aliado, o inimigo sem campeão', () => {
  const myTeam = [cell({ cellId: 0 }), cell({ cellId: 1, championPickIntent: 266 })];
  const theirTeam = [cell({ cellId: 5, team: 2 })];
  const pick = (actorCellId: number, championId = 0) => action({ actorCellId, isAllyAction: actorCellId < 5, type: 'pick', isInProgress: true, championId });
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(5, 157), pick(1, 103)]] }))).toEqual({ cell: myTeam[1], foe: false, championId: 103 });
  // Sem destaque na ação vale a intenção declarada.
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(1)]] }))!.championId).toBe(266);
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(5, 157)]] }))).toEqual({ cell: theirTeam[0], foe: true, championId: 0 });
  // Só eu escolhendo, vaga desconhecida ou fora de BAN_PICK: ninguém.
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(0, 103)]] }))).toBeNull();
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(9)]] }))).toBeNull();
  expect(watching(session({ myTeam, theirTeam, actions: [[pick(1)]], timer: { phase: 'FINALIZATION' } as never }))).toBeNull();
});

test('Arena: tamanho do time pela fila; os times saem das vagas, em duplas (8 times) e em trios (6), com o meu marcado', () => {
  expect(arenaTeamSize(1700)).toBe(2);
  expect(arenaTeamSize(1740)).toBe(3);
  expect(arenaTeamSize(undefined)).toBe(2);
  const duo = arenaSubteams(arenaSession(2, 8, 9), 2);
  expect(duo.map((g) => [g.index, g.cells.map((c) => c.cellId), g.mine])).toEqual([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i, [i * 2, i * 2 + 1], i === 4]));
  const trio = arenaSubteams(arenaSession(3, 6, 4), 3);
  expect(trio).toHaveLength(6);
  expect(trio.every((g) => g.cells.length === 3)).toBe(true);
  expect(trio.filter((g) => g.mine).map((g) => g.cells.map((c) => c.cellId))).toEqual([[3, 4, 5]]);
  // Partida incompleta (vagas faltando): os times que existem, sem inventar os outros.
  const few = arenaSubteams(session({ localPlayerCellId: 6, myTeam: [cell({ cellId: 6 }), cell({ cellId: 7 }), cell({ cellId: 8 })], theirTeam: [cell({ cellId: 15 })] }), 3);
  expect(few.map((g) => [g.index, g.cells.length, g.mine])).toEqual([[2, 3, true], [5, 1, false]]);
});

test('Arena: ordem de escolha pelas ações: uma rodada por grupo com escolhas, com os times de quem escolhe nela', () => {
  const round = (cells: number[], over = {}) => cells.map((actorCellId) => action({ actorCellId, type: 'pick', ...over }));
  const bans = [0, 1, 2, 3].map((actorCellId) => action({ actorCellId, type: 'ban', completed: true }));
  // Duplas: dois times por rodada.
  const duo = arenaSession(2, 8, 9, { actions: [bans, round([0, 1, 2, 3], { completed: true }), round([4, 5, 6, 7], { isInProgress: true }), round([8, 9, 10, 11]), round([12, 13, 14, 15])] });
  expect(arenaPickOrder(duo, 2)).toEqual([
    { teams: [0, 1], state: 'done' },
    { teams: [2, 3], state: 'now' },
    { teams: [4, 5], state: 'next' },
    { teams: [6, 7], state: 'next' },
  ]);
  // Trios: as mesmas vagas dão outros times.
  const trio = arenaSession(3, 6, 4, { actions: [round([0, 1, 2, 3, 4, 5], { isInProgress: true }), round([6, 7, 8, 9, 10, 11]), round([12, 13, 14, 15, 16, 17])] });
  expect(arenaPickOrder(trio, 3).map((r) => r.teams)).toEqual([[0, 1], [2, 3], [4, 5]]);
  // Um grupo por jogador do mesmo time conta como uma rodada só (em andamento até o último travar).
  const solo = arenaSession(2, 2, 0, { actions: [round([0], { completed: true }), round([1]), round([2]), round([3])] });
  expect(arenaPickOrder(solo, 2)).toEqual([
    { teams: [0], state: 'now' },
    { teams: [1], state: 'next' },
  ]);
  expect(arenaPickOrder(arenaSession(2, 8, 0, { actions: [bans] }), 2)).toEqual([]);
});

test('Arena: banimento por jogador: os do meu time na hora, os dos outros escondidos até a rodada (e a revelação) acabar', () => {
  const ban = (actorCellId: number, over = {}) => action({ actorCellId, type: 'ban', ...over });
  // Trios, eu na vaga 4 (time das vagas 3, 4 e 5).
  const during = arenaSession(3, 6, 4, {
    actions: [[ban(3, { isInProgress: true, championId: 266 }), ban(4, { completed: true, championId: 157 }), ban(5, { isInProgress: true }), ban(0, { completed: true, championId: 103 }), ban(1, { completed: true }), ban(2, { isInProgress: true, championId: 103 })]],
  });
  expect([...arenaBanCells(during, 3)]).toEqual([
    [3, { id: 266, state: 'intent' }],
    [4, { id: 157, state: 'done' }],
    [0, { id: 0, state: 'hidden' }],
    [1, { id: 0, state: 'hidden' }],
  ]);
  const after = arenaSession(3, 6, 4, { actions: [[ban(4, { completed: true, championId: 157 }), ban(5, { completed: true, championId: -1 }), ban(0, { completed: true, championId: 103 }), ban(1, { completed: true })]] });
  expect([...arenaBanCells(after, 3)]).toEqual([
    [4, { id: 157, state: 'done' }],
    [5, { id: 0, state: 'none' }],
    [0, { id: 103, state: 'done' }],
    [1, { id: 0, state: 'none' }],
  ]);
  // Durante a revelação os dos outros continuam escondidos (o cartão ainda não pousou).
  expect(arenaBanCells(after, 3, true).get(0)).toEqual({ id: 0, state: 'hidden' });
  expect(arenaBanCells(after, 3, true).get(4)).toEqual({ id: 157, state: 'done' });
  // Em duplas a vaga 5 já é de outro time.
  expect(arenaBanCells(arenaSession(2, 8, 2, { actions: after.actions as never }), 2, true).get(5)!.state).toBe('hidden');
});
