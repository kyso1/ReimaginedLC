import { expect, test } from 'vitest';
import { parseColor } from './gl';
import { CAMPS, flip, homeOf, laneOf, lanePoints, LANES, lineDist, mirror, NEXUS, pinTimes, QUADS, sideName, SPOTS, spotsFor, TOWERS, type Lane, type Point } from './rift';

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const nearestLane = (p: Point): Lane => (['top', 'mid', 'bot'] as const).reduce((best, l) => (lineDist(p, LANES[l]) < lineDist(p, LANES[best]) ? l : best), 'top' as Lane);
/** Lado do rio (a diagonal x = y): o azul fica embaixo à esquerda. */
const half = ([x, y]: Point) => (y > x ? 'blue' : y < x ? 'red' : 'river');
const ROLES = ['top', 'jungle', 'middle', 'bottom', 'utility'];

test('rotas: saem da base azul e chegam na vermelha; topo e baixo dobram no canto; a de baixo é o espelho do topo', () => {
  for (const lane of ['top', 'mid', 'bot'] as const) {
    const pts = lanePoints(lane);
    expect(dist(pts[0]!, homeOf('blue'))).toBeLessThan(260);
    expect(dist(pts.at(-1)!, homeOf('red'))).toBeLessThan(260);
    // Sem saltos: pontos seguidos ficam perto um do outro.
    for (let i = 1; i < pts.length; i++) expect(dist(pts[i - 1]!, pts[i]!)).toBeLessThan(20);
  }
  expect(lineDist([88, 88], LANES.top)).toBeLessThan(40);
  expect(lineDist([912, 912], LANES.bot)).toBeLessThan(40);
  expect(lineDist([500, 500], LANES.mid)).toBeLessThan(1);
  expect(LANES.bot[0]).toEqual(QUADS[1]!(LANES.top[0]!));
});

test('com função: cada aliado cai na própria rota, do próprio lado do rio; o vermelho é o azul espelhado pelo rio', () => {
  const blue = spotsFor('blue', ROLES);
  const red = spotsFor('red', ROLES);
  expect(blue).toEqual([SPOTS.TOP, SPOTS.JUNGLE, SPOTS.MIDDLE, SPOTS.BOTTOM, SPOTS.UTILITY]);
  expect(red).toEqual(blue.map(mirror));
  for (const [side, spots] of [['blue', blue], ['red', red]] as const) {
    expect(nearestLane(spots[0]!)).toBe('top');
    expect(nearestLane(spots[2]!)).toBe('mid');
    expect(nearestLane(spots[3]!)).toBe('bot');
    expect(nearestLane(spots[4]!)).toBe('bot');
    for (const i of [0, 1, 2, 3]) expect(half(spots[i]!)).toBe(side);
  }
  // Girar 180° (como as torres) trocaria as rotas: o topo azul cairia na rota de baixo.
  expect(nearestLane(flip(SPOTS.TOP))).toBe('bot');
});

test('caçador no buff da própria selva; topo e meio à frente da torre externa da rota', () => {
  expect(dist(SPOTS.JUNGLE, [CAMPS[0]![0], CAMPS[0]![1]])).toBeLessThan(10);
  expect(dist(spotsFor('red', ['jungle'])[0]!, mirror([CAMPS[0]![0], CAMPS[0]![1]]))).toBeLessThan(10);
  // Torres externas do azul: topo e meio (a primeira de cada trio).
  expect(dist(SPOTS.TOP, TOWERS[0]!)).toBeLessThan(60);
  expect(dist(SPOTS.MIDDLE, TOWERS[6]!)).toBeLessThan(60);
  // À frente: mais longe da própria base que a torre.
  expect(dist(SPOTS.TOP, homeOf('blue'))).toBeGreaterThan(dist(TOWERS[0]!, homeOf('blue')));
});

