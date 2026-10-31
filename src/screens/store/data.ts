// Catálogo da loja montado com os dados do próprio client: itens e posse (`/lol-catalog`), promoções e destaques (`/lol-store`),
// arte e raridade (`/lol-game-data/.../skins.json`). Funções puras, testadas sem a LCU.

export type Kind = 'champion' | 'skin' | 'chroma' | 'bundle' | 'icon' | 'ward' | 'emote' | 'loot';
export type Rarity = 'epic' | 'legendary' | 'mythic' | 'ultimate' | 'transcendent' | 'exalted';
export const RARITIES: Rarity[] = ['epic', 'legendary', 'mythic', 'ultimate', 'transcendent', 'exalted'];

export interface StoreItem {
  /** `${inventoryType}:${itemId}`: o par que a janela de compra da Riot pede. */
  key: string;
  itemId: number;
  inventoryType: string;
  kind: Kind;
  name: string;
  description: string;
  /** 0 quando o item não é de um campeão. */
  championId: number;
  rarity: Rarity | null;
  owned: boolean;
  /** Preço atual (já com a promoção). */
  rp: number | null;
  be: number | null;
  /** Preço cheio em RP, só quando há desconto. */
  rpFull: number | null;
  saleEnd: string | null;
  /** Lançamento em ms. */
  release: number;
  portrait: string;
  splash: string;
  /** Imagem pequena (croma, ícone, sentinela): mostrar inteira em vez de cortar. */
  contain: boolean;
  /** Oferta da Sua Loja: o preço especial só existe na janela da própria Sua Loja. */
  yourShop?: boolean;
}

export interface CatalogItem {
  itemId: number;
  inventoryType: string;
  subInventoryType?: string;
  name: string;
  description?: string;
  owned?: boolean;
  active?: boolean;
  prices?: Array<{ cost: number; currency: string }> | null;
  releaseDate?: number;
  imagePath?: string;
  tilePath?: string;
}
export interface SkinMeta {
  id: number;
  name?: string;
  rarity?: string;
  description?: string | null;
  splashPath?: string;
  loadScreenPath?: string;
  tilePath?: string;
  chromas?: Array<{ id: number }> | null;
}
export interface Sale {
  item: { inventoryType: string; itemId: number };
  sale?: { endDate?: string; prices?: Array<{ cost: number; currency: string }> };
}
export interface FeaturedItem {
  itemId: number;
  inventoryType: string;
  subInventoryType?: string;
  name?: string;
  description?: string;
  owned?: boolean;
  rp?: number;
  fullPrice?: number;
  iconUrl?: string;
  releaseDate?: number;
}
export interface Banner {
  id: number;
  /** Interno, em inglês, com o patch na frente ("26.21 True Damage Epics"). */
  title?: string;
  imgUrl: string;
  items?: Array<{ inventoryType: string; itemId: number }>;
}
export interface Featured {
  carousel?: { banners?: Banner[] };
  catalog?: FeaturedItem[];
}
export interface Offer {
  id: string;
  skinId: number;
  skinName: string;
  championId: number;
  originalPrice: number;
  discountPrice: number;
  owned: boolean;
  revealed: boolean;
  expirationDate: string;
}

const RARITY: Record<string, Rarity> = { kEpic: 'epic', kLegendary: 'legendary', kMythic: 'mythic', kUltimate: 'ultimate', kTranscendent: 'transcendent', kExalted: 'exalted' };
const KIND: Record<string, Kind> = { CHAMPION: 'champion', CHAMPION_SKIN: 'skin', SUMMONER_ICON: 'icon', WARD_SKIN: 'ward', EMOTE: 'emote' };

export const keyOf = (inventoryType: string, itemId: number) => `${inventoryType}:${itemId}`;

/** Desconto em % inteiro; 0 sem preço cheio maior que o atual. */
export const discount = (price: number | null, full: number | null): number => (price !== null && full && price < full ? Math.round((1 - price / full) * 100) : 0);

/** O catálogo manda segundos, o `/lol-store` manda ms. */
const ms = (v: number | undefined) => (!v ? 0 : v < 1e11 ? v * 1000 : v);
/** A LCU manda caminhos de CDN sem esquema (`//d392...`). */
const url = (u: string | undefined) => (!u ? '' : u.startsWith('//') ? `https:${u}` : u);
const cost = (prices: CatalogItem['prices'], currency: string) => prices?.find((p) => p.currency === currency)?.cost ?? null;

/** Itens à venda do catálogo, com promoção, arte e raridade. Inativos e sem preço ficam de fora. */
export function buildCatalog(lists: CatalogItem[][], skins: Record<string, SkinMeta> | null, sales: Sale[]): StoreItem[] {
  const meta = skins ?? {};
  const parent = new Map<number, SkinMeta>();
  for (const s of Object.values(meta)) for (const c of s.chromas ?? []) parent.set(c.id, s);
  const onSale = new Map(sales.map((s) => [keyOf(s.item.inventoryType, s.item.itemId), s.sale]));
  const out: StoreItem[] = [];
  for (const it of lists.flat()) {
    const kind = it.subInventoryType === 'RECOLOR' ? 'chroma' : KIND[it.inventoryType];
    if (!kind || it.active === false) continue;
    const full = { rp: cost(it.prices, 'RP'), be: cost(it.prices, 'IP') };
    if (full.rp === null && full.be === null) continue;
    const key = keyOf(it.inventoryType, it.itemId);
    const sale = onSale.get(key);
    const saleRp = cost(sale?.prices, 'RP');
    const discounted = saleRp !== null && full.rp !== null && saleRp < full.rp;
    const championId = kind === 'champion' ? it.itemId : kind === 'skin' || kind === 'chroma' ? Math.floor(it.itemId / 1000) : 0;
    const skin = kind === 'champion' ? meta[String(it.itemId * 1000)] : kind === 'skin' ? meta[String(it.itemId)] : kind === 'chroma' ? parent.get(it.itemId) : undefined;
    const small = kind === 'chroma' || kind === 'icon' || kind === 'ward' || kind === 'emote';
    out.push({
      key,
      itemId: it.itemId,
      inventoryType: it.inventoryType,
      kind,
      name: it.name.trim(),
      description: it.description || (kind === 'skin' ? (skin?.description ?? '') : ''),
      championId,
      rarity: kind === 'skin' ? (RARITY[skin?.rarity ?? ''] ?? null) : null,
      owned: !!it.owned,
      rp: discounted ? saleRp : full.rp,
      be: full.be,
      rpFull: discounted ? full.rp : null,
      saleEnd: discounted ? (sale?.endDate ?? null) : null,
      release: ms(it.releaseDate),
      portrait: small ? (it.imagePath ?? '') : (skin?.loadScreenPath || it.tilePath || it.imagePath || ''),
      splash: skin?.splashPath || it.imagePath || '',
      contain: small,
    });
  }
  return out;
}

