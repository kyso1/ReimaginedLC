import { signal } from '@preact/signals';
import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { Lcu, StoreState } from '../lcu';
import type { ResolvedTheme } from '../theme/resolve';
import type { ThemeEngine } from '../theme/engine';
import { App, RIOT_ROOT_ID } from './App';
import { enabled, hideRiot, syncLayer } from './layer';

const vidro: ResolvedTheme = { name: 'vidro', label: 'Vidro', tokens: { 'color.bg': '#0b1020' }, transition: 'wipe', backgrounds: { default: { theme: 'vidro', path: '/fe/x/a.jpg' } } };
const editorial: ResolvedTheme = { name: 'editorial', label: 'Editorial', tokens: { 'color.bg': '#0e0e10' }, transition: 'fade', backgrounds: { default: { theme: 'editorial', path: '' } } };

let root: HTMLElement;
let riot: HTMLElement;
let phase: Lcu['gameflowPhase'];
let lcu: Lcu;
let themes: ThemeEngine;
const focused = signal(true);

const ready = <T,>(data: T): StoreState<T> => ({ status: 'ready', data });
const flush = async () => {
  await new Promise((r) => setTimeout(r, 0));
  // os efeitos do Preact rodam depois do próximo frame (ou 100 ms)
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
};
const short = () => new Promise((r) => setTimeout(r, 0));
const dom = signal(0);
const mount = (extra: Partial<Parameters<typeof App>[0]> = {}) => render(<App root={root} lcu={lcu} themes={themes} base="https://plugins/ReimaginedLC/" focused={focused} dom={dom} {...extra} />, root);

beforeEach(() => {
  setLocale('pt_BR');
  delete window.DataStore;
  window.Toast = { success: vi.fn(), error: vi.fn() };
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as unknown as HTMLMediaElement['play'];
  HTMLMediaElement.prototype.pause = vi.fn() as unknown as HTMLMediaElement['pause'];
  syncLayer();
  focused.value = true;
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  root = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'rlc-root' }));
  phase = signal(ready('None')) as Lcu['gameflowPhase'];
  lcu = { gameflowPhase: phase, currentSummoner: signal(ready(null)), build: signal(ready({ version: '16.19.823.0722' })), regionLocale: signal(ready({ locale: 'pt_BR' })) };
  const active = signal(vidro);
  themes = { active, available: [vidro, editorial].map(({ name, label }) => ({ name, label })), set: (name) => void (active.value = name === 'editorial' ? editorial : vidro) };
});

afterEach(() => {
  render(null, root);
  root.remove();
  riot.remove();
  delete window.Toast;
});

test('com a camada desligada nada aparece e a interface da Riot fica visível', async () => {
  mount();
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(root.querySelector('.rlc-app')).toBeNull();
  expect(riot.style.visibility).toBe('');
});

test('ligada na fase None mostra a tela inicial, aplica o tema e esconde a interface da Riot', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(root.dataset.visible).toBe('true');
  expect(root.textContent).toContain('Jogar');
  expect(root.textContent).toContain('16.19');
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0b1020');
  expect(root.dataset.transition).toBe('wipe');
  expect(root.querySelector('img.rlc-bg')!.getAttribute('src')).toBe('/fe/x/a.jpg');
  expect(riot.style.visibility).toBe('hidden');
});

test('com hideRiot desligado a interface da Riot não é escondida', async () => {
  enabled.value = true;
  hideRiot.value = false;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('');
});

test('fase sem tela nossa oculta a camada e devolve a interface da Riot; voltar a None mostra de novo', async () => {
  enabled.value = true;
  mount();
  await flush();
  phase.value = ready('ChampSelect');
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(root.querySelector('.rlc-app')).toBeNull();
  expect(riot.style.visibility).toBe('');
  phase.value = ready('None');
  await flush();
  expect(root.dataset.visible).toBe('true');
  expect(riot.style.visibility).toBe('hidden');
});

test('store de fase indisponível nunca deixa um root vazio cobrindo o client', async () => {
  enabled.value = true;
  phase.value = { status: 'unavailable', data: null };
  mount();
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('trocar de tema muda variáveis, transição e fundo sem remontar', async () => {
  enabled.value = true;
  mount();
  await flush();
  themes.set('editorial');
  await short();
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0e0e10');
  await flush();
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0e0e10');
  expect(root.dataset.transition).toBe('fade');
  expect(root.querySelector('img.rlc-bg')).toBeNull();
});

test('Jogar e "Client original" desligam a camada', async () => {
  for (const label of ['Jogar', 'Client original']) {
    enabled.value = true;
    mount();
    await flush();
    const button = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes(label) || b.getAttribute('aria-label') === label)!;
    button.click();
    await flush();
    expect(enabled.value, label).toBe(false);
    expect(root.dataset.visible).toBe('false');
  }
});

test('tela que lança ao renderizar desliga a camada e avisa', async () => {
  enabled.value = true;
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  mount({ screens: { home: () => { throw new Error('quebrou'); } } });
  await flush();
  expect(enabled.value).toBe(false);
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  noise.mockRestore();
});

test('sem o elemento raiz da Riot a camada funciona do mesmo jeito', async () => {
  riot.remove();
  enabled.value = true;
  expect(() => mount()).not.toThrow();
  await flush();
  expect(root.dataset.visible).toBe('true');
});

test('sai da fase None: a camada some e a Riot volta na hora, sem esperar o frame', async () => {
  enabled.value = true;
  mount();
  await flush();
  phase.value = ready('ChampSelect');
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('desligar a camada enquanto aparece devolve a Riot na hora', async () => {
  enabled.value = true;
  mount();
  await flush();
  enabled.value = false;
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('tela que lança devolve a Riot na hora e remove também a barra e o fundo', async () => {
  enabled.value = true;
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  mount({ screens: { home: () => { throw new Error('quebrou'); } } });
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
  expect(root.querySelector('.rlc-rail')).toBeNull();
  expect(root.querySelector('.rlc-bg')).toBeNull();
  noise.mockRestore();
});

test('desmontar o App devolve a Riot e esconde o root', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  render(null, root);
  expect(riot.style.visibility).toBe('');
  expect(root.dataset.visible).toBe('false');
});

test('camada desligada não mexe no visibility que a Riot definiu', async () => {
  riot.style.visibility = 'collapse';
  mount();
  await flush();
  expect(riot.style.visibility).toBe('collapse');
});

test('ao desligar a camada a Riot volta ao valor que tinha antes de a escondermos', async () => {
  riot.style.visibility = 'collapse';
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  enabled.value = false;
  await flush();
  expect(riot.style.visibility).toBe('collapse');
});

test('a raiz da Riot aparece depois do mount: passa a ser escondida', async () => {
  riot.remove();
  enabled.value = true;
  mount();
  await flush();
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  dom.value++;
  await short();
  expect(riot.style.visibility).toBe('hidden');
});

test('a raiz da Riot é trocada enquanto escondida: o novo elemento guarda o próprio valor', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  riot.remove();
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  riot.style.visibility = 'collapse';
  dom.value++;
  await short();
  expect(riot.style.visibility).toBe('hidden');
  enabled.value = false;
  await short();
  expect(riot.style.visibility).toBe('collapse');
});
