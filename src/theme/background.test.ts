import { expect, test } from 'vitest';
import { DEFAULT_BG, pickRandom, sanitizeBg, sourceFor, wantsRandom } from './background';

test('sanitizeBg aceita só o formato esperado e limita os ajustes', () => {
  expect(sanitizeBg('lixo')).toEqual(DEFAULT_BG);
  const s = sanitizeBg({ scope: 'screens', global: { kind: 'splash', skinId: 103001 }, screens: { home: { kind: 'file', key: 'f1', mime: 'video/webm' }, nada: { kind: 'splash', skinId: 1 } }, dim: 5, blur: -3, posX: 140, posY: 20, random: true });
  expect(s).toEqual({ scope: 'screens', global: { kind: 'splash', skinId: 103001 }, screens: { home: { kind: 'file', key: 'f1', mime: 'video/webm' } }, dim: 0.9, blur: 0, posX: 100, posY: 20, random: true });
  expect(sanitizeBg({ global: { kind: 'file', key: 'x', mime: 'text/html' } }).global).toEqual({ kind: 'none' });
});

test('sourceFor: global vale para todas; por tela usa a da tela e cai no global', () => {
  const g = { kind: 'splash', skinId: 1 } as const;
  const h = { kind: 'splash', skinId: 2 } as const;
  expect(sourceFor({ ...DEFAULT_BG, scope: 'global', global: g, screens: { home: h } }, 'home')).toEqual(g);
  expect(sourceFor({ ...DEFAULT_BG, scope: 'screens', global: g, screens: { home: h } }, 'home')).toEqual(h);
  expect(sourceFor({ ...DEFAULT_BG, scope: 'screens', global: g, screens: { home: h } }, 'profile')).toEqual(g);
  expect(sourceFor({ ...DEFAULT_BG, scope: 'screens', global: g, screens: {} }, 'champselect')).toBeNull();
  expect(sourceFor(DEFAULT_BG, 'home')).toBeNull();
});

test('pickRandom escolhe entre as skins possuídas de forma estável para a mesma semente', () => {
  const skins = [{ id: 1, owned: true }, { id: 2, owned: false }, { id: 3, owned: true }];
  expect([1, 3]).toContain(pickRandom(skins, 0.1));
  expect(pickRandom(skins, 0.1)).toBe(pickRandom(skins, 0.1));
  expect(pickRandom([], 0.5)).toBeNull();
});

test('wantsRandom: só nas telas com fundo personalizado; tela com fonte própria fica com ela', () => {
  const b = { ...DEFAULT_BG, random: true };
  expect(wantsRandom(b, 'home')).toBe(true);
  expect(wantsRandom(b, 'champselect')).toBe(false);
  expect(wantsRandom(b, 'ingame')).toBe(false);
  expect(wantsRandom({ ...b, scope: 'screens', screens: { lobby: { kind: 'splash', skinId: 1 } } }, 'lobby')).toBe(false);
  expect(wantsRandom({ ...b, scope: 'screens' }, 'profile')).toBe(true);
  expect(wantsRandom({ ...b, random: false }, 'home')).toBe(false);
});
