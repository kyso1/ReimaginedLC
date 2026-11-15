import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { action, arenaSession, cell, fakeLcu, ready, session } from '../../test/fixtures';
import { ChampSelect, DIVE_MS, LOCK_FX_MS, MAP_INTRO_MS } from './ChampSelect';
import { BRAVE_MS, LOCK_SHOW_MS, REVEAL_MS } from './fx';
import { FAV_MS } from './Arena';
import { CARD_FX_MS } from './Teams';
import { CHROMA_HIDE_MS } from './Loadout';
import { BENCH_COOLDOWN_MS, BENCH_SLOTS, flipAt, forgetDeal } from './Swaps';
import { FLY_MS } from './aramFx';
import { DODGE_PATH } from '../../plugins/dodge';
import { setPrefs } from '../../shell/prefs';

// O jsdom não tem WebGL: a cena do mapa é trocada por uma que não desenha (ela tem os testes dela em RiftScene.test.tsx
// e scene/); aqui vale quando o mapa aparece, mergulha e some.
vi.mock('./scene/riftScene', () => ({ mountRift: () => ({ update() {}, dispose() {} }) }));
vi.mock('./scene/abyssScene', () => ({ mountAbyss: () => ({ update() {}, dispose() {} }) }));
vi.mock('./scene/arenaScene', () => ({ mountArena: () => ({ update() {}, dispose() {} }) }));

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  // A prévia abre por portal em #rlc-root.
  root.id = 'rlc-root';
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Image', LoadedImage);
  forgetDeal();
});

// O jsdom não carrega imagens: esta "carrega" logo, para o Crossfade trocar a camada.
class LoadedImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decode = () => Promise.resolve();
  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const CHAMPS = new Map([
  [103, { id: 103, name: 'Ahri', icon: '/i/103.png', roles: ['mage', 'assassin'] }],
  [157, { id: 157, name: 'Yasuo', icon: '/i/157.png', roles: ['fighter'] }],
  [266, { id: 266, name: 'Aatrox', icon: '/i/266.png', roles: ['fighter', 'tank'] }],
]);
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string, scope: ParentNode = root) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
/** Fundo do palco: a camada de cima do Crossfade. */
const stage = () => root.querySelector<HTMLElement>('.rlc-cs-splash .rlc-xfade-layer:last-child')?.style.backgroundImage ?? '';
const call = (url: string) => fetchMock.mock.calls.filter((c) => c[0] === url);

function setup(s: ReturnType<typeof session> | null, over: Partial<Record<keyof Lcu, unknown>> = {}) {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS, splash: async (id) => (id ? `/splash/${id}.jpg` : null) };
  const values: Partial<Record<keyof Lcu, unknown>> = { champSelect: ready(s), pickable: ready([103, 157, 266]), bannable: ready([103, 157]), ...over };
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  act(() => render(<ChampSelect lcu={lcu} />, root));
  return lcu;
}

const me = cell({ cellId: 0, gameName: 'Fulano', assignedPosition: 'middle' });
const ally = cell({ cellId: 1, gameName: '', puuid: 'p-ally' });
const enemy = cell({ cellId: 5, gameName: 'Zeca', team: 2 });
const banTurn = () => session({ myTeam: [me, ally], theirTeam: [enemy], actions: [[action({ id: 0, type: 'ban', isInProgress: true })]] });
const pickTurn = (championId = 0) => session({ myTeam: [me, ally], theirTeam: [enemy], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId })]] });

test('cartões dos aliados com nome e ícone da rota; inimigo de nome oculto vira "Inimigo N", com o campeão só depois de travado', async () => {
  setup(session({ myTeam: [me, ally], theirTeam: [cell({ cellId: 5, gameName: 'Zeca', team: 2, nameVisibilityType: 'HIDDEN' }), cell({ cellId: 6, team: 2, gameName: '', championId: 157 }), cell({ cellId: 7, team: 2, gameName: 'Sicrano' })] }));
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-team');
  expect(mine!.querySelectorAll('.rlc-cs-cell')).toHaveLength(2);
  expect(mine!.textContent).toContain('Fulano');
  expect(mine!.querySelector('.rlc-cs-pos')!.getAttribute('aria-label')).toBe('Meio');
  expect(mine!.querySelector('.rlc-cs-pos svg')!.getAttribute('data-role')).toBe('MIDDLE');
  const foes = [...theirs!.querySelectorAll('.rlc-cs-cell')].map((c) => [c.querySelector('.rlc-cs-name')!.textContent, c.querySelector('.rlc-cs-status')?.textContent ?? '', c.getAttribute('data-state')]);
  // O terceiro tem o nome à mostra (a LCU o manda, como nas personalizadas).
  expect(foes).toEqual([['Inimigo 1', '', 'empty'], ['Inimigo 2', 'Yasuo', 'locked'], ['Sicrano', '', 'empty']]);
  expect(theirs!.textContent).not.toContain('Zeca');
});

test('palco: splash ao fundo, fase e tempo, nome grande, aliados à esquerda, inimigos à direita e barra com Travar', async () => {
  setup(session({ myTeam: [{ ...me, championPickIntent: 103 }, cell({ cellId: 1, championId: 266 })], theirTeam: [enemy], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId: 103 })]] }));
  await settle();
  await settle();
  await settle();
  expect(stage()).toContain('/splash/103000.jpg');
  expect(root.querySelector('.rlc-cs-side[data-side="mine"] .rlc-cs-team')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-side[data-side="theirs"] .rlc-cs-team')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-clock')!.textContent).toBe('Sua vez de escolher30 s');
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Ahri');
  expect(root.querySelector('.rlc-cs-bar .rlc-cs-action')!.textContent).toBe('Travar');
  // a arte do campeão do aliado entra no cartão
  const arts = [...root.querySelectorAll<HTMLElement>('.rlc-cs-side[data-side="mine"] .rlc-cs-art')];
  expect(arts.map((a) => [a.style.backgroundImage, a.dataset.locked])).toEqual([['url("/splash/103000.jpg")', undefined], ['url("/splash/266000.jpg")', 'true']]);
});

test('mouse na grade troca a prévia do palco; sair da grade volta ao campeão em destaque', async () => {
  setup(session({ myTeam: [{ ...me, championPickIntent: 103 }], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId: 103 })]] }));
  await settle();
  act(() => void btn('Yasuo')!.dispatchEvent(new MouseEvent('mouseenter')));
  await settle();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Yasuo');
  expect(stage()).toContain('/splash/157000.jpg');
  act(() => void root.querySelector('.rlc-cs-grid')!.dispatchEvent(new MouseEvent('mouseleave')));
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Ahri');
  // só prévia: nada é enviado
  expect(fetchMock.mock.calls.filter((c) => c[1]?.method)).toEqual([]);
});

test('nome vazio na faixa vem do lcu.name', async () => {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS };
  lcu.name = async (p) => (p === 'p-ally' ? 'Beltrano' : null);
  lcu.champSelect.value = ready(banTurn());
  act(() => render(<ChampSelect lcu={lcu} />, root));
  await settle();
  expect(root.querySelector('.rlc-cs-team')!.textContent).toContain('Beltrano');
});

test('na minha vez de banir: grade só com baníveis, botão Banir, clique destaca e Banir conclui', async () => {
  setup(banTurn());
  await settle();
  const names = [...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'));
  expect(names).toEqual(['Ahri', 'Yasuo']);
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Bana um campeão');
  act(() => btn('Yasuo')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/0')[0]![1].body)).toEqual({ championId: 157 });
});

test('Banir/Confirmar só habilita com campeão destacado permitido e envia completed', async () => {
  setup(pickTurn(103));
  await settle();
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Sua vez de escolher');
  const confirm = btn('Travar')!;
  expect(confirm.disabled).toBe(false);
  act(() => confirm.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[0]![1].body)).toEqual({ championId: 103, completed: true });
});

test('campeão destacado que deixou de ser permitido some da grade e desabilita Confirmar', async () => {
  setup(pickTurn(103), { pickable: ready([157, 266]) });
  await settle();
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox', 'Yasuo']);
  expect(btn('Travar')!.disabled).toBe(true);
});

test('fora da vez: sem botão de confirmar nem banir, e clique na grade não envia nada', async () => {
  setup(session({ myTeam: [me], actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] }));
  await settle();
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Aguardando');
  expect(btn('Travar')).toBeUndefined();
  expect(btn('Banir')).toBeUndefined();
  // Fora da vez a grade começa fechada (palco com o mapa); aberta à mão, só mostra.
  expect(root.querySelector('.rlc-cs-drawer')).toBeNull();
  act(() => btn('Mostrar campeões')!.click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-cs-champ')!.click());
  // só leituras (nomes da sala); nenhuma escrita
  expect(fetchMock.mock.calls.filter((c) => c[1]?.method)).toEqual([]);
});

test('busca por nome', async () => {
  setup(pickTurn());
  await settle();
  const search = root.querySelector<HTMLInputElement>('input[aria-label="Buscar campeão"]')!;
  act(() => {
    search.value = 'ah';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri']);
});

const LANES = { '103': { recommendedPositions: ['MIDDLE'] }, '157': { recommendedPositions: ['MIDDLE', 'TOP'] }, '266': { recommendedPositions: ['TOP'] } };
const grid = (favs: Record<number, string[]>) => [103, 157, 266].map((id) => ({ id, positionsFavorited: favs[id] ?? [] }));

test('rota começa pela posição atribuída e filtra; clicar de novo mostra todas', async () => {
  setup(session({ myTeam: [cell({ cellId: 0, assignedPosition: 'top' })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({})) });
  await settle();
  expect(btn('Topo')!.getAttribute('aria-pressed')).toBe('true');
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox', 'Yasuo']);
  act(() => btn('Meio')!.click());
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri', 'Yasuo']);
  act(() => btn('Meio')!.click());
  expect(root.querySelectorAll('.rlc-cs-champ')).toHaveLength(3);
});

test('favoritos da rota vêm primeiro com estrela; a estrela alterna pela LCU', async () => {
  setup(session({ myTeam: [cell({ cellId: 0, assignedPosition: 'middle' })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({ 157: ['middle'], 103: ['top'] })) });
  await settle();
  const tiles = [...root.querySelectorAll('.rlc-cs-tile')];
  expect(tiles.map((t) => t.querySelector('.rlc-cs-champ')!.getAttribute('aria-label'))).toEqual(['Yasuo', 'Ahri']);
  expect(tiles[0]!.querySelector('.rlc-cs-fav')!.getAttribute('aria-pressed')).toBe('true');
  expect(tiles[1]!.querySelector('.rlc-cs-fav')!.getAttribute('aria-pressed')).toBe('false');
  act(() => tiles[1]!.querySelector<HTMLButtonElement>('.rlc-cs-fav')!.click());
  expect(call('/lol-champ-select/v1/toggle-favorite/103/middle')[0]![1]).toEqual({ method: 'POST' });
});

test('palco: as splashes se fundem pelo Crossfade', async () => {
  setup(session({ myTeam: [{ ...me, championPickIntent: 103 }], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId: 103 })]] }));
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-splash')!.classList.contains('rlc-xfade')).toBe(true);
  act(() => void btn('Yasuo')!.dispatchEvent(new MouseEvent('mouseenter')));
  await settle();
  await settle();
  await settle();
  // a anterior fica por baixo enquanto a nova entra
  expect([...root.querySelectorAll<HTMLElement>('.rlc-cs-splash .rlc-xfade-layer')].map((l) => l.style.backgroundImage)).toEqual(['url("/splash/103000.jpg")', 'url("/splash/157000.jpg")']);
});

const menu = () => document.body.querySelector<HTMLElement>('.rlc-cs-ctx');
const menuItems = () => [...menu()!.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]')];

test('clique direito num campeão abre o menu de favoritar por rota, marcado onde já é favorito', async () => {
  setup(session({ myTeam: [cell({ cellId: 0 })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({ 103: ['middle', 'utility'] })) });
  await settle();
  const ahri = btn('Ahri')!;
  const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 120, clientY: 80 });
  act(() => void ahri.dispatchEvent(ev));
  expect(ev.defaultPrevented).toBe(true);
  expect(menu()!.getAttribute('aria-label')).toBe('Ahri');
  expect(menuItems().map((b) => [b.textContent, b.getAttribute('aria-checked')])).toEqual([
    ['Favoritar para Topo★', 'false'],
    ['Favoritar para Selva★', 'false'],
    ['Favoritar para Meio★', 'true'],
    ['Favoritar para Atirador★', 'false'],
    ['Favoritar para Suporte★', 'true'],
  ]);
  expect(document.activeElement).toBe(menuItems()[0]);
  act(() => menuItems()[0]!.click());
  expect(call('/lol-champ-select/v1/toggle-favorite/103/top')[0]![1]).toEqual({ method: 'POST' });
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(ahri);
});

test('menu do campeão: Shift+F10 abre, Esc fecha só o menu, clique fora fecha', async () => {
  setup(session({ myTeam: [cell({ cellId: 0 })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({})) });
  await settle();
  act(() => void btn('Yasuo')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true })));
  expect(menu()!.getAttribute('aria-label')).toBe('Yasuo');
  act(() => void document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(menu()).toBeNull();
  // a grade continua aberta: o Esc foi do menu
  expect(root.querySelector('.rlc-cs-drawer')).not.toBeNull();
  act(() => void btn('Yasuo')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
  act(() => document.body.querySelector<HTMLElement>('.rlc-cs-ctx-backdrop')!.click());
  expect(menu()).toBeNull();
  expect(fetchMock.mock.calls.filter((c) => c[1]?.method)).toEqual([]);
});

