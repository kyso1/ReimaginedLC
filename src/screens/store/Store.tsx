import { useEffect, useMemo, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { Wallet } from '../../shell/Wallet';
import { Crossfade } from '../../ui/Crossfade';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';
import {
  applyFilters,
  BANDS,
  bannerImage,
  buildCatalog,
  buildFeatured,
  discount,
  fold,
  keyOf,
  NO_FILTERS,
  offerItem,
  RARITIES,
  type Banner,
  type CatalogItem,
  type Featured,
  type Filters,
  type Kind,
  type Offer,
  type Rarity,
  type Sale,
  type SkinMeta,
  type Sort,
  type StoreItem,
} from './data';
import { openRiotPurchase, openRiotRpPurchase, type PurchaseItem } from './purchase';
import { RiotStorePage } from './RiotStore';

type Tab = 'featured' | 'champions' | 'skins' | 'accessories' | 'loot' | 'yourshop';
const TABS: Array<[Tab, TextKey]> = [
  ['featured', 'storeFeatured'],
  ['champions', 'storeChampions'],
  ['skins', 'storeSkins'],
  ['accessories', 'storeAccessories'],
  ['loot', 'storeLoot'],
  ['yourshop', 'storeYourShop'],
];

const KIND_LABEL: Record<Kind, TextKey> = {
  champion: 'storeKindChampion',
  skin: 'storeKindSkin',
  chroma: 'storeKindChroma',
  bundle: 'storeKindBundle',
  icon: 'storeKindIcon',
  ward: 'storeKindWard',
  emote: 'storeKindEmote',
  loot: 'storeKindLoot',
};
const RARITY_LABEL: Record<Rarity, TextKey> = {
  epic: 'storeRarityEpic',
  legendary: 'storeRarityLegendary',
  mythic: 'storeRarityMythic',
  ultimate: 'storeRarityUltimate',
  transcendent: 'storeRarityTranscendent',
  exalted: 'storeRarityExalted',
};
const BAND_LABEL: TextKey[] = ['storeBand1', 'storeBand2', 'storeBand3', 'storeBand4'];
const SORT_LABEL: Array<[Sort, TextKey]> = [
  ['recent', 'storeSortRecent'],
  ['priceAsc', 'storeSortPriceAsc'],
  ['priceDesc', 'storeSortPriceDesc'],
  ['name', 'storeSortName'],
];

/** O que cada aba de catálogo mostra e quais filtros fazem sentido nela. */
const CATALOG: Record<'champions' | 'skins' | 'accessories' | 'loot', { pool: Kind[]; types: Kind[]; start: Kind[]; rarity: boolean; champ: boolean }> = {
  champions: { pool: ['champion'], types: [], start: [], rarity: false, champ: false },
  // Cromas são milhares: começam desligadas.
  skins: { pool: ['skin', 'chroma', 'bundle'], types: ['skin', 'chroma', 'bundle'], start: ['skin'], rarity: true, champ: true },
  accessories: { pool: ['icon', 'ward', 'emote'], types: ['icon', 'ward', 'emote'], start: [], rarity: false, champ: false },
  loot: { pool: ['loot'], types: [], start: [], rarity: false, champ: false },
};

/** Ícones do próprio client, os mesmos da carteira. */
const RP_ICON = '/fe/lol-static-assets/images/icon-rp-72.png';
const BE_ICON = '/fe/lol-static-assets/images/icon-be-150.png';
const PAGE = 120;

interface Data {
  items: StoreItem[];
  banners: Banner[];
  /** null: Sua Loja desligada agora. */
  yourShop: Array<{ offer: Offer; item: StoreItem }> | null;
}

/** Tudo que a loja mostra, lido uma vez por abertura. */
async function load(): Promise<Data> {
  const items = (type: string) => getJson<CatalogItem[]>(`/lol-catalog/v1/items/${type}`);
  // ponytail: os dois JSONs grandes (catálogo de skins e skins.json, ~17 MB) são lidos a cada abertura; guardar em memória se reabrir pesar.
  const [champions, skinItems, icons, wards, emotes, skins, sales, featured, status, offers] = await Promise.all([
    items('CHAMPION'),
    items('CHAMPION_SKIN'),
    items('SUMMONER_ICON'),
    items('WARD_SKIN'),
    items('EMOTE'),
    getJson<Record<string, SkinMeta>>('/lol-game-data/assets/v1/skins.json'),
    getJson<Sale[]>('/lol-store/v1/catalog/sales'),
    getJson<Featured>('/lol-store/v1/featured'),
    getJson<{ hubEnabled?: boolean }>('/lol-yourshop/v1/status'),
    getJson<Offer[]>('/lol-yourshop/v1/offers'),
  ]);
  const list = (x: CatalogItem[] | null) => (Array.isArray(x) ? x : []);
  return {
    items: [...buildCatalog([list(champions), list(skinItems), list(icons), list(wards), list(emotes)], skins, Array.isArray(sales) ? sales : []), ...buildFeatured(featured)],
    banners: (featured?.carousel?.banners ?? []).filter((b) => b.imgUrl),
    yourShop: status?.hubEnabled ? (Array.isArray(offers) ? offers : []).map((offer) => ({ offer, item: offerItem(offer, skins) })) : null,
  };
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(locale(), { day: '2-digit', month: 'short' });

/** Nome do campeão quando ajuda: item de campeão cujo nome não o traz ("Ilha das Sombras" sem "Hecarim"). */
const champHint = (item: StoreItem, champ: string | undefined): string => (champ && item.kind !== 'champion' && !fold(item.name).includes(fold(champ)) ? champ : '');

/**
 * Loja feita com o catálogo do client: Destaques (vitrine), catálogos com filtros, Espólios e Sua Loja.
 * Comprar e presentear sempre na janela da Riot (`openRiotPurchase`); quando ela não abre, a página da loja da Riot aparece no quadro.
 */
export function Store({ lcu, purchase = openRiotPurchase, buyRp = openRiotRpPurchase }: { lcu: Lcu; purchase?: (item: PurchaseItem) => 'dialog' | 'store'; buyRp?: () => Promise<'dialog' | 'store'> }) {
  const [tab, setTab] = useState<Tab>('featured');
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState<StoreItem | null>(null);
  const [riot, setRiot] = useState(false);

  useEffect(() => {
    let live = true;
    void load().then((d) => live && setData(d));
    return () => void (live = false);
  }, []);

  const champions = useMemo(() => (data?.items ?? []).filter((i) => i.kind === 'champion'), [data]);
  const championName = useMemo(() => new Map(champions.map((c) => [c.championId, c.name])), [champions]);
  const ownedChampions = useMemo(() => new Set(champions.filter((c) => c.owned).map((c) => c.championId)), [champions]);

  const buy = (item: StoreItem) => {
    if (purchase(item) === 'store') setRiot(true);
  };
  // RP também se compra só pela Riot: sem a janela de pagamento, a página da loja da Riot (que tem o botão de RP).
  const topUp = () => void buyRp().then((r) => r === 'store' && setRiot(true));

  if (riot)
    return (
      <section class="rlc-store rlc-sto">
        <header class="rlc-sto-top">
          <button type="button" class="rlc-sto-back" onClick={() => setRiot(false)}>
            {t('storeBack')}
          </button>
          <Wallet lcu={lcu} show={['be', 'rp']} onBuyRp={topUp} />
        </header>
        <RiotStorePage />
      </section>
    );

  const tabs = TABS.filter(([k]) => k !== 'yourshop' || data?.yourShop);
  return (
    <section class="rlc-store rlc-sto">
      <header class="rlc-sto-top">
        <nav class="rlc-tabs-text">
          {tabs.map(([k, label]) => (
            <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              {t(label)}
            </button>
          ))}
        </nav>
        <Wallet lcu={lcu} show={['be', 'rp']} onBuyRp={topUp} />
      </header>
      {!data ? (
        <p class="rlc-muted rlc-sto-wait">{t('storeLoading')}</p>
      ) : tab === 'featured' ? (
        <Showcase data={data} championName={championName} onOpen={setOpen} />
      ) : tab === 'yourshop' ? (
        <YourShop offers={data.yourShop ?? []} onOpen={setOpen} onHidden={() => setRiot(true)} />
      ) : (
        <Catalog key={tab} items={data.items} config={CATALOG[tab]} ownedChampions={ownedChampions} championName={championName} onOpen={setOpen} />
      )}
      {open ? <Drawer item={open} championName={championName.get(open.championId)} onClose={() => setOpen(null)} onBuy={() => buy(open)} onGift={() => setRiot(true)} /> : null}
    </section>
  );
}

// --- Destaques: banner grande e prateleiras --------------------------------------------------------

function Showcase({ data, championName, onOpen }: { data: Data; championName: Map<number, string>; onOpen: (i: StoreItem) => void }) {
  const byKey = useMemo(() => new Map(data.items.map((i) => [i.key, i])), [data]);
  const sale = data.items.filter((i) => i.rpFull !== null && !i.owned && i.kind !== 'chroma').sort((a, b) => discount(b.rp, b.rpFull) - discount(a.rp, a.rpFull));
  const fresh = data.items.filter((i) => (i.kind === 'skin' || i.kind === 'champion') && i.release).sort((a, b) => b.release - a.release).slice(0, 12);
  const bundles = data.items.filter((i) => i.kind === 'bundle');
  return (
    <div class="rlc-sto-show">
      <Hero banners={data.banners} byKey={byKey} championName={championName} onOpen={onOpen} />
      <Shelf title={t('storeOnSale')} items={sale} championName={championName} onOpen={onOpen} />
      <Shelf title={t('storeNew')} items={fresh} championName={championName} onOpen={onOpen} />
      <Shelf title={t('storeBundles')} items={bundles} championName={championName} onOpen={onOpen} />
    </div>
  );
}

/**
 * Banners da Riot em carrossel, trocando com fusão. O título do banner é interno (em inglês, com o patch): a legenda
 * vem do primeiro item do banner no catálogo (nome localizado e preço). Banner sem item (Loja Mítica) fica só com a arte.
 */
function Hero({ banners, byKey, championName, onOpen }: { banners: Banner[]; byKey: Map<string, StoreItem>; championName: Map<number, string>; onOpen: (i: StoreItem) => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(id);
  }, [banners.length, index]);
  const banner = banners[index % Math.max(banners.length, 1)];
  if (!banner) return null;
  const targets = (banner.items ?? []).map((k) => byKey.get(keyOf(k.inventoryType, k.itemId))).filter((i): i is StoreItem => !!i);
  const target = targets[0];
  const champ = target ? champHint(target, championName.get(target.championId)) : '';
  return (
    <div class="rlc-sto-hero">
      <Crossfade src={bannerImage(banner)} position="center 24%" />
      {target ? (
        <div class="rlc-sto-hero-cap" key={banner.id}>
          {champ ? <small>{champ}</small> : null}
          <h2>{target.name}</h2>
          <div class="rlc-sto-hero-row">
            <Price item={target} />
            {targets.length > 1 ? <small>{t('storeMoreItems').replace('{n}', String(targets.length - 1))}</small> : null}
          </div>
        </div>
      ) : null}
      {target ? (
        <button type="button" class="rlc-sto-hero-go" onClick={() => onOpen(target)}>
          {t('storeView')}
        </button>
      ) : null}
      {banners.length > 1 ? (
        <div class="rlc-sto-dots">
          {banners.map((b, i) => (
            <button type="button" key={b.id} aria-label={`${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Shelf({ title, items, championName, onOpen }: { title: string; items: StoreItem[]; championName: Map<number, string>; onOpen: (i: StoreItem) => void }) {
  if (!items.length) return null;
  return (
    <section class="rlc-sto-shelf">
      <h3>{title}</h3>
      <div class="rlc-sto-row">
        {items.map((i) => (
          <Tile key={i.key} item={i} wide sub={champHint(i, championName.get(i.championId))} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

// --- Catálogo com filtros ---------------------------------------------------------------------------

function Catalog({ items, config, ownedChampions, championName, onOpen }: { items: StoreItem[]; config: (typeof CATALOG)[keyof typeof CATALOG]; ownedChampions: Set<number>; championName: Map<number, string>; onOpen: (i: StoreItem) => void }) {
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, kinds: config.start });
  const [limit, setLimit] = useState(PAGE);
  const set = (patch: Partial<Filters>) => {
    setF({ ...f, ...patch });
    setLimit(PAGE);
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const pool = useMemo(() => items.filter((i) => config.pool.includes(i.kind)), [items, config]);
  const list = applyFilters(pool, f, ownedChampions, championName);
  return (
    <div class="rlc-sto-cat">
      <aside class="rlc-sto-side">
        {config.types.length ? (
          <>
            <div class="rlc-sto-sec">{t('storeType')}</div>
            {config.types.map((k) => (
              <Check key={k} on={f.kinds.includes(k)} onClick={() => set({ kinds: toggle(f.kinds, k) })} label={t(KIND_LABEL[k])} />
            ))}
          </>
        ) : null}
        {config.rarity ? (
          <>
            <div class="rlc-sto-sec">{t('storeRarity')}</div>
            {RARITIES.map((r) => (
              <Check key={r} on={f.rarities.includes(r)} onClick={() => set({ rarities: toggle(f.rarities, r) })} label={t(RARITY_LABEL[r])} />
            ))}
          </>
        ) : null}
        <div class="rlc-sto-sec">{t('storePrice')}</div>
        {BANDS.map((_, i) => (
          <Check key={i} on={f.band === i} onClick={() => set({ band: f.band === i ? null : i })} label={t(BAND_LABEL[i]!)} />
        ))}
        <div class="rlc-sto-sec">{t('storeShow')}</div>
        <Check on={f.sale} onClick={() => set({ sale: !f.sale })} label={t('storeOnlySale')} />
        <Check on={f.notOwned} onClick={() => set({ notOwned: !f.notOwned })} label={t('storeNotOwned')} />
        {config.champ ? <Check on={f.champOwned} onClick={() => set({ champOwned: !f.champOwned })} label={t('storeChampOwned')} /> : null}
      </aside>
      <div class="rlc-sto-main">
        <div class="rlc-sto-tools">
          <input type="search" class="rlc-sto-search" placeholder={t('storeSearch')} aria-label={t('storeSearch')} value={f.q} onInput={(e) => set({ q: (e.target as HTMLInputElement).value })} />
          <select class="rlc-sto-sort" aria-label={t('storeSort')} value={f.sort} onChange={(e) => set({ sort: (e.target as HTMLSelectElement).value as Sort })}>
            {SORT_LABEL.map(([k, label]) => (
              <option key={k} value={k}>
                {t(label)}
              </option>
            ))}
          </select>
          <small class="rlc-muted">{new Intl.NumberFormat(locale()).format(list.length)}</small>
        </div>
        {list.length ? (
          <div class="rlc-sto-grid">
            {list.slice(0, limit).map((i) => (
              <Tile key={i.key} item={i} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p class="rlc-muted">{t('storeEmpty')}</p>
        )}
        {list.length > limit ? (
          <button type="button" class="rlc-sto-more" onClick={() => setLimit(limit + PAGE)}>
            {t('storeMore')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" class="rlc-sto-ck" role="checkbox" aria-checked={on} onClick={onClick}>
      <i />
      {label}
    </button>
  );
}

// --- Sua Loja -----------------------------------------------------------------------------------------

function YourShop({ offers, onOpen, onHidden }: { offers: Array<{ offer: Offer; item: StoreItem }>; onOpen: (i: StoreItem) => void; onHidden: () => void }) {
  return (
    <div class="rlc-sto-ys">
      {offers.map(({ offer, item }) =>
        offer.revealed ? (
          <button type="button" key={offer.id} class="rlc-sto-offer" aria-label={item.name} onClick={() => onOpen(item)}>
            {item.splash ? <img src={item.splash} alt="" loading="lazy" decoding="async" /> : null}
            {!item.owned && item.rpFull ? <span class="rlc-sto-off">-{discount(item.rp, item.rpFull)}%</span> : null}
            {item.owned ? <span class="rlc-sto-own">{t('storeOwned')}</span> : null}
            <span class="rlc-sto-info">
              <b>{item.name}</b>
              <Price item={item} />
              <small>{t('storeExpires').replace('{date}', shortDate(offer.expirationDate))}</small>
            </span>
          </button>
        ) : (
          // Revelar é uma ação da Riot (POST /reveal): fica na página dela.
          <button type="button" key={offer.id} class="rlc-sto-offer" data-hidden="true" onClick={onHidden}>
            <span class="rlc-sto-info">
              <b>{t('storeHidden')}</b>
              <small>{t('storeHiddenHint')}</small>
            </span>
          </button>
        ),
      )}
    </div>
  );
}

// --- Peças --------------------------------------------------------------------------------------------

function Tile({ item, wide = false, sub, onOpen }: { item: StoreItem; wide?: boolean; sub?: string; onOpen: (i: StoreItem) => void }) {
  const off = item.owned ? 0 : discount(item.rp, item.rpFull);
  const art = wide && !item.contain ? item.splash || item.portrait : item.portrait || item.splash;
  return (
    <button type="button" class="rlc-sto-tile" data-wide={wide ? 'true' : undefined} data-contain={item.contain ? 'true' : undefined} aria-label={item.name} onClick={() => onOpen(item)}>
      {art ? <img src={art} alt="" loading="lazy" decoding="async" /> : null}
      {off ? <span class="rlc-sto-off">-{off}%</span> : null}
      {item.owned ? <span class="rlc-sto-own">{t('storeOwned')}</span> : null}
      <span class="rlc-sto-info">
        {sub ? <small>{sub}</small> : null}
        <b>{item.name}</b>
        <Price item={item} />
      </span>
    </button>
  );
}

function Price({ item }: { item: StoreItem }) {
  if (item.owned) return <span class="rlc-sto-price">{t('storeOwned')}</span>;
  const n = new Intl.NumberFormat(locale());
  return (
    <span class="rlc-sto-price">
      {item.rp !== null ? (
        <span class="rlc-sto-cost">
          <img src={RP_ICON} alt={t('riotPoints')} />
          {n.format(item.rp)}
          {item.rpFull !== null ? <s>{n.format(item.rpFull)}</s> : null}
        </span>
      ) : null}
      {item.be !== null ? (
        <span class="rlc-sto-cost">
          <img src={BE_ICON} alt={t('blueEssence')} />
          {n.format(item.be)}
        </span>
      ) : null}
    </span>
  );
}

function Drawer({ item, championName, onClose, onBuy, onGift }: { item: StoreItem; championName: string | undefined; onClose: () => void; onBuy: () => void; onGift: () => void }) {
  useEscape(onClose);
  const kicker = [t(KIND_LABEL[item.kind]), item.rarity ? t(RARITY_LABEL[item.rarity]) : '', item.kind !== 'champion' ? (championName ?? '') : ''].filter(Boolean).join(' · ');
  const off = item.owned ? 0 : discount(item.rp, item.rpFull);
  return (
    <div class="rlc-sto-drawer" role="dialog" aria-label={item.name}>
      <button type="button" class="rlc-sto-x" aria-label={t('storeClose')} onClick={onClose}>
        ✕
      </button>
      {/* Sem `key` na gaveta: trocar de item mantém a gaveta e funde uma splash na outra. */}
      <div class="rlc-sto-sp" data-contain={item.contain ? 'true' : undefined}>
        {item.splash ? <Crossfade src={item.splash} /> : null}
      </div>
      <div class="rlc-sto-in">
        <small class="rlc-muted">{kicker}</small>
        <h2>{item.name}</h2>
        {item.description ? <p class="rlc-sto-desc">{item.description}</p> : null}
        {item.owned ? (
          <p class="rlc-sto-big">{t('storeYouOwn')}</p>
        ) : (
          <div class="rlc-sto-big">
            <Price item={item} />
            {off ? <span class="rlc-sto-off" data-inline="true">-{off}%</span> : null}
          </div>
        )}
        {item.saleEnd && !item.owned ? <small class="rlc-muted">{t(item.yourShop ? 'storeExpires' : 'storeSaleEnds').replace('{date}', shortDate(item.saleEnd))}</small> : null}
        <div class="rlc-sto-buy">
          <button type="button" class="rlc-sto-cta" disabled={item.owned} onClick={onBuy}>
            {t('storeBuy')}
          </button>
          <button type="button" class="rlc-sto-gift" onClick={onGift}>
            {t('storeGift')}
          </button>
        </div>
        <small class="rlc-muted">{t('storeBuyHint')}</small>
      </div>
    </div>
  );
}
