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
const navBtn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-cv-nav button')].find((b) => b.firstChild?.nextSibling?.textContent === text)!;
const count = (text: string) => navBtn(text).querySelector('small')!.textContent;
// O chip traz o rótulo e, num <small>, o contador.
const chip = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-vt-chip')].find((b) => b.firstChild?.textContent === text)!;
const chipCount = (text: string) => chip(text).querySelector('small')?.textContent;
const select = (label: string) => root.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
const options = (label: string) => [...select(label).options].map((o) => o.textContent);
const pick = (label: string, value: string) =>
  act(() => {
    const s = select(label);
    s.value = value;
    s.dispatchEvent(new Event('change'));
  });
const groups = () => [...root.querySelectorAll('.rlc-vt-group')].map((g) => g.textContent);
let store: Map<string, unknown>;
const tiles = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-vt-tile')];
const tile = (name: string) => tiles().find((c) => c.getAttribute('aria-label') === name)!;
const names = () => tiles().map((c) => c.getAttribute('aria-label'));
const drawer = () => root.querySelector('.rlc-vt-drawer');
const type = (value: string) =>
  act(() => {
    const input = root.querySelector<HTMLInputElement>('.rlc-vt-search')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  });

const champs = [
  { id: 103, name: 'Ahri', title: 'a Raposa de Nove Caudas', roles: ['mage'], baseSplashPath: '/s/103.jpg', baseLoadScreenPath: '/l/103.jpg', squarePortraitPath: '/i/103.png', ownership: { owned: true }, purchased: 2000 },
  { id: 266, name: 'Aatrox', title: 'a Espada Darkin', roles: ['fighter'], baseSplashPath: '/s/266.jpg', baseLoadScreenPath: '/l/266.jpg', squarePortraitPath: '/i/266.png', ownership: { owned: false } },
  { id: 238, name: 'Zed', title: 'o Mestre das Sombras', roles: ['assassin'], baseSplashPath: '/s/238.jpg', baseLoadScreenPath: '/l/238.jpg', squarePortraitPath: '/i/238.png', ownership: { owned: true }, purchased: 1000 },
  // Variante de modo (Jade_Ahri): mesmo nome, id alto; não é um campeão a mais.
  { id: 60103, name: 'Ahri', title: 'a Raposa de Nove Caudas', roles: ['mage'], baseSplashPath: '/s/103.jpg', squarePortraitPath: '/i/103.png', ownership: { owned: true } },
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
  '/lol-champion-mastery/v1/me/champion-mastery': [{ championId: 238, championLevel: 12, championPoints: 99000 }, { championId: 103, championLevel: 5, championPoints: 20000 }],
  '/lol-game-data/assets/v1/skins.json': {
    '103015': { rarity: 'kEpic', skinLines: [{ id: 5 }], loadScreenPath: '/l/103015.jpg', chromas: [{ id: 103016, name: 'Ahri do Arcade (Rubi)', chromaPath: '/c/103016.png', colors: ['#e05a8a'] }, { id: 103017, name: 'Ahri do Arcade (Safira)', chromaPath: '/c/103017.png', colors: ['#2756ce'] }] },
    '238001': { rarity: 'kLegendary', isLegacy: true, loadScreenPath: '/l/238001.jpg' },
  },
  '/lol-game-data/assets/v1/skinlines.json': [{ id: 0, name: '' }, { id: 5, name: 'Retrô' }],
  '/lol-inventory/v2/inventory/CHAMPION_SKIN': [{ itemId: 103015, owned: true }, { itemId: 103016, owned: true }, { itemId: 238001, owned: true }],
  '/lol-inventory/v2/inventory/SUMMONER_ICON': [{ itemId: 29, owned: true }, { itemId: 588, owned: true }],
  '/lol-game-data/assets/v1/summoner-icons.json': [
    { id: 29, title: 'Poro', yearReleased: 2015 },
    { id: 588, title: 'Coroa', yearReleased: 2020 },
    { id: 900, title: 'Dragão', yearReleased: 2020 },
  ],
  '/lol-game-data/assets/v1/summoner-icon-sets.json': [
    { id: 1, displayName: 'Poros', icons: [29, 900] },
    { id: 2, hidden: true, displayName: 'Oculto', icons: [588] },
  ],
  '/lol-game-data/assets/v1/summoner-spells.json': [
    { id: 4, name: 'Flash', description: 'Teleporta você.', iconPath: '/sp/4.png', gameModes: ['ARAM', 'RUBY_TRIAL_1', 'CLASSIC'] },
    { id: 4294967295, name: 'Golpear Primordial', description: '', iconPath: '/sp/x.png', gameModes: [] },
  ],
};

