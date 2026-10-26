import { expect, test } from 'vitest';
import { normalizeSlots, quickPlayProblem, spellsFor, withChampion, withPosition, type Slot } from './QuickPlay';

const slot = (o: Partial<Slot>): Slot => ({ championId: 0, skinId: 0, positionPreference: 'UNSELECTED', perks: '', spell1: 4, spell2: 14, ...o });

test('feitiços seguem a rota como no client: selva põe Golpear no lugar do que não é Flash; sair troca pelo da rota', () => {
  expect(spellsFor('JUNGLE', 4, 14)).toEqual([4, 11]);
  expect(spellsFor('JUNGLE', 6, 4)).toEqual([11, 4]);
  expect(spellsFor('TOP', 4, 11)).toEqual([4, 12]);
  expect(spellsFor('BOTTOM', 4, 11)).toEqual([4, 7]);
  expect(spellsFor('MIDDLE', 4, 14)).toEqual([4, 14]);
});

test('rota repetida troca as vagas; campeão repetido troca os campeões; skin padrão', () => {
  const two = normalizeSlots([slot({ positionPreference: 'TOP', championId: 1 }), slot({ positionPreference: 'MIDDLE', championId: 2 })]);
  const p = withPosition(two, 0, 'MIDDLE');
  expect(p.map((s) => s.positionPreference)).toEqual(['MIDDLE', 'TOP']);
  const c = withChampion(two, 1, 1, '{"perkIds":[]}');
  expect(c.map((s) => s.championId)).toEqual([2, 1]);
  expect(c[1].skinId).toBe(1000);
  expect(c[1].perks).toBe('{"perkIds":[]}');
  expect(normalizeSlots(undefined)).toHaveLength(2);
});

test('vaga nova com feitiços 0 ganha Flash e o feitiço da rota ao escolher o campeão', () => {
  const two = normalizeSlots([slot({ positionPreference: 'JUNGLE', spell1: 0, spell2: 0 }), slot({ positionPreference: 'BOTTOM', spell1: 0, spell2: 0 })]);
  const c = withChampion(two, 0, 64, '');
  expect([c[0].spell1, c[0].spell2]).toEqual([4, 11]);
  expect([c[1].spell1, c[1].spell2]).toEqual([4, 7]);
});

test('restrição do Jogo Rápido vira texto; rota em falta lista as rotas', async () => {
  const { setLocale } = await import('../../i18n');
  setLocale('pt_BR');
  expect(quickPlayProblem([], [])).toBeNull();
  expect(quickPlayProblem([{ restrictionCode: 'PlayerLevelRestriction' }], [])).toBeNull();
  expect(quickPlayProblem([{ restrictionCode: 'QPPlayerScarcePositionCoverageRestriction' }], ['UTILITY'])).toBe('Uma das vagas precisa de uma rota em falta: Suporte');
});