test('sem função (escolha às cegas): o time se espalha pelos pontos, sem repetir; quem tem função fica com o dela', () => {
  const free = spotsFor('blue', ['', '', '', '', '']);
  expect(new Set(free.map((p) => p.join())).size).toBe(5);
  expect(free[0]).toEqual(SPOTS.MIDDLE);
  for (const p of free) expect(Object.values(SPOTS)).toContainEqual(p);
  // Sozinho na personalizada: no meio.
  expect(spotsFor('red', [undefined])).toEqual([mirror(SPOTS.MIDDLE)]);
  // Misturado: quem tem função fica no ponto dela e os outros não o ocupam.
  const mixed = spotsFor('blue', ['', 'middle', 'fill']);
  expect(mixed[1]).toEqual(SPOTS.MIDDLE);
  expect(mixed[0]).toEqual(SPOTS.TOP);
  expect(mixed[2]).toEqual(SPOTS.BOTTOM);
});

test('mais de cinco sem função: os que sobram ficam em arco na frente da própria base', () => {
  const spots = spotsFor('red', ['', '', '', '', '', '', '']);
  expect(new Set(spots.map((p) => p.join())).size).toBe(7);
  for (const p of spots.slice(5)) expect(Math.round(dist(p, homeOf('red')))).toBe(300);
});

test('rota acesa: a da função do jogador; caçador, preencher e sem função não acendem nenhuma', () => {
  expect(laneOf('top')).toBe('top');
  expect(laneOf('MIDDLE')).toBe('mid');
  expect(laneOf('bottom')).toBe('bot');
  expect(laneOf('utility')).toBe('bot');
  expect(laneOf('jungle')).toBeNull();
  expect(laneOf('fill')).toBeNull();
  expect(laneOf('')).toBeNull();
  expect(laneOf(undefined)).toBeNull();
});

test('entrada: os aliados caem em sequência e o jogador por último, depois de uma pausa', () => {
  const at = pinTimes(5, 2);
  expect(Math.max(...at)).toBe(at[2]);
  const others = at.filter((_, i) => i !== 2);
  expect(others).toEqual([...others].sort((a, b) => a - b));
  expect(at[2]! - Math.max(...others)).toBeGreaterThan(0.3);
  // Como no mockup, com cinco: 2,5 s o primeiro e 3,3 s o jogador.
  expect(at[0]).toBeCloseTo(2.5);
  expect(at[2]).toBeCloseTo(3.3);
  expect(pinTimes(1, 0)[0]).toBeCloseTo(2.74);
});

test('torres e nexus do vermelho são o giro de 180° dos do azul, cada um na sua metade', () => {
  expect(half(NEXUS)).toBe('blue');
  expect(half(flip(NEXUS))).toBe('red');
  for (const t of TOWERS) {
    expect(half(t)).toBe('blue');
    expect(half(flip(t))).toBe('red');
    // Em cima de uma rota ou ao lado do nexus.
    expect(Math.min(lineDist(t, LANES.top), lineDist(t, LANES.mid), lineDist(t, LANES.bot), dist(t, NEXUS) - 70)).toBeLessThan(5);
  }
});

test('cor do tema para o shader: hex e rgb() viram 0..1; o que não der para ler vira a cor reserva', () => {
  const fb: [number, number, number] = [0.1, 0.2, 0.3];
  expect(parseColor(' #ff8000 ', fb)).toEqual([1, 128 / 255, 0]);
  expect(parseColor('#f80', fb)).toEqual([1, 136 / 255, 0]);
  expect(parseColor('#ff800080', fb)).toEqual([1, 128 / 255, 0]);
  expect(parseColor('rgb(255, 0, 51)', fb)).toEqual([1, 0, 0.2]);
  expect(parseColor('rgba(0 102 255 / 0.5)', fb)).toEqual([0, 0.4, 1]);
  expect(parseColor('', fb)).toBe(fb);
  expect(parseColor('var(--x)', fb)).toBe(fb);
  expect(parseColor('#12', fb)).toBe(fb);
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
