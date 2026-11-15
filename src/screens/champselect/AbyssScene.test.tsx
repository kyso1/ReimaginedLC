import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { shown } from '../../shell/layer';
import { setPrefs } from '../../shell/prefs';
import { cell } from '../../test/fixtures';
import { forgetAbyssIntro } from './AbyssScene';
import type { Cell } from './logic';
import { MapSide, retryWebgl } from './MapSide';
import { INTRO_S } from './scene/rift';

// O jsdom não tem WebGL: o contexto é um de mentira que só conta as chamadas (ou nenhum, para o caso sem WebGL).
// As peças, a cena, a câmera e os marcadores são os de verdade.
const gl = vi.hoisted(() => ({ on: true, calls: [] as string[] }));
vi.mock('./scene/gl', async (orig) => {
  const fake: unknown = new Proxy(() => fake, { get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'getExtension' ? () => ({ loseContext: () => gl.calls.push('loseContext') }) : (gl.calls.push(String(k)), fake)), apply: () => fake });
  return { ...(await orig<typeof import('./scene/gl')>()), createContext: () => (gl.on ? fake : null) };
});

const CHAMPS = new Map([
  [103, { id: 103, name: 'Ahri', icon: '/i/103.png', roles: [] }],
  [157, { id: 157, name: 'Yasuo', icon: '/i/157.png', roles: [] }],
]);
const ART = { south: '/m/south.png', north: '/m/north.png' };
const W = 1200;
const H = 700;

