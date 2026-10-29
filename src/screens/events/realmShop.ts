import { marketPurchase } from '../../lcu/marketplace';
import { getJson } from './data';

// Loja de Cristais do Reino do TFT: as lojas do marketplace do TFT pagas em Cristais do Reino (`tft_standard_coin`),
// as mesmas da loja rotativa do client (abas sazonal e de eventos).

/** Moeda dos Cristais do Reino (id no marketplace e chave na carteira). */
export const REALM_CRYSTAL_ID = 'db40bd66-f3ac-5bca-a104-2eebca8cc1d2';
export const REALM_CRYSTAL_WALLET = 'tft_standard_coin';

const STORES = '/lol-marketplace/v1/products/tft/stores';

interface Payment { currencyId: string; finalDelta: number }
interface PaymentOption { key: string; payments: Payment[] }
interface PurchaseUnit { fulfillment: { name?: string; ownedQuantity?: number; maxQuantity?: number }; paymentOptions?: PaymentOption[] }
interface CatalogEntry {
  id: string; name: string; description?: string; endTime?: string;
  displayMetadata?: { tft?: { pc?: string; itemType?: string; rarity?: string } };
  purchaseUnits?: PurchaseUnit[];
}
export interface MarketStore { id: string; name: string; startTime?: string; endTime?: string; displayMetadata?: { tft?: { store?: string } }; catalogEntries: CatalogEntry[] }

export interface RealmItem {
  storeId: string;
  entryId: string;
  name: string;
  description: string;
  image: string;
  /** Tipo do client (littlelegend, chibi, arena, boom...), para o selo do cartão. */
  kind: string;
  price: number;
  /** Chave da opção de pagamento em Cristais (o que a compra manda). */
  paymentKey: string;
  owned: boolean;
}
export interface RealmSection { id: string; name: string; endsAt: number | null; items: RealmItem[] }

const art = (path: string | undefined) => (!path ? '' : path.startsWith('/') ? path : `/lol-game-data/assets/${path}`);

/**
 * Seções da loja: uma por loja vigente paga em Cristais, na ordem do marketplace. O mesmo item pode vir em duas lojas
 * (a de eventos repete a sazonal com outra aba no client): fica só na primeira. Possuído = todas as unidades no máximo.
 */
export function realmSections(stores: MarketStore[], now = Date.now()): RealmSection[] {
  const seen = new Set<string>();
  const out: RealmSection[] = [];
  for (const s of stores) {
    const ends = s.endTime ? Date.parse(s.endTime) : NaN;
    if ((s.startTime && Date.parse(s.startTime) > now) || ends <= now) continue;
    const items: RealmItem[] = [];
    for (const e of s.catalogEntries ?? []) {
      if (seen.has(e.id) || (e.endTime && Date.parse(e.endTime) <= now)) continue;
      const units = e.purchaseUnits ?? [];
      const option = units[0]?.paymentOptions?.find((o) => o.payments.some((p) => p.currencyId === REALM_CRYSTAL_ID));
      if (!option) continue;
      seen.add(e.id);
      items.push({
        storeId: s.id, entryId: e.id, name: e.name.trim(), description: (e.description ?? '').trim(), image: art(e.displayMetadata?.tft?.pc),
        kind: e.displayMetadata?.tft?.itemType ?? '',
        price: option.payments.filter((p) => p.currencyId === REALM_CRYSTAL_ID).reduce((n, p) => n + p.finalDelta, 0),
        paymentKey: option.key,
        owned: units.length > 0 && units.every((u) => (u.fulfillment.ownedQuantity ?? 0) >= (u.fulfillment.maxQuantity ?? 1)),
      });
    }
    // Mesmo nome (a loja sazonal e a de eventos do Halloween): junta numa seção só.
    const same = out.find((x) => x.name === s.name);
    if (same) same.items.push(...items);
    else if (items.length) out.push({ id: s.id, name: s.name, endsAt: Number.isFinite(ends) ? ends : null, items });
  }
  return out;
}

export async function loadRealmShop(): Promise<RealmSection[]> {
  const r = await getJson<{ data?: MarketStore[] }>(STORES);
  return realmSections(r?.data ?? []);
}

/** Compra um item da loja com a opção de pagamento em Cristais. */
export const buyRealmItem = (item: RealmItem, wait?: (ms: number) => Promise<void>) =>
  marketPurchase({ storeId: item.storeId, catalogEntryId: item.entryId, paymentOptionsKeys: [item.paymentKey], quantity: 1 }, wait);
