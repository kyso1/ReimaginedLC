import { expect, test } from 'vitest';
import { CAMPS_BLUE, flip, inside, JUNGLE_BLUE, lineDist, PATHS_BLUE, sideName, SPOTS, spotFor, TOWERS_BLUE, TREES_BLUE, type Point } from './riftMap';

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// Torres externas de cada rota, como no jogo.
const OUTER = {
  blue: { TOP: TOWERS_BLUE[0]!.p, MIDDLE: TOWERS_BLUE[3]!.p, BOTTOM: TOWERS_BLUE[6]!.p },
  red: { TOP: [4318, 13875] as Point, MIDDLE: [8955, 8510] as Point, BOTTOM: [13866, 4505] as Point },
};

test('cada rota cai à frente da própria torre externa, nos dois lados (o vermelho não é o azul espelhado)', () => {
  for (const side of ['blue', 'red'] as const) {
    for (const lane of ['TOP', 'MIDDLE', 'BOTTOM'] as const) {
      const spot = SPOTS[side][lane];
      const own = OUTER[side][lane];
      // A torre mais próxima do ponto é a externa da própria rota, do próprio lado.
      const all = Object.entries(OUTER).flatMap(([s, lanes]) => Object.entries(lanes).map(([l, p]) => ({ k: `${s}.${l}`, p })));
      const nearest = all.sort((a, b) => dist(spot, a.p) - dist(spot, b.p))[0]!;
      expect(nearest.k).toBe(`${side}.${lane}`);
      expect(dist(spot, own)).toBeLessThan(1500);
    }
    // Suporte ao lado do atirador.
    expect(dist(SPOTS[side].UTILITY, SPOTS[side].BOTTOM)).toBeLessThan(1200);
  }
  // Espelhar o topo azul pelo centro cai na rota de baixo do vermelho: por isso os pontos são próprios de cada lado.
  const mirrored = flip(SPOTS.blue.TOP);
  expect(dist(mirrored, OUTER.red.BOTTOM)).toBeLessThan(dist(mirrored, OUTER.red.TOP));
});

test('caçador no Sentinela Azul do próprio lado', () => {
  expect(SPOTS.blue.JUNGLE).toEqual(CAMPS_BLUE[0]);
  expect(dist(SPOTS.red.JUNGLE, flip(CAMPS_BLUE[0]!))).toBeLessThan(250);
});

test('posição da LCU vira o ponto da função; sem função, em volta da própria base', () => {
  expect(spotFor('blue', 'middle', 0, 5)).toEqual(SPOTS.blue.MIDDLE);
  expect(spotFor('red', 'utility', 4, 5)).toEqual(SPOTS.red.UTILITY);
  expect(spotFor('blue', 'bottom', 3, 5)).toEqual(SPOTS.blue.BOTTOM);
  const free = [0, 1, 2, 3, 4].map((i) => spotFor('blue', '', i, 5));
  for (const p of free) expect(Math.round(dist(p, [0, 0]))).toBe(5600);
  expect(new Set(free.map((p) => p.join())).size).toBe(5);
  const red = spotFor('red', '', 0, 5);
  expect(Math.round(dist(red, [15000, 15000]))).toBe(5600);
});

test('árvores: sempre as mesmas, dentro da selva, fora dos corredores e das clareiras', () => {
  expect(TREES_BLUE.length).toBeGreaterThan(120);
  for (const t of TREES_BLUE) {
    expect(JUNGLE_BLUE.some((q) => inside(t.p, q))).toBe(true);
    expect(Math.min(...PATHS_BLUE.map((l) => lineDist(t.p, l)))).toBeGreaterThanOrEqual(560);
    expect(Math.min(...CAMPS_BLUE.map((c) => dist(t.p, c)))).toBeGreaterThanOrEqual(900);
  }
});

test('nome do lado em todos os idiomas do client', () => {
  const locales = ['pt_BR', 'en_US', 'en_GB', 'es_ES', 'es_MX', 'fr_FR', 'de_DE', 'it_IT', 'pl_PL', 'ru_RU', 'tr_TR', 'cs_CZ', 'hu_HU', 'ro_RO', 'el_GR', 'ja_JP', 'ko_KR', 'zh_CN', 'zh_TW', 'zh_MY', 'th_TH', 'vi_VN', 'ar_AE', 'id_ID'];
  for (const l of locales) {
    expect(sideName('blue', l)).toBeTruthy();
    expect(sideName('red', l)).not.toBe(sideName('blue', l));
    if (!l.startsWith('en')) expect(sideName('blue', l)).not.toBe('Blue side');
  }
  expect(sideName('blue', 'pt_BR')).toBe('Lado azul');
  expect(sideName('red', 'zh_TW')).toBe('紅色方');
  expect(sideName('red', 'zh_CN')).toBe('红色方');
  expect(sideName('red', 'xx_YY')).toBe('Red side');
});
