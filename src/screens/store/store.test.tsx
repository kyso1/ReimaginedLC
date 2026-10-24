import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu, ready } from '../../test/fixtures';
import { applyFilters, buildCatalog, discount, NO_FILTERS, type CatalogItem } from './data';
import { openRiotPurchase, openRiotRpPurchase, setPawApi, setSharedComponentsApi } from './purchase';
import { Store } from './Store';

let root: HTMLElement;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const flush = async () => {
  for (let i = 0; i < 4; i++) await settle();
};
const tabs = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].map((b) => b.textContent);
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text)!;
const check = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-sto-ck')].find((b) => b.textContent === text)!;
const grid = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-sto-grid .rlc-sto-tile')];
const names = () => grid().map((c) => c.getAttribute('aria-label'));

const rp = (cost: number) => [{ cost, currency: 'RP' }];
const champs: CatalogItem[] = [
  { itemId: 103, inventoryType: 'CHAMPION', name: 'Ahri', owned: true, prices: [{ cost: 3150, currency: 'IP' }, { cost: 790, currency: 'RP' }], releaseDate: 1300000000 },
  { itemId: 266, inventoryType: 'CHAMPION', name: 'Aatrox', owned: false, prices: rp(880), releaseDate: 1370000000 },
];
const skinItems: CatalogItem[] = [
  { itemId: 103015, inventoryType: 'CHAMPION_SKIN', name: 'Ahri do Arcade', owned: false, prices: rp(1350), releaseDate: 1700000000 },
  { itemId: 103027, inventoryType: 'CHAMPION_SKIN', name: 'Ahri K/DA', owned: true, prices: rp(1350), releaseDate: 1600000000 },
  { itemId: 266001, inventoryType: 'CHAMPION_SKIN', name: 'Aatrox Justiceiro', owned: false, prices: rp(520), releaseDate: 1500000000 },
  { itemId: 103016, inventoryType: 'CHAMPION_SKIN', subInventoryType: 'RECOLOR', name: 'Ahri do Arcade (Rubi)', owned: false, prices: rp(290), imagePath: '/c/103016.png', releaseDate: 1700000001 },
  { itemId: 103099, inventoryType: 'CHAMPION_SKIN', name: 'Ahri Fora de Venda', owned: false, prices: [], releaseDate: 1800000000 },
];
const skinsJson = {
  '103000': { id: 103000, loadScreenPath: '/l/103000.jpg', splashPath: '/s/103000.jpg' },
  '103015': { id: 103015, rarity: 'kEpic', loadScreenPath: '/l/103015.jpg', splashPath: '/s/103015.jpg', description: 'Fliperama.', chromas: [{ id: 103016 }] },
  '103027': { id: 103027, rarity: 'kLegendary', loadScreenPath: '/l/103027.jpg', splashPath: '/s/103027.jpg' },
  '266001': { id: 266001, rarity: 'kNoRarity', loadScreenPath: '/l/266001.jpg', splashPath: '/s/266001.jpg' },
  '238015': { id: 238015, name: 'Zed PsyOps', rarity: 'kEpic', splashPath: '/s/238015.jpg' },
};
const sales = [{ item: { inventoryType: 'CHAMPION_SKIN', itemId: 103015 }, sale: { endDate: '2026-10-26T17:00:00.000+00:00', prices: [{ cost: 675, currency: 'RP', discount: 0 }] } }];
const featured = {
  carousel: { banners: [{ id: 1, imgUrl: '//cdn/b1.jpg', items: [{ inventoryType: 'CHAMPION_SKIN', itemId: 103015 }] }, { id: 2, imgUrl: '//cdn/b2.jpg' }] },
  catalog: [{ itemId: 999, inventoryType: 'BUNDLES', subInventoryType: 'CHROMA_BUNDLE', name: 'Pacote de Cromas', rp: 1000, fullPrice: 1450, iconUrl: 'https://cdn/999.png' }],
};
const offers = [
  { id: 'o1', skinId: 238015, skinName: ' PsyOps Zed', championId: 238, originalPrice: 1350, discountPrice: 540, owned: false, revealed: true, expirationDate: '2026-11-10T17:00:00.000+00:00' },
  { id: 'o2', skinId: 120004, skinName: 'Arcade Hecarim', championId: 120, originalPrice: 1350, discountPrice: 540, owned: false, revealed: false, expirationDate: '2026-11-10T17:00:00.000+00:00' },
];

