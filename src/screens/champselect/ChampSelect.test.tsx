import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { action, cell, fakeLcu, ready, session } from '../../test/fixtures';
import { ChampSelect } from './ChampSelect';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Image', LoadedImage);
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

test('cartões dos aliados com nome e ícone da rota; inimigos sem nome, só o campeão ou "escolhendo"', async () => {
  setup(session({ myTeam: [me, ally], theirTeam: [enemy, cell({ cellId: 6, team: 2, championId: 157 })] }));
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-team');
  expect(mine!.querySelectorAll('.rlc-cs-cell')).toHaveLength(2);
  expect(mine!.textContent).toContain('Fulano');
  expect(mine!.querySelector('.rlc-cs-pos')!.getAttribute('aria-label')).toBe('Meio');
  expect(mine!.querySelector('.rlc-cs-pos svg')!.getAttribute('data-role')).toBe('MIDDLE');
  const foes = [...theirs!.querySelectorAll('.rlc-cs-cell')].map((c) => c.textContent);
  expect(foes).toEqual(['Escolhendo…', 'Yasuo']);
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

test('banimentos aparecem sob o time certo', async () => {
  setup(session({ myTeam: [me], theirTeam: [enemy], actions: [[action({ type: 'ban', completed: true, championId: 157 })], [action({ type: 'ban', completed: true, championId: 266, isAllyAction: false })]] }));
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-bans');
  expect(mine!.querySelector('img')!.getAttribute('alt')).toBe('Yasuo');
  expect(theirs!.querySelector('img')!.getAttribute('alt')).toBe('Aatrox');
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
  act(() => cells[1]!.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  expect([...root.querySelectorAll('[role="menuitem"]')].map((b) => b.textContent)).toEqual(['Trocar campeão', 'Trocar posição']);
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

test('campeão banido sai da grade mesmo se a LCU ainda o lista como disponível', async () => {
  setup(session({ myTeam: [me], actions: [[action({ type: 'ban', completed: true, championId: 157 })], [action({ id: 6, type: 'pick', isInProgress: true })]] }));
  await settle();
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox', 'Ahri']);
});

test('gaveta de campeões: ✕ e Esc fecham, o botão reabre e a minha vez reabre sozinha', async () => {
  const lcu = setup(session({ myTeam: [me], actions: [[action({ id: 6, type: 'pick', isInProgress: false })]] }));
  await settle();
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
