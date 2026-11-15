import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { shown } from '../../../shell/layer';
import { setPrefs } from '../../../shell/prefs';
import type { GL } from './gl';
import { createStage, type Frame, type Scene } from './stage';

// O jsdom não tem WebGL: o contexto é trocado por um de mentira (ou por nenhum).
const context = vi.hoisted(() => ({ make: (): unknown => null }));
vi.mock('./gl', async (orig) => ({ ...(await orig<typeof import('./gl')>()), createContext: () => context.make() }));

let lostCalls = 0;
const fakeGl = () => ({ getExtension: () => ({ loseContext: () => void lostCalls++ }) }) as unknown as GL;
/** Quadros pedidos e ainda não rodados. */
let frames: Array<[number, FrameRequestCallback]> = [];
let now = 0;
/** Roda os quadros pendentes, `ms` depois. */
const step = (ms = 16) => {
  now += ms;
  const run = frames;
  frames = [];
  run.forEach(([, fn]) => fn(now));
};
let canvas: HTMLCanvasElement;
const scene = () => {
  const drawn: Frame[] = [];
  const s: Scene & { drawn: Frame[]; inits: number; sizes: number[][] } = { drawn, inits: 0, sizes: [], init: () => void s.inits++, resize: (w, h) => void s.sizes.push([w, h]), draw: (f) => void drawn.push(f) };
  return s;
};

beforeEach(() => {
  frames = [];
  now = 0;
  lostCalls = 0;
  let id = 0;
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => (frames.push([++id, fn]), id));
  vi.stubGlobal('cancelAnimationFrame', (n: number) => void (frames = frames.filter(([i]) => i !== n)));
  canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: 800 });
  Object.defineProperty(canvas, 'clientHeight', { value: 450 });
  context.make = fakeGl;
  shown.value = true;
});
afterEach(() => {
  vi.unstubAllGlobals();
  shown.value = false;
  setPrefs({ motion: 'full' });
});

test('sem WebGL não há palco (quem chama usa o desenho plano); cena que não monta também', () => {
  context.make = () => null;
  expect(createStage(canvas, scene())).toBeNull();
  context.make = fakeGl;
  const broken = scene();
  broken.init = () => {
    throw new Error('shader');
  };
  expect(createStage(canvas, broken)).toBeNull();
  // O contexto criado é devolvido.
  expect(lostCalls).toBe(1);
  expect(frames).toHaveLength(0);
});

test('roda um quadro atrás do outro, com o relógio em segundos e o canvas no tamanho da tela (densidade com teto)', () => {
  vi.stubGlobal('devicePixelRatio', 3);
  const s = scene();
  const stage = createStage(canvas, s)!;
  expect(s.inits).toBe(1);
  step();
  step(500);
  step(16);
  expect(s.drawn).toHaveLength(3);
  expect(s.drawn[0]).toEqual({ t: 0, w: 800, h: 450, still: false });
  // Um quadro que demorou (janela travada, aba em segundo plano) não faz a animação saltar.
  expect(s.drawn[1]!.t).toBeCloseTo(0.1);
  expect(s.drawn[2]!.t).toBeCloseTo(0.116);
  expect(s.sizes).toEqual([[800, 450]]);
  expect([canvas.width, canvas.height]).toEqual([1200, 675]);
  stage.dispose();
});

test('com a nossa camada fora da tela o laço para; de volta, continua de onde estava', () => {
  const s = scene();
  const stage = createStage(canvas, s)!;
  step();
  step();
  const t = s.drawn.at(-1)!.t;
  shown.value = false;
  expect(frames).toHaveLength(0);
  step(5000);
  expect(s.drawn).toHaveLength(2);
  shown.value = true;
  step();
  expect(s.drawn).toHaveLength(3);
  // O tempo parado não conta: a entrada não é pulada.
  expect(s.drawn[2]!.t).toBe(t);
  stage.dispose();
});

test('movimento reduzido ou desligado: um quadro parado, e outro só quando pedem', () => {
  setPrefs({ motion: 'off' });
  const s = scene();
  const stage = createStage(canvas, s)!;
  step();
  expect(s.drawn).toHaveLength(1);
  expect(s.drawn[0]!.still).toBe(true);
  expect(frames).toHaveLength(0);
  stage.invalidate();
  stage.invalidate();
  step();
  expect(s.drawn).toHaveLength(2);
  expect(frames).toHaveLength(0);
  // Voltou o movimento: o laço retoma.
  setPrefs({ motion: 'full' });
  step();
  step();
  expect(s.drawn.at(-1)!.still).toBe(false);
  expect(frames).toHaveLength(1);
  setPrefs({ motion: 'reduced' });
  step();
  expect(s.drawn.at(-1)!.still).toBe(true);
  expect(frames).toHaveLength(0);
  stage.dispose();
});

test('contexto perdido pausa sem erro; quando volta, a cena é remontada e o laço retoma', () => {
  const s = scene();
  const stage = createStage(canvas, s)!;
  step();
  const lost = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(lost);
  // Sem isto o navegador não devolve o contexto.
  expect(lost.defaultPrevented).toBe(true);
  expect(frames).toHaveLength(0);
  step();
  expect(s.drawn).toHaveLength(1);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  expect(s.inits).toBe(2);
  step();
  expect(s.drawn).toHaveLength(2);
  expect(s.sizes).toHaveLength(2);
  stage.dispose();
});

test('ao desmontar: o laço para, o contexto é devolvido e nada mais reage', () => {
  const s = scene();
  const stage = createStage(canvas, s)!;
  step();
  stage.dispose();
  expect(frames).toHaveLength(0);
  expect(lostCalls).toBe(1);
  shown.value = false;
  shown.value = true;
  stage.invalidate();
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  step();
  expect(s.drawn).toHaveLength(1);
  expect(s.inits).toBe(1);
});