test('sem rota marcada a estrela fica escondida e não há favoritos na frente', async () => {
  setup(session({ myTeam: [cell({ cellId: 0 })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({ 266: ['top'] })) });
  await settle();
  expect(root.querySelector('.rlc-cs-fav')).toBeNull();
  // favorito em alguma rota fica marcado mesmo sem rota no filtro
  expect([...root.querySelectorAll('.rlc-cs-tile')].map((t) => !!t.querySelector('.rlc-cs-fav-mark'))).toEqual([true, false, false]);
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox', 'Ahri', 'Yasuo']);
});

test('Sair só aparece com showQuitButton e chama a LCU', async () => {
  setup(session({ myTeam: [me], showQuitButton: true } as never));
  await settle();
  act(() => btn('Sair da seleção')!.click());
  expect(call('/lol-lobby-team-builder/champ-select/v1/session/quit')).toHaveLength(1);
  render(null, root);
  setup(session({ myTeam: [me], showQuitButton: false } as never));
  await settle();
  expect(btn('Sair da seleção')).toBeUndefined();
});

test('dodge: só com o plugin ligado, pede confirmação e então chama o quitV2', async () => {
  setup(pickTurn());
  await settle();
  expect(btn('Dodge')).toBeUndefined();
  setPrefs({ dodge: true });
  await settle();
  act(() => btn('Dodge')!.click());
  expect(fetchMock.mock.calls.filter((c) => c[1]?.method)).toEqual([]);
  const dialog = root.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain('penalidade de dodge');
  act(() => btn('Dodge', dialog)!.click());
  expect(call(DODGE_PATH)).toHaveLength(1);
  expect(decodeURIComponent(DODGE_PATH)).toContain('["","teambuilder-draft","quitV2",""]');
  setPrefs({ dodge: false });
});

test('banimentos na faixa do cabeçalho, cada time do seu lado', async () => {
  setup(session({ myTeam: [me], theirTeam: [enemy], actions: [[action({ type: 'ban', completed: true, championId: 157 })], [action({ type: 'ban', completed: true, championId: 266, isAllyAction: false })]] }));
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-head .rlc-cs-banstrip .rlc-cs-bans');
  expect(mine!.querySelector('[data-state="done"]')!.getAttribute('aria-label')).toBe('Yasuo');
  expect(mine!.querySelector('img')!.getAttribute('src')).toBe('/i/157.png');
  expect(theirs!.querySelector('[data-state="done"]')!.getAttribute('aria-label')).toBe('Aatrox');
});

test('fundo com a splash do campeão destacado; sem campeão, sem splash', async () => {
  setup(session({ myTeam: [cell({ cellId: 0, championPickIntent: 103 })] }));
  await settle();
  await settle();
  await settle();
  expect(stage()).toContain('/splash/103000.jpg');
  render(null, root);
  setup(session({ myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId: 103005 })] }));
  await settle();
  await settle();
  await settle();
  expect(stage()).toContain('/splash/103005.jpg');
  render(null, root);
  setup(session({ myTeam: [cell({ cellId: 0 })] }));
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-splash')).toBeNull();
});

test('tempo: conta localmente e reancora a cada valor novo, mesmo repetido numa fase nova', async () => {
  vi.useFakeTimers();
  const lcu = setup(pickTurn());
  expect(root.querySelector('.rlc-cs-timer')!.textContent).toBe('30');
  act(() => void vi.advanceTimersByTime(5000));
  expect(root.querySelector('.rlc-cs-timer')!.textContent).toBe('25');
  act(() => {
    lcu.champSelect.value = ready(session({ myTeam: [me], timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: 30000, totalTimeInPhase: 30000, internalNowInEpochMs: Date.now(), isInfinite: false } as never }));
  });
  expect(root.querySelector('.rlc-cs-timer')!.textContent).toBe('30');
  act(() => void vi.advanceTimersByTime(40000));
  expect(root.querySelector('.rlc-cs-timer')!.textContent).toBe('0');
});

test('sessão nula não quebra', () => {
  setup(null);
  expect(root.querySelector('.rlc-champselect')).not.toBeNull();
});

test('travar fecha a grade e mostra o carrossel de skins; dá para reabrir a grade à mão', async () => {
  const lcu = setup(pickTurn(103), { skins: ready([skin(103000, { isBase: true }), skin(103001)]) });
  await settle();
  expect(root.querySelector('.rlc-cs-grid')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-carousel')).toBeNull();
  act(() => {
    lcu.champSelect.value = ready(session({ myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId: 103001 })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] }));
  });
  expect(root.querySelector('.rlc-cs-grid')).toBeNull();
  expect(btn('Travar')).toBeUndefined();
  expect([...root.querySelectorAll('.rlc-cs-carousel .rlc-cs-skin')].map((s) => s.getAttribute('aria-label'))).toEqual(['Skin 103000', 'Skin 103001']);
  expect(root.querySelector('.rlc-cs-skin-name')!.textContent).toBe('Skin 103001');
  act(() => btn('Mostrar campeões')!.click());
  expect(root.querySelector('.rlc-cs-grid')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-carousel')).toBeNull();
});

const skin = (id: number, over: Record<string, unknown> = {}) => ({ id, name: `Skin ${id}`, unlocked: true, disabled: false, isBase: false, tilePath: `/t/${id}.jpg`, childSkins: [], ...over });
const lockedMe = (over = {}) => session({ myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId: 103000, spell1Id: 4, spell2Id: 14, ...over })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] });

test('skins: só as desbloqueadas; clique aplica; cromas da skin selecionada aparecem e aplicam', async () => {
  setup(lockedMe({ selectedSkinId: 103001 }), {
    skins: ready([skin(103000, { isBase: true }), skin(103001, { childSkins: [{ id: 103010, name: 'Rubi', unlocked: true, colors: ['#f00'] }, { id: 103011, name: 'Safira', unlocked: false, colors: ['#00f'] }] }), skin(103002, { unlocked: false })]),
  });
  await settle();
  expect([...root.querySelectorAll('.rlc-cs-skin')].map((s) => s.getAttribute('aria-label'))).toEqual(['Skin 103000', 'Skin 103001']);
  expect(root.querySelector('.rlc-cs-skin[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Skin 103001');
  expect([...root.querySelectorAll('.rlc-cs-chroma')].map((s) => s.getAttribute('aria-label'))).toEqual(['Rubi']);
  act(() => btn('Skin 103000')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[0]![1].body)).toEqual({ selectedSkinId: 103000 });
  await settle();
  act(() => btn('Rubi')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[1]![1].body)).toEqual({ selectedSkinId: 103010 });
});

test('mouse na skin mostra as cromas dela com prévia; não possuída fica bloqueada; clique aplica a croma', async () => {
  setup(lockedMe({ selectedSkinId: 103000 }), {
    skins: ready([
      skin(103000, { isBase: true }),
      skin(103001, { childSkins: [{ id: 103010, name: 'Rubi', unlocked: true, colors: ['#f00'], chromaPreviewPath: '/c/103010.png' }, { id: 103011, name: 'Safira', unlocked: false, colors: ['#00f'], chromaPreviewPath: '/c/103011.png' }] }),
    ]),
  });
  await settle();
  const tile = btn('Skin 103001')!;
  expect(tile.dataset.chromas).toBe('true');
  expect(btn('Skin 103000')!.dataset.chromas).toBeUndefined();
  act(() => void tile.dispatchEvent(new MouseEvent('mouseenter')));
  const pop = root.querySelector('.rlc-cs-chroma-pop')!;
  expect(pop.getAttribute('aria-label')).toBe('Cromas · Skin 103001');
  const locked = btn('Safira · não possuída', pop)!;
  expect(locked.disabled).toBe(true);
  act(() => void locked.dispatchEvent(new MouseEvent('mouseenter')));
  expect(pop.querySelector('.rlc-cs-chroma-preview img')!.getAttribute('src')).toBe('/c/103011.png');
  act(() => void btn('Rubi', pop)!.dispatchEvent(new MouseEvent('mouseenter')));
  expect(pop.querySelector('.rlc-cs-chroma-preview img')!.getAttribute('src')).toBe('/c/103010.png');
  act(() => btn('Rubi', pop)!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[0]![1].body)).toEqual({ selectedSkinId: 103010 });
  // Sai da skin: o painel some depois de um instante (dá tempo de chegar até ele).
  vi.useFakeTimers();
  act(() => void tile.dispatchEvent(new MouseEvent('mouseleave')));
  expect(root.querySelector('.rlc-cs-chroma-pop')).not.toBeNull();
  await act(async () => void (await vi.advanceTimersByTimeAsync(CHROMA_HIDE_MS + 10)));
  expect(root.querySelector('.rlc-cs-chroma-pop')).toBeNull();
});

test('skin sem cromas também mostra prévia no mouse (splash, animada quando tem); Prévia abre em tela cheia', async () => {
  setup(lockedMe({ selectedSkinId: 103000 }), { skins: ready([skin(103000, { isBase: true, splashPath: '/s/103000.jpg' }), skin(103001, { splashPath: '/s/103001.jpg', splashVideoPath: '/v/103001.webm' })]) });
  await settle();
  act(() => void btn('Skin 103000')!.dispatchEvent(new MouseEvent('mouseenter')));
  let pop = root.querySelector('.rlc-cs-chroma-pop')!;
  expect(pop.getAttribute('data-solo')).toBe('true');
  expect(pop.querySelector('.rlc-cs-skin-preview img')!.getAttribute('src')).toBe('/s/103000.jpg');
  expect(pop.querySelector('.rlc-cs-chroma-name')!.textContent).toBe('Skin 103000');
  act(() => void btn('Skin 103001')!.dispatchEvent(new MouseEvent('mouseenter')));
  pop = root.querySelector('.rlc-cs-chroma-pop')!;
  expect(pop.querySelector('.rlc-cs-skin-preview video')!.getAttribute('src')).toBe('/v/103001.webm');
  act(() => btn('Prévia', pop)!.click());
  expect(root.querySelector('.rlc-pv')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-chroma-pop')).toBeNull();
});

test('croma selecionada mantém a skin mãe marcada', async () => {
  setup(lockedMe({ selectedSkinId: 103010 }), { skins: ready([skin(103001, { childSkins: [{ id: 103010, name: 'Rubi', unlocked: true, colors: [] }] })]) });
  await settle();
  expect(root.querySelector('.rlc-cs-skin[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Skin 103001');
  expect(root.querySelector('.rlc-cs-chroma[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Rubi');
});

const SPELLS = new Map([
  [4, { id: 4, name: 'Flash', icon: '/s/4.png', gameModes: ['CLASSIC', 'ARAM'] }],
  [14, { id: 14, name: 'Incendiar', icon: '/s/14.png', gameModes: ['CLASSIC', 'ARAM'] }],
  [11, { id: 11, name: 'Golpear', icon: '/s/11.png', gameModes: ['CLASSIC'] }],
  [32, { id: 32, name: 'Marcar', icon: '/s/32.png', gameModes: ['ARAM'] }],
]);
function setupLoadout(over: Partial<Record<keyof Lcu, unknown>> = {}) {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS, spells: async () => SPELLS, splash: async (id) => (id ? `/splash/${id}.jpg` : null) };
  const values: Partial<Record<keyof Lcu, unknown>> = {
    champSelect: ready(lockedMe()),
    gameflowSession: ready({ gameData: { queue: { gameMode: 'CLASSIC' } } }),
    perkPages: ready([{ id: 1, name: 'Meio', isValid: true, current: true }, { id: 2, name: 'Topo', isValid: true }, { id: 3, name: 'Quebrada', isValid: false }]),
    currentPerkPage: ready({ id: 1, name: 'Meio' }),
    ...over,
  };
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  act(() => render(<ChampSelect lcu={lcu} />, root));
}

test('feitiços: slot lista os do modo atual e aplica; escolher o do outro slot troca os dois', async () => {
  setupLoadout();
  await settle();
  act(() => btn('Feitiço 1: Flash')!.click());
  expect([...root.querySelectorAll('.rlc-cs-spell-option')].map((b) => b.getAttribute('aria-label'))).toEqual(['Flash', 'Golpear', 'Incendiar']);
  act(() => btn('Golpear')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[0]![1].body)).toEqual({ spell1Id: 11 });
  await settle();
  act(() => btn('Feitiço 1: Flash')!.click());
  act(() => btn('Incendiar')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[1]![1].body)).toEqual({ spell1Id: 14, spell2Id: 4 });
});

test('runas: a barra mostra a página atual e o botão Runas abre o editor por cima, com a lista ▾ das páginas', async () => {
  setupLoadout();
  await settle();
  expect(root.querySelector('.rlc-cs-page-name')!.textContent).toBe('Meio');
  expect(root.querySelector('select[aria-label="Páginas de runas"]')).toBeNull();
  act(() => btn('Runas')!.click());
  await settle();
  expect(root.querySelector('.rlc-champselect > .rlc-re[data-mode="overlay"]')).not.toBeNull();
  act(() => btn('Páginas de runas')!.click());
  const items = [...root.querySelectorAll<HTMLButtonElement>('.rlc-re-list-item')];
  expect(items.map((i) => i.textContent)).toEqual(['Meio', 'Topo', 'Quebrada']);
  act(() => items[1]!.click());
  const [, init] = call('/lol-perks/v1/currentpage')[0]!;
  expect(init).toEqual({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '2' });
  act(() => btn('Fechar')!.click());
  expect(root.querySelector('.rlc-re')).toBeNull();
});

test('troca recebida: cartão com Aceitar e Recusar', async () => {
  setup(session({ myTeam: [me, cell({ cellId: 1, gameName: 'Zeca' })], trades: [{ id: 7, cellId: 1, state: 'RECEIVED' }] as never }));
  await settle();
  const card = root.querySelector('.rlc-cs-swap')!;
  expect(card.textContent).toContain('Zeca');
  expect(card.textContent).toContain('trocar de campeão');
  act(() => btn('Aceitar', card)!.click());
  expect(call('/lol-champ-select/v1/session/champion-swaps/7/accept')).toHaveLength(1);
  await settle();
  act(() => btn('Recusar', card)!.click());
  expect(call('/lol-champ-select/v1/session/champion-swaps/7/decline')).toHaveLength(1);
});

test('troca enviada: aguardando, com Cancelar', async () => {
  setup(session({ myTeam: [me, cell({ cellId: 1, gameName: 'Zeca' })], pickOrderSwaps: [{ id: 8, cellId: 1, state: 'SENT' }] as never }));
  await settle();
  const card = root.querySelector('.rlc-cs-swap')!;
  expect(card.textContent).toContain('Aguardando Zeca');
  act(() => btn('Cancelar', card)!.click());
  expect(call('/lol-champ-select/v1/session/pick-order-swaps/8/cancel')).toHaveLength(1);
});

