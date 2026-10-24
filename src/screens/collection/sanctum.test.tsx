import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { MythicShop, mythicTiles, type MarketStore } from './MythicShop';
import { Sanctum, timeLeft } from './Sanctum';

let root: HTMLElement;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const DAY = 86_400_000;
const loader = (data: Record<string, unknown>) => async <T,>(url: string) => {
  const key = Object.keys(data).find((k) => url.startsWith(k));
  return (key ? data[key] : null) as T | null;
};

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

// Formato real de `/lol-sanctum/v1/banners` (patch 26.21), ids falsos.
const banner = (id: string, skinId: number, over: Record<string, unknown> = {}) => ({
  id,
  bannerBackgroundTexture: `/art/${id}.jpg`,
  bannerSkin: { id: skinId, name: `DariusSkin${skinId}`, rarity: 'kMythic' },
  chasePityThreshold: 40,
  pityCounter: { active: true, amount: 12 },
  startDate: Math.floor((Date.now() - DAY) / 1000),
  endDate: Math.floor((Date.now() + 3 * DAY + 3_700_000) / 1000),
  ...over,
});
const skinDetail = (itemId: number, name: string) => ({ assets: { splashPath: `/s/${itemId}.jpg` }, item: { itemId, inventoryType: 'CHAMPION_SKIN', name } });

test('tempo restante em dias, horas ou minutos', () => {
  expect(timeLeft(1000 + 3 * DAY + 3_700_000, 1000)).toBe('3 d 1 h');
  expect(timeLeft(1000 + 5_400_000, 1000)).toBe('1 h 30 min');
  expect(timeLeft(1000 + 600_000, 1000)).toBe('10 min');
  expect(timeLeft(0, 1000)).toBeNull();
});

test('Santuário: faixa escolhida com nome do catálogo, prazo, garantia e saldos; sem nome técnico', async () => {
  const load = loader({
    '/lol-sanctum/v1/banners/selected/id': 'b2',
    '/lol-sanctum/v1/banners': [banner('b1', 122064), banner('b2', 86044, { pityCounter: { active: true, amount: 39 } })],
    '/lol-inventory/v1/wallet/0': { lol_mythic_essence: 102, lol_blessing_token: 7 },
    '/lol-catalog/v1/items-list-details': [skinDetail(122064, 'Darius Deus-Rei'), skinDetail(86044, 'Garen Mítico')],
  });
  act(() => render(<Sanctum load={load} />, root));
  await settle();
  await settle();
  expect(root.querySelector('.rlc-lt-hero h2')!.textContent).toBe('Garen Mítico');
  expect(root.querySelector('.rlc-lt-timer')!.textContent).toMatch(/^Termina em 3 d [01] h$/);
  expect(root.querySelector('.rlc-lt-pity')!.textContent).toBe('Mítico garantido na próxima invocação');
  expect(root.querySelector('.rlc-lt-wallet')!.textContent).toContain('102Essência Mítica');
  expect(root.querySelector('.rlc-lt-wallet')!.textContent).toContain('7Centelhas Ancestrais');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-lt-banners button[aria-label="Darius Deus-Rei"]')!.click());
  expect(root.querySelector('.rlc-lt-pity')!.textContent).toBe('Mítico garantido em 28 invocações');
  expect(root.textContent).not.toMatch(/DariusSkin|kMythic/);
});

test('Santuário vazio: sem faixas ativas (ou falha da LCU) mostra o aviso', async () => {
  act(() => render(<Sanctum load={loader({ '/lol-sanctum/v1/banners': [banner('old', 1, { endDate: 100 })] })} />, root));
  await settle();
  expect(root.textContent).toContain('Nenhum santuário ativo agora.');
  render(null, root);
  act(() => render(<Sanctum load={loader({})} />, root));
  await settle();
  expect(root.textContent).toContain('Nenhum santuário ativo agora.');
});