beforeEach(() => {
  setLocale('pt_BR');
  store = new Map();
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: (k) => void store.delete(k) };
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => (url in routes ? new Response(JSON.stringify(routes[url]), { status: 200 }) : new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  delete window.DataStore;
});

async function mount() {
  const lcu = fakeLcu();
  lcu.chatMe.value = ready({ puuid: 'me', summonerId: 42 }) as Lcu['chatMe']['value'];
  lcu.lanes.value = ready({ '103': { recommendedPositions: ['MIDDLE'] }, '266': { recommendedPositions: ['TOP'] }, '238': { recommendedPositions: ['MIDDLE'] } }) as Lcu['lanes']['value'];
  act(() => render(<Collection lcu={lcu} />, root));
  await flush();
}

test('barra lateral: favorito de maior maestria, quatro totais e contagem por categoria', async () => {
  await mount();
  const hero = root.querySelector('.rlc-cv-hero-in')!;
  expect(hero.querySelector('b')!.textContent).toBe('Zed');
  expect(hero.textContent).toContain('Maestria 12');
  expect([...root.querySelectorAll('.rlc-cv-stats b')].map((b) => b.textContent)).toEqual(['2/3', '2', '17', '1']);
  expect(count('Campeões')).toBe('2');
  expect(count('Skins')).toBe('2');
  expect(count('Cromas')).toBe('1');
  expect(count('Ícones')).toBe('2');
  expect(count('Feitiços')).toBe('1');
  expect(navBtn('Campeões').getAttribute('aria-current')).toBe('page');
});

test('Espólios saiu da Coleção: virou vista própria no trilho', async () => {
  await mount();
  const labels = [...root.querySelectorAll('.rlc-cv-nav button')].map((b) => b.firstChild?.nextSibling?.textContent);
  expect(labels).not.toContain('Espólios');
  expect(labels).toContain('Feitiços');
  expect(root.querySelector('.rlc-loot')).toBeNull();
  expect(fetchMock.mock.calls.some((c) => String(c[0]).startsWith('/lol-loot/'))).toBe(false);
});

test('campeões: A–Z, sem variante de modo, quem não tem fica apagado com selo', async () => {
  await mount();
  expect(names()).toEqual(['Aatrox', 'Ahri', 'Zed']);
  expect(tile('Aatrox').getAttribute('data-owned')).toBe('false');
  expect(tile('Aatrox').querySelector('.rlc-vt-pill')!.textContent).toBe('Não possui');
  expect(tile('Zed').querySelector('.rlc-vt-pill')!.textContent).toBe('M12');
  expect(tile('Ahri').querySelector('img')!.getAttribute('src')).toBe('/l/103.jpg');
});

test('campeões: busca, rota com contador, posse, classe, maestria e ordem', async () => {
  await mount();
  type('ze');
  expect(names()).toEqual(['Zed']);
  type('');
  expect(chipCount('Meio')).toBe('2');
  act(() => chip('Topo').click());
  expect(names()).toEqual(['Aatrox']);
  act(() => chip('Todos').click());
  expect(options('Posse')).toEqual(['Todos (3)', 'Possuo (2)', 'Não possuo (1)']);
  pick('Posse', 'owned');
  expect(names()).toEqual(['Ahri', 'Zed']);
  expect(chipCount('Meio')).toBe('2');
  expect(chipCount('Topo')).toBe('0');
  expect(options('Classe')).toEqual(['Todas as classes', 'Assassino (1)', 'Mago (1)']);
  pick('Classe', 'mage');
  expect(names()).toEqual(['Ahri']);
  pick('Classe', '');
  pick('Maestria', '10');
  expect(names()).toEqual(['Zed']);
  pick('Maestria', '');
  pick('Ordenar', 'mastery');
  expect(names()).toEqual(['Zed', 'Ahri']);
  pick('Ordenar', 'recent');
  expect(names()).toEqual(['Ahri', 'Zed']);
});

test('gaveta do campeão abre com título, maestria e skins com cromas; ✕ fecha', async () => {
  await mount();
  act(() => tile('Ahri').click());
  const d = drawer()!;
  expect(d.querySelector('.rlc-vt-title')!.textContent).toBe('Ahri');
  expect(d.querySelector('.rlc-vt-kicker')!.textContent).toBe('a Raposa de Nove Caudas');
  expect(d.textContent).toContain('Mago');
  expect(d.textContent).toContain('Maestria 5');
  expect([...d.querySelectorAll('.rlc-vt-skin figcaption')].map((f) => f.textContent)).toEqual(['Ahri do Arcade']);
  expect([...d.querySelectorAll('.rlc-vt-dot')].map((c) => [c.getAttribute('aria-label'), c.getAttribute('data-owned')])).toEqual([
    ['Ahri do Arcade (Rubi)', 'true'],
    ['Ahri do Arcade (Safira)', 'false'],
  ]);
  act(() => d.querySelector<HTMLButtonElement>('.rlc-vt-close')!.click());
  expect(drawer()).toBeNull();
});