let routes: Record<string, unknown>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  routes = {
    '/lol-catalog/v1/items/CHAMPION': champs,
    '/lol-catalog/v1/items/CHAMPION_SKIN': skinItems,
    '/lol-catalog/v1/items/SUMMONER_ICON': [{ itemId: 29, inventoryType: 'SUMMONER_ICON', name: 'Ícone de Teste', prices: rp(250), imagePath: '/i/29.png' }],
    '/lol-game-data/assets/v1/skins.json': skinsJson,
    '/lol-store/v1/catalog/sales': sales,
    '/lol-store/v1/featured': featured,
    '/lol-yourshop/v1/status': { hubEnabled: true },
    '/lol-yourshop/v1/offers': offers,
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url in routes ? new Response(JSON.stringify(routes[url]), { status: 200 }) : new Response(null, { status: 404 }))));
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  setPawApi(null);
  setSharedComponentsApi(null);
});

async function mount(purchase = vi.fn((_item: unknown): 'dialog' | 'store' => 'dialog'), buyRp = vi.fn(async (): Promise<'dialog' | 'store'> => 'dialog')) {
  act(() => render(<Store lcu={fakeLcu()} purchase={purchase} buyRp={buyRp} />, root));
  await flush();
  return purchase;
}

test('desconto: % inteiro arredondado, 0 sem preço cheio maior', () => {
  expect(discount(675, 1350)).toBe(50);
  expect(discount(540, 1820)).toBe(70);
  expect(discount(1350, 1350)).toBe(0);
  expect(discount(1350, null)).toBe(0);
  expect(discount(null, 1350)).toBe(0);
});

test('catálogo: junta promoção, raridade e arte; croma e item sem preço', () => {
  const items = buildCatalog([champs, skinItems], skinsJson, sales);
  const arcade = items.find((i) => i.itemId === 103015)!;
  expect(arcade).toMatchObject({ kind: 'skin', rp: 675, rpFull: 1350, rarity: 'epic', portrait: '/l/103015.jpg', championId: 103, release: 1700000000000 });
  expect(items.find((i) => i.itemId === 103016)).toMatchObject({ kind: 'chroma', splash: '/s/103015.jpg', portrait: '/c/103016.png', contain: true });
  expect(items.find((i) => i.itemId === 103)).toMatchObject({ rp: 790, be: 3150, portrait: '/l/103000.jpg' });
  expect(items.some((i) => i.itemId === 103099)).toBe(false);
  const by = (f: Partial<typeof NO_FILTERS>) => applyFilters(items, { ...NO_FILTERS, kinds: ['skin'], ...f }, new Set([103]), new Map([[103, 'Ahri'], [266, 'Aatrox']])).map((i) => i.name);
  expect(by({ sort: 'priceAsc' })).toEqual(['Aatrox Justiceiro', 'Ahri do Arcade', 'Ahri K/DA']);
  expect(by({ q: 'aatrox' })).toEqual(['Aatrox Justiceiro']);
  expect(by({ champOwned: true, notOwned: true })).toEqual(['Ahri do Arcade']);
});

test('abas, carteira e Sua Loja só quando ligada', async () => {
  await mount();
  expect(tabs()).toEqual(['Destaques', 'Campeões', 'Skins', 'Acessórios', 'Espólios', 'Sua Loja']);
  render(null, root);
  routes['/lol-yourshop/v1/status'] = { hubEnabled: false };
  await mount();
  expect(tabs()).not.toContain('Sua Loja');
});

test('destaques: banner com a arte da Riot e prateleiras de promoção, novidades e pacotes', async () => {
  await mount();
  // Banner na Crossfade (fusão entre banners), com nome e preço do item por cima da arte.
  expect(root.querySelector<HTMLElement>('.rlc-sto-hero .rlc-xfade .rlc-xfade-layer')!.style.backgroundImage).toContain('https://cdn/b1.jpg');
  expect(root.querySelector('.rlc-sto-hero-cap h2')!.textContent).toBe('Ahri do Arcade');
  expect(root.querySelector('.rlc-sto-hero-cap .rlc-sto-price')!.textContent).toBe('6751.350');
  const shelves = [...root.querySelectorAll('.rlc-sto-shelf')].map((s) => [s.querySelector('h3')!.textContent, [...s.querySelectorAll('.rlc-sto-tile')].map((t) => t.getAttribute('aria-label'))]);
  expect(shelves).toEqual([
    ['Em promoção', ['Ahri do Arcade', 'Pacote de Cromas']],
    ['Novidades', ['Ahri do Arcade', 'Ahri K/DA', 'Aatrox Justiceiro', 'Aatrox', 'Ahri']],
    ['Pacotes', ['Pacote de Cromas']],
  ]);
  const sale = root.querySelector('.rlc-sto-shelf .rlc-sto-tile')!;
  expect(sale.querySelector('.rlc-sto-off')!.textContent).toBe('-50%');
  expect(sale.querySelector('s')!.textContent).toBe('1.350');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-hero-go')!.click());
  expect(root.querySelector('.rlc-sto-drawer h2')!.textContent).toBe('Ahri do Arcade');
});