// Formato real de `/lol-shoppefront/v1/stores/MYTHIC_SHOP` (patch 26.21), reduzido.
const entry = (id: string, instance: string, price: number, owned = 0) => ({
  id,
  purchaseUnits: [{ fulfillment: { itemId: instance, name: `EN ${instance}`, ownedQuantity: owned, maxQuantity: 1 }, paymentOptions: [{ key: '0-lol_mythic_essence', payments: [{ name: 'lol_mythic_essence', finalDelta: price }] }] }],
});
const iso = (ms: number) => new Date(ms).toISOString();
const STORES: MarketStore[] = [
  { id: 's1', name: 'MYTHIC_SHOPPE_FEATURED_X', startTime: iso(Date.now() - DAY), endTime: iso(Date.now() + 10 * DAY), displayMetadata: {}, catalogEntries: [entry('e1', 'i-skin', 150), entry('e2', 'i-icon', 5, 1)] },
  { id: 's2', name: 'MYTHIC_SHOPPE_DAILY_ROTATION_V4', startTime: iso(Date.now() - DAY), endTime: iso(Date.now() + 2 * 3_600_000), displayMetadata: { shoppefront: { id: 'MYTHIC_SHOP', categories: ['DAILY'] } }, catalogEntries: [entry('e3', 'i-ward', 10)] },
  { id: 's3', name: 'MYTHIC_SHOPPE_WEEKLY_ROTATION_V5', startTime: iso(Date.now() - 9 * DAY), endTime: iso(Date.now() - DAY), displayMetadata: { shoppefront: { id: 'MYTHIC_SHOP', categories: ['WEEKLY'] } }, catalogEntries: [entry('e4', 'i-old', 10)] },
  { id: 's4', name: 'CLASSIC_PASS_2_TIER_1', catalogEntries: [entry('e5', 'i-pass', 1)] },
];

test('Loja Mítica: só vitrines míticas ativas, por rotação, com preço em Essência Mítica', () => {
  const tiles = mythicTiles(STORES);
  expect(tiles.map((x) => [x.rotation, x.instanceId, x.price, x.owned])).toEqual([
    ['FEATURED', 'i-skin', 150, false],
    ['FEATURED', 'i-icon', 5, true],
    ['DAILY', 'i-ward', 10, false],
  ]);
});

test('Loja Mítica: abas, nome e arte do catálogo, prazo, preço e possuído', async () => {
  const load = loader({
    '/lol-shoppefront/v1/stores/MYTHIC_SHOP': STORES,
    '/lol-inventory/v1/wallet/0': { lol_mythic_essence: 102 },
    '/lol-store/v1/itemKeysFromInstanceIds': { 'i-skin': { inventoryType: 'CHAMPION_SKIN', itemId: 235009 }, 'i-icon': { inventoryType: 'SUMMONER_ICON', itemId: 3351 }, 'i-ward': { inventoryType: 'WARD_SKIN', itemId: 9 } },
    '/lol-catalog/v1/items-list-details': [
      { assets: { tilePath: '/t/senna.jpg' }, item: { itemId: 235009, inventoryType: 'CHAMPION_SKIN', itemInstanceId: 'i-skin', name: 'Senna Dano Verdadeiro Prestígio' } },
      { assets: { iconPath: '/i/3351.jpg' }, item: { itemId: 3351, inventoryType: 'SUMMONER_ICON', itemInstanceId: 'i-icon', name: 'Ícone Sona Dourada' } },
    ],
  });
  act(() => render(<MythicShop load={load} />, root));
  for (let i = 0; i < 4; i++) await settle();
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-subtabs button')];
  expect(tabs.map((b) => b.textContent)).toEqual(['Destaque 2', 'Quinzenal 0', 'Semanal 0', 'Diária 1']);
  const offers = [...root.querySelectorAll('.rlc-lt-offer')];
  expect(offers.map((o) => o.querySelector('b')!.textContent)).toEqual(['Senna Dano Verdadeiro Prestígio', 'Ícone Sona Dourada']);
  expect(offers[0]!.querySelector('.rlc-lt-price')!.textContent).toBe('150 EM');
  expect(offers[1]!.querySelector('.rlc-lt-price')!.textContent).toBe('Possuído');
  expect(offers[0]!.querySelector('small')!.textContent).toMatch(/^Termina em \d+ d/);
  expect((offers[1]!.querySelector('.rlc-lt-offer-art') as HTMLElement).style.backgroundImage).toContain('/i/3351.jpg');
  expect(root.querySelector('.rlc-lt-wallet')!.textContent).toContain('102');
  // Saldo 102 não paga 150: comprar desligado; possuído não tem botão.
  const buy = offers[0]!.querySelector<HTMLButtonElement>('.rlc-lt-buy')!;
  expect([buy.textContent, buy.disabled]).toEqual(['Essência insuficiente', true]);
  expect(offers[1]!.querySelector('.rlc-lt-buy')).toBeNull();
  act(() => tabs[2]!.click());
  expect(root.querySelector('.rlc-lt-empty')!.textContent).toBe('Nada nesta rotação agora.');
});

