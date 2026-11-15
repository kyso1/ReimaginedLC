import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { shown } from '../../shell/layer';
import { setPrefs } from '../../shell/prefs';
import { arenaSession } from '../../test/fixtures';
import { forgetArenaIntro } from './ArenaScene';
import { arenaSubteams, type Cell } from './logic';
import { MapSide, retryWebgl, sceneOnly } from './MapSide';
import { arenaPinTimes } from './scene/arena';

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
let frames: Array<[number, FrameRequestCallback]> = [];
let frameId = 0;
let now = 0;
/** Roda os quadros pendentes até passarem `seconds` (a 20 quadros por segundo). */
const run = (seconds: number) => {
  for (let i = 0; i < seconds * 20; i++) {
    now += 50;
    const pending = frames;
    frames = [];
    pending.forEach(([, fn]) => fn(now));
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
  forgetArenaIntro();
  shown.value = true;
  // Cancelar tira só o quadro pedido: o Preact também usa rAF (e cancela o dele quando o timer de 100 ms vence antes),
  // e apagar a fila inteira levava junto o quadro da cena, que ficava esperando para sempre.
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => (frames.push([++frameId, fn]), frameId));
  vi.stubGlobal('cancelAnimationFrame', (n: number) => void (frames = frames.filter(([i]) => i !== n)));
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

/** Duplas: 8 times, eu na vaga 9 (time 4). Trios: 6 times, eu na vaga 4 (time 1). */
const DUO = [2, 8, 9] as const;
const TRIO = [3, 6, 4] as const;
async function mount([size, teams, me]: readonly [number, number, number], props: Partial<Parameters<typeof MapSide>[0]> = {}, cells: Record<number, Partial<Cell>> = {}) {
  const subteams = arenaSubteams(arenaSession(size, teams, me, {}, cells), size);
  act(() => render(<MapSide art={ART} mapId={30} cells={subteams.find((g) => g.mine)!.cells} subteams={subteams} localCellId={me} champions={CHAMPS} name={async () => null} {...props} />, root));
  await settle();
}
const pins = () => [...root.querySelectorAll<HTMLElement>('.rlc-rift-pin')];
const mine = () => pins().filter((p) => p.dataset.mine === 'true');
const at = (el: HTMLElement) => /translate3d\((-?\d+)px, ?(-?\d+)px/.exec(el.style.transform)!.slice(1).map(Number) as [number, number];

test('sem WebGL: fica a arte do client com as escolhas do meu time (dupla ou trio), e não tenta de novo; sem arte, nada', async () => {
  gl.on = false;
  expect(sceneOnly(30)).toBe(true);
  await mount(DUO);
  expect(root.querySelector('.rlc-arena')).toBeNull();
  expect(root.querySelector('canvas')).toBeNull();
  expect(root.querySelector('.rlc-cs-map-art')!.getAttribute('src')).toBe('/m/south.png');
  expect(root.querySelectorAll('.rlc-cs-map-pick')).toHaveLength(2);
  // Daqui em diante a Arena não aparece mais sem a arte do client.
  expect(sceneOnly(30)).toBe(false);
  render(null, root);
  gl.on = true;
  await mount(TRIO);
  expect(root.querySelector('.rlc-arena')).toBeNull();
  expect(root.querySelectorAll('.rlc-cs-map-pick')).toHaveLength(3);
  render(null, root);
  await mount(TRIO, { art: null });
  expect(root.innerHTML).toBe('');
});

test('mapa animado desligado: a arte do client, sem criar contexto', async () => {
  setPrefs({ riftMap: false });
  try {
    expect(sceneOnly(30)).toBe(false);
    await mount(DUO);
    expect(root.querySelector('.rlc-arena')).toBeNull();
    expect(root.querySelector('.rlc-cs-map-art')).not.toBeNull();
    expect(gl.calls).toEqual([]);
  } finally {
    setPrefs({ riftMap: true });
  }
});

test('duplas: dezesseis marcadores, dois por pedestal na cor do time; os do meu time por último, com a etiqueta, e só eu marcado', async () => {
  await mount(DUO, { art: null }, { 8: { championPickIntent: 103 }, 0: { championId: 157 } });
  const map = root.querySelector('.rlc-arena')!;
  expect(map.querySelector('.rlc-cs-map-side')!.textContent).toBe('Seu time · Rapinante');
  const all = pins();
  expect(all).toHaveLength(16);
  // Cor por time (o índice do subtime), dois de cada.
  const byTeam = new Map<string, number>();
  for (const p of all) byTeam.set(p.dataset.team!, (byTeam.get(p.dataset.team!) ?? 0) + 1);
  expect([...byTeam].sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', '7'].map((t) => [t, 2]));
  expect(mine()).toHaveLength(2);
  expect(all.slice(-2).every((p) => p.dataset.mine === 'true' && p.dataset.team === '4')).toBe(true);
  expect(all.filter((p) => p.hasAttribute('data-me'))).toHaveLength(1);
  expect(all.at(-1)!.getAttribute('data-me')).toBe('true');
  expect(all.at(-1)!.title).toBe('Rapinante');
  expect(all.at(-2)!.getAttribute('data-state')).toBe('hover');
  expect(all.at(-2)!.querySelector('img')!.getAttribute('src')).toBe('/i/103.png');
  expect(all[0]!.getAttribute('data-state')).toBe('locked');
  expect(all[0]!.title).toBe('Poro');
  expect(map.querySelector('.rlc-rift-role')).toBeNull();
});

test('trios: dezoito marcadores, três por pedestal, lado a lado; o meu time no centro e os outros cinco em volta', async () => {
  await mount(TRIO);
  expect(pins()).toHaveLength(18);
  expect(mine()).toHaveLength(3);
  expect(mine().every((p) => p.dataset.team === '1')).toBe(true);
  run(4.5);
  expect(root.querySelector('.rlc-arena')!.hasAttribute('data-ready')).toBe(true);
  expect(pins().every((p) => p.dataset.on)).toBe(true);
  const spots = pins().map(at);
  for (const [x, y] of spots) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(W);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(H);
  }
  // Cada time: a mesma altura, um ao lado do outro, sem se cobrir.
  for (let i = 0; i < 18; i += 3) {
    const [a, b, c] = spots.slice(i, i + 3) as [[number, number], [number, number], [number, number]];
    expect(a[1]).toBe(b[1]);
    expect(b[1]).toBe(c[1]);
    expect(b[0] - a[0]).toBe(40);
    expect(c[0] - b[0]).toBe(40);
  }
  // O meu time (os três últimos) fica entre os outros, nos dois eixos.
  const center = spots[16]!;
  const others = spots.slice(0, 15);
  expect(center[0]).toBeGreaterThan(Math.min(...others.map((p) => p[0])));
  expect(center[0]).toBeLessThan(Math.max(...others.map((p) => p[0])));
  expect(center[1]).toBeGreaterThan(Math.min(...others.map((p) => p[1])));
  expect(center[1]).toBeLessThan(Math.max(...others.map((p) => p[1])));
});

test('entrada: a cena aparece, os times caem nos pedestais um a um e o meu por último', async () => {
  await mount(DUO);
  run(0.2);
  expect(root.querySelector('.rlc-arena')!.hasAttribute('data-ready')).toBe(true);
  expect(draws()).toBeGreaterThan(0);
  run(1.6);
  expect(pins().filter((p) => p.dataset.on)).toHaveLength(0);
  const times = arenaPinTimes(8, 4);
  run(Math.max(...times.filter((_, i) => i !== 4)) - 1.8 + 0.1);
  // Os sete times de fora já caíram (dois marcadores cada); o meu ainda não.
  expect(pins().filter((p) => p.dataset.on === 'drop')).toHaveLength(14);
  expect(mine().some((p) => p.dataset.on)).toBe(false);
  run(0.5);
  expect(mine().every((p) => p.dataset.on === 'drop')).toBe(true);
});

test('movimento desligado: um quadro pronto, com todos os marcadores no lugar, e mais nenhum', async () => {
  setPrefs({ motion: 'off' });
  try {
    await mount(TRIO);
    run(0.2);
    expect(draws()).toBe(1);
    expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
    run(3);
    expect(draws()).toBe(1);
  } finally {
    setPrefs({ motion: 'full' });
  }
});

test('reaberta na mesma seleção: aparece pronta, sem repetir a entrada', async () => {
  await mount(DUO);
  run(1);
  render(null, root);
  await mount(DUO);
  run(0.2);
  expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
});

test('mergulho (travei): a câmera desce até o centro da arena, onde está o meu time', async () => {
  await mount(TRIO);
  run(0.5);
  await mount(TRIO, { diving: true });
  expect(root.querySelector('.rlc-arena')!.hasAttribute('data-diving')).toBe(true);
  run(1.5);
  // O marcador do meio do meu trio vai para o centro da tela.
  const [x, y] = at(mine()[1]!);
  expect(Math.abs(x - W / 2)).toBeLessThan(3);
  expect(Math.abs(y - H / 2)).toBeLessThan(8);
});

test('com a nossa camada fora da tela a cena não desenha; ao sair, o contexto WebGL é devolvido', async () => {
  await mount(DUO);
  run(0.5);
  const before = draws();
  expect(before).toBeGreaterThan(0);
  act(() => void (shown.value = false));
  run(2);
  expect(draws()).toBe(before);
  render(null, root);
  expect(gl.calls).toContain('loseContext');
  expect(frames).toHaveLength(0);
});
