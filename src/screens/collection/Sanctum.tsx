import { useEffect, useRef, useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import { request } from '../../lcu/request';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';

/** Faixa do Santuário em `/lol-sanctum/v1/banners` (só os campos usados). Datas em segundos. */
export interface SanctumBanner {
  id: string;
  bannerBackgroundTexture?: string;
  bannerSkin?: { id: number; name: string; rarity: string };
  chasePityThreshold?: number;
  pityCounter?: { amount: number; active: boolean };
  startDate?: number;
  endDate?: number;
}

/** Prêmio possível de uma faixa, de `/lol-sanctum/v1/banners/{id}/odds` → `nodeIdToDropDetailsMap`. */
export interface SanctumDrop {
  nodeId: string;
  itemInstanceId: string;
  quantity: number;
  type: string;
  isChaseItem?: boolean;
}

/** Item de `/lol-catalog/v1/items-list-details`: nome localizado e arte. */
export interface CatalogDetail {
  assets?: { tilePath?: string; splashPath?: string; iconPath?: string };
  item?: { itemId: number; inventoryType?: string; itemInstanceId?: string; name?: string; owned?: boolean; tilePath?: string; imagePath?: string };
}

export type Load = <T>(url: string) => Promise<T | null>;

/** Id da moeda Essência Mítica no catálogo (o mesmo que o client oficial usa em `CAP_CURRENCY_IDS`). */
export const MYTHIC_ESSENCE_ID = '8ce03930-7079-5e3f-a49b-d4721b00dbb3';

export const detailsUrl = (keys: Array<{ inventoryType: string; itemId: number }>) => `/lol-catalog/v1/items-list-details?catalogItemsKeys=${encodeURIComponent(JSON.stringify(keys))}`;

/** Leitura com aviso de pronto: `undefined` enquanto carrega, `null` se falhou. Mudar `rev` relê sem voltar a "carregando". */
export function useLoad<T>(load: Load, url: string | null, rev = 0): T | null | undefined {
  const [value, setValue] = useState<T | null | undefined>(undefined);
  const last = useRef(url);
  useEffect(() => {
    if (last.current !== url) setValue(undefined);
    last.current = url;
    if (!url) return setValue(null);
    let live = true;
    void load<T>(url).then((v) => live && setValue(v));
    return () => void (live = false);
  }, [url, rev]);
  return value;
}

/** Nome e arte do catálogo a partir dos ids de instância (o marketplace e o Santuário só dão esse id). */
export function useInstanceDetails(load: Load, ids: string[]): (id: string) => CatalogDetail | undefined {
  const unique = [...new Set(ids)].sort();
  const keys = useLoad<Record<string, { inventoryType: string; itemId: number }>>(load, unique.length ? `/lol-store/v1/itemKeysFromInstanceIds?instanceIds=${encodeURIComponent(JSON.stringify(unique))}` : null);
  const keyList = keys ? Object.values(keys) : [];
  const details = useLoad<CatalogDetail[]>(load, keyList.length ? detailsUrl(keyList) : null);
  return (id) => {
    const k = keys?.[id];
    return (Array.isArray(details) ? details : []).find((d) => d.item?.itemInstanceId === id || (k && d.item?.itemId === k.itemId && d.item.inventoryType === k.inventoryType));
  };
}

/**
 * Compras da LCU são assíncronas: o POST devolve um id e o resultado sai em `url` (`Success` ou `Failure`).
 * Só lê com GET até sair ou estourar o prazo; nunca refaz a compra.
 */
export async function waitPurchase<T extends { status?: string }>(load: Load, url: string, timeoutMs = 15_000, stepMs = 500): Promise<T> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const p = await load<T>(url);
    if (p?.status === 'Success') return p;
    if (p?.status === 'Failure') throw new Error('purchase failed');
    if (Date.now() >= end) throw new Error('purchase timeout');
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

/** Tempo até `endMs` em "3 d 4 h", "5 h 20 min" ou "12 min"; null se já passou. */
export function timeLeft(endMs: number, now = Date.now()): string | null {
  const min = Math.floor((endMs - now) / 60000);
  if (min <= 0) return null;
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  if (d) return `${d} d ${h} h`;
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}

export const endsIn = (endMs: number) => {
  const left = timeLeft(endMs);
  return left ? t('lootEndsIn').replace('{t}', left) : null;
};

/** Troca `{chave}` pelos valores. */
export const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

/** Saldo de moedas do Santuário e da Loja Mítica, de `/lol-inventory/v1/wallet/0`. */
export function MythicWallet({ wallet, sparks = false }: { wallet: Record<string, number> | null | undefined; sparks?: boolean }) {
  const n = new Intl.NumberFormat(locale());
  return (
    <div class="rlc-lt-wallet">
      <span title={t('lootMythicEssence')}>
        <img src="/lol-game-data/assets/ASSETS/Loot/Mythic_Essence_490px.png" alt="" />
        <b>{n.format(wallet?.lol_mythic_essence ?? 0)}</b>
        <small>{t('lootMythicEssence')}</small>
      </span>
      {sparks ? (
        <span title={t('lootAncientSparks')}>
          <img src="/fe/lol-static-assets/images/currency/icons/ancient_spark.svg" alt="" />
          <b>{n.format(wallet?.lol_blessing_token ?? 0)}</b>
          <small>{t('lootAncientSparks')}</small>
        </span>
      ) : null}
    </div>
  );
}

const ROLLS = [1, 10] as const;
const sparksText = (n: number) => (n === 1 ? t('lootSpark1') : fill(t('lootSparksN'), { n }));

/** Entrada de catálogo das Centelhas da faixa, de `/lol-sanctum/v1/banners/{id}/token-catalog-entry` (só os campos usados). */
export interface TokenEntry {
  purchaseLimits?: Array<{ ruleId?: string; remaining?: number }>;
  purchaseUnits?: Array<{ paymentOptions?: Array<{ payments?: Array<{ name?: string; finalDelta?: number }> }> }>;
}
/** Pacotes de recarga. O oficial usa um contador de 1 até o limite; aqui atalhos, cortados pelo limite. */
export const SPARK_PACKS = [1, 5, 10, 20, 50] as const;
const RP_ICON = '/fe/lol-static-assets/images/icon-rp-72.png';
const SPARK_ICON = '/fe/lol-static-assets/images/currency/icons/ancient_spark.svg';

/** Preço em RP de uma Centelha (só se a forma de pagamento for RP) e quantas ainda dá para comprar. */
export function sparkOffer(entry: TokenEntry | null | undefined, limits: Record<string, { availableTokens?: number }> | null | undefined): { price: number; left: number } | null {
  const pay = entry?.purchaseUnits?.[0]?.paymentOptions?.[0]?.payments?.[0];
  if (pay?.name !== 'RP' || !pay.finalDelta) return null;
  const rule = entry?.purchaseLimits?.[0];
  const left = (rule?.ruleId ? limits?.[rule.ruleId]?.availableTokens : undefined) ?? rule?.remaining ?? 0;
  return { price: pay.finalDelta, left };
}

/**
 * Santuário: faixa em destaque (arte, skin, prazo, garantia), saldos e invocação x1/x10.
 * Cada invocação custa 1 Centelha Ancestral (o client oficial abre a recarga quando `saldo < quantidade`).
 * Fluxo como o oficial: `POST /lol-sanctum/v1/purchase/roll {quantity, bannerId}` devolve o id da compra;
 * o resultado sai em `/lol-sanctum/v1/purchases/{id}` (`rollResultNodeIds`, traduzidos pelas chances da faixa).
 * Centelhas com RP como o `purchaseTokens` oficial: `POST /lol-sanctum/v1/purchase/token {quantity, bannerId}`, mesmo acompanhamento.
 */
export function Sanctum({ load = getJson }: { load?: Load }) {
  const [rev, setRev] = useState(0);
  const banners = useLoad<SanctumBanner[]>(load, '/lol-sanctum/v1/banners', rev);
  const selected = useLoad<string>(load, '/lol-sanctum/v1/banners/selected/id');
  const wallet = useLoad<Record<string, number>>(load, '/lol-inventory/v1/wallet/0', rev);
  const list = (Array.isArray(banners) ? banners : []).filter((b) => !b.endDate || b.endDate * 1000 > Date.now());
  const skinKeys = list.filter((b) => b.bannerSkin?.id).map((b) => ({ inventoryType: 'CHAMPION_SKIN', itemId: b.bannerSkin!.id }));
  const details = useLoad<CatalogDetail[]>(load, skinKeys.length ? detailsUrl(skinKeys) : null);
  const [chosen, setChosen] = useState<string | null>(null);
  const banner: SanctumBanner | undefined = list.find((b) => b.id === chosen) ?? list.find((b) => b.id === selected) ?? list[0];
  // Sem as chances não dá para mostrar o que saiu: o oficial também trava a invocação até elas chegarem.
  const odds = useLoad<{ nodeIdToDropDetailsMap?: Record<string, SanctumDrop> }>(load, banner ? `/lol-sanctum/v1/banners/${encodeURIComponent(banner.id)}/odds` : null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [result, setResult] = useState<SanctumDrop[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenEntry = useLoad<TokenEntry>(load, banner ? `/lol-sanctum/v1/banners/${encodeURIComponent(banner.id)}/token-catalog-entry` : null);
  const limits = useLoad<Record<string, { availableTokens?: number }>>(load, '/lol-sanctum/v1/velocity-limits', rev);
  const offer = sparkOffer(tokenEntry, limits);
  const [packs, setPacks] = useState(false);
  const [sparkConfirm, setSparkConfirm] = useState<number | null>(null);
  const [sparkDone, setSparkDone] = useState<{ ok: boolean; text: string } | null>(null);

  const buySparks = useAction(async (quantity: number, bannerId: string) => {
    setSparkDone(null);
    try {
      const id = await request<string>('POST', '/lol-sanctum/v1/purchase/token', { quantity, bannerId });
      if (!id) throw new Error('no purchase id');
      await waitPurchase(load, `/lol-sanctum/v1/purchases/${encodeURIComponent(id)}`);
      setSparkDone({ ok: true, text: fill(t('lootSparkBought'), { cost: sparksText(quantity) }) });
    } catch {
      setSparkDone({ ok: false, text: t('lootSparkBuyError') });
    } finally {
      setRev((r) => r + 1);
    }
  });

  const roll = useAction(async (quantity: number, bannerId: string) => {
    setError(null);
    try {
      const id = await request<string>('POST', '/lol-sanctum/v1/purchase/roll', { quantity, bannerId });
      if (!id) throw new Error('no purchase id');
      const done = await waitPurchase<{ status?: string; rollResultNodeIds?: string[] }>(load, `/lol-sanctum/v1/purchases/${encodeURIComponent(id)}`);
      const map = odds?.nodeIdToDropDetailsMap ?? {};
      setResult((done.rollResultNodeIds ?? []).map((n) => map[n]).filter((d): d is SanctumDrop => !!d));
    } catch {
      setError(t('lootRollError'));
    } finally {
      // Saldo e garantia mudam (ou podem ter mudado) com a tentativa.
      setRev((r) => r + 1);
    }
  });

  if (banners === undefined) return <p class="rlc-muted rlc-lt-empty">{t('lootLoading')}</p>;
  if (!banner)
    return (
      <div class="rlc-lt-sanctum">
        <p class="rlc-muted rlc-lt-empty">{t('lootSanctumEmpty')}</p>
      </div>
    );

  const skin = (b: SanctumBanner) => (Array.isArray(details) ? details : []).find((d) => d.item?.itemId === b.bannerSkin?.id);
  // Nome técnico da skin (`DariusSkin64`) nunca aparece: sem o catálogo, a faixa fica sem nome.
  const name = (b: SanctumBanner) => skin(b)?.item?.name ?? '';
  const art = banner.bannerBackgroundTexture || skin(banner)?.assets?.splashPath;
  const left = banner.chasePityThreshold ? Math.max(0, banner.chasePityThreshold - (banner.pityCounter?.amount ?? 0)) : null;
  const end = banner.endDate ? endsIn(banner.endDate * 1000) : null;
  const sparks = wallet?.lol_blessing_token ?? 0;
  const rp = wallet?.RP ?? 0;
  const n = new Intl.NumberFormat(locale());

  return (
    <div class="rlc-lt-sanctum">
      <div class="rlc-lt-hero" style={art ? { backgroundImage: `url("${art}")` } : undefined}>
        <div class="rlc-lt-hero-in">
          <small class="rlc-lt-rarity" data-rarity="mythic">{t('lootTabSanctum')}</small>
          <h2>{name(banner)}</h2>
          {end ? <p class="rlc-lt-timer">{end}</p> : null}
          {left !== null ? <p class="rlc-lt-pity">{left > 1 ? t('lootPity').replace('{n}', String(left)) : t('lootPityNext')}</p> : null}
          <div class="rlc-lt-rolls">
            {ROLLS.map((q) => {
              const short = sparks < q;
              return (
                <button type="button" key={q} class="rlc-button rlc-lt-roll" data-variant={q === 10 ? 'primary' : undefined} disabled={short || !odds || roll.pending || buySparks.pending} title={short ? t('lootRollShort') : undefined} onClick={() => setConfirm(q)}>
                  <span>{roll.pending ? t('lootRolling') : fill(t('lootRoll'), { n: q })}</span>
                  <small>
                    <img src="/fe/lol-static-assets/images/currency/icons/ancient_spark.svg" alt="" />
                    {sparksText(q)}
                  </small>
                </button>
              );
            })}
          </div>
          {error ? (
            <p class="rlc-lt-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div class="rlc-lt-hero-side">
          <MythicWallet wallet={wallet} sparks />
          {offer ? (
            <button type="button" class="rlc-button rlc-lt-sparkbuy" disabled={buySparks.pending || roll.pending || offer.left <= 0} title={offer.left <= 0 ? t('lootSparkLimit') : undefined} onClick={() => setPacks(true)}>
              <img src={SPARK_ICON} alt="" />
              {buySparks.pending ? t('lootBuying') : t('lootSparkBuy')}
            </button>
          ) : null}
        </div>
      </div>
      {list.length > 1 ? (
        <div class="rlc-lt-banners">
          {list.map((b) => (
            <button type="button" key={b.id} aria-pressed={b === banner} aria-label={name(b) || t('lootTabSanctum')} disabled={roll.pending} onClick={() => setChosen(b.id)} style={b.bannerBackgroundTexture ? { backgroundImage: `url("${b.bannerBackgroundTexture}")` } : undefined}>
              <span>{name(b)}</span>
            </button>
          ))}
        </div>
      ) : null}
      {sparkDone ? (
        <p class={sparkDone.ok ? 'rlc-lt-done' : 'rlc-lt-error'} role={sparkDone.ok ? 'status' : 'alert'}>
          {sparkDone.text}
        </p>
      ) : null}
      {packs && offer ? (
        <SparkPacks
          offer={offer}
          rp={rp}
          onPick={(q) => {
            setPacks(false);
            setSparkConfirm(q);
          }}
          onClose={() => setPacks(false)}
        />
      ) : null}
      {sparkConfirm !== null && offer ? (
        <Confirm
          message={fill(t('lootSparkConfirm'), { cost: sparksText(sparkConfirm), price: n.format(sparkConfirm * offer.price), before: n.format(rp), after: n.format(rp - sparkConfirm * offer.price) })}
          confirmLabel={t('lootBuy')}
          onConfirm={() => {
            buySparks.run(sparkConfirm, banner.id);
            setSparkConfirm(null);
          }}
          onCancel={() => setSparkConfirm(null)}
        />
      ) : null}
      {confirm !== null ? (
        <Confirm
          message={fill(t('lootRollConfirm'), { n: confirm, banner: name(banner) || t('lootTabSanctum'), cost: sparksText(confirm), before: n.format(sparks), after: n.format(sparks - confirm) })}
          confirmLabel={fill(t('lootRoll'), { n: confirm })}
          onConfirm={() => {
            roll.run(confirm, banner.id);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {result ? <RollResults load={load} drops={result} onClose={() => setResult(null)} /> : null}
    </div>
  );
}

/** Pacotes de Centelhas com preço em RP; pacote acima do limite some, acima do saldo fica desligado. */
function SparkPacks({ offer, rp, onPick, onClose }: { offer: { price: number; left: number }; rp: number; onPick: (q: number) => void; onClose: () => void }) {
  useEscape(onClose);
  const n = new Intl.NumberFormat(locale());
  const packs = SPARK_PACKS.filter((q) => q <= offer.left);
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('lootSparkBuy')}>
      <div class="rlc-dialog rlc-lt-packs">
        <h2>{t('lootSparkBuy')}</h2>
        <p class="rlc-lt-packs-info">
          <span>
            <img src={RP_ICON} alt="" />
            {fill(t('lootSparkRp'), { rp: n.format(rp) })}
          </span>
          <small>{fill(t('lootSparkLeft'), { n: n.format(offer.left) })}</small>
        </p>
        <div class="rlc-lt-pack-list">
          {packs.map((q) => {
            const cost = q * offer.price;
            const short = cost > rp;
            return (
              <button type="button" key={q} class="rlc-lt-pack" disabled={short} title={short ? t('lootRpShort') : undefined} onClick={() => onPick(q)}>
                <span>
                  <img src={SPARK_ICON} alt="" />
                  {sparksText(q)}
                </span>
                <b>
                  <img src={RP_ICON} alt="" />
                  {n.format(cost)}
                </b>
              </button>
            );
          })}
        </div>
        {packs.length && packs[0]! * offer.price > rp ? <p class="rlc-lt-error">{t('lootRpShort')}</p> : null}
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** O que saiu da invocação, com nome e arte do catálogo; Essência Mítica aparece como moeda. */
function RollResults({ load, drops, onClose }: { load: Load; drops: SanctumDrop[]; onClose: () => void }) {
  const detail = useInstanceDetails(load, drops.filter((d) => d.type !== 'CURRENCY').map((d) => d.itemInstanceId));
  const n = new Intl.NumberFormat(locale());
  return (
    <div class="rlc-veil rlc-lt-reveal" role="dialog" aria-modal="true" aria-label={t('lootRollResults')}>
      <h2>{t('lootRollResults')}</h2>
      <div class="rlc-lt-reveal-cards">
        {drops.map((d, i) => {
          const essence = d.itemInstanceId === MYTHIC_ESSENCE_ID;
          const c = essence ? undefined : detail(d.itemInstanceId);
          const art = essence ? '/fe/lol-static-assets/images/currency/tokens/mythic_essence.png' : c?.assets?.tilePath || c?.item?.tilePath || c?.assets?.iconPath || c?.item?.imagePath;
          const label = essence ? `${n.format(d.quantity)} ${t('lootMythicEssence')}` : c?.item?.name || t('lootItem');
          return (
            <div key={i} class="rlc-lt-reveal-card" data-chase={d.isChaseItem ? 'true' : undefined} style={{ animationDelay: `${i * 120}ms` }}>
              {art ? <img src={art} alt="" /> : null}
              <span>
                {label}
                {!essence && d.quantity > 1 ? ` ×${n.format(d.quantity)}` : ''}
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" class="rlc-button" data-variant="primary" onClick={onClose}>
        {t('ok')}
      </button>
    </div>
  );
}