test('trocar de categoria: skins agrupadas por campeão, só as minhas por padrão', async () => {
  await mount();
  act(() => navBtn('Skins').click());
  expect(navBtn('Skins').getAttribute('aria-current')).toBe('page');
  expect(names()).toEqual(['Ahri do Arcade', 'Zed de Choque']);
  expect(groups()).toEqual(['Ahri', 'Zed']);
  pick('Posse', 'all');
  expect(names()).toContain('Ahri K/DA');
});

test('skins: raridade com nome legível e contador, legado, coleção e busca por campeão ou coleção', async () => {
  await mount();
  act(() => navBtn('Skins').click());
  await flush();
  expect([...root.querySelectorAll('.rlc-vt-chip')].map((b) => b.textContent)).toEqual(['Todas2', 'Épica1', 'Lendária1', 'Legado1']);
  expect(root.textContent).not.toContain('kEpic');
  act(() => chip('Lendária').click());
  expect(names()).toEqual(['Zed de Choque']);
  act(() => chip('Todas').click());
  pick('Posse', 'all');
  expect(chipCount('Comum')).toBe('1');
  pick('Agrupar', 'line');
  expect(groups()).toEqual(['Retrô', 'Sem coleção']);
  pick('Agrupar', 'rarity');
  expect(groups()).toEqual(['Lendária', 'Épica', 'Comum']);
  type('retrô');
  expect(names()).toEqual(['Ahri do Arcade']);
  type('zed');
  expect(names()).toEqual(['Zed de Choque']);
});

test('filtro escolhido fica salvo por seção e volta ao reabrir', async () => {
  await mount();
  act(() => navBtn('Skins').click());
  await flush();
  act(() => chip('Lendária').click());
  pick('Agrupar', 'none');
  expect(store.get('rlc.collection.filters')).toEqual({ skins: { own: 'owned', rarity: 'kLegendary', group: 'none', sort: 'name' } });
  render(null, root);
  await mount();
  act(() => navBtn('Skins').click());
  await flush();
  expect(chip('Lendária').getAttribute('aria-pressed')).toBe('true');
  expect(select('Agrupar').value).toBe('none');
  expect(names()).toEqual(['Zed de Choque']);
  // Campeões não herdam o filtro das skins.
  act(() => navBtn('Campeões').click());
  expect(names()).toEqual(['Aatrox', 'Ahri', 'Zed']);
});

test('ícones: conjuntos com contador (sem os ocultos), ano em grupos, mais recentes primeiro', async () => {
  await mount();
  act(() => navBtn('Ícones').click());
  await flush();
  expect(groups()).toEqual(['2020', '2015']);
  expect(options('Conjunto')).toEqual(['Todos os conjuntos', 'Poros (1)', 'Sem conjunto (1)']);
  pick('Conjunto', '1');
  expect(names()).toEqual(['Poro']);
  pick('Conjunto', '');
  pick('Posse', 'all');
  expect(names()).toEqual(['Dragão', 'Coroa', 'Poro']);
  expect(options('Conjunto')).toEqual(['Todos os conjuntos', 'Poros (2)', 'Sem conjunto (1)']);
  pick('Ano', '2020');
  expect(names()).toEqual(['Dragão', 'Coroa']);
  // Ícone que o jogador não tem não equipa.
  act(() => tile('Dragão').click());
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-summoner/v1/current-summoner/icon')).toBe(false);
  pick('Ordenar', 'name');
  expect(groups()).toEqual([]);
  expect(names()).toEqual(['Coroa', 'Dragão']);
});

test('ícones mostram o nome e clicar equipa', async () => {
  await mount();
  act(() => navBtn('Ícones').click());
  await flush();
  expect(names()).toEqual(['Coroa', 'Poro']);
  act(() => tile('Coroa').click());
  const call = fetchMock.mock.calls.find((c) => c[0] === '/lol-summoner/v1/current-summoner/icon');
  expect(JSON.parse(call![1].body)).toEqual({ profileIconId: 588 });
});

test('feitiços: modos com nome legível, sem ids internos, e sem feitiço sem modo', async () => {
  await mount();
  act(() => navBtn('Feitiços').click());
  expect(names()).toEqual(['Flash']);
  expect(options('Modos')).toEqual(['Todos os modos (1)', "Summoner's Rift (1)", 'ARAM (1)']);
  act(() => tile('Flash').click());
  const d = drawer()!;
  expect(d.textContent).toContain('Teleporta você.');
  expect([...d.querySelectorAll('.rlc-vt-modes span')].map((s) => s.textContent)).toEqual(["Summoner's Rift", 'ARAM']);
  expect(d.textContent).not.toContain('CLASSIC');
});
