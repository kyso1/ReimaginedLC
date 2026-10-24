import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { MythicShop, mythicTiles, type MarketStore } from './MythicShop';

let root: HTMLElement;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

// Formato real de `/lol-shoppefront/v1/stores/MYTHIC_SHOP` (patch 26.21), reduzido: o pacote Ekko + borda, um emote e um item com pré-requisito.
const SKIN = 'd620ae7b-cf87-496c-96c5-893c99dc2791';
const EMOTE = '5cee03fb-af16-4bc9-89f7-064b49e1233f';
const STORE_ID = 'cde098bb-e465-49fc-aecd-79e4effe387f';
const EKKO_ENTRY = 'b4fb9b29-bfba-4adb-b967-57b88ea7cfe3';
const STORE: MarketStore = {
  id: STORE_ID,
  name: 'MYTHIC_SHOPPE_FEATURED_25_13_EMOTE_V1',
  startTime: iso(Date.now() - DAY),
  endTime: iso(Date.now() + 10 * DAY),
  displayMetadata: { shoppefront: { id: 'MYTHIC_SHOP', categories: ['FEATURED'] } },
  catalogEntries: [
    {
      id: EKKO_ENTRY,
      endTime: iso(Date.now() + 10 * DAY),
      prerequisites: [],
      purchaseLimits: [],
      purchaseUnits: [
        { fulfillment: { itemId: 'i-ekko', itemTypeId: SKIN, name: 'Prestige True Damage Know My Name Ekko', ownedQuantity: 0, maxQuantity: 1, delta: 1 }, paymentOptions: [{ key: '0-Payment Option 0', payments: [{ name: 'lol_mythic_essence', finalDelta: 150 }] }] },
        { fulfillment: { itemId: 'i-border', itemTypeId: 'bb69c4a5-35a6-423c-a61a-a1eb4ca1aae7', name: 'prestige_true_damage_know_my_name_ekko_border_icon', ownedQuantity: 0, maxQuantity: 1, delta: 1 }, paymentOptions: [] },
      ],
    },
    { id: 'b383fc92-emote', purchaseLimits: [{ ruleId: 'rule-emote' }], purchaseUnits: [{ fulfillment: { itemId: 'i-emote', itemTypeId: EMOTE, name: 'Time For Triumph', ownedQuantity: 0, maxQuantity: 1, delta: 1 }, paymentOptions: [{ key: '0-lol_mythic_essence', payments: [{ name: 'lol_mythic_essence', finalDelta: 25 }] }] }] },
    { id: 'entry-pre', prerequisites: [{ catalogEntryId: 'x' }], purchaseUnits: [{ fulfillment: { itemId: 'i-pre', itemTypeId: SKIN, name: 'Chroma', delta: 1 }, paymentOptions: [{ key: 'k', payments: [{ name: 'lol_mythic_essence', finalDelta: 10 }] }] }] },
  ],
};
const EKKO = 'Ekko Dano Verdadeiro Prestígio';

