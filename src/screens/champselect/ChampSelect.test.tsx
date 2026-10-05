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
});
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

test('faixas dos dois times com nomes, nome vazio resolvido pelo puuid, posição', async () => {
  const lcu = fakeLcu();
  setup(banTurn());
  void lcu;
  await settle();
  const [mine, theirs] = root.querySelectorAll('.rlc-cs-team');
  expect(mine!.querySelectorAll('.rlc-cs-cell')).toHaveLength(2);
  expect(mine!.textContent).toContain('Fulano');
  expect(mine!.textContent).toContain('Meio');
  expect(theirs!.textContent).toContain('Zeca');
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
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Banir');
  act(() => btn('Yasuo')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/0')[0]![1].body)).toEqual({ championId: 157 });
});

test('Banir/Confirmar só habilita com campeão destacado permitido e envia completed', async () => {
  setup(pickTurn(103));
  await settle();
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Sua vez de escolher');
  const confirm = btn('Confirmar')!;
  expect(confirm.disabled).toBe(false);
  act(() => confirm.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/actions/6')[0]![1].body)).toEqual({ championId: 103, completed: true });
});

test('campeão destacado que deixou de ser permitido some da grade e desabilita Confirmar', async () => {
  setup(pickTurn(103), { pickable: ready([157, 266]) });
  await settle();
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox', 'Yasuo']);
  expect(btn('Confirmar')!.disabled).toBe(true);
});

test('fora da vez: sem botão de confirmar nem banir, e clique na grade não envia nada', async () => {
  setup(session({ myTeam: [me], actions: [[action({ actorCellId: 3, type: 'pick', isInProgress: true })]] }));
  await settle();
  expect(root.querySelector('.rlc-cs-phase')!.textContent).toBe('Aguardando');
  expect(btn('Confirmar')).toBeUndefined();
  expect(btn('Banir')).toBeUndefined();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-cs-champ')!.click());
  expect(fetchMock).not.toHaveBeenCalled();
});

test('busca por nome e filtro por classe', async () => {
  setup(pickTurn());
  await settle();
  const search = root.querySelector<HTMLInputElement>('input[aria-label="Buscar campeão"]')!;
  act(() => {
    search.value = 'ah';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri']);
  act(() => {
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => btn('Tanque')!.click());
  expect([...root.querySelectorAll('.rlc-cs-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Aatrox']);
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
  expect(root.querySelector<HTMLElement>('.rlc-cs-splash')!.style.backgroundImage).toContain('/splash/103000.jpg');
  render(null, root);
  setup(session({ myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId: 103005 })] }));
  await settle();
  expect(root.querySelector<HTMLElement>('.rlc-cs-splash')!.style.backgroundImage).toContain('/splash/103005.jpg');
  render(null, root);
  setup(session({ myTeam: [cell({ cellId: 0 })] }));
  await settle();
  expect(root.querySelector<HTMLElement>('.rlc-cs-splash')!.style.backgroundImage).toBe('');
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

test('a aba muda para Skins quando meu campeão é confirmado, e volta à mão', async () => {
  const lcu = setup(pickTurn(103));
  await settle();
  expect(btn('Campeões')!.getAttribute('aria-selected')).toBe('true');
  act(() => {
    lcu.champSelect.value = ready(session({ myTeam: [cell({ cellId: 0, championId: 103 })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] }));
  });
  expect(btn('Skins')!.getAttribute('aria-selected')).toBe('true');
  act(() => btn('Campeões')!.click());
  expect(btn('Campeões')!.getAttribute('aria-selected')).toBe('true');
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
  lcu.game = { ...lcu.game, champions: async () => CHAMPS, spells: async () => SPELLS };
  const values: Partial<Record<keyof Lcu, unknown>> = {
    champSelect: ready(lockedMe()),
    gameflowSession: ready({ gameData: { queue: { gameMode: 'CLASSIC' } } }),
    perkPages: ready([{ id: 1, name: 'Meio', isValid: true }, { id: 2, name: 'Topo', isValid: true }, { id: 3, name: 'Quebrada', isValid: false }]),
    currentPerkPage: ready({ id: 1, name: 'Meio' }),
    ...over,
  };
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  act(() => render(<ChampSelect lcu={lcu} />, root));
}

test('feitiços: slot lista os do modo atual e aplica; escolher o do outro slot troca os dois', async () => {
  setupLoadout();
  await settle();
  act(() => btn('Runas e feitiços')!.click());
  act(() => btn('Feitiço 1: Flash')!.click());
  expect([...root.querySelectorAll('.rlc-cs-spell-option')].map((b) => b.getAttribute('aria-label'))).toEqual(['Flash', 'Golpear', 'Incendiar']);
  act(() => btn('Golpear')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[0]![1].body)).toEqual({ spell1Id: 11 });
  await settle();
  act(() => btn('Feitiço 1: Flash')!.click());
  act(() => btn('Incendiar')!.click());
  expect(JSON.parse(call('/lol-champ-select/v1/session/my-selection')[1]![1].body)).toEqual({ spell1Id: 14, spell2Id: 4 });
});

test('runas: páginas válidas com a atual marcada; clique troca a página', async () => {
  setupLoadout();
  await settle();
  act(() => btn('Runas e feitiços')!.click());
  const pages = [...root.querySelectorAll('.rlc-cs-page')];
  expect(pages.map((p) => p.textContent)).toEqual(['Meio', 'Topo']);
  expect(pages[0]!.getAttribute('aria-pressed')).toBe('true');
  act(() => btn('Topo')!.click());
  const [, init] = call('/lol-perks/v1/currentpage')[0]!;
  expect(init).toEqual({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '2' });
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
  expect(btn('Confirmar')!.disabled).toBe(true);
});