test('skins: tipo, raridade, faixa de preço, busca, ordenação e selo Possui', async () => {
  await mount();
  act(() => tab('Skins').click());
  expect(names()).toEqual(['Ahri do Arcade', 'Ahri K/DA', 'Aatrox Justiceiro']);
  const owned = grid().find((c) => c.getAttribute('aria-label') === 'Ahri K/DA')!;
  expect(owned.querySelector('.rlc-sto-own')!.textContent).toBe('Possui');
  expect(owned.querySelector('.rlc-sto-price')!.textContent).toBe('Possui');
  act(() => check('Croma').click());
  expect(names()).toContain('Ahri do Arcade (Rubi)');
  act(() => check('Croma').click());
  act(() => check('Épica').click());
  expect(names()).toEqual(['Ahri do Arcade']);
  act(() => check('Épica').click());
  act(() => check('Até 520').click());
  expect(names()).toEqual(['Aatrox Justiceiro']);
  act(() => check('Até 520').click());
  act(() => check('Só em promoção').click());
  expect(names()).toEqual(['Ahri do Arcade']);
  act(() => check('Só em promoção').click());
  act(() => check('Campeão que tenho').click());
  act(() => check('Não possuo').click());
  expect(names()).toEqual(['Ahri do Arcade']);
  act(() => check('Campeão que tenho').click());
  act(() => check('Não possuo').click());
  const sort = root.querySelector<HTMLSelectElement>('.rlc-sto-sort')!;
  act(() => {
    sort.value = 'name';
    sort.dispatchEvent(new Event('change'));
  });
  expect(names()).toEqual(['Aatrox Justiceiro', 'Ahri do Arcade', 'Ahri K/DA']);
  const search = root.querySelector<HTMLInputElement>('.rlc-sto-search')!;
  act(() => {
    search.value = 'kda';
    search.dispatchEvent(new Event('input'));
  });
  expect(names()).toEqual([]);
  act(() => {
    search.value = 'k/da';
    search.dispatchEvent(new Event('input'));
  });
  expect(names()).toEqual(['Ahri K/DA']);
});

test('campeões mostram RP e Essência Azul; acessórios trazem ícones', async () => {
  await mount();
  act(() => tab('Campeões').click());
  expect(names()).toEqual(['Aatrox', 'Ahri']);
  act(() => tab('Acessórios').click());
  expect(names()).toEqual(['Ícone de Teste']);
});

test('gaveta: Comprar chama openRiotPurchase com o item; item que possui não compra', async () => {
  const purchase = await mount();
  act(() => tab('Skins').click());
  act(() => grid()[0]!.click());
  const drawer = root.querySelector('.rlc-sto-drawer')!;
  expect(drawer.querySelector('h2')!.textContent).toBe('Ahri do Arcade');
  expect(drawer.querySelector('small')!.textContent).toBe('Skin · Épica · Ahri');
  expect(drawer.querySelector('.rlc-sto-desc')!.textContent).toBe('Fliperama.');
  expect(root.querySelector<HTMLElement>('.rlc-sto-sp .rlc-xfade-layer')!.style.backgroundImage).toContain('/s/103015.jpg');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-cta')!.click());
  expect(purchase).toHaveBeenCalledWith(expect.objectContaining({ itemId: 103015, inventoryType: 'CHAMPION_SKIN' }));
  expect(root.querySelector('.rlc-sto-riot')).toBeNull();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-x')!.click());
  expect(root.querySelector('.rlc-sto-drawer')).toBeNull();
  act(() => grid()[1]!.click());
  expect(root.querySelector('.rlc-sto-drawer .rlc-sto-big')!.textContent).toBe('Você já possui');
  expect(root.querySelector<HTMLButtonElement>('.rlc-sto-cta')!.disabled).toBe(true);
});

