import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { Collection } from './Collection';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const flush = async () => {
  await settle();
  await settle();
  await settle();
};
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text)!;
const chip = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-cn-chips button')].find((b) => b.textContent === text)!;
const cards = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-cn-card')];
const names = () => cards().map((c) => c.getAttribute('aria-label'));

const champs = [
  { id: 103, name: 'Ahri', title: 'a Raposa de Nove Caudas', roles: ['mage'], baseSplashPath: '/s/103.jpg', squarePortraitPath: '/i/103.png', ownership: { owned: true } },
  { id: 266, name: 'Aatrox', title: 'a Espada Darkin', roles: ['fighter'], baseSplashPath: '/s/266.jpg', squarePortraitPath: '/i/266.png', ownership: { owned: false } },
  { id: 238, name: 'Zed', title: 'o Mestre das Sombras', roles: ['assassin'], baseSplashPath: '/s/238.jpg', squarePortraitPath: '/i/238.png', ownership: { owned: true } },
];
const skins = [
  { id: 103000, championId: 103, name: 'Ahri', isBase: true, splashPath: '/s/103000.jpg', tilePath: '/t/103000.jpg', ownership: { owned: true } },
  { id: 103015, championId: 103, name: 'Ahri do Arcade', isBase: false, splashPath: '/s/103015.jpg', tilePath: '/t/103015.jpg', ownership: { owned: true } },
  { id: 103027, championId: 103, name: 'Ahri K/DA', isBase: false, splashPath: '/s/103027.jpg', tilePath: '/t/103027.jpg', ownership: { owned: false } },
  { id: 238001, championId: 238, name: 'Zed de Choque', isBase: false, splashPath: '/s/238001.jpg', tilePath: '/t/238001.jpg', ownership: { owned: true } },
];
const routes: Record<string, unknown> = {
  '/lol-champions/v1/inventories/42/champions-minimal': champs,
  '/lol-champions/v1/inventories/42/skins-minimal': skins,
  '/lol-champion-mastery/v1/me/champion-mastery': [{ championId: 238, championLevel: 10, championPoints: 90000 }, { championId: 103, championLevel: 5, championPoints: 20000 }],
  '/lol-champions/v1/inventories/42/champions/103/skins/103015/chromas': [{ id: 103016, name: 'Rubi', colors: ['#e05a8a'], ownership: { owned: true } }],
  '/lol-inventory/v2/inventory/SUMMONER_ICON': [{ itemId: 29, owned: true }, { itemId: 588, owned: true }],
};

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => (url in routes ? new Response(JSON.stringify(routes[url]), { status: 200 }) : new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

function mount() {
  const lcu = fakeLcu();
  lcu.chatMe.value = ready({ puuid: 'me', summonerId: 42 }) as Lcu['chatMe']['value'];
  lcu.lanes.value = ready({ '103': { recommendedPositions: ['MIDDLE'] }, '266': { recommendedPositions: ['TOP'] }, '238': { recommendedPositions: ['MIDDLE'] } }) as Lcu['lanes']['value'];
  act(() => render(<Collection lcu={lcu} />, root));
}

test('campeões: trilho A–Z, quem não tem fica marcado, o foco mostra nome, título e splash', async () => {
  mount();
  await flush();
  expect(names()).toEqual(['Aatrox', 'Ahri', 'Zed']);
  expect(cards()[0]!.getAttribute('data-owned')).toBe('false');
  expect(root.querySelector('.rlc-cn-title')!.textContent).toBe('Aatrox');
  act(() => void cards()[1]!.dispatchEvent(new MouseEvent('mouseenter')));
  expect(root.querySelector('.rlc-cn-title')!.textContent).toBe('Ahri');
  expect(root.querySelector('.rlc-cn-kicker')!.textContent).toBe('a Raposa de Nove Caudas');
  await flush();
  expect(root.querySelector<HTMLElement>('.rlc-cn-bg')!.style.backgroundImage).toContain('/s/103.jpg');
});

test('campeões: maior maestria, só os meus e filtro por rota', async () => {
  mount();
  await flush();
  act(() => chip('Maior maestria').click());
  expect(names()).toEqual(['Zed', 'Ahri']);
  act(() => chip('Todos').click());
  act(() => chip('Só os meus').click());
  expect(names()).toEqual(['Ahri', 'Zed']);
  act(() => chip('Só os meus').click());
  act(() => chip('Topo').click());
  expect(names()).toEqual(['Aatrox']);
});

test('clicar num campeão abre as skins dele', async () => {
  mount();
  await flush();
  act(() => cards()[1]!.click());
  await flush();
  expect(tab('Skins').getAttribute('aria-current')).toBe('page');
  expect(names()).toEqual(['Ahri', 'Ahri do Arcade']);
});

test('skins: só as minhas por padrão, todas mostra as outras; foco com cromas', async () => {
  mount();
  await flush();
  act(() => tab('Skins').click());
  await flush();
  expect(names()).toEqual(['Ahri', 'Ahri do Arcade', 'Zed de Choque']);
  act(() => chip('Todas').click());
  expect(names()).toContain('Ahri K/DA');
  act(() => void cards().find((c) => c.getAttribute('aria-label') === 'Ahri do Arcade')!.dispatchEvent(new MouseEvent('mouseenter')));
  await flush();
  expect([...root.querySelectorAll('.rlc-cn-chroma')].map((c) => c.getAttribute('aria-label'))).toEqual(['Rubi']);
});

test('ícones: clicar equipa o ícone', async () => {
  mount();
  await flush();
  act(() => tab('Ícones').click());
  await flush();
  act(() => cards().find((c) => c.getAttribute('aria-label') === '588')!.click());
  const call = fetchMock.mock.calls.find((c) => c[0] === '/lol-summoner/v1/current-summoner/icon');
  expect(JSON.parse(call![1].body)).toEqual({ profileIconId: 588 });
});
