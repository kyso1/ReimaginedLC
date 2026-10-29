import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { ABILITY_CDN, findSkin, SkinPreview, type ChampionJson } from './SkinPreview';

let root: HTMLElement;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const tabs = () => [...root.querySelectorAll('.rlc-pv-tabs button')].map((b) => b.textContent);
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-pv-tabs button')].find((b) => b.textContent === text)!;

// Campeão sintético: base sem nada, skin com cromas, skin com splash animada e efeitos.
const champ: ChampionJson = {
  id: 901,
  name: 'Fulano',
  skins: [
    { id: 901000, name: 'Fulano', isBase: true, splashPath: '/s/0.jpg', uncenteredSplashPath: '/u/0.jpg', loadScreenPath: '/l/0.jpg' },
    { id: 901001, name: 'Fulano Arcade', splashPath: '/s/1.jpg', loadScreenPath: '/l/1.jpg', chromaPath: '/c/901001.png', chromas: [{ id: 901002, name: 'Fulano Arcade (Rubi)', chromaPath: '/c/901002.png', colors: ['#f00'] }] },
    { id: 901003, name: 'Fulano Lendário', splashPath: '/s/3.jpg', splashVideoPath: '/v/3.webm', skinFeaturePreviewData: [{ description: 'Golpe', iconPath: 'ASSETS/x/q.png', videoPath: 'ASSETS/x/q.webm' }] },
  ],
  passive: { name: 'Passiva', abilityIconPath: '/i/p.png', abilityVideoPath: 'champion-abilities/0901/ability_0901_P1.webm', abilityVideoImagePath: 'champion-abilities/0901/ability_0901_P1.jpg' },
  spells: [{ spellKey: 'q', name: 'Golpe Q', abilityIconPath: '/i/q.png', abilityVideoPath: 'champion-abilities/0901/ability_0901_Q1.webm', description: 'Bate.' }],
};

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  // A prévia abre por portal em #rlc-root.
  root.id = 'rlc-root';
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url === '/lol-game-data/assets/v1/champions/901.json' ? new Response(JSON.stringify(champ), { status: 200 }) : new Response(null, { status: 404 }))));
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

test('findSkin: skin, croma pela mãe, e a base quando não acha', () => {
  expect(findSkin(champ, 901001)!.id).toBe(901001);
  expect(findSkin(champ, 901002)!.id).toBe(901001);
  expect(findSkin(champ, 999999)!.id).toBe(901000);
  expect(findSkin(champ, undefined)!.id).toBe(901000);
});

test('skin com cromas: abas só com o que existe; croma abre na aba de cromas com o modelo dela', async () => {
  act(() => render(<SkinPreview championId={901} skinId={901002} onClose={() => {}} />, root));
  await settle();
  expect(root.querySelector('.rlc-pv-head h2')!.textContent).toBe('Fulano Arcade (Rubi)');
  expect(tabs()).toEqual(['Splash', 'Tela de carregamento', 'Cromas', 'Habilidades']);
  expect(root.querySelector('.rlc-pv-model img')!.getAttribute('src')).toBe('/c/901002.png');
  // A própria skin entra como "Padrão".
  const def = root.querySelector<HTMLButtonElement>('.rlc-pv-swatch[aria-label="Padrão"]')!;
  act(() => def.click());
  expect(root.querySelector('.rlc-pv-model img')!.getAttribute('src')).toBe('/c/901001.png');
  act(() => tab('Tela de carregamento').click());
  expect(root.querySelector('.rlc-pv-load')!.getAttribute('src')).toBe('/l/1.jpg');
});

test('skin sem cromas: splash animada, efeitos da skin pela LCU e habilidades pelo CDN', async () => {
  act(() => render(<SkinPreview championId={901} skinId={901003} onClose={() => {}} />, root));
  await settle();
  expect(tabs()).toEqual(['Splash', 'Efeitos', 'Habilidades']);
  expect(root.querySelector('video.rlc-pv-splash')!.getAttribute('src')).toBe('/v/3.webm');
  act(() => tab('Efeitos').click());
  expect(root.querySelector('.rlc-pv-video')!.getAttribute('src')).toBe('/lol-game-data/assets/ASSETS/x/q.webm');
  act(() => tab('Habilidades').click());
  expect(root.querySelector('.rlc-pv-video')!.getAttribute('src')).toBe(`${ABILITY_CDN}champion-abilities/0901/ability_0901_P1.webm`);
  act(() => root.querySelector<HTMLButtonElement>('.rlc-pv-ability[aria-label="Golpe Q"]')!.click());
  expect(root.querySelector('.rlc-pv-video')!.getAttribute('src')).toBe(`${ABILITY_CDN}champion-abilities/0901/ability_0901_Q1.webm`);
  expect(root.querySelector('.rlc-pv-caption')!.textContent).toContain('Bate.');
});

test('Escape e ✕ fecham; ações ficam no pé', async () => {
  const onClose = vi.fn();
  act(() => render(<SkinPreview championId={901} start="abilities" onClose={onClose}><button type="button">Comprar</button></SkinPreview>, root));
  await settle();
  expect(root.querySelector('.rlc-pv-tabs [aria-current="page"]')!.textContent).toBe('Habilidades');
  expect(root.querySelector('.rlc-pv-actions button')!.textContent).toBe('Comprar');
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  act(() => root.querySelector<HTMLButtonElement>('.rlc-pv-x')!.click());
  expect(onClose).toHaveBeenCalledTimes(2);
});

test('JSON do campeão não carrega: aviso, sem quebrar', async () => {
  act(() => render(<SkinPreview championId={404} onClose={() => {}} />, root));
  await settle();
  expect(root.querySelector('.rlc-pv-wait')!.textContent).toBe('A prévia não carregou.');
});

test('vídeo de habilidade que não carrega vira ícone grande com aviso', async () => {
  act(() => render(<SkinPreview championId={901} start="abilities" onClose={() => {}} />, root));
  await settle();
  act(() => void root.querySelector('.rlc-pv-video')!.dispatchEvent(new Event('error')));
  expect(root.querySelector('.rlc-pv-novideo img')!.getAttribute('src')).toBe('/i/p.png');
  expect(root.querySelector('.rlc-pv-novideo')!.textContent).toContain('ainda não está disponível');
});