test('menu do aliado oferece só as trocas disponíveis com ele', async () => {
  setup(session({
    myTeam: [me, cell({ cellId: 1, gameName: 'Zeca' }), cell({ cellId: 2, gameName: 'Beltrano' })],
    trades: [{ id: 7, cellId: 1, state: 'AVAILABLE' }, { id: 9, cellId: 2, state: 'INVALID' }] as never,
    positionSwaps: [{ id: 11, cellId: 1, state: 'AVAILABLE' }] as never,
  }));
  await settle();
  const cells = root.querySelectorAll('.rlc-cs-team')[0]!.querySelectorAll('.rlc-cs-cell');
  expect(cells[0]!.querySelector('.rlc-col-menu')).toBeNull();
  expect(cells[2]!.querySelector('.rlc-col-menu')).toBeNull();
  root.id = 'rlc-root';
  act(() => cells[1]!.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  expect([...root.querySelectorAll('[role="menuitem"]')].map((b) => b.textContent)).toEqual(['Trocar campeão', 'Trocar posição']);
  // A lista abre solta na tela, fora do cartão: dentro dele, entrava no fluxo e esticava o banner do campeão.
  expect(cells[1]!.querySelector('.rlc-menu')).toBeNull();
  expect(root.querySelector(':scope > .rlc-menu[data-floating]')).not.toBeNull();
  root.removeAttribute('id');
  act(() => btn('Trocar posição')!.click());
  expect(call('/lol-champ-select/v1/session/position-swaps/11/request')).toHaveLength(1);
});

test('ARAM: banco troca pelo clique; rolagem mostra o restante e desabilita sem rolagens', async () => {
  const lcu = setup(session({ myTeam: [me], benchEnabled: true, benchChampions: [{ championId: 157, isPriority: false }] as never, allowRerolling: true, rerollsRemaining: 2 }));
  await settle();
  act(() => btn('Yasuo', root.querySelector('.rlc-cs-bench')!)!.click());
  expect(call('/lol-champ-select/v1/session/bench/swap/157')).toHaveLength(1);
  const reroll = btn('Rolar (2)')!;
  act(() => reroll.click());
  expect(call('/lol-champ-select/v1/session/my-selection/reroll')).toHaveLength(1);
  act(() => {
    lcu.champSelect.value = ready(session({ myTeam: [me], benchEnabled: true, benchChampions: [] as never, allowRerolling: true, rerollsRemaining: 0 }));
  });
  expect(btn('Rolar (0)')!.disabled).toBe(true);
});

test('ARAM: campeão do banco fora dos que posso jogar fica em cinza e não troca, como no client', async () => {
  const bench = [{ championId: 157, isPriority: false }, { championId: 266, isPriority: false }];
  setup(session({ myTeam: [me], benchEnabled: true, benchChampions: bench as never }), { pickable: ready([103, 157]) });
  await settle();
  const scope = root.querySelector('.rlc-cs-bench')!;
  const locked = btn('Aatrox · Indisponível para você', scope)!;
  expect(locked.disabled).toBe(true);
  expect(locked.dataset.locked).toBe('true');
  expect(btn('Yasuo', scope)!.dataset.locked).toBeUndefined();
  act(() => locked.click());
  expect(call('/lol-champ-select/v1/session/bench/swap/266')).toHaveLength(0);
});

test('ARAM: depois de trocar, o banco espera 3 s; quem acabou de chegar ao banco também', async () => {
  const bench = [{ championId: 157, isPriority: false }, { championId: 266, isPriority: false }];
  const lcu = setup(session({ myTeam: [me], benchEnabled: true, benchChampions: bench as never }));
  await settle();
  vi.useFakeTimers();
  act(() => btn('Yasuo', root.querySelector('.rlc-cs-bench')!)!.click());
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const aatrox = () => btn('Aatrox', root.querySelector('.rlc-cs-bench')!)!;
  expect(aatrox().disabled).toBe(true);
  expect(aatrox().dataset.cooldown).toBe('true');
  await act(async () => void (await vi.advanceTimersByTimeAsync(BENCH_COOLDOWN_MS + 10)));
  expect(aatrox().disabled).toBe(false);
  // Um aliado trocou: Ahri chega ao banco e espera; Aatrox continua livre.
  act(() => void (lcu.champSelect.value = ready(session({ myTeam: [me], benchEnabled: true, benchChampions: [...bench, { championId: 103, isPriority: false }] as never }))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const ahri = () => btn('Ahri', root.querySelector('.rlc-cs-bench')!)!;
  expect(ahri().disabled).toBe(true);
  expect(aatrox().disabled).toBe(false);
  await act(async () => void (await vi.advanceTimersByTimeAsync(BENCH_COOLDOWN_MS + 10)));
  expect(ahri().disabled).toBe(false);
});

test('mouse na grade não mexe no tamanho do cabeçalho (a grade pulava para cima e para baixo na primeira linha)', async () => {
  setup(pickTurn());
  await settle();
  const head = root.querySelector('.rlc-cs-head')!;
  const shape = () => [...head.children].map((e) => e.tagName + e.className).join('|');
  const before = shape();
  expect(root.querySelector('.rlc-cs-champ-name')!.getAttribute('data-empty')).toBe('true');
  act(() => void root.querySelector('.rlc-cs-grid .rlc-cs-champ')!.dispatchEvent(new MouseEvent('mouseenter')));
  await settle();
  expect(root.querySelector('.rlc-cs-champ-name')!.getAttribute('data-empty')).toBeNull();
  expect(shape()).toBe(before);
});

test('tempo ao montar no meio da fase desconta o que já passou desde o valor da LCU', () => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  setup(session({ myTeam: [me], timer: { phase: 'BAN_PICK', adjustedTimeLeftInPhase: 34000, totalTimeInPhase: 34000, internalNowInEpochMs: 80000, isInfinite: false } as never }));
  expect(root.querySelector('.rlc-cs-timer')!.textContent).toBe('14');
});

test('Confirmar fica desabilitado enquanto o destaque do clique ainda não voltou', async () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  setup(pickTurn(103));
  await settle();
  act(() => btn('Yasuo')!.click());
  expect(btn('Travar')!.disabled).toBe(true);
});

test('id -1 (nenhum campeão) da lista de disponíveis não vira ladrilho', async () => {
  setup(pickTurn(), { pickable: ready([-1, 103]) });
  await settle();
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri']);
});

test('depois de alternar o favorito, a estrela segue o grid-champions do campeão (all-grid-champions fica velho)', async () => {
  fetchMock.mockImplementation(async (url: string) =>
    url === '/lol-champ-select/v1/grid-champions/103' ? new Response(JSON.stringify({ id: 103, positionsFavorited: ['middle'] }), { status: 200 }) : new Response(null, { status: 204 }));
  setup(session({ myTeam: [cell({ cellId: 0, assignedPosition: 'middle' })], actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] }), { lanes: ready(LANES), gridChampions: ready(grid({})) });
  await settle();
  const ahri = () => [...root.querySelectorAll('.rlc-cs-tile')].find((t) => t.querySelector('.rlc-cs-champ')!.getAttribute('aria-label') === 'Ahri')!;
  act(() => ahri().querySelector<HTMLButtonElement>('.rlc-cs-fav')!.click());
  await settle();
  await settle();
  expect(ahri().querySelector('.rlc-cs-fav')!.getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelectorAll('.rlc-cs-champ')[0]!.getAttribute('aria-label')).toBe('Ahri');
});

test('planejamento: clique declara a intenção na ação de escolha, sem botão de confirmar', async () => {
  const planning = { phase: 'PLANNING', adjustedTimeLeftInPhase: 20000, totalTimeInPhase: 20000, internalNowInEpochMs: Date.now(), isInfinite: false } as never;
  setup(session({ myTeam: [me], timer: planning, actions: [[action({ id: 0, type: 'ban', isInProgress: true })], [action({ id: 6, type: 'pick' })]] }));
  await settle();
  expect(btn('Banir')).toBeUndefined();
  expect(btn('Travar')).toBeUndefined();
  act(() => btn('Ahri')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[0]![1].body)).toEqual({ championId: 103 });
});

test('banido e travado por outro ficam na grade, cinza e sem clique, mesmo se a LCU ainda os lista', async () => {
  setup(session({ myTeam: [me, ally], actions: [[action({ type: 'ban', completed: true, championId: 157 })], [action({ actorCellId: 1, type: 'pick', completed: true, championId: 266 }), action({ id: 6, type: 'pick', isInProgress: true })]] }), { pickable: ready([103, 157]) });
  await settle();
  const tiles = [...root.querySelectorAll<HTMLElement>('.rlc-cs-tile')];
  expect(tiles.map((t) => [t.querySelector('button')!.getAttribute('aria-label'), t.dataset.state])).toEqual([['Aatrox · Já escolhido', 'picked'], ['Ahri', undefined], ['Yasuo · Banido', 'banned']]);
  const yasuo = btn('Yasuo · Banido')!;
  expect(yasuo.disabled).toBe(true);
  act(() => yasuo.click());
  expect(fetchMock.mock.calls.filter((c) => c[1]?.method)).toEqual([]);
});

test('banir o campeão que um aliado quer mostra o aviso; o ladrilho dele vem marcado', async () => {
  const wanting = { ...ally, championPickIntent: 157 };
  setup(session({ myTeam: [me, wanting], theirTeam: [enemy], actions: [[action({ id: 0, type: 'ban', isInProgress: true, championId: 103 })]] }));
  await settle();
  expect(root.querySelector('.rlc-cs-warn')).toBeNull();
  expect(root.querySelector('.rlc-cs-tile[data-wanted="true"] button')!.getAttribute('aria-label')).toBe('Yasuo · Um aliado quer jogar');
  setup(session({ myTeam: [me, wanting], theirTeam: [enemy], actions: [[action({ id: 0, type: 'ban', isInProgress: true, championId: 157 })]] }));
  await settle();
  expect(root.querySelector('.rlc-cs-warn')!.textContent).toBe('Um aliado quer jogar com esse campeão.');
  expect(btn('Banir')!.disabled).toBe(false);
});

test('banimento nulo aparece como quadro vazio no time de quem não baniu', async () => {
  setup(session({ myTeam: [me], theirTeam: [enemy], actions: [[action({ type: 'ban', completed: true, championId: 157 }), action({ type: 'ban', completed: true, championId: 0 }), action({ type: 'ban', completed: true, championId: -1, isAllyAction: false })]] }));
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-bans');
  expect([...mine!.children].map((e) => e.getAttribute('alt') ?? e.getAttribute('aria-label'))).toEqual(['Yasuo', 'Sem banimento']);
  expect(theirs!.querySelector('.rlc-cs-ban-none')!.getAttribute('title')).toBe('Sem banimento');
});

const aramTimer = (phase: string) => ({ phase, adjustedTimeLeftInPhase: 12000, totalTimeInPhase: 12000, internalNowInEpochMs: 0, isInfinite: false }) as never;
const subsetOf = (ids: number[]) => Object.assign(ready(ids), { refresh: async () => {} });

test('ARAM com cartões: sem grade nem Travar; o clique no cartão escolhe e a terceira é a carta da sorte', async () => {
  setup(session({ myTeam: [me], allowSubsetChampionPicks: true, benchEnabled: true, actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] } as never), { subset: subsetOf([103, 157, 266]) });
  await settle();
  expect(root.querySelector('.rlc-cs-drawer')).toBeNull();
  expect(btn('Mostrar campeões')).toBeUndefined();
  expect(btn('Travar')).toBeUndefined();
  expect(root.querySelector('.rlc-cs-cards-title')!.textContent).toBe('Escolha seu campeão');
  const cards = [...root.querySelectorAll<HTMLButtonElement>('.rlc-cs-card')];
  expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri', 'Yasuo', 'Aatrox · Carta da sorte']);
  // As cartas chegam de costas; só viradas respondem.
  await vi.waitFor(() => expect(cards.every((c) => c.hasAttribute('data-up'))).toBe(true), { timeout: 3000 });
  act(() => void cards[1]!.dispatchEvent(new MouseEvent('mouseenter')));
  await settle();
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Yasuo');
  act(() => cards[1]!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[0]![1].body)).toEqual({ championId: 157, completed: true });
});

test('ARAM com cartões: depois de escolher, banco sem rolagem; na escolha só os meus cartões saem do banco', async () => {
  const picked = { ...me, championId: 157 };
  const bench = [{ championId: 103, isPriority: false }, { championId: 266, isPriority: false }];
  const lcu = setup(session({ myTeam: [picked], allowSubsetChampionPicks: true, benchEnabled: true, allowRerolling: true, rerollsRemaining: 1, benchChampions: bench, timer: aramTimer('BAN_PICK'), actions: [[action({ id: 6, type: 'pick', completed: true, championId: 157 })]] } as never), { subset: subsetOf([157, 103]) });
  await settle();
  const scope = root.querySelector('.rlc-cs-bench')!;
  expect(btn('Ahri', scope)!.disabled).toBe(false);
  expect(btn('Aatrox · Disponível na finalização', scope)!.disabled).toBe(true);
  expect(btn('Rolar (1)')).toBeUndefined();
  expect(btn('Mostrar campeões')).toBeUndefined();
  act(() => void (lcu.champSelect.value = ready(session({ myTeam: [picked], allowSubsetChampionPicks: true, benchEnabled: true, benchChampions: bench, timer: aramTimer('FINALIZATION') } as never))));
  act(() => btn('Aatrox', root.querySelector('.rlc-cs-bench')!)!.click());
  expect(call('/lol-champ-select/v1/session/bench/swap/266')).toHaveLength(1);
});

test('gaveta de campeões: ✕ e Esc fecham, o botão reabre e a minha vez reabre sozinha', async () => {
  const lcu = setup(session({ myTeam: [me], actions: [[action({ id: 6, type: 'pick', isInProgress: false })]] }));
  await settle();
  act(() => btn('Mostrar campeões')!.click());
  act(() => btn('Fechar seleção de campeões')!.click());
  expect(root.querySelector('.rlc-cs-drawer')).toBeNull();
  act(() => btn('Mostrar campeões')!.click());
  expect(root.querySelector('.rlc-cs-drawer')).not.toBeNull();
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(root.querySelector('.rlc-cs-drawer')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(pickTurn())));
  await settle();
  expect(root.querySelector('.rlc-cs-grid')).not.toBeNull();
});

