import { expect, test } from 'vitest';
import { fitBox, ndc, orbit, outCubic, pinLifts, smooth, toScreen, type Box, type Vec3 } from './camera';

const FOV = 0.46;
const CENTER: Vec3 = [500, 0, 500];

test('câmera em órbita: o alvo cai no centro da tela; o que está mais perto da câmera aparece mais embaixo', () => {
  const pv = orbit(Math.PI * 0.75, 0.84, 2500, 16 / 9, FOV, CENTER);
  const [x, y] = ndc(pv, 500, 0, 500);
  expect(x).toBeCloseTo(0, 5);
  expect(y).toBeCloseTo(0, 5);
  // Câmera atrás da base azul (0, 1000): a base fica embaixo na tela, a vermelha em cima.
  expect(ndc(pv, 0, 0, 1000)[1]).toBeLessThan(0);
  expect(ndc(pv, 1000, 0, 0)[1]).toBeGreaterThan(0);
  // Subir no mundo é subir na tela.
  expect(ndc(pv, 500, 100, 500)[1]).toBeGreaterThan(0);
});

test('girar a câmera 180° (lado vermelho) troca as bases de lugar na tela', () => {
  const blue = orbit(Math.PI * 0.75, 0.84, 2500, 16 / 9, FOV, CENTER);
  const red = orbit(-Math.PI * 0.25, 0.84, 2500, 16 / 9, FOV, CENTER);
  const a = ndc(blue, 0, 0, 1000);
  const b = ndc(red, 1000, 0, 0);
  expect(b[0]).toBeCloseTo(a[0], 4);
  expect(b[1]).toBeCloseTo(a[1], 4);
});

test('toScreen: NDC para pixels com a origem em cima à esquerda, somando o deslocamento da cena', () => {
  const pv = orbit(1, 0.8, 2000, 2, FOV, CENTER);
  expect(toScreen(pv, [0, 0], 800, 400, 500, 0, 500).map(Math.round)).toEqual([400, 200]);
  const [x, y] = toScreen(pv, [0.5, -0.5], 800, 400, 500, 0, 500);
  expect(x).toBeCloseTo(600);
  expect(y).toBeCloseTo(300);
});

test('fitBox: a cena inteira cabe na área livre, encostada num dos lados e centrada nela', () => {
  const points: Vec3[] = [[0, 0, 0], [1000, 0, 0], [0, 0, 1000], [1000, 0, 1000], [0, -64, 1000], [1000, 110, 0]];
  const w = 1480;
  const h = 900;
  const area = [300, 140, 1220, 700] as const;
  const cam = (d: number) => orbit(Math.PI * 0.75, 0.84, d, w / h, FOV, CENTER);
  const fit = fitBox(cam, points, w, h, area);
  const px = points.map((p) => toScreen(cam(fit.dist), fit.shift, w, h, p[0], p[1], p[2]));
  const xs = px.map((p) => p[0]);
  const ys = px.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  expect(x0).toBeGreaterThanOrEqual(area[0] - 1);
  expect(x1).toBeLessThanOrEqual(area[2] + 1);
  expect(y0).toBeGreaterThanOrEqual(area[1] - 1);
  expect(y1).toBeLessThanOrEqual(area[3] + 1);
  // Ocupa o que dá: sobra menos de 2px na largura ou na altura.
  expect(Math.min(area[2] - area[0] - (x1 - x0), area[3] - area[1] - (y1 - y0))).toBeLessThan(2);
  expect((x0 + x1) / 2).toBeCloseTo((area[0] + area[2]) / 2, 0);
  expect((y0 + y1) / 2).toBeCloseTo((area[1] + area[3]) / 2, 0);
});

const overlap = (a: Box, la: number, b: Box, lb: number) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && a.y - la > b.y - lb - b.h && a.y - la - a.h < b.y - lb;

test('pinLifts: marcadores afastados ficam no lugar', () => {
  expect(pinLifts([{ x: 100, y: 300, w: 100, h: 80 }, { x: 400, y: 300, w: 100, h: 80 }, { x: 100, y: 100, w: 100, h: 80 }])).toEqual([0, 0, 0]);
});

test('pinLifts: quem cobriria outro sobe até não cobrir; o de baixo (mais perto da câmera) não se mexe', () => {
  const boxes: Box[] = [
    { x: 300, y: 400, w: 110, h: 90 },
    { x: 340, y: 380, w: 110, h: 90 },
    { x: 380, y: 410, w: 110, h: 90 },
    { x: 320, y: 300, w: 130, h: 100 },
    { x: 900, y: 400, w: 110, h: 90 },
  ];
  const lift = pinLifts(boxes);
  // O mais baixo na tela fica onde está; o que está longe também.
  expect(lift[2]).toBe(0);
  expect(lift[4]).toBe(0);
  for (const l of lift) expect(l).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i]!, lift[i]!, boxes[j]!, lift[j]!)).toBe(false);
});

test('curvas da entrada: de 0 a 1, sem passar', () => {
  expect([outCubic(-1), outCubic(0), outCubic(1), outCubic(5)]).toEqual([0, 0, 1, 1]);
  expect([smooth(-1), smooth(0.5), smooth(2)]).toEqual([0, 0.5, 1]);
});