let root: HTMLElement;
let frames: FrameRequestCallback[] = [];
let now = 0;
/** Roda os quadros pendentes até passarem `seconds` (a 20 quadros por segundo). */
const run = (seconds: number) => {
  for (let i = 0; i < seconds * 20; i++) {
    now += 50;
    const pending = frames;
    frames = [];
    pending.forEach((fn) => fn(now));
  }
};
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
// Dois desenhos por quadro: a malha e as partículas.
const draws = () => gl.calls.filter((c) => c === 'drawArrays').length / 2;

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  root.id = 'rlc-root';
  frames = [];
  gl.on = true;
  gl.calls = [];
  retryWebgl();
  forgetAbyssIntro();
  shown.value = true;
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal('cancelAnimationFrame', () => void (frames = []));
  vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockReturnValue(W);
  vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockReturnValue(H);
});
afterEach(() => {
  render(null, root);
  root.remove();
  shown.value = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ARAM: ninguém tem posição.
const team = (): Cell[] => [
  cell({ cellId: 0, gameName: 'Zeca', championPickIntent: 103 }),
  cell({ cellId: 1, gameName: 'Beltrano', championId: 157 }),
  cell({ cellId: 2, gameName: 'Fulano' }),
  cell({ cellId: 3, gameName: 'Sicrano' }),
  cell({ cellId: 4, gameName: '', puuid: '' }),
];
async function mount(cells: Cell[], props: Partial<Parameters<typeof MapSide>[0]> = {}) {
  act(() => render(<MapSide art={ART} mapId={12} cells={cells} localCellId={2} champions={CHAMPS} name={async () => null} {...props} />, root));
  await settle();
}
const pins = () => [...root.querySelectorAll<HTMLElement>('.rlc-rift-pin')];
const at = (el: HTMLElement) => /translate3d\((-?\d+)px, ?(-?\d+)px/.exec(el.style.transform)!.slice(1).map(Number);

test('sem WebGL: fica a arte do Howling Abyss do client, com as escolhas dos aliados; e não tenta de novo', async () => {
  gl.on = false;
  await mount(team());
  expect(root.querySelector('.rlc-abyss')).toBeNull();
  expect(root.querySelector('canvas')).toBeNull();
  expect(root.querySelector('.rlc-cs-map-art')!.getAttribute('src')).toBe('/m/south.png');
  expect(root.querySelectorAll('.rlc-cs-map-pick')).toHaveLength(5);
  // Com as cartas na mesa a arte também fica apagada ao fundo.
  await mount(team(), { dim: true });
  expect(root.querySelector('.rlc-cs-map')!.getAttribute('data-dim')).toBe('true');
  render(null, root);
  gl.on = true;
  await mount(team());
  expect(root.querySelector('.rlc-abyss')).toBeNull();
  expect(root.querySelector('.rlc-cs-map-art')).not.toBeNull();
});

test('mapa animado desligado: a arte do client, sem criar contexto', async () => {
  setPrefs({ riftMap: false });
  try {
    await mount(team());
    expect(root.querySelector('.rlc-abyss')).toBeNull();
    expect(root.querySelector('.rlc-cs-map-art')).not.toBeNull();
    expect(gl.calls).toEqual([]);
  } finally {
    setPrefs({ riftMap: true });
  }
});

test('um marcador por aliado, sem rota: nome e o que está fazendo; o meu por último e marcado', async () => {
  await mount(team());
  const map = root.querySelector('.rlc-abyss')!;
  expect(map.getAttribute('data-side')).toBe('blue');
  expect(map.querySelector('.rlc-cs-map-side')!.textContent).toBe('Lado azul');
  const all = pins();
  expect(all).toHaveLength(5);
  expect(map.querySelector('.rlc-rift-role')).toBeNull();
  const by = (name: string) => all.find((p) => p.textContent!.includes(name))!;
  expect(by('Zeca').getAttribute('data-state')).toBe('hover');
  expect(by('Zeca').querySelector('img')!.getAttribute('src')).toBe('/i/103.png');
  expect(by('Beltrano').getAttribute('data-state')).toBe('locked');
  expect(by('Beltrano').querySelector('.rlc-rift-tag')!.textContent).toBe('BeltranoYasuo');
  expect(by('Sicrano').getAttribute('data-state')).toBe('empty');
  const mine = all.at(-1)!;
  expect(mine.getAttribute('data-me')).toBe('true');
  expect(mine.querySelector('.rlc-rift-tag')!.textContent).toBe('FulanoEscolhendo…Você');
  expect(all.filter((p) => p.hasAttribute('data-me'))).toHaveLength(1);
});

test('entrada: a cena aparece, os aliados caem na ponte um a um e eu por último, à frente de todos', async () => {
  await mount(team());
  const map = root.querySelector<HTMLElement>('.rlc-abyss')!;
  run(0.2);
  expect(map.hasAttribute('data-ready')).toBe(true);
  expect(draws()).toBeGreaterThan(0);
  run(2.2);
  expect(pins().filter((p) => p.dataset.on)).toHaveLength(0);
  run(0.85);
  // Os quatro aliados já caíram; eu ainda não.
  expect(pins().filter((p) => p.dataset.on === 'drop')).toHaveLength(4);
  expect(pins().at(-1)!.dataset.on).toBeUndefined();
  run(INTRO_S - 3);
  expect(pins().at(-1)!.dataset.on).toBe('drop');
  // Todos dentro da tela; a minha base fica à esquerda, então eu, na frente, sou o mais à direita.
  const spots = pins().map(at);
  for (const [x, y] of spots) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(W);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(H);
  }
  expect(Math.max(...spots.map((p) => p[0]!))).toBe(spots.at(-1)![0]);
});

test('lado vermelho: a mesma ponte com as cores trocadas (a minha base continua do lado de cá)', async () => {
  await mount(team().map((c) => ({ ...c, team: 2 })));
  expect(root.querySelector('.rlc-abyss')!.getAttribute('data-side')).toBe('red');
  expect(root.querySelector('.rlc-cs-map-side')!.textContent).toBe('Lado vermelho');
  run(INTRO_S + 0.5);
  const spots = pins().map(at);
  expect(Math.max(...spots.map((p) => p[0]!))).toBe(spots.at(-1)![0]);
});

test('com a nossa camada fora da tela a cena não desenha; de volta, retoma', async () => {
  await mount(team());
  run(0.5);
  const before = draws();
  expect(before).toBeGreaterThan(0);
  act(() => void (shown.value = false));
  run(2);
  expect(draws()).toBe(before);
  act(() => void (shown.value = true));
  run(0.2);
  expect(draws()).toBeGreaterThan(before);
});

test('movimento desligado: um quadro pronto, com todos os marcadores no lugar, e mais nenhum', async () => {
  setPrefs({ motion: 'off' });
  try {
    await mount(team());
    run(0.2);
    expect(draws()).toBe(1);
    expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
    run(3);
    expect(draws()).toBe(1);
  } finally {
    setPrefs({ motion: 'full' });
  }
});

test('reaberta na mesma seleção, ou aberta já atrás das cartas: aparece pronta, sem repetir a entrada', async () => {
  await mount(team());
  run(1);
  render(null, root);
  await mount(team());
  run(0.2);
  expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
  render(null, root);
  forgetAbyssIntro();
  await mount(team(), { dim: true });
  expect(root.querySelector('.rlc-abyss')!.getAttribute('data-dim')).toBe('true');
  run(0.2);
  expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
});

test('mergulho (campeão confirmado): a câmera desce até o meu lugar na ponte, que vai para o centro; a cena deixa de estar apagada', async () => {
  await mount(team(), { dim: true });
  run(0.5);
  const start = at(pins().at(-1)!);
  await mount(team(), { dim: true, diving: true });
  const map = root.querySelector('.rlc-abyss')!;
  expect(map.hasAttribute('data-diving')).toBe(true);
  expect(map.hasAttribute('data-dim')).toBe(false);
  run(1.5);
  const [x, y] = at(pins().at(-1)!);
  expect(start).not.toEqual([x, y]);
  expect(Math.abs(x! - W / 2)).toBeLessThan(3);
  expect(Math.abs(y! - H / 2)).toBeLessThan(3);
});

test('ao sair da tela o contexto WebGL é devolvido', async () => {
  await mount(team());
  run(0.2);
  render(null, root);
  expect(gl.calls).toContain('loseContext');
  expect(frames).toHaveLength(0);
});