test('aliados com o nome real da sala de chat, tag menor, elo de Solo/Duo fora da ranqueada e vitórias, KDA e rota', async () => {
  const hidden = cell({ cellId: 1, gameName: 'Poro Ágil', puuid: '', obfuscatedPuuid: 'ob1', nameVisibilityType: 'HIDDEN' });
  fetchMock.mockImplementation(async (url: string) => {
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
    if (url === '//riotclient/chat/v5/participants')
      return json({ participants: [{ cid: 'r@champ-select.br1.pvp.net', game_name: 'Fulano', game_tag: 'BR1', puuid: me.puuid }, { cid: 'r@champ-select.br1.pvp.net', game_name: 'Real Name', game_tag: 'XYZ', puuid: 'real-1' }] });
    if (url === '/lol-chat/v1/player-mutes') return json({});
    if (url === '/lol-ranked/v1/ranked-stats/real-1') return json({ queueMap: { RANKED_SOLO_5x5: { tier: 'GOLD', division: 'II', leaguePoints: 40, wins: 30, losses: 20 } } });
    if (url.startsWith('/lol-match-history/v1/products/lol/real-1/'))
      return json({ games: { games: [{ participants: [{ stats: { kills: 4, deaths: 2, assists: 6 }, timeline: { lane: 'JUNGLE', role: 'NONE' } }] }] } });
    return new Response(null, { status: 204 });
  });
  setup(session({ myTeam: [me, hidden], theirTeam: [enemy] }));
  await settle();
  await settle();
  await settle();
  const row = root.querySelectorAll('.rlc-cs-team')[0]!.querySelectorAll('.rlc-cs-cell')[1]!;
  expect(row.querySelector('.rlc-cs-name')!.textContent).toBe('Real Name#XYZ');
  expect(row.querySelector('.rlc-cs-tag')!.textContent).toBe('#XYZ');
  expect(row.textContent).not.toContain('Poro Ágil');
  expect(row.querySelector('.rlc-rank')!.textContent).toContain('40');
  const stats = row.querySelector('.rlc-cs-stats')!;
  expect(stats.textContent).toContain('60%');
  expect(stats.textContent).toContain('30V 20D');
  expect(stats.textContent).toContain('5 KDA');
  expect(stats.querySelector('svg')!.getAttribute('data-role')).toBe('JUNGLE');
  // nada técnico na tela
  expect(row.textContent).not.toMatch(/real-1|RANKED|ob1/);
});

test('sentinela: lista as possuídas, marca a equipada e troca pelo loadout da conta', async () => {
  fetchMock.mockImplementation(async (url: string) => {
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
    if (url === '/lol-collections/v1/inventories/42/ward-skins')
      return json([
        { id: 0, name: 'Sentinela Padrão', wardImagePath: '/w/0.png', ownership: { owned: true } },
        { id: 201, name: 'Sentinela Poro', wardImagePath: '/w/201.png', ownership: { owned: true } },
        { id: 300, name: 'Sentinela Bloqueada', wardImagePath: '/w/300.png', ownership: { owned: false } },
      ]);
    if (url === '/lol-loadouts/v4/loadouts/scope/account') return json([{ id: 'acc-1', loadout: { WARD_SKIN_SLOT: { inventoryType: 'WARD_SKIN', itemId: 201 } } }]);
    return new Response(null, { status: 204 });
  });
  setupLoadout({ chatMe: ready({ summonerId: 42 }) });
  await settle();
  await settle();
  act(() => btn('Sentinela: Sentinela Poro')!.click());
  const items = [...root.querySelectorAll('.rlc-cs-ward-list [role="menuitem"]')];
  expect(items.map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-current')])).toEqual([
    ['Sentinela Padrão', null],
    ['Sentinela Poro', 'true'],
  ]);
  act(() => btn('Sentinela Padrão')!.click());
  const [, init] = call('/lol-loadouts/v4/loadouts/acc-1')[0]!;
  expect(init.method).toBe('PATCH');
  expect(JSON.parse(init.body)).toEqual({ id: 'acc-1', loadout: { WARD_SKIN_SLOT: { inventoryType: 'WARD_SKIN', itemId: 0 } } });
  await settle();
  expect(btn('Sentinela: Sentinela Padrão')).not.toBeUndefined();
});

test('editor de runas na seleção: fundo com a skin escolhida', async () => {
  setupLoadout({ champSelect: ready(lockedMe({ selectedSkinId: 103005 })) });
  await settle();
  act(() => btn('Runas')!.click());
  // O fundo chega depois de várias leituras assíncronas: espera o resultado em vez de contar voltas (instável com a suíte cheia).
  await vi.waitFor(async () => {
    await settle();
    expect(root.querySelector<HTMLElement>('.rlc-re-art-splash .rlc-xfade-layer:last-child')?.style.backgroundImage).toBe('url("/splash/103005.jpg")');
  });
});

const mapsOk = (maps: unknown[]) =>
  fetchMock.mockImplementation(async (url: string) => (url === '/lol-maps/v2/maps' ? new Response(JSON.stringify(maps), { status: 200 }) : new Response(null, { status: 204 })));
const RIFT = [{ id: 11, gameMode: 'CLASSIC', assets: { 'map-south': 'm/south.png', 'map-north': 'm/north.png' } }];

test('antes de escolher, no Summoner’s Rift: mapa 3D do lado do time com um marcador por aliado e a minha rota acesa', async () => {
  mapsOk(RIFT);
  const lcu = setup(session({ myTeam: [cell({ ...me, team: 2, assignedPosition: 'top' } as never), cell({ cellId: 1, team: 2, championPickIntent: 103, assignedPosition: 'middle' } as never)], actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] }));
  lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  await settle();
  await settle();
  const map = root.querySelector('.rlc-rift')!;
  expect(map.getAttribute('data-side')).toBe('red');
  expect(map.querySelector('.rlc-cs-map-side')!.textContent).toBe('Lado vermelho');
  // Sem a linha de texto embaixo do lado.
  expect(map.querySelectorAll('p')).toHaveLength(1);
  expect(map.getAttribute('data-lane')).toBe('top');
  const pins = [...map.querySelectorAll('.rlc-rift-pin')];
  expect(pins).toHaveLength(2);
  const ally = pins.find((p) => !p.hasAttribute('data-me'))!;
  const mine = pins.find((p) => p.hasAttribute('data-me'))!;
  expect(ally.querySelector('img')!.getAttribute('src')).toBe('/i/103.png');
  expect(ally.textContent).toContain('Ahri');
  expect(mine.textContent).toContain('Fulano');
  // O meu marcador cai por último.
  expect(pins.at(-1)).toBe(mine);
});

test('antes de escolher, nos outros mapas: arte do client do lado do time com as escolhas dos aliados', async () => {
  mapsOk([{ id: 21, gameMode: 'NEXUSBLITZ', assets: { 'map-south': 'a/south.png', 'map-north': 'a/north.png' } }]);
  const lcu = setup(session({ myTeam: [cell({ ...me, team: 2 } as never), cell({ cellId: 1, championPickIntent: 103, assignedPosition: 'middle' } as never)], actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] }));
  lcu.gameflowSession.value = ready({ map: { id: 21 }, gameData: { queue: { gameMode: 'NEXUSBLITZ' } } }) as never;
  await settle();
  await settle();
  const map = root.querySelector('.rlc-cs-map')!;
  expect(map.classList.contains('rlc-rift')).toBe(false);
  expect(map.querySelector('img')!.getAttribute('src')).toBe('/a/north.png');
  expect(map.textContent).toContain('Lado vermelho');
  expect(map.querySelectorAll('.rlc-cs-map-pick')).toHaveLength(2);
});

test('ao travar: o mapa mergulha na minha rota sobre a splash do campeão e some; aberto já travado, não', async () => {
  mapsOk(RIFT);
  const before = session({ myTeam: [cell({ ...me })], actions: [[action({ id: 6, type: 'pick', isInProgress: false })]] });
  const lcu = setup(before);
  lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  await settle();
  await settle();
  expect(root.querySelector('.rlc-rift:not([data-diving])')).not.toBeNull();
  vi.useFakeTimers();
  act(() => void (lcu.champSelect.value = ready(lockedMe({ assignedPosition: 'middle' }))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const diving = root.querySelector('.rlc-rift[data-diving]') as HTMLElement;
  expect(diving).not.toBeNull();
  // Mergulha na minha rota (meio).
  expect(diving.getAttribute('data-lane')).toBe('mid');
  expect(root.querySelector('.rlc-cs-splash')).not.toBeNull();
  await act(async () => void (await vi.advanceTimersByTimeAsync(DIVE_MS + 20)));
  expect(root.querySelector('.rlc-rift')).toBeNull();
  vi.useRealTimers();
  render(null, root);
  const again = setup(lockedMe());
  again.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  await settle();
  await settle();
  expect(root.querySelector('.rlc-rift')).toBeNull();
});

test('Arena em trios: sem runas, feitiços fixos; todos os outros subtimes com ícone, nome e o campeão de cada um', async () => {
  const theirs = [3, 4, 5, 6, 7, 8].map((id) => cell({ cellId: id, team: 2, championId: id === 4 ? 157 : 0, championPickIntent: id === 6 ? 266 : 0 }));
  setupLoadout({
    gameflowSession: ready({ gameData: { queue: { id: 1740, gameMode: 'CHERRY' } } }),
    champSelect: ready({ ...lockedMe(), myTeam: [...lockedMe().myTeam, cell({ cellId: 1 }), cell({ cellId: 2 })], theirTeam: theirs, actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 }), action({ id: 9, actorCellId: 7, type: 'pick', isInProgress: true })]] }),
  });
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-runes')).toBeNull();
  expect([...root.querySelectorAll<HTMLButtonElement>('.rlc-cs-spell-slots .rlc-cs-spell-slot')].every((b) => b.disabled)).toBe(true);
  expect(root.querySelectorAll('.rlc-cs-side[data-side="mine"] .rlc-cs-cell')).toHaveLength(3);
  const groups = [...root.querySelectorAll('.rlc-cs-subteam')].map((g) => [g.getAttribute('aria-label'), [...g.querySelectorAll('.rlc-cs-subteam-name')].map((n) => n.textContent)]);
  expect(groups).toEqual([
    ['Tropa', ['Aguardando', 'Yasuo', 'Aguardando']],
    ['Caranguejo', ['Aatrox', 'Escolhendo…', 'Aguardando']],
  ]);
  expect(root.querySelector('.rlc-cs-subteam-icon')!.getAttribute('src')).toBe('/fe/lol-champ-select/images/subteams/Minion.png');
  expect(root.querySelectorAll('.rlc-cs-subteam')[1]!.getAttribute('data-acting')).toBe('true');
});

test('Arena em duplas: a LCU mistura os times; o meu subtime é o das minhas vagas, os outros vão para a direita', async () => {
  setupLoadout({
    gameflowSession: ready({ gameData: { queue: { id: 1700, gameMode: 'CHERRY' } } }),
    champSelect: ready({ ...lockedMe(), localPlayerCellId: 2, myTeam: [0, 1, 2, 3].map((id) => cell({ cellId: id })), theirTeam: [4, 5, 14, 15].map((id) => cell({ cellId: id, team: 2 })) }),
  });
  await settle();
  expect(root.querySelectorAll('.rlc-cs-side[data-side="mine"] .rlc-cs-cell')).toHaveLength(2);
  expect([...root.querySelectorAll('.rlc-cs-subteam')].map((g) => g.getAttribute('aria-label'))).toEqual(['Poro', 'Caranguejo', 'Gromp']);
});

test('Arena: Ousadia no começo da grade (destaca -3 e trava), bigorna nos favoritos da torcida, palco com a arte da Ousadia', async () => {
  const arena = (championId: number) => session({ myTeam: [me, ally], theirTeam: [enemy], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId })]] });
  const lcu = setup(arena(0), { gameflowSession: ready({ gameData: { queue: { id: 1700, gameMode: 'CHERRY' } } }), crowdFavorites: ready([157]) });
  await settle();
  const tiles = [...root.querySelectorAll('.rlc-cs-tile')];
  expect(tiles[0]!.getAttribute('data-bravery')).toBe('true');
  // Bigorna logo depois da Ousadia; "Todos" volta à ordem alfabética pura.
  expect(tiles[1]!.querySelector('button')!.getAttribute('aria-label')).toBe('Yasuo · favorito da torcida (bônus ao escolher)');
  const names = () => [...root.querySelectorAll('.rlc-cs-tile:not([data-bravery]) .rlc-cs-tile-name')].map((n) => n.textContent!);
  expect(names().length).toBeGreaterThan(1);
  act(() => btn('Todos')!.click());
  expect(names()).toEqual([...names()].sort((a, b) => a.localeCompare(b)));
  expect(names()[0]).not.toBe('Yasuo');
  act(() => btn('Todos')!.click());
  expect(names()[0]).toBe('Yasuo');
  act(() => btn('Ousadia')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[0]![1].body)).toEqual({ championId: -3 });
  act(() => void (lcu.champSelect.value = ready(arena(-3))));
  await settle();
  expect(btn('Ousadia')!.getAttribute('aria-pressed')).toBe('true');
  expect(stage()).toContain('bravery-splash-background.png');
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Ousadia');
  act(() => btn('Travar')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[1]![1].body)).toEqual({ championId: -3, completed: true });
});

test('fora da Arena: sem Ousadia nem bigorna', async () => {
  setup(pickTurn(), { crowdFavorites: ready([157]) });
  await settle();
  expect(root.querySelector('.rlc-cs-tile[data-bravery]')).toBeNull();
  expect(root.querySelector('.rlc-cs-crowd')).toBeNull();
});

test('regras do mapa: ARAM Caos sem runas nem sentinela; ARAM normal com runas e sem sentinela', async () => {
  const maps = [{ id: 12, gameMode: 'ARAM', properties: { suppressRunesMasteriesPerks: false } }, { id: 12, gameMode: 'KIWI', properties: { suppressRunesMasteriesPerks: true } }];
  fetchMock.mockImplementation(async (url: string) => (url === '/lol-maps/v2/maps' ? new Response(JSON.stringify(maps), { status: 200 }) : new Response(null, { status: 204 })));
  setupLoadout({ gameflowSession: ready({ map: { id: 12 }, gameData: { queue: { gameMode: 'KIWI' } } }) });
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-runes')).toBeNull();
  expect(root.querySelector('.rlc-cs-ward')).toBeNull();
  render(null, root);
  setupLoadout({ gameflowSession: ready({ map: { id: 12 }, gameData: { queue: { gameMode: 'ARAM' } } }) });
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-runes')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-ward')).toBeNull();
});