function setup({ essence = 200, status = 'Success', post, velocity = {} }: { essence?: number; status?: string; post?: () => Promise<Response>; velocity?: Record<string, unknown> } = {}) {
  const data: Record<string, unknown> = {
    '/lol-shoppefront/v1/purchases/buy-1': { id: 'buy-1', status },
    '/lol-shoppefront/v1/stores/MYTHIC_SHOP': [STORE],
    '/lol-shoppefront/v1/velocity': velocity,
    '/lol-inventory/v1/wallet/0': { lol_mythic_essence: essence },
    '/lol-store/v1/itemKeysFromInstanceIds': { 'i-ekko': { inventoryType: 'CHAMPION_SKIN', itemId: 245030 }, 'i-emote': { inventoryType: 'EMOTE', itemId: 4500 } },
    '/lol-catalog/v1/items-list-details': [
      { assets: { tilePath: '/t/ekko.jpg' }, item: { itemId: 245030, inventoryType: 'CHAMPION_SKIN', itemInstanceId: 'i-ekko', name: EKKO } },
      { assets: { iconPath: '/i/emote.png' }, item: { itemId: 4500, inventoryType: 'EMOTE', itemInstanceId: 'i-emote', name: 'Hora do Triunfo' } },
    ],
  };
  const reads: string[] = [];
  const load = async <T,>(url: string) => {
    reads.push(url);
    const key = Object.keys(data).find((k) => url.startsWith(k));
    return (key ? data[key] : null) as T | null;
  };
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => (init?.method === 'POST' && url === '/lol-shoppefront/v1/bulk-purchases' ? (post ? post() : new Response('"buy-1"', { status: 200 })) : new Response('null', { status: 404 })));
  vi.stubGlobal('fetch', fetchMock);
  return { load, reads, posts: () => fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST') };
}
const offer = (name: string) => [...root.querySelectorAll('.rlc-lt-offer')].find((o) => o.querySelector('b')!.textContent === name)!;
const buyButton = () => offer(EKKO).querySelector<HTMLButtonElement>('.rlc-lt-buy')!;
const dialog = () => root.querySelector<HTMLElement>('[role="dialog"]');
const accept = () => act(() => dialog()!.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
async function mount(load: ReturnType<typeof setup>['load']) {
  act(() => render(<MythicShop load={load} />, root));
  for (let i = 0; i < 4; i++) await settle();
}

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

test('cada oferta guarda loja, entrada, forma de pagamento e tipo; com pré-requisito não compra aqui', () => {
  const [ekko, emote, pre] = mythicTiles([STORE]);
  expect(ekko).toMatchObject({ key: EKKO_ENTRY, storeId: STORE_ID, payKey: '0-Payment Option 0', quantity: 1, price: 150, kind: 'skin' });
  expect(emote).toMatchObject({ kind: 'emote', limitRule: 'rule-emote' });
  expect(pre!.payKey).toBeNull();
});

test('rotação pela categoria da entrada ou da loja; ato e patch vão para Destaque', () => {
  const store = (cat: string, per?: Record<string, { categories: string[] }>): MarketStore => ({ ...STORE, displayMetadata: { shoppefront: { id: 'MYTHIC_SHOP', categories: [cat], dataByCatalogEntry: per } } });
  expect(mythicTiles([store('WEEKLY')]).map((x) => x.rotation)).toEqual(['WEEKLY', 'WEEKLY', 'WEEKLY']);
  expect(mythicTiles([store('ACT', { [EKKO_ENTRY]: { categories: ['DAILY'] } })]).map((x) => x.rotation)).toEqual(['DAILY', 'FEATURED', 'FEATURED']);
});

test('lê a vitrine oficial (shoppefront), não o marketplace que guarda a rotação velha', async () => {
  const { load, reads } = setup();
  await mount(load);
  expect(reads).toContain('/lol-shoppefront/v1/stores/MYTHIC_SHOP');
  expect(reads.some((u) => u.includes('marketplace'))).toBe(false);
});

test('filtro por tipo dentro da rotação', async () => {
  const { load } = setup();
  await mount(load);
  const kinds = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-kinds button')];
  expect(kinds().map((b) => b.textContent)).toEqual(['Todos', 'Skins 2', 'Emotes 1']);
  act(() => kinds()[2]!.click());
  expect([...root.querySelectorAll('.rlc-lt-offer b')].map((b) => b.textContent)).toEqual(['Hora do Triunfo']);
});

test('comprar: confirmação com item, preço e saldo antes e depois; corpo igual ao do client oficial; saldo e itens relidos', async () => {
  const { load, reads, posts } = setup();
  await mount(load);
  expect(offer('Chroma').querySelector('.rlc-lt-buy')).toBeNull();
  act(() => buyButton().click());
  expect(dialog()!.textContent).toContain(`Comprar ${EKKO} por 150 de Essência Mítica? Seu saldo passa de 200 para 50.`);
  expect(posts()).toHaveLength(0);
  const before = reads.filter((u) => u.startsWith('/lol-inventory/v1/wallet/0')).length;
  accept();
  for (let i = 0; i < 6; i++) await settle();
  expect(posts()).toHaveLength(1);
  expect(posts()[0]![0]).toBe('/lol-shoppefront/v1/bulk-purchases');
  expect(JSON.parse(String(posts()[0]![1]!.body))).toEqual({
    purchaseItems: [{ catalogEntryId: EKKO_ENTRY, paymentOptions: ['0-Payment Option 0'], quantity: 1, storeId: STORE_ID }],
    purchaseTimeOut: 10000,
  });
  expect(reads).toContain('/lol-shoppefront/v1/purchases/buy-1');
  expect(root.querySelector('[role="status"]')!.textContent).toBe(`Comprado: ${EKKO}`);
  expect(reads.filter((u) => u.startsWith('/lol-inventory/v1/wallet/0')).length).toBeGreaterThan(before);
});

test('comprar: cancelar não compra; saldo insuficiente desliga o botão', async () => {
  const ok = setup();
  await mount(ok.load);
  act(() => buyButton().click());
  act(() => [...dialog()!.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Cancelar')!.click());
  expect(dialog()).toBeNull();
  expect(ok.posts()).toHaveLength(0);
  render(null, root);
  const poor = setup({ essence: 149 });
  await mount(poor.load);
  expect([buyButton().textContent, buyButton().disabled]).toEqual(['Essência insuficiente', true]);
});

test('comprar: sem duplo envio enquanto a compra corre', async () => {
  let release!: (r: Response) => void;
  const { load, posts } = setup({ post: () => new Promise<Response>((r) => (release = r)) });
  await mount(load);
  act(() => buyButton().click());
  accept();
  await settle();
  expect([buyButton().textContent, buyButton().disabled]).toEqual(['Comprando…', true]);
  act(() => buyButton().click());
  expect(dialog()).toBeNull();
  expect(posts()).toHaveLength(1);
  release(new Response('"buy-1"', { status: 200 }));
  for (let i = 0; i < 6; i++) await settle();
});

test('comprar: falha mostra erro legível e não repete', async () => {
  const { load, posts } = setup({ status: 'Failure' });
  await mount(load);
  act(() => buyButton().click());
  accept();
  for (let i = 0; i < 6; i++) await settle();
  expect(root.querySelector('p[role="alert"]')!.textContent).toBe('A compra não foi concluída. Confira o saldo de Essência Mítica antes de tentar de novo.');
  expect(offer(EKKO).querySelector('.rlc-lt-offer-error')!.textContent).toBe('A LCU recusou a compra deste item.');
  expect(posts()).toHaveLength(1);
});

test('erro da LCU (item já possuído, limite) aparece no cartão da oferta', async () => {
  const { load, posts } = setup({ post: async () => new Response(JSON.stringify({ httpStatus: 400, message: 'Item already owned' }), { status: 400 }) });
  await mount(load);
  act(() => buyButton().click());
  accept();
  for (let i = 0; i < 6; i++) await settle();
  expect(offer(EKKO).querySelector('.rlc-lt-offer-error')!.textContent).toBe('Item already owned');
  expect(posts()).toHaveLength(1);
});

test('limite de compra esgotado em /velocity: aviso no cartão, sem botão', async () => {
  const { load } = setup({ velocity: { 'rule-emote': { availableTokens: 0, refill: '' } } });
  await mount(load);
  expect(offer('Hora do Triunfo').querySelector('.rlc-lt-price')!.textContent).toBe('Limite de compra atingido');
  expect(offer('Hora do Triunfo').querySelector('.rlc-lt-buy')).toBeNull();
});
