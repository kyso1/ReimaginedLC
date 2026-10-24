import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { DEFAULT_PREFS, prefs } from '../../shell/prefs';
import { fakeLcu, ready } from '../../test/fixtures';
import { clearOpggCache, opgg, opggPosition, parseOpgg, recommend, recommendVs } from './opgg';
import { RuneEditor, spellOrder, useApplyOnLock, type RecoContext } from './RuneEditor';

const build = (key: number, sub: number, play: number, win: number) => ({
  id: key,
  primary_page_id: 8100,
  primary_rune_ids: [key, 8139, 8140, 8106],
  secondary_page_id: sub,
  secondary_rune_ids: [8210, 8226],
  stat_mod_ids: [5005, 5008, 5001],
  play,
  win,
  pick_rate: 0.6,
});
const BODY = {
  data: {
    rune_pages: [
      { id: 8112, pick_rate: 0.68, builds: [build(8112, 8200, 200, 110), build(8112, 8200, 10, 1)] },
      { id: 8128, pick_rate: 0.2, builds: [build(8128, 8200, 50, 25)] },
      { id: 9923, pick_rate: 0.1, builds: [{ ...build(9923, 8200, 5, 2), stat_mod_ids: [5005] }] },
      { id: 8999, pick_rate: 0.05, builds: [build(8999, 8300, 40, 22)] },
      { id: 8998, pick_rate: 0.01, builds: [build(8998, 8300, 35, 18)] },
    ],
    summoner_spells: [{ ids: [4, 14], win: 1, play: 2, pick_rate: 0.7 }],
  },
};