const timed = (secondsLeft: number) => ({ phase: 'BAN_PICK', adjustedTimeLeftInPhase: secondsLeft * 1000, totalTimeInPhase: 30000, internalNowInEpochMs: Date.now(), isInfinite: false });

test('com mapa, a seleção começa de grade fechada enquanto ele se forma; depois a minha vez abre a grade', async () => {
  vi.useFakeTimers();
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS };
  lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  lcu.champSelect.value = ready(session({ myTeam: [me], timer: timed(30), actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] } as never));
  lcu.pickable.value = ready([103, 157]);
  act(() => render(<ChampSelect lcu={lcu} />, root));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-drawer')).toBeNull();
  // Dá para abrir à mão durante a formação.
  expect(btn('Mostrar campeões')).toBeDefined();
  await act(async () => void (await vi.advanceTimersByTimeAsync(MAP_INTRO_MS + 50)));
  expect(root.querySelector('.rlc-cs-drawer')).not.toBeNull();
});

test('com pouco tempo na vez, a grade abre na hora mesmo com o mapa se formando', async () => {
  vi.useFakeTimers();
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS };
  lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  lcu.champSelect.value = ready(session({ myTeam: [me], timer: timed(8), actions: [[action({ id: 6, type: 'pick', isInProgress: true })]] } as never));
  act(() => render(<ChampSelect lcu={lcu} />, root));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-drawer')).not.toBeNull();
});

test('mapa animado desligado nas configurações: no Summoner’s Rift volta a arte do client', async () => {
  mapsOk(RIFT);
  setPrefs({ riftMap: false });
  try {
    const lcu = setup(session({ myTeam: [cell({ ...me, team: 2 } as never)], actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] }));
    lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
    await settle();
    await settle();
    expect(root.querySelector('.rlc-rift')).toBeNull();
    expect(root.querySelector('.rlc-cs-map img')!.getAttribute('src')).toBe('/m/north.png');
  } finally {
    setPrefs({ riftMap: true });
  }
});

// ── Etapa 2: colunas, banimento, escolha, preparação e saída, sempre pelo que a LCU confirma ──

/** Mesma sessão (mesmo `id`) em momentos diferentes: é assim que a LCU manda, e é o que dispara as animações. */
const live = (over: Parameters<typeof session>[0]) => session({ id: 'sala-1', ...over });
const screen = () => root.querySelector<HTMLElement>('.rlc-champselect')!;
const cards = (side: 'mine' | 'theirs') => [...root.querySelectorAll<HTMLElement>(`.rlc-cs-side[data-side="${side}"] .rlc-cs-cell`)];

test('tom vermelho só na fase de banimento: liga na vez de banir, desliga na escolha, e não liga no planejamento', async () => {
  const lcu = setup(live({ myTeam: [me], actions: [[action({ id: 1, type: 'ban', isInProgress: true })]] }));
  await settle();
  expect(screen().getAttribute('data-ban')).toBe('true');
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Fase de banimento');
  expect(root.querySelector('.rlc-cs-heat')).not.toBeNull();
  // Banimento de um aliado (não é a minha vez): a fase ainda é de banimento.
  act(() => void (lcu.champSelect.value = ready(live({ myTeam: [me, ally], actions: [[action({ id: 1, type: 'ban', completed: true, championId: -1 }), action({ id: 2, type: 'ban', actorCellId: 1, isInProgress: true })]] }))));
  expect(screen().getAttribute('data-ban')).toBe('true');
  render(null, root);
  setup(pickTurn());
  await settle();
  expect(screen().getAttribute('data-ban')).toBeNull();
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Fase de escolha');
  render(null, root);
  // No planejamento a LCU já marca o banimento como em andamento, mas ninguém bane ainda.
  setup(session({ myTeam: [me], timer: { phase: 'PLANNING', adjustedTimeLeftInPhase: 20000, totalTimeInPhase: 20000, internalNowInEpochMs: 0, isInfinite: false } as never, actions: [[action({ id: 1, type: 'ban', isInProgress: true })], [action({ id: 2, type: 'pick' })]] }));
  await settle();
  expect(screen().getAttribute('data-ban')).toBeNull();
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Planejamento');
});

test('textos da fase nos dois idiomas', async () => {
  setLocale('en_US');
  setup(live({ myTeam: [me], actions: [[action({ id: 1, type: 'ban', isInProgress: true })]] }));
  await settle();
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Ban phase');
  expect(root.querySelector('.rlc-cs-team-title')!.textContent).toBe('Your team');
});

test('cartões: vazio, em destaque (apagado) e travado; quem está na vez ganha o anel e a barra do tempo', async () => {
  const hovering = cell({ cellId: 1, gameName: 'Zeca', championPickIntent: 157 });
  const locked = cell({ cellId: 2, gameName: 'Beltrano', championId: 266 });
  setup(session({ myTeam: [me, hovering, locked], theirTeam: [enemy], actions: [[action({ id: 7, actorCellId: 1, type: 'pick', isInProgress: true, championId: 157 })]], timer: { phase: 'BAN_PICK', adjustedTimeLeftInPhase: 15000, totalTimeInPhase: 30000, internalNowInEpochMs: Date.now(), isInfinite: false } as never }));
  await settle();
  await settle();
  const [mine, zeca, beltrano] = cards('mine');
  expect([mine, zeca, beltrano].map((c) => c!.getAttribute('data-state'))).toEqual(['empty', 'hover', 'locked']);
  expect([mine, zeca, beltrano].map((c) => c!.getAttribute('data-active'))).toEqual([null, 'true', null]);
  expect(zeca!.querySelector('.rlc-cs-status')!.textContent).toBe('Yasuo · Escolhendo…');
  expect(beltrano!.querySelector('.rlc-cs-status')!.textContent).toBe('Aatrox');
  // A barra do tempo só existe no cartão de quem está na vez e segue o tempo da sessão (metade).
  expect(root.querySelectorAll('.rlc-cs-turnbar')).toHaveLength(1);
  expect(zeca!.querySelector<HTMLElement>('.rlc-cs-turnbar i')!.style.transform).toBe('scaleX(0.5)');
  expect(root.querySelector<HTMLElement>('.rlc-cs-timebar i')!.style.transform).toBe('scaleX(0.5)');
  // Ninguém travou agora: nada de varredura.
  expect(root.querySelector('[data-fx]')).toBeNull();
});

test('"você" marca só o meu cartão', async () => {
  setup(session({ myTeam: [ally, me], theirTeam: [enemy], localPlayerCellId: 0 }));
  await settle();
  const marks = [...root.querySelectorAll('.rlc-cs-you')];
  expect(marks).toHaveLength(1);
  expect(marks[0]!.textContent).toBe('Você');
  expect(marks[0]!.closest('.rlc-cs-cell')!.getAttribute('data-local')).toBe('true');
  expect(marks[0]!.closest('.rlc-cs-cell')!.textContent).toContain('Fulano');
});

test('escolha do inimigo: nada aparece antes de travar (nem com a ação em andamento); ao travar, o cartão revela com a animação uma vez', async () => {
  const foe = (championId: number) => cell({ cellId: 5, team: 2, gameName: '', championId });
  const at = (championId: number, done: boolean) => live({ myTeam: [me], theirTeam: [foe(done ? championId : 0)], actions: [[action({ id: 9, actorCellId: 5, isAllyAction: false, type: 'pick', isInProgress: !done, completed: done, championId })]] });
  vi.useFakeTimers();
  const lcu = setup(at(157, false));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  let card = cards('theirs')[0]!;
  expect(card.getAttribute('data-state')).toBe('empty');
  expect(card.getAttribute('data-active')).toBe('true');
  expect(card.querySelector('.rlc-cs-art')).toBeNull();
  expect(card.textContent).not.toContain('Yasuo');
  // Vez do inimigo: o palco não mostra campeão, só o aviso.
  expect(screen().getAttribute('data-stage')).toBe('foe');
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('O inimigo está escolhendo');
  expect(root.querySelector('.rlc-cs-splash')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(at(157, true))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  card = cards('theirs')[0]!;
  expect(card.getAttribute('data-state')).toBe('locked');
  expect(card.getAttribute('data-fx')).toBe('lock');
  expect(card.querySelector('.rlc-cs-status')!.textContent).toBe('Yasuo');
  // A arte entra quando a imagem termina de carregar.
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(cards('theirs')[0]!.querySelector<HTMLElement>('.rlc-cs-art')!.style.backgroundImage).toContain('/splash/157000.jpg');
  // O palco fica com quem acabou de travar por um momento.
  expect(screen().getAttribute('data-stage')).toBe('foefull');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Inimigo 1 travou');
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Yasuo');
  await act(async () => void (await vi.advanceTimersByTimeAsync(CARD_FX_MS + 10)));
  expect(cards('theirs')[0]!.getAttribute('data-fx')).toBeNull();
  // A mesma sessão de novo não repete a animação nem o palco.
  await act(async () => void (await vi.advanceTimersByTimeAsync(LOCK_SHOW_MS)));
  act(() => void (lcu.champSelect.value = ready(at(157, true))));
  expect(cards('theirs')[0]!.getAttribute('data-fx')).toBeNull();
  expect(screen().getAttribute('data-stage')).toBeNull();
});

test('aliado escolhendo fora da minha vez: o palco mostra o destaque dele apagado, com nome e rota', async () => {
  const zeca = cell({ cellId: 1, gameName: 'Zeca', assignedPosition: 'top' });
  setup(session({ myTeam: [me, zeca], theirTeam: [enemy], actions: [[action({ id: 7, actorCellId: 1, type: 'pick', isInProgress: true, championId: 157 })]] }));
  await settle();
  await settle();
  await settle();
  expect(screen().getAttribute('data-stage')).toBe('dim');
  expect(stage()).toContain('/splash/157000.jpg');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Zeca está escolhendo · Topo');
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Zeca está escolhendo');
});

test('fase de banimento: intenção do aliado com o ✕ no cartão, banido fica marcado, e a faixa mostra o ban do inimigo ainda escondido', async () => {
  const zeca = cell({ cellId: 1, gameName: 'Zeca' });
  const beltrano = cell({ cellId: 2, gameName: 'Beltrano' });
  setup(session({ myTeam: [me, zeca, beltrano], theirTeam: [enemy], actions: [[
    action({ id: 1, type: 'ban', isInProgress: true }),
    action({ id: 2, actorCellId: 1, type: 'ban', isInProgress: true, championId: 157 }),
    action({ id: 3, actorCellId: 2, type: 'ban', completed: true, championId: 266 }),
    action({ id: 4, actorCellId: 5, isAllyAction: false, type: 'ban', completed: true, championId: 0 }),
    action({ id: 5, actorCellId: 6, isAllyAction: false, type: 'ban', isInProgress: true }),
  ]] }));
  await settle();
  const [mine, wants, banned] = cards('mine');
  expect(mine!.querySelector('.rlc-cs-intent')).toBeNull();
  expect(wants!.querySelector('.rlc-cs-intent')!.getAttribute('aria-label')).toBe('Quer banir: Yasuo');
  expect(wants!.querySelector('.rlc-cs-intent')!.getAttribute('data-done')).toBeNull();
  expect(banned!.querySelector('.rlc-cs-intent')!.getAttribute('aria-label')).toBe('Banido: Aatrox');
  expect(banned!.querySelector('.rlc-cs-intent')!.getAttribute('data-done')).toBe('true');
  const [stripMine, stripTheirs] = root.querySelectorAll('.rlc-cs-banstrip .rlc-cs-bans');
  expect([...stripMine!.children].map((e) => e.getAttribute('data-state'))).toEqual(['empty', 'empty', 'done']);
  expect([...stripTheirs!.children].map((e) => e.getAttribute('data-state'))).toEqual(['hidden', 'empty']);
});

test('revelação dos banimentos: uma vez, quando a rodada termina; depois some, e abrir a tela com os bans já feitos não revela', async () => {
  const at = (done: boolean, left = 30000) =>
    live({
      myTeam: [me],
      theirTeam: [enemy],
      timer: { phase: 'BAN_PICK', adjustedTimeLeftInPhase: left, totalTimeInPhase: 30000, internalNowInEpochMs: 0, isInfinite: false } as never,
      actions: [
        [action({ id: 1, type: 'ban', isInProgress: !done, completed: done, championId: 157 }), action({ id: 2, actorCellId: 5, isAllyAction: false, type: 'ban', isInProgress: !done, completed: done, championId: done ? 266 : 0 })],
        [action({ id: 3, actorCellId: 5, isAllyAction: false, type: 'pick', isInProgress: done })],
      ],
    });
  vi.useFakeTimers();
  const lcu = setup(at(false));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(at(true))));
  expect([...root.querySelectorAll('.rlc-cs-reveal .rlc-cs-rv')].map((c) => [c.getAttribute('data-side'), c.textContent])).toEqual([['mine', '?Yasuo'], ['theirs', '?Aatrox']]);
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Banimentos revelados');
  // Durante a revelação a tela segue vermelha e as vagas da faixa esperam o cartão pousar.
  expect(screen().getAttribute('data-ban')).toBe('true');
  expect(root.querySelector('.rlc-cs-banstrip img')).toBeNull();
  // A LCU reenvia a sessão (o tempo andou): continua a mesma revelação, sem recomeçar.
  const first = root.querySelector('.rlc-cs-reveal');
  act(() => void (lcu.champSelect.value = ready(at(true, 25000))));
  expect(root.querySelector('.rlc-cs-reveal')).toBe(first);
  act(() => void vi.advanceTimersByTime(REVEAL_MS + 10));
  expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
  expect(screen().getAttribute('data-ban')).toBeNull();
  expect(root.querySelectorAll('.rlc-cs-banstrip img')).toHaveLength(2);
  act(() => void (lcu.champSelect.value = ready(at(true, 20000))));
  expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
  render(null, root);
  setup(at(true));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
  // Banidos seguem apagados na grade.
  act(() => btn('Mostrar campeões')!.click());
  expect(root.querySelectorAll('.rlc-cs-tile[data-state="banned"]')).toHaveLength(2);
});

