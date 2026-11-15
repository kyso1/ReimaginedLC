import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { shown } from '../../shell/layer';
import { setPrefs } from '../../shell/prefs';
import { cell } from '../../test/fixtures';
import type { Cell } from './logic';
import { MapSide, retryWebgl } from './MapSide';
import { forgetRiftIntro } from './RiftScene';
import { INTRO_S } from './scene/rift';

// O jsdom não tem WebGL nem canvas 2D: o contexto é um de mentira que só conta as chamadas (ou nenhum, para o caso
// sem WebGL) e as peças do mapa são mínimas. A cena, a câmera e os marcadores são os de verdade.
const gl = vi.hoisted(() => ({ on: true, calls: [] as string[] }));
vi.mock('./scene/gl', async (orig) => {
  const fake: unknown = new Proxy(() => fake, { get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'getExtension' ? () => ({ loseContext: () => gl.calls.push('loseContext') }) : (gl.calls.push(String(k)), fake)), apply: () => fake });
  return { ...(await orig<typeof import('./scene/gl')>()), createContext: () => (gl.on ? fake : null) };
});
vi.mock('./scene/riftAssets', async (orig) => ({
  ...(await orig<typeof import('./scene/riftAssets')>()),
  loadRift: async () => ({ hAt: () => 0, masks: new Uint8Array(4), lanes: new Uint8Array(4), light: new Uint8Array(4), albedo: document.createElement('canvas'), terrain: new Float32Array(6), index: new Uint16Array(3), mesh: new Float32Array(15), sprites: new Float32Array(10) }),
}));

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
const draws = () => gl.calls.filter((c) => c === 'drawElements').length;

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  root.id = 'rlc-root';
  frames = [];
  gl.on = true;
  gl.calls = [];
  retryWebgl();
  forgetRiftIntro();
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

