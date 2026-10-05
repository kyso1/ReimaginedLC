import { expect, test, vi } from 'vitest';
import { createGameData } from './gamedata';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

test('campeões: champion-summary lido uma vez, com nome, ícone e posições', async () => {
  const f = vi.fn().mockResolvedValue(json([{ id: -1, name: 'Nenhum' }, { id: 103, name: 'Ahri', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/103.png', roles: ['mage'] }]));
  const game = createGameData(f);
  const a = await game.champions();
  await game.champions();
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-game-data/assets/v1/champion-summary.json');
  expect(a.get(103)).toEqual({ id: 103, name: 'Ahri', icon: '/lol-game-data/assets/v1/champion-icons/103.png', roles: ['mage'] });
  expect(a.has(-1)).toBe(false);
});

test('feitiços: summoner-spells lido uma vez, com modos', async () => {
  const f = vi.fn().mockResolvedValue(json([{ id: 4, name: 'Flash', iconPath: '/x/flash.png', gameModes: ['CLASSIC', 'ARAM'] }]));
  const game = createGameData(f);
  expect((await game.spells()).get(4)).toEqual({ id: 4, name: 'Flash', icon: '/x/flash.png', gameModes: ['CLASSIC', 'ARAM'] });
  await game.spells();
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-game-data/assets/v1/summoner-spells.json');
});

test('falha de rede vira mapa vazio', async () => {
  const game = createGameData(vi.fn().mockRejectedValue(new TypeError('x')));
  expect((await game.champions()).size).toBe(0);
  expect((await game.spells()).size).toBe(0);
});

test('splash da skin pelo splashPath do campeão, com cache por campeão', async () => {
  const champ = { skins: [{ id: 40000, splashPath: '/a.jpg' }, { id: 40067, splashPath: '/lol-game-data/assets/ASSETS/janna_67.jpg' }] };
  const f = vi.fn().mockResolvedValue(json(champ));
  const game = createGameData(f);
  expect(await game.splash(40067)).toBe('/lol-game-data/assets/ASSETS/janna_67.jpg');
  expect(await game.splash(40000)).toBe('/a.jpg');
  expect(await game.splash(40999)).toBeNull();
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-game-data/assets/v1/champions/40.json');
});

test('splash: skin 0 ou ausente e falha de rede viram null', async () => {
  const game = createGameData(vi.fn().mockRejectedValue(new TypeError('x')));
  expect(await game.splash(0)).toBeNull();
  expect(await game.splash(undefined)).toBeNull();
  expect(await game.splash(1001)).toBeNull();
});

test('pequenas lendas: companions.json indexado por contentId', async () => {
  const f = vi.fn().mockResolvedValue(json([{ contentId: 'abc', itemId: 91003, name: 'Chibi Orianna', loadoutsIcon: '/lol-game-data/assets/ASSETS/o.png' }, { itemId: 1 }]));
  const game = createGameData(f);
  const m = await game.companions();
  await game.companions();
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-game-data/assets/v1/companions.json');
  expect(m.get('abc')).toEqual({ itemId: 91003, name: 'Chibi Orianna', icon: '/lol-game-data/assets/ASSETS/o.png' });
  expect(m.size).toBe(1);
});
