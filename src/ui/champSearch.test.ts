import { expect, test } from 'vitest';
import { matchesName } from './champSearch';

test('letras na ordem, com pulos, como no client: "zean" acha Zilean', () => {
  expect(matchesName('zean', 'Zilean')).toBe(true);
  expect(matchesName('zean', 'Zed')).toBe(false);
  expect(matchesName('ZED', 'Zed')).toBe(true);
});

test('ignora acento, pontuação e espaço; busca vazia acha tudo', () => {
  expect(matchesName('chogath', "Cho'Gath")).toBe(true);
  expect(matchesName('drmundo', 'Dr. Mundo')).toBe(true);
  expect(matchesName('kaisa', "Kai'Sa")).toBe(true);
  expect(matchesName('nunu', 'Nunu & Willump')).toBe(true);
  expect(matchesName('  ', 'Ahri')).toBe(true);
});