test('animações desligadas nas configurações: sem a revelação dos banimentos (a faixa só atualiza)', async () => {
  setPrefs({ motion: 'off' });
  try {
    const at = (done: boolean) => live({ myTeam: [me], actions: [[action({ id: 1, type: 'ban', isInProgress: !done, completed: done, championId: 157 })], [action({ id: 3, actorCellId: 5, isAllyAction: false, type: 'pick', isInProgress: done })]] });
    const lcu = setup(at(false));
    await settle();
    act(() => void (lcu.champSelect.value = ready(at(true))));
    expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
    expect(root.querySelector('.rlc-cs-banstrip [data-state]')!.getAttribute('aria-label')).toBe('Yasuo');
    expect(root.querySelector('.rlc-cs-banstrip img')!.getAttribute('src')).toBe('/i/157.png');
    expect(screen().getAttribute('data-ban')).toBeNull();
  } finally {
    setPrefs({ motion: 'full' });
  }
});

test('depois de banir (confirmado pela LCU) a grade fecha e o palco mostra o banido riscado', async () => {
  const at = (done: boolean) => live({ myTeam: [me, ally], actions: [[action({ id: 1, type: 'ban', isInProgress: !done, completed: done, championId: 157 }), action({ id: 2, actorCellId: 1, type: 'ban', isInProgress: true })]] });
  const lcu = setup(at(false));
  await settle();
  expect(root.querySelector('.rlc-cs-grid')).not.toBeNull();
  expect(screen().getAttribute('data-stage')).toBe('ban');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Banir');
  // O clique em Banir só envia: a grade continua até a LCU confirmar.
  act(() => btn('Banir')!.click());
  expect(root.querySelector('.rlc-cs-grid')).not.toBeNull();
  act(() => void (lcu.champSelect.value = ready(at(true))));
  await settle();
  expect(root.querySelector('.rlc-cs-grid')).toBeNull();
  expect(screen().getAttribute('data-stage')).toBe('banned');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Banido por você');
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Yasuo');
});

test('cinemática do travamento: só quando a LCU confirma a escolha, não no clique; dura o tempo dela e não repete', async () => {
  vi.useFakeTimers();
  const lcu = setup(live({ myTeam: [me], actions: [[action({ id: 6, type: 'pick', isInProgress: true, championId: 103 })]] }));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  act(() => btn('Travar')!.click());
  await act(async () => void (await vi.advanceTimersByTimeAsync(50)));
  expect(call('/lol-champ-select/v1/session/actions/6')).toHaveLength(1);
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  expect(cards('mine')[0]!.getAttribute('data-fx')).toBeNull();
  expect(cards('mine')[0]!.getAttribute('data-state')).toBe('empty');
  expect(root.querySelector('.rlc-cs-locked')).toBeNull();
  const lockedNow = live({ myTeam: [cell({ ...me, championId: 103, selectedSkinId: 103000 })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] });
  act(() => void (lcu.champSelect.value = ready(lockedNow)));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  // Sem mapa, o clarão e a batida do nome vêm na hora.
  expect(screen().getAttribute('data-lockfx')).toBe('now');
  expect(screen().getAttribute('data-stage')).toBe('full');
  expect(root.querySelector('.rlc-cs-flash')).not.toBeNull();
  expect(cards('mine')[0]!.getAttribute('data-fx')).toBe('lock');
  expect(cards('mine')[0]!.getAttribute('data-state')).toBe('locked');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Travado');
  expect(root.querySelector('.rlc-cs-locked')!.textContent).toBe('Travado ✓');
  await act(async () => void (await vi.advanceTimersByTimeAsync(DIVE_MS + LOCK_FX_MS + 20)));
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(lockedNow)));
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  // Abrir a tela já travado não é escolher.
  render(null, root);
  setup(lockedNow);
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  expect(root.querySelector('[data-fx]')).toBeNull();
});

test('travamento com mapa: a cinemática espera o mergulho', async () => {
  mapsOk(RIFT);
  const lcu = setup(live({ myTeam: [cell({ ...me })], actions: [[action({ id: 6, type: 'pick' })]] }));
  lcu.gameflowSession.value = ready({ map: { id: 11 }, gameData: { queue: { gameMode: 'CLASSIC' } } }) as never;
  await settle();
  await settle();
  act(() => void (lcu.champSelect.value = ready(live({ myTeam: [cell({ ...me, championId: 103, selectedSkinId: 103000 })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] }))));
  await settle();
  expect(screen().getAttribute('data-lockfx')).toBe('dive');
  expect(root.querySelector('.rlc-rift[data-diving]')).not.toBeNull();
});

test('preparação: carrossel grande de skins com a escolhida no centro, setas, pontos, contagem no fim e selo de travado', async () => {
  vi.useFakeTimers();
  const final = (selectedSkinId: number, left: number) =>
    live({
      myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId })],
      actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]],
      timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: left, totalTimeInPhase: 30000, internalNowInEpochMs: Date.now(), isInfinite: false } as never,
    });
  const lcu = setup(final(103001, 10000), { skins: ready([skin(103000, { isBase: true }), skin(103001), skin(103002), skin(103003, { unlocked: false })]) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Prepare-se');
  const flow = root.querySelector('.rlc-cs-carousel[data-flow]')!;
  expect(screen().getAttribute('data-stage')).toBe('skin');
  const tiles = [...flow.querySelectorAll<HTMLElement>('.rlc-cs-skins > .rlc-cs-skin')];
  expect(tiles.map((s) => [s.getAttribute('aria-label'), s.getAttribute('aria-pressed')])).toEqual([['Skin 103000', 'false'], ['Skin 103001', 'true'], ['Skin 103002', 'false']]);
  // A escolhida no centro em tamanho cheio; as vizinhas deslocadas e menores.
  expect(tiles[1]!.style.transform).toBe('translateX(calc(-50% + 0%)) scale(1)');
  expect(tiles[0]!.style.transform).toBe('translateX(calc(-50% + -62%)) scale(0.84)');
  expect(flow.querySelector('.rlc-cs-flow-name')!.textContent).toBe('Skin 103001');
  expect([...flow.querySelectorAll('.rlc-cs-flow-dots i')].map((d) => d.getAttribute('data-on'))).toEqual([null, 'true', null]);
  // Na preparação não há o que escolher na grade.
  expect(btn('Mostrar campeões')).toBeUndefined();
  expect(root.querySelector('.rlc-cs-locked')!.textContent).toBe('Travado ✓');
  // A seta pede a skin vizinha à LCU; o carrossel só anda quando ela confirma.
  act(() => btn('Próximo', flow)!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[0]![1].body)).toEqual({ selectedSkinId: 103002 });
  expect(flow.querySelector('.rlc-cs-flow-name')!.textContent).toBe('Skin 103001');
  act(() => void (lcu.champSelect.value = ready(final(103002, 9000))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-flow-name')!.textContent).toBe('Skin 103002');
  expect(btn('Próximo', root.querySelector('.rlc-cs-carousel')!)!.disabled).toBe(true);
  // Últimos segundos: a contagem toma o título.
  act(() => void vi.advanceTimersByTime(7000));
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('2');
});

test('troca de campeão recebida: cartão ao lado do aliado que pediu, com os dois campeões', async () => {
  setup(session({ myTeam: [cell({ ...me, championId: 103 }), ally, cell({ cellId: 2, gameName: 'Zeca', championId: 157 })], trades: [{ id: 7, cellId: 2, state: 'RECEIVED' }] as never }), {});
  await settle();
  const box = root.querySelector<HTMLElement>('.rlc-cs-swaps')!;
  // Terceiro de três aliados.
  expect(Number(box.style.getPropertyValue('--at'))).toBeCloseTo(2 / 3);
  expect([...box.querySelectorAll('.rlc-cs-swap-champs img')].map((i) => i.getAttribute('alt'))).toEqual(['Ahri', 'Yasuo']);
  expect(box.querySelector('.rlc-cs-swap-champs small')!.textContent).toBe('Você fica com Yasuo');
});

test('saída: quando a partida vai começar a tela se desmonta (colunas, cabeçalho e barra saem)', async () => {
  const lcu = setup(live({ myTeam: [cell({ ...me, championId: 103, selectedSkinId: 103000 })] }));
  await settle();
  expect(screen().getAttribute('data-exit')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(live({ myTeam: [cell({ ...me, championId: 103, selectedSkinId: 103000 })], timer: { phase: 'GAME_STARTING', adjustedTimeLeftInPhase: 3000, totalTimeInPhase: 3000, internalNowInEpochMs: 0, isInfinite: false } as never }))));
  expect(screen().getAttribute('data-exit')).toBe('true');
  expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('A partida vai começar');
});

// ── ARAM (Howling Abyss): ponte em 3D, cartas distribuídas, banco no cabeçalho e voos confirmados pela LCU ──
const ABYSS = [{ id: 12, gameMode: 'ARAM', assets: { 'map-south': 'a/south.png', 'map-north': 'a/north.png' } }];
const aramFlow = () => ready({ map: { id: 12 }, gameData: { queue: { gameMode: 'ARAM' } } }) as never;
const tick = (ms = 0) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
// O ARAM não tem posição.
const aramMe = { ...me, assignedPosition: '' };
const zeca = (championId = 0) => cell({ cellId: 1, gameName: 'Zeca', championId });
const benchOf = (...ids: number[]) => ids.map((championId) => ({ championId, isPriority: false })) as never;
const cardSession = (over: Record<string, unknown> = {}) => live({ myTeam: [aramMe, zeca()], allowSubsetChampionPicks: true, benchEnabled: true, timer: aramTimer('BAN_PICK'), actions: [[action({ id: 6, type: 'pick', isInProgress: true })]], ...over } as never);
const pickedSession = (championId: number, bench: number[], over: Record<string, unknown> = {}) =>
  live({ myTeam: [{ ...aramMe, championId }, zeca()], allowSubsetChampionPicks: true, benchEnabled: true, benchChampions: benchOf(...bench), timer: aramTimer('BAN_PICK'), actions: [[action({ id: 6, type: 'pick', completed: true, championId })]], ...over } as never);
const cardEls = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-cs-card')];
const faceUp = () => cardEls().map((c) => c.hasAttribute('data-up'));
const flyers = () => [...root.querySelectorAll<HTMLElement>('.rlc-cs-flights .rlc-cs-flyer')];
/** O jsdom não mede nada: cada elemento ganha um retângulo qualquer, para os voos terem de onde sair e onde pousar. */
function measurable() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 40, height: 40, right: 50, bottom: 60, x: 10, y: 20, toJSON() {} } as DOMRect);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
}

test('ARAM: as cartas chegam de costas e viram uma a uma, a da sorte por último; de costas não respondem', async () => {
  vi.useFakeTimers();
  setup(cardSession(), { subset: subsetOf([103, 157, 266]) });
  await tick();
  expect(faceUp()).toEqual([false, false, false]);
  expect(cardEls().every((c) => c.disabled)).toBe(true);
  // De costas, o mouse não mostra o campeão no palco e o clique não escolhe.
  act(() => void cardEls()[0]!.dispatchEvent(new MouseEvent('mouseenter')));
  act(() => cardEls()[0]!.click());
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).not.toBe('Ahri');
  expect(call('/lol-champ-select/v1/session/actions/6')).toHaveLength(0);
  await tick(flipAt(0, 3));
  expect(faceUp()).toEqual([true, false, false]);
  await tick(flipAt(1, 3) - flipAt(0, 3));
  expect(faceUp()).toEqual([true, true, false]);
  // Só a terceira é a carta da sorte; ela vira depois de uma pausa.
  expect(cardEls().map((c) => c.dataset.lucky)).toEqual([undefined, undefined, 'true']);
  await tick(flipAt(2, 3) - flipAt(1, 3) - 10);
  expect(faceUp()).toEqual([true, true, false]);
  await tick(10);
  expect(faceUp()).toEqual([true, true, true]);
  expect(cardEls().every((c) => !c.disabled)).toBe(true);
  // Reaberta na mesma escolha: já viradas, sem distribuir de novo.
  render(null, root);
  setup(cardSession(), { subset: subsetOf([103, 157, 266]) });
  await tick();
  expect(faceUp()).toEqual([true, true, true]);
});

test('ARAM com duas cartas: nenhuma é a da sorte; movimento desligado: já chegam viradas', async () => {
  vi.useFakeTimers();
  setup(cardSession(), { subset: subsetOf([103, 157]) });
  await tick(flipAt(1, 2));
  expect(faceUp()).toEqual([true, true]);
  expect(cardEls().map((c) => c.dataset.lucky)).toEqual([undefined, undefined]);
  render(null, root);
  setPrefs({ motion: 'off' });
  try {
    setup(cardSession(), { subset: subsetOf([157, 266]) });
    await tick();
    expect(faceUp()).toEqual([true, true]);
  } finally {
    setPrefs({ motion: 'full' });
  }
});

test('ARAM: a carta escolhida só voa para o meu cartão (e as outras para o banco) quando a LCU confirma', async () => {
  vi.useFakeTimers();
  measurable();
  const lcu = setup(cardSession(), { subset: subsetOf([103, 157, 266]) });
  await tick(flipAt(2, 3));
  act(() => cardEls()[1]!.click());
  await tick();
  // Só o pedido saiu: as cartas continuam na mesa, nada voa e nada acende antes da confirmação.
  expect(call('/lol-champ-select/v1/session/actions/6')).toHaveLength(1);
  expect(cardEls()).toHaveLength(3);
  expect(flyers()).toHaveLength(0);
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  // Confirmado: Yasuo é meu e as outras duas cartas foram para o banco.
  act(() => void (lcu.champSelect.value = ready(pickedSession(157, [103, 266]))));
  await tick();
  expect(cardEls()).toHaveLength(0);
  // Cada carta voa com a própria arte.
  expect(flyers().map((f) => /splash\/(\d+)/.exec(f.style.backgroundImage)?.[1])).toEqual(['157000', '103000', '266000']);
  expect(root.querySelector('[data-fly="cell:0"]')!.hasAttribute('data-landing')).toBe(true);
  expect(root.querySelector('[data-fly="cell:0"] img')!.getAttribute('src')).toBe('/i/157.png');
  expect(root.querySelector('[data-fly="bench:103"]')!.hasAttribute('data-landing')).toBe(true);
  expect(root.querySelector('[data-fly="bench:266"]')!.hasAttribute('data-landing')).toBe(true);
  // E a cinemática da escolha (sem mapa: na hora).
  expect(screen().getAttribute('data-lockfx')).toBe('now');
  expect(screen().getAttribute('data-stage')).toBe('full');
  await tick(FLY_MS + 150);
  expect(flyers()).toHaveLength(0);
});