test('posição da seleção ou da LCU para a da OP.GG', () => {
  expect(['top', 'jungle', 'middle', 'bottom', 'utility'].map(opggPosition)).toEqual(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']);
  expect(opggPosition('MIDDLE')).toBe('MID');
  expect(opggPosition('')).toBeNull();
});

test('leitura: 3 primeiras páginas válidas, build mais jogada de cada, 9 ids na ordem da LCU, taxas e feitiços', () => {
  const recs = parseOpgg(BODY)!;
  expect(recs).toHaveLength(3);
  expect(recs[0]).toEqual({ primary: 8100, sub: 8200, perks: [8112, 8139, 8140, 8106, 8210, 8226, 5005, 5008, 5001], win: 0.55, pick: 0.68, spells: [4, 14] });
  // a terceira página veio incompleta e foi pulada
  expect(recs.map((r) => r.perks[0])).toEqual([8112, 8128, 8999]);
  expect(parseOpgg({})).toBeNull();
  expect(parseOpgg(null)).toBeNull();
});

test('cache por campeão, rota e inimigo; falha devolve null e não fica no cache', async () => {
  clearOpggCache();
  const get = vi.spyOn(opgg, 'get').mockResolvedValue(BODY);
  await recommend('BR', 103, 'MID');
  await recommend('BR', 103, 'MID');
  expect(get).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledWith('https://lol-api-champion.op.gg/api/BR/champions/ranked/103/MID');
  await recommend('BR', 103, 'MID', 157);
  expect(get).toHaveBeenLastCalledWith('https://lol-api-champion.op.gg/api/BR/champions/ranked/103/MID?target_champion=157');
  get.mockRejectedValueOnce(new Error('rede'));
  expect(await recommend('BR', 103, 'TOP')).toBeNull();
  expect(await recommend('BR', 103, 'TOP')).toHaveLength(3);
  get.mockRestore();
});

test('feitiços: o Flash fica na tecla que o jogador já usa', () => {
  expect(spellOrder([4, 14], { spell1Id: 4, spell2Id: 7 })).toEqual({ spell1Id: 4, spell2Id: 14 });
  expect(spellOrder([4, 14], { spell1Id: 7, spell2Id: 4 })).toEqual({ spell1Id: 14, spell2Id: 4 });
  expect(spellOrder([12, 4], { spell1Id: 4, spell2Id: 7 })).toEqual({ spell1Id: 4, spell2Id: 12 });
  expect(spellOrder([11, 14], { spell1Id: 4, spell2Id: 7 })).toEqual({ spell1Id: 11, spell2Id: 14 });
});

// Painel "Recomendadas" dentro do editor
let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let canAdd = true;
let opggFails = false;
// Matchup sem amostra: a OP.GG devolve páginas, mas todas abaixo do MIN_GAMES.
let thinMatchup = false;
const THIN = { data: { rune_pages: [{ id: 8112, pick_rate: 1, builds: [build(8112, 8200, 2, 1)] }], summoner_spells: [] } };
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
const calls = (url: string, method?: string) => fetchMock.mock.calls.filter((c) => c[0] === url && (!method || c[1]?.method === method));
const CHAMPS = new Map([
  [103, { name: 'Ahri', icon: '/i/103.png' }],
  [157, { name: 'Yasuo', icon: '/i/157.png' }],
  [266, { name: 'Aatrox', icon: '/i/266.png' }],
]);
const SPELLS = new Map([
  [4, { id: 4, name: 'Flash', icon: '/s/4.png', gameModes: ['CLASSIC'] }],
  [14, { id: 14, name: 'Incendiar', icon: '/s/14.png', gameModes: ['CLASSIC'] }],
]);
const reco = (over: Partial<RecoContext> = {}): RecoContext => ({ championId: 103, position: 'middle', enemies: [157, 0, 0], laneEnemy: 0, champions: CHAMPS, spells: SPELLS, me: { spell1Id: 14, spell2Id: 4 }, ...over });

beforeEach(() => {
  setLocale('pt_BR');
  clearOpggCache();
  canAdd = true;
  opggFails = false;
  thinMatchup = false;
  prefs.value = { ...DEFAULT_PREFS };
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://lol-api-champion.op.gg/')) return opggFails ? Promise.reject(new Error('cors')) : new Response(JSON.stringify(thinMatchup && url.includes('target_champion') ? THIN : BODY), { status: 200 });
    if (url === '/lol-perks/v1/inventory') return new Response(JSON.stringify({ canAddCustomPage: canAdd }), { status: 200 });
    if (url === '/lol-perks/v1/pages' && init?.method === 'POST') return new Response(JSON.stringify({ id: 9 }), { status: 200 });
    if (url === '/lol-perks/v1/styles' || url === '/lol-perks/v1/perks') return new Response('[]', { status: 200 });
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  prefs.value = { ...DEFAULT_PREFS };
});

const PAGES = [
  { id: 1, name: 'Minha', isEditable: true, current: false },
  { id: 2, name: 'Atual', isEditable: true, current: true },
];
async function mount(r: RecoContext = reco()) {
  const lcu = fakeLcu();
  lcu.regionLocale.value = ready({ locale: 'pt_BR', region: 'BR' } as never);
  lcu.perkPages.value = ready(PAGES) as Lcu['perkPages']['value'];
  lcu.currentPerkPage.value = ready(PAGES[1]) as Lcu['currentPerkPage']['value'];
  act(() => render(<RuneEditor lcu={lcu} mode="overlay" reco={r} onClose={() => {}} />, root));
  await settle();
  await settle();
  return lcu;
}

test('Contra: Geral e só os inimigos já escolhidos; vagas escolhendo ficam tracejadas; clicar busca a matchup', async () => {
  await mount();
  expect(root.querySelector('.rlc-re-reco')).not.toBeNull();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID')).toHaveLength(1);
  expect(btn('Geral')!.getAttribute('aria-pressed')).toBe('true');
  expect([...root.querySelectorAll('.rlc-re-vs-champ')].map((b) => b.getAttribute('aria-label'))).toEqual(['Yasuo']);
  expect(root.querySelectorAll('.rlc-re-vs-empty')).toHaveLength(2);
  expect(root.querySelectorAll('.rlc-re-rec')).toHaveLength(3);
  expect(root.querySelector('.rlc-re-rec-wr')!.textContent).toBe('55%');
  act(() => btn('Yasuo')!.click());
  await settle();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=157')).toHaveLength(1);
  expect(root.querySelector('.rlc-re-reco')!.textContent).toContain('Runas e feitiços que mais ganham contra Yasuo');
});

test('rota trocada busca de novo; falha de rede vira "Sem recomendações agora"', async () => {
  await mount();
  opggFails = true;
  const lane = root.querySelector<HTMLSelectElement>('select[aria-label="Rota"]')!;
  expect(lane.value).toBe('MID');
  act(() => {
    lane.value = 'TOP';
    lane.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle();
  await settle();
  expect(root.querySelector('.rlc-re-reco')!.textContent).toContain('Sem recomendações agora');
  expect(btn('Aplicar runas e feitiços')!.disabled).toBe(true);
});

test('sem matchup nas preferências não há Contra; sem runesAuto o painel começa fechado e nada é buscado', async () => {
  prefs.value = { ...DEFAULT_PREFS, runesMatchup: false };
  await mount();
  expect(btn('Geral')).toBeUndefined();
  render(null, root);
  fetchMock.mockClear();
  prefs.value = { ...DEFAULT_PREFS, runesAuto: false };
  await mount();
  expect(root.querySelector('.rlc-re-reco')).toBeNull();
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('op.gg'))).toBe(false);
  act(() => btn('★ Recomendadas')!.click());
  await settle();
  expect(root.querySelector('.rlc-re-reco')).not.toBeNull();
});

test('Aplicar cria a página e troca os feitiços mantendo o Flash na tecla do jogador', async () => {
  await mount();
  act(() => btn('Aplicar runas e feitiços')!.click());
  await settle();
  await settle();
  expect(JSON.parse(calls('/lol-perks/v1/pages', 'POST')[0]![1].body)).toEqual({ name: 'Ahri Meio', primaryStyleId: 8100, subStyleId: 8200, selectedPerkIds: [8112, 8139, 8140, 8106, 8210, 8226, 5005, 5008, 5001], current: true });
  expect(JSON.parse(calls('/lol-champ-select/v1/session/my-selection', 'PATCH')[0]![1].body)).toEqual({ spell1Id: 14, spell2Id: 4 });
});

test('Aplicar no limite de páginas sobrescreve a página editável em edição', async () => {
  canAdd = false;
  await mount();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-re-rec')[1]!.click());
  act(() => btn('Aplicar runas e feitiços')!.click());
  await settle();
  await settle();
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(0);
  expect(JSON.parse(calls('/lol-perks/v1/pages/2', 'PUT')[0]![1].body)).toMatchObject({ id: 2, name: 'Ahri Meio', selectedPerkIds: [8128, 8139, 8140, 8106, 8210, 8226, 5005, 5008, 5001], current: true });
});

function Lock({ lcu, r, locked, id }: { lcu: Lcu; r: RecoContext; locked: boolean; id: string }) {
  useApplyOnLock(lcu, r, locked, id);
  return null;
}

test('aplicar ao confirmar: dispara uma vez quando o campeão trava, só com a preferência ligada', async () => {
  const lcu = fakeLcu();
  lcu.perkPages.value = ready(PAGES) as Lcu['perkPages']['value'];
  act(() => render(<Lock lcu={lcu} r={reco()} locked id="s1" />, root));
  await settle();
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(0);
  render(null, root);
  prefs.value = { ...DEFAULT_PREFS, runesApplyOnLock: true };
  act(() => render(<Lock lcu={lcu} r={reco()} locked={false} id="s1" />, root));
  await settle();
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(0);
  act(() => render(<Lock lcu={lcu} r={reco()} locked id="s1" />, root));
  await settle();
  await settle();
  act(() => render(<Lock lcu={lcu} r={reco({ me: { spell1Id: 4, spell2Id: 14 } })} locked id="s1" />, root));
  await settle();
  await settle();
  // região sem dado no fake: reserva KR
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID')).toHaveLength(1);
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(1);
  expect(calls('/lol-champ-select/v1/session/my-selection', 'PATCH')).toHaveLength(1);
});

test('matchup sem amostra cai nas gerais e avisa; com amostra fica na matchup', async () => {
  clearOpggCache();
  const get = vi.spyOn(opgg, 'get').mockImplementation(async (url) => (url.includes('target_champion') ? THIN : BODY));
  const thin = await recommendVs('global', 103, 'MID', 157);
  expect(thin.general).toBe(true);
  expect(thin.recs).toHaveLength(3);
  expect(get).toHaveBeenCalledWith('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=157');
  get.mockResolvedValue(BODY);
  clearOpggCache();
  expect((await recommendVs('global', 103, 'MID', 157)).general).toBe(false);
  expect((await recommendVs('global', 103, 'MID', 0)).general).toBe(false);
  get.mockRestore();
});

test('adversário da rota conhecido: o painel já abre na matchup; sem amostra mostra as gerais com aviso', async () => {
  thinMatchup = true;
  await mount(reco({ laneEnemy: 157 }));
  await settle();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=157')).toHaveLength(1);
  expect(btn('Yasuo')!.getAttribute('aria-pressed')).toBe('true');
  const panel = root.querySelector('.rlc-re-reco')!;
  expect(panel.textContent).toContain('Poucas partidas nessa matchup');
  expect(panel.textContent).toContain('Runas e feitiços mais usados na rota');
  expect(root.querySelectorAll('.rlc-re-rec')).toHaveLength(3);
  // Geral à mão desliga o automático
  act(() => btn('Geral')!.click());
  await settle();
  expect(btn('Geral')!.getAttribute('aria-pressed')).toBe('true');
  expect(panel.textContent).not.toContain('Poucas partidas');
});

test('inimigo sem posição: pede para escolher entre os já confirmados', async () => {
  await mount(reco({ laneEnemy: 0, enemies: [157, 266, 0] }));
  expect(root.querySelector('.rlc-re-reco')!.textContent).toContain('escolha o seu adversário em Contra');
  act(() => btn('Aatrox')!.click());
  await settle();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=266')).toHaveLength(1);
  expect(root.querySelector('.rlc-re-reco')!.textContent).not.toContain('escolha o seu adversário');
  expect(root.querySelector('.rlc-re-reco')!.textContent).toContain('que mais ganham contra Aatrox');
});

test('aplicar ao confirmar usa a matchup e aplica de novo quando o adversário aparece depois', async () => {
  prefs.value = { ...DEFAULT_PREFS, runesApplyOnLock: true };
  const lcu = fakeLcu();
  lcu.perkPages.value = ready(PAGES) as Lcu['perkPages']['value'];
  act(() => render(<Lock lcu={lcu} r={reco()} locked id="s1" />, root));
  await settle();
  await settle();
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(1);
  act(() => render(<Lock lcu={lcu} r={reco({ laneEnemy: 157 })} locked id="s1" />, root));
  await settle();
  await settle();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=157')).toHaveLength(1);
  expect(calls('/lol-perks/v1/pages', 'POST')).toHaveLength(2);
  // sem a preferência de matchup, o adversário não muda nada
  prefs.value = { ...DEFAULT_PREFS, runesApplyOnLock: true, runesMatchup: false };
  act(() => render(<Lock lcu={lcu} r={reco({ laneEnemy: 266 })} locked id="s1" />, root));
  await settle();
  expect(calls('https://lol-api-champion.op.gg/api/global/champions/ranked/103/MID?target_champion=266')).toHaveLength(0);
});