test('Loja Mítica com a LCU fora: estado vazio, sem erro', async () => {
  act(() => render(<MythicShop load={loader({})} />, root));
  await settle();
  expect(root.querySelector('.rlc-lt-empty')!.textContent).toBe('Nada nesta rotação agora.');
});

// Invocação: POST de compra devolve o id; o resultado sai em `/purchases/{id}` e os nós viram prêmios pelas chances da faixa.
const ME = '8ce03930-7079-5e3f-a49b-d4721b00dbb3';
const ODDS = {
  bannerId: 'b1',
  nodeIdToDropDetailsMap: {
    n1: { nodeId: 'n1', itemInstanceId: 'inst-skin', quantity: 1, type: 'ENTITLEMENT', isChaseItem: true },
    n2: { nodeId: 'n2', itemInstanceId: ME, quantity: 130, type: 'CURRENCY' },
  },
};
function rollSetup({ sparks = 12, status = 'Success', post }: { sparks?: number; status?: string; post?: () => Promise<Response> } = {}) {
  const load = loader({
    '/lol-sanctum/v1/banners/b1/odds': ODDS,
    '/lol-sanctum/v1/purchases/p1': { id: 'p1', status, rollResultNodeIds: ['n1', 'n2'] },
    '/lol-sanctum/v1/banners/selected/id': 'b1',
    '/lol-sanctum/v1/banners': [banner('b1', 122064)],
    '/lol-inventory/v1/wallet/0': { lol_mythic_essence: 102, lol_blessing_token: sparks },
    '/lol-store/v1/itemKeysFromInstanceIds': { 'inst-skin': { inventoryType: 'CHAMPION_SKIN', itemId: 122064 } },
    '/lol-catalog/v1/items-list-details': [skinDetail(122064, 'Darius Deus-Rei')],
  });
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => (init?.method === 'POST' && url === '/lol-sanctum/v1/purchase/roll' ? (post ? post() : new Response('"p1"', { status: 200 })) : new Response('null', { status: 404 })));
  vi.stubGlobal('fetch', fetchMock);
  return { load, posts: () => fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST') };
}
const rollButton = (n: number) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-roll')][n === 1 ? 0 : 1]!;
const lastDialog = () => [...root.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1)!;
async function mountSanctum(load: ReturnType<typeof loader>) {
  act(() => render(<Sanctum load={load} />, root));
  for (let i = 0; i < 4; i++) await settle();
}