const team = (): Cell[] => [
  cell({ cellId: 0, gameName: 'Zeca', assignedPosition: 'top', championPickIntent: 103 }),
  cell({ cellId: 1, gameName: 'Um Nome Bem Comprido Mesmo', assignedPosition: 'jungle' }),
  cell({ cellId: 2, gameName: 'Fulano', assignedPosition: 'middle' }),
  cell({ cellId: 3, gameName: 'Beltrano', assignedPosition: 'bottom', championId: 157 }),
  cell({ cellId: 4, gameName: '', puuid: '', assignedPosition: 'utility' }),
];
async function mount(cells: Cell[], props: Partial<Parameters<typeof MapSide>[0]> = {}) {
  act(() => render(<MapSide art={ART} mapId={11} cells={cells} localCellId={2} champions={CHAMPS} name={async () => null} {...props} />, root));
  await settle();
}
const pins = () => [...root.querySelectorAll<HTMLElement>('.rlc-rift-pin')];
const at = (el: HTMLElement) => /translate3d\((-?\d+)px, ?(-?\d+)px/.exec(el.style.transform)!.slice(1).map(Number);

test('sem WebGL: fica a arte do mapa do client, com as escolhas dos aliados; e não tenta de novo na próxima vez', async () => {
  gl.on = false;
  await mount(team());
  expect(root.querySelector('.rlc-rift')).toBeNull();
  expect(root.querySelector('canvas')).toBeNull();
  expect(root.querySelector('.rlc-cs-map-art')!.getAttribute('src')).toBe('/m/south.png');
  expect(root.querySelectorAll('.rlc-cs-map-pick')).toHaveLength(5);
  // WebGL "voltou", mas o client já mostrou que não tem: continua na arte, sem criar outro contexto.
  render(null, root);
  gl.on = true;
  await mount(team());
  expect(root.querySelector('.rlc-rift')).toBeNull();
  expect(root.querySelector('.rlc-cs-map-art')).not.toBeNull();
});

test('mapa animado desligado ou outro mapa: a arte do client, sem criar contexto', async () => {
  setPrefs({ riftMap: false });
  try {
    await mount(team());
    expect(root.querySelector('.rlc-rift')).toBeNull();
    expect(root.querySelector('.rlc-cs-map-art')).not.toBeNull();
  } finally {
    setPrefs({ riftMap: true });
  }
  render(null, root);
  await mount(team(), { mapId: 21 });
  expect(root.querySelector('.rlc-rift')).toBeNull();
  expect(gl.calls).toEqual([]);
});

test('um marcador por aliado: nome, rota e o que está fazendo (escolhendo, declarado, travado); o meu por último e marcado', async () => {
  await mount(team());
  const map = root.querySelector('.rlc-rift')!;
  expect(map.getAttribute('data-side')).toBe('blue');
  expect(map.querySelector('.rlc-cs-map-side')!.textContent).toBe('Lado azul');
  const all = pins();
  expect(all).toHaveLength(5);
  const by = (name: string) => all.find((p) => p.textContent!.includes(name))!;
  // Declarado (intenção): retrato do campeão, ainda não travado.
  expect(by('Zeca').getAttribute('data-state')).toBe('hover');
  expect(by('Zeca').querySelector('img')!.getAttribute('src')).toBe('/i/103.png');
  expect(by('Zeca').querySelector('.rlc-rift-tag')!.textContent).toBe('ZecaAhri');
  expect(by('Zeca').querySelector('.rlc-rift-role')!.getAttribute('aria-label')).toBe('Topo');
  expect(by('Zeca').querySelector('.rlc-rift-role svg')!.getAttribute('data-role')).toBe('TOP');
  // Travado.
  expect(by('Beltrano').getAttribute('data-state')).toBe('locked');
  expect(by('Beltrano').querySelector('.rlc-rift-tag')!.textContent).toBe('BeltranoYasuo');
  // Ainda escolhendo: "?" e o texto; o nome comprido vai inteiro para o DOM (o CSS corta com reticências).
  const long = by('Um Nome Bem Comprido Mesmo');
  expect(long.getAttribute('data-state')).toBe('empty');
  expect(long.querySelector('img')).toBeNull();
  expect(long.querySelector('.rlc-rift-face')!.textContent).toBe('?');
  expect(long.querySelector('.rlc-rift-tag i')!.textContent).toBe('Escolhendo…');
  // Nome oculto: só o estado, sem nome vazio.
  const hidden = all.find((p) => p.querySelector('[data-role="UTILITY"]'))!;
  expect(hidden.querySelector('.rlc-rift-who')).toBeNull();
  // O meu: por último (cai depois e fica por cima), marcado e com o selo.
  const mine = all.at(-1)!;
  expect(mine.getAttribute('data-me')).toBe('true');
  expect(mine.querySelector('.rlc-rift-tag')!.textContent).toBe('FulanoEscolhendo…Você');
  expect(all.filter((p) => p.hasAttribute('data-me'))).toHaveLength(1);
});

test('nome real da sala (Revelar nomes) no lugar do nome da vaga', async () => {
  await mount(team(), { real: new Map([[4, { gameName: 'Sicrana', tagLine: 'BR1', puuid: 'p-4' }]]) });
  expect(pins().find((p) => p.querySelector('[data-role="UTILITY"]'))!.querySelector('.rlc-rift-who')!.textContent).toBe('Sicrana');
});

test('a rota da minha função fica acesa; caçador, preencher e sem função não acendem nenhuma', async () => {
  const lane = async (position: string) => {
    render(null, root);
    await mount([cell({ cellId: 2, assignedPosition: position })]);
    return root.querySelector('.rlc-rift')!.getAttribute('data-lane');
  };
  expect(await lane('middle')).toBe('mid');
  expect(await lane('top')).toBe('top');
  expect(await lane('utility')).toBe('bot');
  expect(await lane('jungle')).toBeNull();
  expect(await lane('fill')).toBeNull();
  expect(await lane('')).toBeNull();
});

test('entrada: o mapa aparece, os aliados caem um a um nos pontos das rotas e o meu por último', async () => {
  await mount(team());
  const map = root.querySelector<HTMLElement>('.rlc-rift')!;
  run(0.2);
  expect(map.hasAttribute('data-ready')).toBe(true);
  expect(draws()).toBeGreaterThan(0);
  run(2);
  expect(pins().filter((p) => p.dataset.on)).toHaveLength(0);
  run(0.85);
  // Os quatro aliados já caíram; eu ainda não.
  expect(pins().filter((p) => p.dataset.on === 'drop')).toHaveLength(4);
  expect(pins().at(-1)!.dataset.on).toBeUndefined();
  run(INTRO_S - 3);
  expect(pins().at(-1)!.dataset.on).toBe('drop');
  // Cada um no seu ponto, dentro da tela: topo à esquerda, atirador à direita, suporte mais à direita ainda; a base
  // azul fica embaixo, então o meio aparece acima do atirador.
  const [top, jungle, bottom, support, mid] = pins().map(at);
  for (const [x, y] of [top!, jungle!, bottom!, support!, mid!]) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(W);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(H);
  }
  expect(top![0]).toBeLessThan(jungle![0]!);
  expect(jungle![0]).toBeLessThan(mid![0]!);
  expect(mid![0]).toBeLessThan(bottom![0]!);
  expect(bottom![0]).toBeLessThan(support![0]!);
  expect(mid![1]).toBeLessThan(bottom![1]!);
});

test('lado vermelho: a câmera fica atrás da base vermelha, então o topo aparece à direita e a rota de baixo à esquerda', async () => {
  await mount(team().map((c) => ({ ...c, team: 2 })));
  expect(root.querySelector('.rlc-rift')!.getAttribute('data-side')).toBe('red');
  expect(root.querySelector('.rlc-cs-map-side')!.textContent).toBe('Lado vermelho');
  run(INTRO_S + 0.3);
  const [top, , bottom, , mid] = pins().map(at);
  // Visto de trás da base vermelha, a rota do topo fica à direita e a de baixo à esquerda.
  expect(top![0]).toBeGreaterThan(mid![0]!);
  expect(bottom![0]).toBeLessThan(mid![0]!);
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

test('reaberto na mesma seleção (fechar a grade): já aparece pronto, sem repetir a entrada', async () => {
  await mount(team());
  run(1);
  render(null, root);
  await mount(team());
  run(0.2);
  expect(pins().every((p) => p.dataset.on === 'now')).toBe(true);
});

test('mergulho ao travar: os marcadores já estão no lugar e a câmera desce até o meu ponto, que vai para o centro', async () => {
  await mount(team());
  run(INTRO_S + 0.3);
  const start = at(pins().at(-1)!);
  await mount(team(), { diving: true });
  expect(root.querySelector('.rlc-rift')!.hasAttribute('data-diving')).toBe(true);
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