test('ARAM: banco no cabeçalho com dez vagas; quem entra e sai do banco voa entre a vaga e o cartão, só com a sessão confirmada', async () => {
  vi.useFakeTimers();
  measurable();
  const s = (mine: number, ally: number, bench: number[]) => live({ myTeam: [{ ...aramMe, championId: mine }, zeca(ally)], benchEnabled: true, benchChampions: benchOf(...bench), timer: aramTimer('FINALIZATION') } as never);
  const lcu = setup(s(103, 157, [266]));
  await tick();
  const bench = () => root.querySelector('.rlc-cs-head .rlc-cs-bench')!;
  expect(bench().querySelectorAll('.rlc-cs-champ')).toHaveLength(1);
  expect(bench().querySelectorAll('.rlc-cs-bench-slot')).toHaveLength(BENCH_SLOTS - 1);
  // Sem rota no ARAM: o canto do cartão mostra o retrato do campeão.
  expect(root.querySelector('.rlc-cs-pos')).toBeNull();
  expect(root.querySelector('[data-fly="cell:1"] img')!.getAttribute('src')).toBe('/i/157.png');
  expect(flyers()).toHaveLength(0);
  // Zeca troca o Yasuo pelo Aatrox do banco: Aatrox voa da vaga para o cartão dele e o Yasuo faz o caminho de volta.
  act(() => void (lcu.champSelect.value = ready(s(103, 266, [157]))));
  await tick();
  expect(flyers().map((f) => /i\/(\d+)/.exec(f.style.backgroundImage)?.[1])).toEqual(['266', '157']);
  expect(root.querySelector('[data-fly="cell:1"]')!.hasAttribute('data-landing')).toBe(true);
  expect(root.querySelector('[data-fly="bench:157"]')!.hasAttribute('data-landing')).toBe(true);
  // Troca de aliado não é a minha cinemática.
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  await tick(FLY_MS + 150);
  expect(flyers()).toHaveLength(0);
  // Eu pego o Yasuo: os dois voos e a minha cinemática.
  act(() => void (lcu.champSelect.value = ready(s(157, 266, [103]))));
  await tick();
  expect(flyers().map((f) => /i\/(\d+)/.exec(f.style.backgroundImage)?.[1])).toEqual(['157', '103']);
  expect(screen().getAttribute('data-lockfx')).toBe('now');
  await tick(FLY_MS + 150);
  // A carta que um aliado deixou chega ao banco sem origem conhecida (a LCU não mostra as cartas dele): só aparece.
  act(() => void (lcu.champSelect.value = ready(s(157, 266, [103, 1]))));
  await tick();
  expect(bench().querySelectorAll('.rlc-cs-champ')).toHaveLength(2);
  expect(flyers()).toHaveLength(0);
});

test('ARAM: depois da minha troca o banco mostra a espera; na vez das cartas o banco só mostra', async () => {
  vi.useFakeTimers();
  setup(live({ myTeam: [{ ...aramMe, championId: 103 }], benchEnabled: true, benchChampions: benchOf(157, 266), timer: aramTimer('FINALIZATION') } as never));
  await tick();
  expect(root.querySelector('.rlc-cs-bench-cd')).toBeNull();
  act(() => btn('Yasuo', root.querySelector('.rlc-cs-bench')!)!.click());
  await tick();
  expect(root.querySelector('.rlc-cs-bench-cd')!.textContent).toBe('Banco em espera');
  expect(root.querySelector<HTMLElement>('.rlc-cs-bench')!.style.getPropertyValue('--cd')).toBe(`${BENCH_COOLDOWN_MS}ms`);
  await tick(BENCH_COOLDOWN_MS + 10);
  expect(root.querySelector('.rlc-cs-bench-cd')).toBeNull();
  render(null, root);
  // Na vez de escolher a carta o banco já aparece, mas nada sai dele.
  setup(cardSession({ benchChampions: benchOf(103) }), { subset: subsetOf([103, 157]) });
  await tick();
  expect(btn('Ahri', root.querySelector('.rlc-cs-bench')!)!.disabled).toBe(true);
});

test('ARAM: sem coluna inimiga enquanto o outro time está oculto; se a LCU o mostra, a coluna volta', async () => {
  setup(live({ myTeam: [aramMe], benchEnabled: true } as never));
  await settle();
  expect(screen().getAttribute('data-solo')).toBe('true');
  expect(root.querySelector('.rlc-cs-side[data-side="theirs"]')).toBeNull();
  render(null, root);
  setup(live({ myTeam: [aramMe], theirTeam: [enemy], benchEnabled: true } as never));
  await settle();
  expect(screen().getAttribute('data-solo')).toBeNull();
  expect(root.querySelector('.rlc-cs-side[data-side="theirs"]')).not.toBeNull();
  render(null, root);
  // Fora do ARAM a coluna inimiga existe mesmo vazia.
  setup(live({ myTeam: [me] }));
  await settle();
  expect(root.querySelector('.rlc-cs-side[data-side="theirs"]')).not.toBeNull();
});

test('ARAM no Howling Abyss: a ponte se forma antes das cartas, fica apagada atrás delas e mergulha a cada campeão confirmado', async () => {
  mapsOk(ABYSS);
  vi.useFakeTimers();
  const timer = { phase: 'BAN_PICK', adjustedTimeLeftInPhase: 40000, totalTimeInPhase: 40000, internalNowInEpochMs: 0, isInfinite: false } as never;
  const lcu = setup(cardSession({ timer }), { subset: subsetOf([103, 157, 266]), gameflowSession: aramFlow() });
  await tick();
  await tick();
  const map = () => root.querySelector<HTMLElement>('.rlc-abyss');
  // Entrada: a cena inteira, com um marcador por aliado (sem rota), e as cartas ainda fora da mesa.
  expect(map()!.getAttribute('data-side')).toBe('blue');
  expect(map()!.hasAttribute('data-dim')).toBe(false);
  expect(screen().getAttribute('data-scene')).toBe('intro');
  expect(map()!.querySelectorAll('.rlc-rift-pin')).toHaveLength(2);
  expect(map()!.querySelector('.rlc-rift-role')).toBeNull();
  expect(map()!.querySelector('.rlc-rift-pin:last-child')!.hasAttribute('data-me')).toBe(true);
  expect(cardEls()).toHaveLength(0);
  await tick(MAP_INTRO_MS);
  // Cartas na mesa: a cena continua, apagada ao fundo.
  expect(cardEls()).toHaveLength(3);
  expect(map()!.getAttribute('data-dim')).toBe('true');
  expect(screen().getAttribute('data-scene')).toBeNull();
  // A LCU confirma a carta: mergulho no meu lugar da ponte, depois a splash.
  act(() => void (lcu.champSelect.value = ready(pickedSession(157, [103, 266], { timer }))));
  await tick();
  expect(map()!.hasAttribute('data-diving')).toBe(true);
  expect(map()!.hasAttribute('data-dim')).toBe(false);
  expect(screen().getAttribute('data-lockfx')).toBe('dive');
  await tick(DIVE_MS + 20);
  expect(map()).toBeNull();
  await tick(LOCK_FX_MS);
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  // Troca com o banco confirmada: mergulha de novo.
  act(() => void (lcu.champSelect.value = ready(pickedSession(103, [157, 266], { timer }))));
  await tick();
  expect(map()!.hasAttribute('data-diving')).toBe(true);
  expect(screen().getAttribute('data-lockfx')).toBe('dive');
});

test('ARAM antigo: aberto já com campeão não mergulha; a rolagem confirmada mergulha', async () => {
  mapsOk(ABYSS);
  vi.useFakeTimers();
  const s = (championId: number, rerollsRemaining: number) => live({ myTeam: [{ ...aramMe, championId }], benchEnabled: true, allowRerolling: true, rerollsRemaining, timer: aramTimer('FINALIZATION') } as never);
  const lcu = setup(s(103, 1), { gameflowSession: aramFlow() });
  await tick();
  await tick();
  expect(screen().getAttribute('data-lockfx')).toBeNull();
  expect(root.querySelector('.rlc-abyss')).toBeNull();
  act(() => btn('Rolar (1)')!.click());
  await tick();
  // Pedido enviado, nada confirmado: sem mergulho.
  expect(call('/lol-champ-select/v1/session/my-selection/reroll')).toHaveLength(1);
  expect(root.querySelector('.rlc-abyss')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(s(157, 0))));
  await tick();
  expect(root.querySelector('.rlc-abyss[data-diving]')).not.toBeNull();
  expect(screen().getAttribute('data-lockfx')).toBe('dive');
  expect(btn('Rolar (0)')!.disabled).toBe(true);
});

test('ARAM na preparação: o carrossel grande de skins toma o palco e o banco continua no cabeçalho', async () => {
  setup(live({ myTeam: [{ ...aramMe, championId: 103, selectedSkinId: 103000 }], benchEnabled: true, benchChampions: benchOf(157), timer: aramTimer('FINALIZATION') } as never), { skins: ready([skin(103000, { isBase: true }), skin(103001)]) });
  await settle();
  expect(root.querySelector('.rlc-cs-carousel[data-flow]')).not.toBeNull();
  expect(screen().getAttribute('data-stage')).toBe('skin');
  expect(btn('Yasuo', root.querySelector('.rlc-cs-head .rlc-cs-bench')!)!.disabled).toBe(false);
});

// ── Arena: duplas (8 times) e trios (6 times) ──
const CHERRY = (queueId: number, map = false) => ready({ ...(map ? { map: { id: 30 } } : {}), gameData: { queue: { id: queueId, gameMode: 'CHERRY' } } });
const banAll = (count: number, over: (cellId: number) => Partial<Parameters<typeof action>[0]>) => Array.from({ length: count }, (_, i) => action({ id: 100 + i, actorCellId: i, type: 'ban', ...over(i) }));
/** Uma rodada de escolha por par de times, na ordem das vagas. */
const pickRounds = (size: number, teams: number, state: (round: number) => Partial<Parameters<typeof action>[0]>) =>
  Array.from({ length: teams / 2 }, (_, r) => Array.from({ length: size * 2 }, (_, i) => action({ id: 200 + r * 10 + i, actorCellId: r * size * 2 + i, type: 'pick', ...state(r) })));
const subteamsShown = () => [...root.querySelectorAll('.rlc-cs-subteam')].map((g) => [g.getAttribute('aria-label'), g.getAttribute('data-team'), g.querySelectorAll('.rlc-cs-subteam-pick').length]);
const order = () => [...root.querySelectorAll('.rlc-cs-rd')].map((r) => [r.getAttribute('data-state'), [...r.querySelectorAll('i')].map((i) => i.textContent)]);

test('Arena em duplas: o meu time grande à esquerda, os outros sete compactos à direita na cor de cada um, e a ordem de escolha pelas ações', async () => {
  // Eu na vaga 9: time 4 (Rapinante), com a vaga 8 de parceiro.
  setup(arenaSession(2, 8, 9, { actions: [banAll(16, () => ({ completed: true })), ...pickRounds(2, 8, (r) => (r === 0 ? { completed: true } : r === 1 ? { isInProgress: true } : {}))] }), { gameflowSession: CHERRY(1700) });
  await settle();
  expect(screen().getAttribute('data-arena')).toBe('true');
  expect(root.querySelector('.rlc-cs-side[data-side="mine"] .rlc-cs-team-title')!.textContent).toBe('Seu time · Rapinante');
  expect(cards('mine').map((c) => c.querySelector('.rlc-cs-name')!.textContent)).toEqual(['Jogador 8', 'Jogador 9']);
  expect(cards('mine')[1]!.getAttribute('data-local')).toBe('true');
  expect(subteamsShown()).toEqual([['Poro', '0', 2], ['Tropa', '1', 2], ['Caranguejo', '2', 2], ['Krug', '3', 2], ['Sentinela', '5', 2], ['Lobo', '6', 2], ['Gromp', '7', 2]]);
  expect(root.querySelector('.rlc-cs-subteam')!.getAttribute('data-size')).toBe('2');
  // Quatro rodadas de dois times: a primeira já foi, a segunda está na vez (os dois times pulsam com a barra do tempo).
  expect(root.querySelector('.rlc-cs-rounds')!.getAttribute('aria-label')).toBe('Ordem de escolha');
  expect(order()).toEqual([
    ['done', ['Poro', 'Tropa']],
    ['now', ['Caranguejo', 'Krug']],
    ['next', ['Rapinante (você)', 'Sentinela']],
    ['next', ['Lobo', 'Gromp']],
  ]);
  const acting = [...root.querySelectorAll('.rlc-cs-subteam[data-acting]')];
  expect(acting.map((g) => g.getAttribute('aria-label'))).toEqual(['Caranguejo', 'Krug']);
  expect(acting[0]!.querySelector('.rlc-cs-subteam-head em')!.textContent).toBe('Escolhendo…');
  expect(acting[0]!.querySelector('.rlc-cs-subteam-bar')).not.toBeNull();
});

test('Arena em trios: seis times de três; o meu com três cartões, os outros cinco com três retratos, e a ordem em três rodadas', async () => {
  // Eu na vaga 4: time 1 (Tropa), com as vagas 3 e 5.
  setup(arenaSession(3, 6, 4, { actions: [banAll(18, () => ({ completed: true })), ...pickRounds(3, 6, (r) => (r === 0 ? { isInProgress: true } : {}))] }), { gameflowSession: CHERRY(1740) });
  await settle();
  expect(root.querySelector('.rlc-cs-side[data-side="mine"] .rlc-cs-team-title')!.textContent).toBe('Seu time · Tropa');
  expect(cards('mine').map((c) => c.querySelector('.rlc-cs-name')!.textContent)).toEqual(['Jogador 3', 'Jogador 4', 'Jogador 5']);
  expect(subteamsShown()).toEqual([['Poro', '0', 3], ['Caranguejo', '2', 3], ['Krug', '3', 3], ['Rapinante', '4', 3], ['Sentinela', '5', 3]]);
  expect(root.querySelector('.rlc-cs-subteam')!.getAttribute('data-size')).toBe('3');
  expect(order()).toEqual([
    ['now', ['Poro', 'Tropa (você)']],
    ['next', ['Caranguejo', 'Krug']],
    ['next', ['Rapinante', 'Sentinela']],
  ]);
  // Sem ações de escolha na sessão, a ordem não aparece.
  render(null, root);
  setup(arenaSession(3, 6, 4), { gameflowSession: CHERRY(1740) });
  await settle();
  expect(root.querySelector('.rlc-cs-rounds')).toBeNull();
  expect(root.querySelectorAll('.rlc-cs-subteam')).toHaveLength(5);
});