test('invocar x10: botões com custo, confirmação com custo e saldo, POST da compra e revelação do resultado', async () => {
  const { load, posts } = rollSetup();
  await mountSanctum(load);
  expect(rollButton(1).textContent).toBe('Invocar ×11 Centelha Ancestral');
  expect(rollButton(10).textContent).toBe('Invocar ×1010 Centelhas Ancestrais');
  act(() => rollButton(10).click());
  expect(lastDialog().textContent).toContain('Invocar ×10 em Darius Deus-Rei? Custa 10 Centelhas Ancestrais. Seu saldo passa de 12 para 2.');
  expect(posts()).toHaveLength(0);
  act(() => lastDialog().querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  for (let i = 0; i < 6; i++) await settle();
  expect(posts()).toHaveLength(1);
  expect(posts()[0]![0]).toBe('/lol-sanctum/v1/purchase/roll');
  expect(JSON.parse(String(posts()[0]![1]!.body))).toEqual({ quantity: 10, bannerId: 'b1' });
  const cards = [...root.querySelectorAll('.rlc-lt-reveal-card')];
  expect(cards.map((c) => c.textContent)).toEqual(['Darius Deus-Rei', '130 Essência Mítica']);
  expect(cards[0]!.getAttribute('data-chase')).toBe('true');
});

test('invocar: cancelar não compra; saldo insuficiente desliga só o que não dá', async () => {
  const { load, posts } = rollSetup({ sparks: 5 });
  await mountSanctum(load);
  expect(rollButton(1).disabled).toBe(false);
  expect(rollButton(10).disabled).toBe(true);
  expect(rollButton(10).title).toBe('Centelhas Ancestrais insuficientes');
  act(() => rollButton(1).click());
  act(() => [...lastDialog().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Cancelar')!.click());
  await settle();
  expect(root.querySelector('[role="dialog"]')).toBeNull();
  expect(posts()).toHaveLength(0);
});

test('invocar: botões travados enquanto a compra corre (sem duplo envio)', async () => {
  let release!: (r: Response) => void;
  const { load, posts } = rollSetup({ post: () => new Promise<Response>((r) => (release = r)) });
  await mountSanctum(load);
  act(() => rollButton(1).click());
  act(() => lastDialog().querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  await settle();
  expect([rollButton(1).disabled, rollButton(10).disabled]).toEqual([true, true]);
  expect(rollButton(1).textContent).toContain('Invocando…');
  act(() => rollButton(1).click());
  expect(root.querySelector('[role="dialog"]')).toBeNull();
  expect(posts()).toHaveLength(1);
  release(new Response('"p1"', { status: 200 }));
  for (let i = 0; i < 6; i++) await settle();
});

test('invocar: falha da compra mostra o erro e não tenta de novo', async () => {
  const { load, posts } = rollSetup({ status: 'Failure' });
  await mountSanctum(load);
  act(() => rollButton(1).click());
  act(() => lastDialog().querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  for (let i = 0; i < 6; i++) await settle();
  expect(root.querySelector('[role="alert"]')!.textContent).toBe('A invocação não foi concluída. Confira o saldo de Centelhas antes de tentar de novo.');
  expect(root.querySelector('.rlc-lt-reveal')).toBeNull();
  expect(posts()).toHaveLength(1);
});

test('invocar: sem as chances da faixa os botões ficam desligados', async () => {
  const { posts } = rollSetup();
  await mountSanctum(loader({ '/lol-sanctum/v1/banners/b1/odds': null, '/lol-sanctum/v1/banners': [banner('b1', 1)], '/lol-inventory/v1/wallet/0': { lol_blessing_token: 50 } }));
  expect([rollButton(1).disabled, rollButton(10).disabled]).toEqual([true, true]);
  expect(posts()).toHaveLength(0);
});

// Centelhas com RP. Formato real de `/lol-sanctum/v1/banners/{id}/token-catalog-entry` e `/lol-sanctum/v1/velocity-limits` (patch 26.21), reduzido.
const TOKEN_ENTRY = {
  id: '78caa2ef-c43c-4f53-817a-8a6384bee252',
  name: 'Purchase Ancient Spark with RP',
  purchaseLimits: [{ delta: 1, remaining: 250, ruleId: '7ab7ccfb-f2ab-491b-bb9b-525cef022a73' }],
  purchaseUnits: [{ fulfillment: { delta: 1, name: 'lol_blessing_token' }, paymentOptions: [{ key: '0-RP', payments: [{ currencyId: 'ee2b5bcb-83f0-5d53-a430-b7ef41c4f90f', finalDelta: 400, name: 'RP' }] }] }],
};
function sparkSetup({ rp = 4500, left = 250, status = 'Success', post }: { rp?: number; left?: number; status?: string; post?: () => Promise<Response> } = {}) {
  const reads: string[] = [];
  const base = loader({
    '/lol-sanctum/v1/banners/b1/token-catalog-entry': TOKEN_ENTRY,
    '/lol-sanctum/v1/banners/b1/odds': ODDS,
    '/lol-sanctum/v1/velocity-limits': { '7ab7ccfb-f2ab-491b-bb9b-525cef022a73': { availableTokens: left, refill: '' }, 'outra-regra': { availableTokens: 1, refill: '' } },
    '/lol-sanctum/v1/purchases/t1': { id: 't1', status },
    '/lol-sanctum/v1/banners/selected/id': 'b1',
    '/lol-sanctum/v1/banners': [banner('b1', 122064)],
    '/lol-inventory/v1/wallet/0': { RP: rp, lol_mythic_essence: 102, lol_blessing_token: 0 },
    '/lol-catalog/v1/items-list-details': [skinDetail(122064, 'Darius Deus-Rei')],
  });
  const load = async <T,>(url: string) => (reads.push(url), base<T>(url));
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => (init?.method === 'POST' && url === '/lol-sanctum/v1/purchase/token' ? (post ? post() : new Response('"t1"', { status: 200 })) : new Response('null', { status: 404 })));
  vi.stubGlobal('fetch', fetchMock);
  return { load, reads, posts: () => fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST') };
}
const sparkButton = () => root.querySelector<HTMLButtonElement>('.rlc-lt-sparkbuy')!;
const packs = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-pack')];

test('Centelhas: pacotes com preço em RP e saldo; confirmação com custo e saldo antes/depois; corpo do client oficial; saldo relido', async () => {
  const { load, reads, posts } = sparkSetup();
  await mountSanctum(load);
  act(() => sparkButton().click());
  expect(lastDialog().querySelector('.rlc-lt-packs-info')!.textContent).toBe('Seu saldo: 4.500 RPVocê ainda pode comprar 250');
  expect(packs().map((b) => [b.textContent, b.disabled])).toEqual([
    ['1 Centelha Ancestral400', false],
    ['5 Centelhas Ancestrais2.000', false],
    ['10 Centelhas Ancestrais4.000', false],
    ['20 Centelhas Ancestrais8.000', true],
    ['50 Centelhas Ancestrais20.000', true],
  ]);
  act(() => packs()[2]!.click());
  expect(lastDialog().textContent).toContain('Comprar 10 Centelhas Ancestrais por 4.000 RP? Seu saldo de RP passa de 4.500 para 500.');
  expect(posts()).toHaveLength(0);
  const before = reads.filter((u) => u === '/lol-inventory/v1/wallet/0').length;
  act(() => lastDialog().querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  for (let i = 0; i < 6; i++) await settle();
  expect(posts()).toHaveLength(1);
  expect(posts()[0]![0]).toBe('/lol-sanctum/v1/purchase/token');
  expect(JSON.parse(String(posts()[0]![1]!.body))).toEqual({ quantity: 10, bannerId: 'b1' });
  expect(reads).toContain('/lol-sanctum/v1/purchases/t1');
  expect(root.querySelector('[role="status"]')!.textContent).toBe('Compradas: 10 Centelhas Ancestrais');
  expect(reads.filter((u) => u === '/lol-inventory/v1/wallet/0').length).toBeGreaterThan(before);
});

test('Centelhas: RP insuficiente desliga os pacotes; limite corta os maiores; limite zerado desliga o atalho', async () => {
  const poor = sparkSetup({ rp: 63, left: 7 });
  await mountSanctum(poor.load);
  act(() => sparkButton().click());
  expect(packs().map((b) => [b.querySelector('span')!.textContent, b.disabled, b.title])).toEqual([
    ['1 Centelha Ancestral', true, 'RP insuficiente'],
    ['5 Centelhas Ancestrais', true, 'RP insuficiente'],
  ]);
  expect(lastDialog().querySelector('.rlc-lt-error')!.textContent).toBe('RP insuficiente');
  act(() => [...lastDialog().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Cancelar')!.click());
  expect(root.querySelector('[role="dialog"]')).toBeNull();
  expect(poor.posts()).toHaveLength(0);
  render(null, root);
  const capped = sparkSetup({ left: 0 });
  await mountSanctum(capped.load);
  expect([sparkButton().disabled, sparkButton().title]).toEqual([true, 'Limite de compra de Centelhas atingido']);
});

test('Centelhas: sem duplo envio enquanto a compra corre; falha mostra erro e não repete', async () => {
  let release!: (r: Response) => void;
  const { load, posts } = sparkSetup({ status: 'Failure', post: () => new Promise<Response>((r) => (release = r)) });
  await mountSanctum(load);
  act(() => sparkButton().click());
  act(() => packs()[0]!.click());
  act(() => lastDialog().querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  await settle();
  expect([sparkButton().disabled, sparkButton().textContent]).toEqual([true, 'Comprando…']);
  expect(rollButton(1).disabled).toBe(true);
  act(() => sparkButton().click());
  expect(root.querySelector('[role="dialog"]')).toBeNull();
  release(new Response('"t1"', { status: 200 }));
  for (let i = 0; i < 6; i++) await settle();
  expect(root.querySelector('p[role="alert"]')!.textContent).toBe('A compra de Centelhas não foi concluída. Confira o saldo de RP antes de tentar de novo.');
  expect(posts()).toHaveLength(1);
});
