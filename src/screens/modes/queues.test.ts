import { expect, test } from 'vitest';
import { queue } from '../../test/fixtures';
import { customLobbyBody, customModes, groupQueues } from './queues';

test('agrupa por gameSelectModeGroup na ordem fixa, só filas disponíveis, visíveis e não personalizadas', () => {
  const groups = groupQueues([
    queue({ id: 450, gameSelectModeGroup: 'kARAM' }),
    queue({ id: 420, gameSelectPriority: 2 }),
    queue({ id: 400, gameSelectPriority: 1 }),
    queue({ id: 3140, gameSelectCategory: 'kTraining', isCustom: true, category: 'Custom' as never }),
    queue({ id: 1750, gameSelectModeGroup: 'kAlternativeLeagueGameModes' }),
    queue({ id: 9, gameSelectModeGroup: 'kNovoModo' }),
    queue({ id: 700, isVisible: false }),
    queue({ id: 999, queueAvailability: 'PlatformDisabled' }),
    queue({ id: 3100, gameSelectCategory: 'CreateCustom', isCustom: true }),
  ]);
  expect(groups.map((g) => [g.id, g.queues.map((q) => q.id)])).toEqual([
    ['sr', [420, 400, 3140]],
    ['aram', [450]],
    ['other', [1750, 9]],
  ]);
});

test('sem filas, nenhum grupo', () => {
  expect(groupQueues([])).toEqual([]);
});

test('customModes: só CreateCustom disponíveis, ordenadas por nome', () => {
  const modes = customModes([
    queue({ id: 3110, name: 'SR Draft', gameSelectCategory: 'CreateCustom' }),
    queue({ id: 3100, name: 'SR Blind', gameSelectCategory: 'CreateCustom' }),
    queue({ id: 3120, name: 'SR Off', gameSelectCategory: 'CreateCustom', queueAvailability: 'PlatformDisabled' }),
    queue({ id: 400 }),
  ]);
  expect(modes.map((q) => q.id)).toEqual([3100, 3110]);
});

test('customLobbyBody usa mapa, modo e mutador da fila e limita o tamanho do time a 1..5', () => {
  const mode = queue({ id: 3200, mapId: 12, gameMode: 'ARAM', gameTypeConfig: { id: 2 } as never, gameSelectCategory: 'CreateCustom' });
  expect(customLobbyBody(mode, { name: ' Sala ', password: '', teamSize: 9, spectators: 'NotAllowed' })).toEqual({
    queueId: 3200,
    isCustom: true,
    customGameLobby: {
      lobbyName: 'Sala',
      lobbyPassword: '',
      configuration: { gameMode: 'ARAM', mapId: 12, mutators: { id: 2 }, spectatorPolicy: 'NotAllowed', teamSize: 5 },
    },
  });
  expect(customLobbyBody(mode, { name: 'x', password: 'p', teamSize: 0, spectators: 'AllAllowed' }).customGameLobby!.configuration.teamSize).toBe(1);
});