for (const [size, teams, me, queueId] of [[2, 8, 9, 1700], [3, 6, 4, 1740]] as const) {
  test(`Arena (${teams} times de ${size}): cada um bane um; os dos outros ficam escondidos até a revelação, que agrupa por time e devolve cada ban a quem baniu`, async () => {
    const mate = me - 1;
    const at = (done: boolean) =>
      arenaSession(size, teams, me, {
        id: 'arena-1',
        actions: [
          // Durante a rodada: eu já bani o Yasuo, o parceiro está de olho no Aatrox, a vaga 0 já baniu (a LCU pode até mandar quem) e o resto ainda não.
          banAll(size * teams, (i) => (done ? { completed: true, championId: i === me ? 157 : i === mate ? 266 : i === 0 ? 103 : i === 1 ? 0 : 266 } : i === me ? { completed: true, championId: 157 } : i === mate ? { isInProgress: true, championId: 266 } : i === 0 ? { completed: true, championId: 103 } : { isInProgress: true })),
          ...pickRounds(size, teams, (r) => (done && r === 0 ? { isInProgress: true } : {})),
        ],
      });
    vi.useFakeTimers();
    const lcu = setup(at(false), { gameflowSession: CHERRY(queueId) });
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
    expect(screen().getAttribute('data-ban')).toBe('true');
    const intent = (cellId: number) => root.querySelector(`.rlc-cs-intent[data-ban-cell="${cellId}"]`);
    const chip = (cellId: number) => root.querySelector(`.rlc-cs-subteam-ban[data-ban-cell="${cellId}"]`);
    expect(intent(me)!.getAttribute('data-done')).toBe('true');
    expect(intent(me)!.getAttribute('aria-label')).toBe('Banido: Yasuo');
    expect(intent(mate)!.getAttribute('data-done')).toBeNull();
    expect(chip(0)!.getAttribute('data-state')).toBe('hidden');
    expect(chip(0)!.querySelector('img')).toBeNull();
    expect(chip(1)).toBeNull();
    expect(root.querySelector('.rlc-cs-banstrip')).toBeNull();
    // A rodada termina: revelação com um grupo por time (o cartão vira junto com o do parceiro) e os bans ainda escondidos nos retratos.
    act(() => void (lcu.champSelect.value = ready(at(true))));
    const reveal = root.querySelector<HTMLElement>('.rlc-cs-reveal')!;
    expect(reveal.getAttribute('data-arena')).toBe('true');
    expect(reveal.style.getPropertyValue('--cols')).toBe(String(teams / 2));
    const rows = [...reveal.querySelectorAll('.rlc-cs-rv-row')];
    expect(rows).toHaveLength(teams);
    // A vaga 1 não baniu ninguém: o time dela revela um cartão a menos.
    expect(rows.map((r) => r.querySelectorAll('.rlc-cs-rv').length)).toEqual([size - 1, ...Array(teams - 1).fill(size)]);
    const mine = rows[Math.floor(me / size)]!;
    expect(mine.querySelector('.rlc-cs-rv-title')!.textContent).toBe('Seu time');
    expect(rows[0]!.querySelector('.rlc-cs-rv-title')!.textContent).toBe('Poro');
    expect(rows[0]!.getAttribute('data-team')).toBe('0');
    expect([...mine.querySelectorAll<HTMLElement>('.rlc-cs-rv')].map((c) => c.dataset.cell)).toContain(String(me));
    expect(root.querySelector('.rlc-cs-title')!.textContent).toBe('Banimentos revelados');
    expect(chip(0)!.getAttribute('data-state')).toBe('hidden');
    // Cada cartão tem para onde voar: o ban no cartão (meu time) ou no retrato (os outros).
    for (const c of reveal.querySelectorAll<HTMLElement>('.rlc-cs-rv')) expect(root.querySelector(`[data-ban-cell="${c.dataset.cell}"]`)).not.toBeNull();
    act(() => void vi.advanceTimersByTime(REVEAL_MS + 10));
    expect(root.querySelector('.rlc-cs-reveal')).toBeNull();
    expect(chip(0)!.getAttribute('data-state')).toBe('done');
    expect(chip(0)!.getAttribute('aria-label')).toBe('Banido: Ahri');
    expect(chip(0)!.querySelector('img')!.getAttribute('src')).toBe('/i/103.png');
    expect(chip(1)!.getAttribute('data-state')).toBe('none');
    expect(intent(mate)!.getAttribute('data-done')).toBe('true');
    expect(screen().getAttribute('data-ban')).toBeNull();
  });
}

test('Arena: favoritos da torcida apresentados quando a lista chega, depois na faixa do cabeçalho; quem trava um ganha o selo', async () => {
  // O parceiro (vaga 8) travou a Ahri, favorita; a vaga 0 travou o Yasuo, favorito; a vaga 1, o Aatrox, que não é.
  const s = arenaSession(2, 8, 9, { id: 'arena-2', actions: [[action({ id: 300, actorCellId: 0, type: 'pick', completed: true, championId: 157 }), action({ id: 301, actorCellId: 2, type: 'pick', isInProgress: true })]] }, { 8: { championId: 103 }, 0: { championId: 157 }, 1: { championId: 266 } });
  vi.useFakeTimers();
  const lcu = setup(s, { gameflowSession: CHERRY(1700) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-favs')).toBeNull();
  expect(root.querySelector('.rlc-cs-badge')).toBeNull();
  act(() => void (lcu.crowdFavorites.value = ready([157, 103])));
  // Apresentação no centro, uma vez.
  expect([...root.querySelectorAll('.rlc-cs-favshow .rlc-cs-fvb')].map((f) => f.textContent)).toEqual(['Yasuo', 'Ahri']);
  expect(screen().getAttribute('data-favintro')).toBe('true');
  const favs = () => [...root.querySelectorAll('.rlc-cs-favs .rlc-cs-fv')].map((f) => [f.getAttribute('aria-label'), f.getAttribute('data-taken')]);
  // O Yasuo já foi escolhido por outro time: apagado na faixa.
  expect(favs()).toEqual([['Yasuo', 'true'], ['Ahri', null]]);
  act(() => void vi.advanceTimersByTime(FAV_MS + 10));
  expect(root.querySelector('.rlc-cs-favshow')).toBeNull();
  expect(screen().getAttribute('data-favintro')).toBeNull();
  expect(favs()).toHaveLength(2);
  // Selo dourado: no cartão do parceiro e no retrato de quem travou um favorito; quem travou outro campeão, não.
  expect(cards('mine')[0]!.querySelector('.rlc-cs-badge')!.getAttribute('data-kind')).toBe('crowd');
  expect(cards('mine')[1]!.querySelector('.rlc-cs-badge')).toBeNull();
  const faces = [...root.querySelectorAll('.rlc-cs-subteam[aria-label="Poro"] .rlc-cs-subteam-face')];
  expect(faces.map((f) => f.querySelector('.rlc-cs-badge')?.getAttribute('data-kind') ?? null)).toEqual(['crowd', null]);
  // A mesma lista de novo não reapresenta.
  act(() => void (lcu.crowdFavorites.value = ready([157, 103])));
  expect(root.querySelector('.rlc-cs-favshow')).toBeNull();
});

test('Arena: abrir a tela com os favoritos já sabidos mostra só a faixa; na preparação ela sai', async () => {
  const lcu = setup(arenaSession(2, 8, 9), { gameflowSession: CHERRY(1700), crowdFavorites: ready([157]) });
  await settle();
  expect(root.querySelector('.rlc-cs-favshow')).toBeNull();
  expect(root.querySelectorAll('.rlc-cs-favs .rlc-cs-fv')).toHaveLength(1);
  act(() => void (lcu.champSelect.value = ready(arenaSession(2, 8, 9, { timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: 30000, totalTimeInPhase: 30000, internalNowInEpochMs: 0, isInfinite: false } as never }))));
  expect(root.querySelector('.rlc-cs-favs')).toBeNull();
});

test('Arena: outro jogador trava a Ousadia: a roleta gira no centro, o palco é dele e o retrato fica com o selo laranja', async () => {
  const at = (championId: number) => arenaSession(3, 6, 4, { id: 'arena-3' }, { 9: { championId, gameName: 'Zeca' } });
  vi.useFakeTimers();
  const lcu = setup(at(0), { gameflowSession: CHERRY(1740) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(at(-3))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  // A roleta passa retratos de campeões e para na Ousadia.
  const reel = [...root.querySelectorAll<HTMLElement>('.rlc-cs-reel > span i')].map((i) => i.style.backgroundImage);
  expect(reel.length).toBeGreaterThan(1);
  expect(reel.at(-1)).toContain('bravery-champion.png');
  expect(root.querySelector('.rlc-cs-reel-flash')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Zeca foi de Ousadia · Krug');
  expect(root.querySelector('.rlc-cs-champ-name')!.textContent).toBe('Ousadia');
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(stage()).toContain('bravery-splash-background.png');
  const pick = () => root.querySelectorAll('.rlc-cs-subteam[aria-label="Krug"] .rlc-cs-subteam-pick')[0]!;
  expect(pick().getAttribute('data-rolling')).toBe('true');
  expect(pick().getAttribute('data-locked')).toBe('true');
  expect(pick().querySelector('.rlc-cs-badge')!.getAttribute('data-kind')).toBe('brave');
  expect(pick().querySelector('.rlc-cs-subteam-name')!.textContent).toBe('Ousadia');
  await act(async () => void (await vi.advanceTimersByTimeAsync(BRAVE_MS + 10)));
  // A roleta some; o selo fica.
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  expect(pick().getAttribute('data-rolling')).toBeNull();
  expect(pick().querySelector('.rlc-cs-badge')!.getAttribute('data-kind')).toBe('brave');
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).not.toContain('Ousadia');
  // A mesma sessão de novo não repete; abrir a tela com a Ousadia já travada também não.
  act(() => void (lcu.champSelect.value = ready(at(-3))));
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  render(null, root);
  setup(at(-3), { gameflowSession: CHERRY(1740) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  expect(root.querySelector('.rlc-cs-subteam .rlc-cs-badge[data-kind="brave"]')).not.toBeNull();
});

test('Arena: a minha Ousadia só vale quando a LCU confirma: roleta, selo laranja no meu cartão e "Travado"', async () => {
  const at = (done: boolean) => arenaSession(2, 8, 9, { id: 'arena-4', actions: [[action({ id: 400, actorCellId: 9, type: 'pick', isInProgress: !done, completed: done, championId: -3 })]] }, { 9: { championId: done ? -3 : 0 } });
  vi.useFakeTimers();
  const lcu = setup(at(false), { gameflowSession: CHERRY(1700) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  // Em destaque, ainda não travada: nada de roleta nem de selo.
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  expect(cards('mine')[1]!.querySelector('.rlc-cs-badge')).toBeNull();
  act(() => btn('Travar')!.click());
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  act(() => void (lcu.champSelect.value = ready(at(true))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(root.querySelector('.rlc-cs-reel')).not.toBeNull();
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Você foi de Ousadia');
  const mine = cards('mine')[1]!;
  expect(mine.getAttribute('data-state')).toBe('locked');
  expect(mine.querySelector('.rlc-cs-badge')!.getAttribute('data-kind')).toBe('brave');
  expect(screen().getAttribute('data-stage')).toBe('full');
  await act(async () => void (await vi.advanceTimersByTimeAsync(BRAVE_MS + 10)));
  expect(root.querySelector('.rlc-cs-reel')).toBeNull();
  expect(root.querySelector('.rlc-cs-stage-sub')!.textContent).toBe('Travado');
  expect(cards('mine')[1]!.querySelector('.rlc-cs-badge')!.getAttribute('data-kind')).toBe('brave');
});

test('Arena com o mapa: a arena em 3D com todos os times (sem precisar da arte do client) e o mergulho quando a LCU confirma a minha escolha', async () => {
  const at = (done: boolean) => arenaSession(3, 6, 4, { id: 'arena-5', actions: [[action({ id: 500, actorCellId: 4, type: 'pick', isInProgress: !done, completed: done, championId: 103 })]] }, { 4: { championId: done ? 103 : 0 } });
  vi.useFakeTimers();
  const lcu = setup(at(false), { gameflowSession: CHERRY(1740, true) });
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  const scene = () => root.querySelector('.rlc-arena');
  expect(scene()).not.toBeNull();
  expect(scene()!.querySelectorAll('.rlc-rift-pin')).toHaveLength(18);
  expect(scene()!.querySelectorAll('.rlc-rift-pin[data-mine="true"]')).toHaveLength(3);
  // Enquanto a arena se forma o palco é dela (o nome e a splash esperam).
  expect(screen().getAttribute('data-scene')).toBe('intro');
  // A grade espera a arena se formar e abre sozinha na minha vez.
  await act(async () => void (await vi.advanceTimersByTimeAsync(MAP_INTRO_MS + 10)));
  expect(scene()).toBeNull();
  expect(btn('Ahri')).toBeDefined();
  act(() => void (lcu.champSelect.value = ready(at(true))));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(scene()!.getAttribute('data-diving')).toBe('true');
  expect(screen().getAttribute('data-lockfx')).toBe('dive');
  await act(async () => void (await vi.advanceTimersByTimeAsync(DIVE_MS + LOCK_FX_MS + 10)));
  expect(scene()).toBeNull();
});

test('Arena na preparação: carrossel de skins e feitiços, sem runas', async () => {
  setupLoadout({
    gameflowSession: CHERRY(1700),
    champSelect: ready(arenaSession(2, 8, 9, { timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: 30000, totalTimeInPhase: 30000, internalNowInEpochMs: 0, isInfinite: false } as never }, { 9: { championId: 103, selectedSkinId: 103000 } })),
    skins: ready([skin(103000, { isBase: true }), skin(103001)]),
  });
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cs-carousel[data-flow]')).not.toBeNull();
  expect(screen().getAttribute('data-stage')).toBe('skin');
  expect(root.querySelectorAll('.rlc-cs-spell-slots .rlc-cs-spell-slot')).toHaveLength(2);
  expect(root.querySelector('.rlc-cs-runes')).toBeNull();
});
