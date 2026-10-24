import { expect, test } from 'vitest';
import { action, cell, session } from '../../test/fixtures';
import { actingCells, bansByTeam, displayedChampion, flatActions, laneOpponent, myTurn, remainingSeconds, selectPhase } from './logic';

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

test('banimentos por time vêm das ações concluídas, sem os vazios, somados ao campo bans quando houver', () => {
  const s = session({
    actions: [[action({ type: 'ban', completed: true, championId: 157, isAllyAction: true })], [action({ type: 'ban', completed: true, championId: -1 })], [action({ type: 'ban', completed: true, championId: 266, isAllyAction: false })], [action({ type: 'ban', championId: 10, isInProgress: true })]],
    bans: { myTeamBans: [157, 55], theirTeamBans: [], numBans: 3 } as never,
  });
  expect(bansByTeam(s)).toEqual({ mine: [157, 55], theirs: [266] });
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
