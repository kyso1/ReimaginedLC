import { useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import { LcuError, request } from '../../lcu/request';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { getJson } from '../profile/data';
import { endsIn, fill, type Load, MythicWallet, useInstanceDetails, useLoad, waitPurchase } from './Sanctum';

type Rotation = 'FEATURED' | 'BIWEEKLY' | 'WEEKLY' | 'DAILY';
const ROTATIONS: Array<[Rotation, TextKey]> = [
  ['FEATURED', 'lootFeatured'],
  ['BIWEEKLY', 'lootBiweekly'],
  ['WEEKLY', 'lootWeekly'],
  ['DAILY', 'lootDaily'],
];

/** Lojas da vitrine oficial: `/lol-shoppefront/v1/stores/MYTHIC_SHOP`. O marketplace tem o mesmo formato, mas fica velho na troca de rotação. */
export const MYTHIC_STORES_URL = '/lol-shoppefront/v1/stores/MYTHIC_SHOP';

/** Loja da vitrine (só os campos usados). */
export interface MarketStore {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  displayMetadata?: { shoppefront?: { id?: string; categories?: string[]; dataByCatalogEntry?: Record<string, { categories?: string[] }> } };
  catalogEntries?: MarketEntry[];
}
interface MarketEntry {
  id: string;
  endTime?: string;
  prerequisites?: unknown[];
  purchaseLimits?: Array<{ ruleId?: string }>;
  purchaseUnits?: Array<{
    fulfillment?: { itemId?: string; itemTypeId?: string; name?: string; ownedQuantity?: number; maxQuantity?: number; delta?: number };
    paymentOptions?: Array<{ key?: string; payments?: Array<{ name?: string; finalDelta?: number }> }>;
  }>;
}

/** Tipo do item pelo `itemTypeId` (ids de `INVENTORY_TYPE_IDS` do client oficial). */
type Kind = 'skin' | 'emote' | 'icon' | 'other';
const KIND_BY_TYPE_ID: Record<string, Kind> = {
  'd620ae7b-cf87-496c-96c5-893c99dc2791': 'skin',
  '5cee03fb-af16-4bc9-89f7-064b49e1233f': 'emote',
  'bb69c4a5-35a6-423c-a61a-a1eb4ca1aae7': 'icon',
};
const KINDS: Array<[Kind, TextKey]> = [
  ['skin', 'lootKindSkins'],
  ['emote', 'lootKindEmotes'],
  ['icon', 'lootKindIcons'],
  ['other', 'lootKindOther'],
];

export interface MythicTile {
  /** Id da entrada do catálogo (`catalogEntryId` da compra). */
  key: string;
  storeId: string;
  /** Chave da forma de pagamento em Essência Mítica; null quando não há ou quando exige pré-requisito: sem compra aqui. */
  payKey: string | null;
  quantity: number;
  instanceId: string;
  rotation: Rotation;
  kind: Kind;
  fallbackName: string;
  price: number | null;
  owned: boolean;
  /** Regra de limite de compra em `/lol-shoppefront/v1/velocity`, se houver. */
  limitRule: string | null;
  endMs: number | null;
}

const isMythic = (s: MarketStore) => s.displayMetadata?.shoppefront?.id === 'MYTHIC_SHOP' || s.name.startsWith('MYTHIC_SHOPPE');

/**
 * Rotação pela categoria da entrada (`dataByCatalogEntry`) ou da loja: quinzenal, semanal, diária.
 * Destaque, ato, patch e o resto vão para Destaque (o oficial os lista antes das rotações). Loja de fora volta null.
 */
export function rotationOf(s: MarketStore, entryId?: string): Rotation | null {
  if (!isMythic(s)) return null;
  const front = s.displayMetadata?.shoppefront;
  const cat = (entryId && front?.dataByCatalogEntry?.[entryId]?.categories?.[0]) || front?.categories?.[0];
  return cat === 'BIWEEKLY' || cat === 'WEEKLY' || cat === 'DAILY' ? cat : 'FEATURED';
}

/** Itens à venda agora, um por item (a mesma skin pode estar em duas vitrines). Preço em Essência Mítica. */
export function mythicTiles(stores: MarketStore[], now = Date.now()): MythicTile[] {
  const seen = new Set<string>();
  const out: MythicTile[] = [];
  for (const s of stores) {
    if (!isMythic(s)) continue;
    if ((s.startTime && Date.parse(s.startTime) > now) || (s.endTime && Date.parse(s.endTime) <= now)) continue;
    for (const e of s.catalogEntries ?? []) {
      const rotation = rotationOf(s, e.id)!;
      const unit = e.purchaseUnits?.[0];
      const f = unit?.fulfillment;
      if (!f?.itemId || seen.has(`${rotation}:${f.itemId}`)) continue;
      if (e.endTime && Date.parse(e.endTime) <= now) continue;
      seen.add(`${rotation}:${f.itemId}`);
      const option = unit?.paymentOptions?.find((o) => o.payments?.[0]?.name === 'lol_mythic_essence');
      const end = e.endTime ?? s.endTime;
      out.push({
        key: e.id,
        storeId: s.id,
        payKey: option?.key && !e.prerequisites?.length ? option.key : null,
        quantity: f.delta ?? 1,
        instanceId: f.itemId,
        rotation,
        kind: KIND_BY_TYPE_ID[f.itemTypeId ?? ''] ?? 'other',
        fallbackName: f.name ?? '',
        price: option?.payments?.[0]?.finalDelta ?? null,
        owned: (f.ownedQuantity ?? 0) >= (f.maxQuantity ?? 1),
        limitRule: e.purchaseLimits?.[0]?.ruleId ?? null,
        endMs: end ? Date.parse(end) : null,
      });
    }
  }
  return out;
}

/** Corpo de `POST /lol-shoppefront/v1/bulk-purchases`, como o `handleModalAccept` → `purchaseCatalogItem` oficial. */
export const purchaseBody = (x: MythicTile) => ({
  purchaseItems: [{ catalogEntryId: x.key, paymentOptions: [x.payKey], quantity: x.quantity, storeId: x.storeId }],
  purchaseTimeOut: 10_000,
});

/**
 * Loja Mítica: vitrines Destaque, Quinzenal, Semanal e Diária, filtro por tipo, arte, nome, prazo e preço em Essência Mítica.
 * Lê e compra como a vitrine oficial (`shoppefront-container` com `MYTHIC_SHOP`): lojas em `/lol-shoppefront/v1/stores/MYTHIC_SHOP`,
 * compra em `POST /lol-shoppefront/v1/bulk-purchases`, resultado em `/lol-shoppefront/v1/purchases/{id}`. Sempre com confirmação.
 */
export function MythicShop({ load = getJson }: { load?: Load }) {
  const [rotation, setRotation] = useState<Rotation>('FEATURED');
  const [kind, setKind] = useState<Kind | null>(null);
  const [rev, setRev] = useState(0);
  const stores = useLoad<MarketStore[]>(load, MYTHIC_STORES_URL, rev);
  const wallet = useLoad<Record<string, number>>(load, '/lol-inventory/v1/wallet/0', rev);
  const velocity = useLoad<Record<string, { availableTokens?: number }>>(load, '/lol-shoppefront/v1/velocity', rev);
  const tiles = mythicTiles(Array.isArray(stores) ? stores : []);
  // A vitrine só dá o id da instância; o catálogo traduz em nome localizado e arte.
  const detail = useInstanceDetails(load, tiles.map((x) => x.instanceId));
  const [confirm, setConfirm] = useState<{ tile: MythicTile; name: string } | null>(null);
  const [done, setDone] = useState<{ ok: boolean; text: string } | null>(null);
  // Erro da LCU fica no cartão da oferta (item já possuído, limite...), não só no aviso geral.
  const [failed, setFailed] = useState<Record<string, string>>({});
  const n = new Intl.NumberFormat(locale());
  const essence = wallet?.lol_mythic_essence ?? 0;
  const inRotation = tiles.filter((x) => x.rotation === rotation);
  const kinds = KINDS.filter(([k]) => inRotation.some((x) => x.kind === k));
  const shown = inRotation.filter((x) => !kind || x.kind === kind);

  const buy = useAction(async (tile: MythicTile, name: string) => {
    setDone(null);
    setFailed(({ [tile.key]: _, ...rest }) => rest);
    try {
      const id = await request<string>('POST', '/lol-shoppefront/v1/bulk-purchases', purchaseBody(tile));
      if (!id) throw new Error('no purchase id');
      await waitPurchase(load, `/lol-shoppefront/v1/purchases/${encodeURIComponent(id)}`, 11_000);
      setDone({ ok: true, text: fill(t('lootBuyDone'), { item: name }) });
    } catch (e) {
      setFailed((f) => ({ ...f, [tile.key]: e instanceof LcuError ? e.message : t('lootBuyFailed') }));
      setDone({ ok: false, text: t('lootBuyError') });
    } finally {
      setRev((r) => r + 1);
    }
  });

  return (
    <div class="rlc-lt-mythic">
      <div class="rlc-lt-mythic-top">
        <nav class="rlc-lt-subtabs" aria-label={t('lootTabMythic')}>
          {ROTATIONS.map(([r, label]) => (
            <button
              type="button"
              key={r}
              aria-pressed={rotation === r}
              onClick={() => {
                setRotation(r);
                setKind(null);
              }}
            >
              {t(label)} <small>{tiles.filter((x) => x.rotation === r).length}</small>
            </button>
          ))}
        </nav>
        <MythicWallet wallet={wallet} />
      </div>
      {kinds.length > 1 ? (
        <nav class="rlc-lt-kinds">
          <button type="button" aria-pressed={!kind} onClick={() => setKind(null)}>
            {t('lootAll')}
          </button>
          {kinds.map(([k, label]) => (
            <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
              {t(label)} <small>{inRotation.filter((x) => x.kind === k).length}</small>
            </button>
          ))}
        </nav>
      ) : null}
      {done ? (
        <p class={done.ok ? 'rlc-lt-done' : 'rlc-lt-error'} role={done.ok ? 'status' : 'alert'}>
          {done.text}
        </p>
      ) : null}
      {stores === undefined ? (
        <p class="rlc-muted rlc-lt-empty">{t('lootLoading')}</p>
      ) : shown.length ? (
        <div class="rlc-lt-shop">
          {shown.map((x) => {
            const d = detail(x.instanceId);
            const name = d?.item?.name || x.fallbackName;
            const art = d?.assets?.tilePath || d?.item?.tilePath || d?.assets?.iconPath || d?.item?.imagePath;
            const owned = x.owned || d?.item?.owned === true;
            const limited = !!x.limitRule && velocity?.[x.limitRule]?.availableTokens === 0;
            const end = x.endMs ? endsIn(x.endMs) : null;
            const short = x.price !== null && essence < x.price;
            const error = failed[x.key];
            return (
              <article key={x.key} class="rlc-lt-offer" data-owned={owned ? 'true' : undefined} data-kind={x.kind}>
                <div class="rlc-lt-offer-art" style={art ? { backgroundImage: `url("${art}")` } : undefined} />
                <div class="rlc-lt-offer-in">
                  <b title={name}>{name}</b>
                  {end ? <small>{end}</small> : null}
                  <span class="rlc-lt-price">{owned ? t('lootOwned') : limited ? t('lootBuyLimit') : x.price !== null ? `${n.format(x.price)} ${t('lootMythicShort')}` : ''}</span>
                  {error ? (
                    <small class="rlc-lt-offer-error" role="alert">
                      {error}
                    </small>
                  ) : null}
                  {!owned && !limited && x.price !== null && x.payKey ? (
                    <button type="button" class="rlc-button rlc-lt-buy" disabled={short || buy.pending} onClick={() => setConfirm({ tile: x, name })}>
                      {buy.pending ? t('lootBuying') : short ? t('lootBuyShort') : t('lootBuy')}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p class="rlc-muted rlc-lt-empty">{t('lootMythicEmpty')}</p>
      )}
      {confirm ? (
        <Confirm
          message={fill(t('lootBuyConfirm'), { item: confirm.name, price: n.format(confirm.tile.price ?? 0), before: n.format(essence), after: n.format(essence - (confirm.tile.price ?? 0)) })}
          confirmLabel={t('lootBuy')}
          onConfirm={() => {
            buy.run(confirm.tile, confirm.name);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