/** Pacotes e espólios dos destaques (o catálogo por tipo não os traz). */
export function buildFeatured(featured: Featured | null): StoreItem[] {
  const out: StoreItem[] = [];
  for (const it of featured?.catalog ?? []) {
    const loot = it.inventoryType === 'HEXTECH_CRAFTING' || it.subInventoryType === 'HEXTECH_BUNDLE';
    if ((it.inventoryType !== 'BUNDLES' && !loot) || !it.name || typeof it.rp !== 'number') continue;
    const icon = url(it.iconUrl);
    const image = /^https?:/.test(icon) ? icon : '';
    out.push({
      key: keyOf(it.inventoryType, it.itemId),
      itemId: it.itemId,
      inventoryType: it.inventoryType,
      kind: loot ? 'loot' : 'bundle',
      name: it.name.trim(),
      description: it.description ?? '',
      championId: 0,
      rarity: null,
      owned: !!it.owned,
      rp: it.rp,
      be: null,
      rpFull: it.fullPrice && it.fullPrice > it.rp ? it.fullPrice : null,
      saleEnd: null,
      release: ms(it.releaseDate),
      portrait: image,
      splash: image,
      contain: false,
    });
  }
  return out;
}

export const bannerImage = (b: Banner) => url(b.imgUrl);

/** Oferta da Sua Loja como item da loja (arte e nome localizado do skins.json quando houver). */
export function offerItem(o: Offer, skins: Record<string, SkinMeta> | null): StoreItem {
  const skin = skins?.[String(o.skinId)];
  return {
    key: `yourshop:${o.id}`,
    itemId: o.skinId,
    inventoryType: 'CHAMPION_SKIN',
    kind: 'skin',
    name: (skin?.name || o.skinName).trim(),
    description: skin?.description ?? '',
    championId: o.championId,
    rarity: RARITY[skin?.rarity ?? ''] ?? null,
    owned: o.owned,
    rp: o.discountPrice,
    be: null,
    rpFull: o.originalPrice > o.discountPrice ? o.originalPrice : null,
    saleEnd: o.expirationDate,
    release: 0,
    portrait: skin?.loadScreenPath ?? '',
    splash: skin?.splashPath ?? '',
    contain: false,
    yourShop: true,
  };
}

// --- Filtros do catálogo -------------------------------------------------------------------------

export type Sort = 'recent' | 'priceAsc' | 'priceDesc' | 'name';
/** Faixas de preço em RP, pelos degraus de preço da loja. */
export const BANDS: Array<[number, number]> = [
  [0, 520],
  [521, 975],
  [976, 1350],
  [1351, Infinity],
];

export interface Filters {
  q: string;
  /** Vazio: todos os tipos da aba. */
  kinds: Kind[];
  rarities: Rarity[];
  band: number | null;
  sale: boolean;
  /** Desligado (padrão): a loja esconde o que a pessoa já possui. */
  showOwned: boolean;
  champOwned: boolean;
  sort: Sort;
}
export const NO_FILTERS: Filters = { q: '', kinds: [], rarities: [], band: null, sale: false, showOwned: false, champOwned: false, sort: 'recent' };

export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function applyFilters(items: StoreItem[], f: Filters, ownedChampions: Set<number>, championName: Map<number, string>): StoreItem[] {
  const q = fold(f.q.trim());
  const band = f.band === null ? null : BANDS[f.band]!;
  const list = items.filter(
    (i) =>
      (!f.kinds.length || f.kinds.includes(i.kind)) &&
      (!f.rarities.length || (i.rarity !== null && f.rarities.includes(i.rarity))) &&
      (!band || (i.rp !== null && i.rp >= band[0] && i.rp <= band[1])) &&
      (!f.sale || i.rpFull !== null) &&
      (f.showOwned || !i.owned) &&
      (!f.champOwned || ownedChampions.has(i.championId)) &&
      (!q || fold(i.name).includes(q) || fold(championName.get(i.championId) ?? '').includes(q)),
  );
  const price = (i: StoreItem) => i.rp ?? Infinity;
  const by: Record<Sort, (a: StoreItem, b: StoreItem) => number> = {
    recent: (a, b) => b.release - a.release || a.name.localeCompare(b.name),
    priceAsc: (a, b) => price(a) - price(b) || a.name.localeCompare(b.name),
    priceDesc: (a, b) => (b.rp ?? -1) - (a.rp ?? -1) || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return list.sort(by[f.sort]);
}