test('sem janela da Riot, Comprar e Presentear mostram a página da loja da Riot, e Voltar retorna', async () => {
  await mount(vi.fn((): 'dialog' | 'store' => 'store'));
  act(() => tab('Skins').click());
  act(() => grid()[0]!.click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-cta')!.click());
  expect(root.querySelector('.rlc-sto-riot')).not.toBeNull();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-back')!.click());
  expect(root.querySelector('.rlc-sto-riot')).toBeNull();
  act(() => grid()[0]!.click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-gift')!.click());
  expect(root.querySelector('.rlc-sto-riot')).not.toBeNull();
});

test('Sua Loja: oferta revelada com desconto e validade; oculta não mostra o item', async () => {
  const purchase = await mount();
  act(() => tab('Sua Loja').click());
  const cards = [...root.querySelectorAll('.rlc-sto-offer')];
  expect(cards[0]!.getAttribute('aria-label')).toBe('Zed PsyOps');
  expect(cards[0]!.querySelector('.rlc-sto-off')!.textContent).toBe('-60%');
  expect(cards[0]!.textContent).toContain('Expira em');
  expect(cards[1]!.textContent).toBe('Oferta ocultaRevele na loja da Riot');
  act(() => (cards[0] as HTMLButtonElement).click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-sto-cta')!.click());
  expect(purchase).toHaveBeenCalledWith(expect.objectContaining({ itemId: 238015, yourShop: true }));
});

test('openRiotPurchase: sem API vai para a loja; com API abre a janela da Riot (nunca compra)', () => {
  expect(openRiotPurchase({ itemId: 1, inventoryType: 'CHAMPION' })).toBe('store');
  const createPAWModal = vi.fn(() => true);
  setPawApi({ createPAWModal });
  expect(openRiotPurchase({ itemId: 103015, inventoryType: 'CHAMPION_SKIN' })).toBe('dialog');
  expect(createPAWModal).toHaveBeenCalledWith({ itemId: 103015, inventoryType: 'CHAMPION_SKIN' }, 'store', null, null, null, expect.any(Function));
  expect(openRiotPurchase({ itemId: 238015, inventoryType: 'CHAMPION_SKIN', yourShop: true })).toBe('store');
  createPAWModal.mockReturnValue(false);
  expect(openRiotPurchase({ itemId: 1, inventoryType: 'CHAMPION' })).toBe('store');
});

test('destaques: nome do item nos cartões, com o campeão quando o nome não o traz', async () => {
  routes['/lol-catalog/v1/items/CHAMPION_SKIN'] = [...skinItems, { itemId: 266002, inventoryType: 'CHAMPION_SKIN', name: 'Mecha', owned: false, prices: rp(1350), releaseDate: 1710000000 }];
  await mount();
  const fresh = [...root.querySelectorAll('.rlc-sto-shelf')][1]!;
  const tile = (n: string) => [...fresh.querySelectorAll('.rlc-sto-tile')].find((x) => x.getAttribute('aria-label') === n)!;
  expect(tile('Mecha').querySelector('.rlc-sto-info')!.textContent).toBe('AatroxMecha1.350');
  expect(tile('Ahri do Arcade').querySelector('.rlc-sto-info small')).toBeNull();
  expect(tile('Ahri do Arcade').querySelector('.rlc-sto-info b')!.textContent).toBe('Ahri do Arcade');
});

test('carteira: "+" ao lado do RP abre a compra de RP da Riot; sem a janela, mostra a loja da Riot', async () => {
  const buyRp = vi.fn(async (): Promise<'dialog' | 'store'> => 'dialog');
  const lcu = fakeLcu();
  lcu.wallet.value = ready({ RP: 63, lol_blue_essence: 117739 });
  act(() => render(<Store lcu={lcu} purchase={vi.fn((): 'dialog' | 'store' => 'dialog')} buyRp={buyRp} />, root));
  await flush();
  const plus = () => root.querySelector<HTMLButtonElement>('.rlc-cur[data-cur="rp"] .rlc-cur-add')!;
  expect(plus().getAttribute('aria-label')).toBe('Comprar RP');
  expect(root.querySelector('.rlc-cur[data-cur="be"] .rlc-cur-add')).toBeNull();
  act(() => plus().click());
  await flush();
  expect(buyRp).toHaveBeenCalledTimes(1);
  expect(root.querySelector('.rlc-sto-riot')).toBeNull();
  buyRp.mockResolvedValue('store');
  act(() => plus().click());
  await flush();
  expect(root.querySelector('.rlc-sto-riot')).not.toBeNull();
});

test('openRiotRpPurchase: sem API vai para a loja; com API pede RP_PURCHASE à Riot (só abre a janela de pagamento)', async () => {
  expect(await openRiotRpPurchase()).toBe('store');
  const openPayments = vi.fn(async () => undefined);
  setSharedComponentsApi({ getApi_Payments: () => ({ openPayments }) });
  expect(await openRiotRpPurchase()).toBe('dialog');
  expect(openPayments).toHaveBeenCalledWith(expect.objectContaining({ action: 'RP_PURCHASE' }));
  openPayments.mockRejectedValueOnce(new Error('x'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(await openRiotRpPurchase()).toBe('store');
});

