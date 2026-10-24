import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { DEFAULT_PREFS, prefs } from '../../shell/prefs';
import { fakeLcu, ready } from '../../test/fixtures';
import { prestigeLevel, prestigeTheme } from './look';
import { Profile } from './Profile';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const dialog = () => root.querySelector<HTMLElement>('[role="dialog"]');
const inDialog = (text: string) => [...dialog()!.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;
const tab = (text: string) => [...dialog()!.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text)!;
const labels = (sel: string) => [...dialog()!.querySelectorAll(sel)].map((e) => e.getAttribute('aria-label') ?? e.textContent);
const writes = () => fetchMock.mock.calls.filter((c) => c[1]?.method && c[1].method !== 'GET').map((c) => [c[1].method, c[0], JSON.parse(c[1].body ?? 'null')]);
const type = (value: string) =>
  act(() => {
    const input = dialog()!.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

const banner = (id: string, name: string, isOwned = true) => ({ isOwned, items: [{ id, idSecondary: '', assetPath: `/b/${id}.png`, localizedName: name }] });
const skin = (id: number, championId: number, name: string, owned: boolean) => ({ id, championId, name, splashPath: `/s/${id}.jpg`, tilePath: `/t/${id}.jpg`, ownership: { owned } });

function routes(url: string): unknown {
  if (url === '/lol-summoner/v2/summoners/puuid/me') return { gameName: 'Fulano', summonerLevel: 120, profileIconId: 29 };
  if (url === '/lol-challenges/v1/summary-player-data/player/me' || url === '/lol-challenges/v1/summary-player-data/local-player')
    return { bannerId: '4', crestId: '1', prestigeCrestBorderLevel: 100, title: { itemId: 2000266, name: 'A Espada Darkin' }, topChallenges: [{ id: 101 }] };
  if (url === '/lol-regalia/v3/inventory/REGALIA_BANNER') return { '1': banner('1', ''), '4': banner('4', 'Estandarte Lutador'), '9': banner('9', 'Não possuído', false) };
  if (url === '/lol-regalia/v2/current-summoner/regalia') return { preferredCrestType: 'prestige', preferredBannerType: 'lastSeasonHighestRank', selectedPrestigeCrest: 5, lastSeasonHighestRank: 'GOLD' };
  if (url === '/lol-inventory/v2/inventory/SUMMONER_ICON') return [{ itemId: 29 }, { itemId: 588 }];
  if (url === '/lol-game-data/assets/v1/summoner-icons.json') return [{ id: 29, title: 'Raio Azul' }, { id: 588, title: 'Poro Rei' }];
  if (url === '/lol-challenges/v2/titles/local-player') return [{ itemId: 2000266, name: 'A Espada Darkin' }, { itemId: 40130404, name: 'Meio Diferente' }];
  if (url === '/lol-banners/v1/current-summoner/flags') return [{ itemId: 65, theme: 'CoPilot', level: 2, seasonId: 10, earnedDateIso8601: '2020-03-29T17:35:01Z' }];
  if (url === '/lol-banners/v1/current-summoner/flags/equipped') return { itemId: 65, theme: 'CoPilot', level: 2, seasonId: 10, earnedDateIso8601: '2020-03-29T17:35:01Z' };
  if (url === '/lol-champions/v1/inventories/7/skins-minimal') return [skin(103000, 103, 'Ahri', true), skin(103015, 103, 'Ahri Arcade', false), skin(238000, 238, 'Zed', true)];
  if (url === '/lol-champion-mastery/v1/me/champion-mastery') return [{ championId: 103, championPoints: 1000 }, { championId: 238, championPoints: 5000 }];
  return null;
}

beforeEach(() => {
  setLocale('pt_BR');
  prefs.value = DEFAULT_PREFS;
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method && init.method !== 'GET') return new Response(null, { status: 204 });
    const body = routes(url);
    return body === null ? new Response(null, { status: 404 }) : new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

async function mount(localPuuid = 'me') {
  const lcu = fakeLcu();
  lcu.currentSummoner.value = ready({ puuid: localPuuid, summonerId: 7 });
  lcu.game = { ...lcu.game, champions: async () => new Map([[103, { id: 103, name: 'Ahri', icon: '', roles: [] }], [238, { id: 238, name: 'Zed', icon: '', roles: [] }]]) };
  act(() => render(<Profile lcu={lcu} puuid="me" />, root));
  await settle();
  await settle();
}
async function open() {
  await mount();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Personalizar')!.click());
  await settle();
  await settle();
}

test('vitrine mostra título; Personalizar só no próprio perfil', async () => {
  await mount('outro');
  expect(root.querySelector('.rlc-pf-title')!.textContent).toBe('A Espada Darkin');
  // A vitrine não tem mais o estandarte (fica só na prévia da janela).
  expect(root.querySelector('.rlc-pf-showcase .rlc-pf-banner')).toBeNull();
  expect([...root.querySelectorAll('button')].some((b) => b.textContent === 'Personalizar')).toBe(false);
  render(null, root);
  await mount('me');
  expect([...root.querySelectorAll('button')].some((b) => b.textContent === 'Personalizar')).toBe(true);
});

test('janela: abas trocam a grade, busca filtra, Esc fecha', async () => {
  await open();
  expect(labels('.rlc-idm-icon')).toEqual(['Poro Rei', 'Raio Azul']);
  await type('raio');
  expect(labels('.rlc-idm-icon')).toEqual(['Raio Azul']);
  act(() => tab('Bordas').click());
  expect(dialog()!.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('');
  expect(labels('.rlc-idm-border')).toEqual(['Elo · Ouro', 'nível 100', 'nível 75', 'nível 50', 'nível 30', 'nível 1']);
  act(() => tab('Títulos').click());
  expect(labels('.rlc-chip-row button')).toEqual(['Sem título', 'A Espada Darkin', 'Meio Diferente']);
  act(() => tab('Estandartes').click());
  expect(labels('.rlc-idm-banner')).toEqual(['Padrão', 'Estandarte Lutador']);
  expect(dialog()!.textContent).toContain('Bandeira · nível 2 · 2020');
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(dialog()).toBeNull();
});

test('fundo: só skins possuídas; com allSplashes, todas; busca por campeão', async () => {
  await open();
  act(() => tab('Fundo').click());
  expect(labels('.rlc-idm-skin')).toEqual(['Ahri', 'Zed']);
  act(() => void (prefs.value = { ...DEFAULT_PREFS, allSplashes: true }));
  expect(labels('.rlc-idm-skin')).toEqual(['Ahri', 'Ahri Arcade', 'Zed']);
  expect(labels('.rlc-idm-group')).toEqual(['Ahri', 'Zed']);
  await type('zed');
  expect(labels('.rlc-idm-skin')).toEqual(['Zed']);
});

test('cada clique chama a escrita certa e a prévia acompanha', async () => {
  await open();
  act(() => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Poro Rei"]')!.click());
  act(() => tab('Bordas').click());
  act(() => dialog()!.querySelector<HTMLButtonElement>('[aria-label="nível 50"]')!.click());
  act(() => tab('Títulos').click());
  act(() => inDialog('Meio Diferente').click());
  act(() => tab('Estandartes').click());
  act(() => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Padrão"]')!.click());
  act(() => inDialog('Bandeira · nível 2 · 2020').click());
  act(() => tab('Fundo').click());
  act(() => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Zed"]')!.click());
  await settle();
  expect(writes()).toEqual([
    ['PUT', '/lol-summoner/v1/current-summoner/icon', { profileIconId: 588 }],
    ['PUT', '/lol-regalia/v2/current-summoner/regalia', { preferredCrestType: 'prestige', preferredBannerType: 'lastSeasonHighestRank', selectedPrestigeCrest: 3 }],
    ['POST', '/lol-challenges/v1/update-player-preferences', { title: '40130404', bannerAccent: '4', challengeIds: [101] }],
    ['POST', '/lol-challenges/v1/update-player-preferences', { title: '40130404', bannerAccent: '1', challengeIds: [101] }],
    ['PUT', '/lol-banners/v1/current-summoner/flags/equipped', { itemId: 65, theme: 'CoPilot', level: 2, seasonId: 10, earnedDateIso8601: '2020-03-29T17:35:01Z' }],
    ['POST', '/lol-summoner/v1/current-summoner/summoner-profile', { key: 'backgroundSkinId', value: 238000 }],
  ]);
  expect(dialog()!.querySelector('.rlc-idm-preview .rlc-pf-title')!.textContent).toBe('Meio Diferente');
  act(() => inDialog('Pronto').click());
  expect(dialog()).toBeNull();
  expect(root.querySelector('.rlc-pf-title')!.textContent).toBe('Meio Diferente');
  expect(root.querySelector('.rlc-pf-icon')!.getAttribute('src')).toContain('/588.jpg');
});

test('Restaurar padrão: título vazio, borda máxima do nível, fundo do campeão de maior maestria; desligado em Ícones', async () => {
  await open();
  expect(inDialog('Restaurar padrão').disabled).toBe(true);
  act(() => tab('Títulos').click());
  act(() => inDialog('Restaurar padrão').click());
  act(() => tab('Bordas').click());
  act(() => inDialog('Restaurar padrão').click());
  act(() => tab('Fundo').click());
  act(() => inDialog('Restaurar padrão').click());
  await settle();
  await settle();
  expect(writes()).toEqual([
    ['POST', '/lol-challenges/v1/update-player-preferences', { title: '', bannerAccent: '4', challengeIds: [101] }],
    ['PUT', '/lol-regalia/v2/current-summoner/regalia', { preferredCrestType: 'prestige', preferredBannerType: 'lastSeasonHighestRank', selectedPrestigeCrest: 5 }],
    ['POST', '/lol-summoner/v1/current-summoner/summoner-profile', { key: 'backgroundSkinId', value: 238000 }],
  ]);
});

test('escrita recusada volta a prévia', async () => {
  await open();
  fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ message: 'não' }), { status: 400 }));
  act(() => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Poro Rei"]')!.click());
  await settle();
  expect(dialog()!.querySelector('[aria-label="Raio Azul"]')!.getAttribute('aria-pressed')).toBe('true');
});

test('bordas de prestígio por nível', () => {
  expect([1, 29, 30, 50, 74, 75, 100, 499, 500, 719].map(prestigeTheme)).toEqual([1, 1, 2, 3, 3, 4, 5, 20, 21, 21]);
  expect([1, 2, 3, 4, 21].map(prestigeLevel)).toEqual([1, 30, 50, 75, 500]);
});

test('clicar no ícone ou na borda da vitrine abre a janela na aba deles; perfil alheio não tem botão', async () => {
  const current = () => dialog()!.querySelector('.rlc-idm-panel [aria-current="page"]')!.textContent;
  const part = (label: string) => root.querySelector<HTMLButtonElement>(`.rlc-pf-showcase button[aria-label="${label}"]`)!;
  await mount();
  for (const [label, expected] of [['Trocar ícone', 'Ícones'], ['Trocar borda', 'Bordas']]) {
    act(() => part(label!).click());
    await settle();
    expect(current()).toBe(expected);
    act(() => inDialog('Pronto').click());
  }
  // Na prévia, as mesmas partes trocam a aba com a janela aberta.
  act(() => part('Trocar ícone').click());
  act(() => dialog()!.querySelector<HTMLButtonElement>('.rlc-idm-preview button[aria-label="Trocar estandarte"]')!.click());
  expect(current()).toBe('Estandartes');
  render(null, root);
  await mount('outro');
  expect(root.querySelector('.rlc-pf-showcase button[aria-label="Trocar ícone"]')).toBeNull();
  expect(root.querySelector('.rlc-pf-icon')!.getAttribute('src')).toContain('/29.jpg');
});
