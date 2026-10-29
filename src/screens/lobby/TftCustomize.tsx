import { useEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { supports } from '../../lcu/capabilities';
import { request } from '../../lcu/request';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';

interface Item {
  itemId: number;
  /** Chave dos favoritos (`/lol-cosmetics/v1/favorites/tft/{aba}/{contentId}`). */
  contentId?: string;
  name: string;
  owned: boolean;
  loadoutsIcon?: string;
  selected?: boolean;
  description?: string;
  /** kStandard, kEpic, kLegendary, kMythic, kPrestige... */
  TFTRarity?: string;
  /** Espécie da Pequena Lenda. */
  species?: string;
}
interface Inventory {
  groups?: Array<{ groupName?: string; items?: Item[] }>;
}

/**
 * Aba: inventório, tipo do PUT de seleção, se os grupos da LCU viram seções (só espécies e temas de arena
 * têm nomes que valem; os outros vêm vazios ou com nome de teste) e se a miniatura é larga (3:2).
 */
type Tab = { key: string; label: TextKey; selection: string; grouped: boolean; wide?: boolean };
const TABS: Tab[] = [
  { key: 'companions', label: 'tftLegend', selection: 'companion', grouped: true, wide: true },
  { key: 'map-skins', label: 'tftArena', selection: 'tft-map-skin', grouped: true },
  { key: 'damage-skins', label: 'tftBoom', selection: 'tft-damage-skin', grouped: false },
  { key: 'zoom-skins', label: 'tftZoom', selection: 'tft-zoom-skin', grouped: false },
];

type Filter = 'owned' | 'favorites' | 'all';
const FILTERS: Array<[Filter, TextKey]> = [
  ['owned', 'tftOwned'],
  ['favorites', 'favorites'],
  ['all', 'tftAll'],
];

/** Raridade da LCU para a chave de cor (mesmos nomes da Loja) e o texto. Padrão não mostra nada. */
const RARITY: Record<string, [string, TextKey]> = {
  kEpic: ['epic', 'storeRarityEpic'],
  kLegendary: ['legendary', 'storeRarityLegendary'],
  kMythic: ['mythic', 'storeRarityMythic'],
  kPrestige: ['prestige', 'tftRarityPrestige'],
};

/** Personalizar do lobby de TFT: abas por tipo, prévia grande à esquerda e grade com busca e filtro. */
export function TftCustomize({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  const [tab, setTab] = useState(TABS[0]!);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('owned');
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [focus, setFocus] = useState<number | null>(null);
  // Aba atual num ref: respostas de outra aba (troca rápida, equipar em voo) são descartadas.
  const current = useRef(tab);
  current.current = tab;
  const load = (from: Tab) => getJson<Inventory>(`/lol-cosmetics/v1/inventories/tft/${from.key}`).then((inv) => current.current === from && setInventory(inv));
  useEffect(() => {
    setInventory(null);
    setFavorites(new Set());
    setFocus(null);
    void load(tab);
    void loadFavorites(tab);
  }, [tab]);
  function loadFavorites(from: Tab) {
    return getJson<{ favoriteItems?: Item[] }>(`/lol-cosmetics/v1/favorites/tft/${from.key}`).then(
      (f) => current.current === from && setFavorites(new Set((f?.favoriteItems ?? []).map((i) => i.itemId))),
    );
  }
  // Favoritar como no client: PUT marca, DELETE desmarca; a marca só muda com os favoritos relidos.
  const favorite = useAction(async (it: Item) => {
    const from = tab;
    await request(favorites.has(it.itemId) ? 'DELETE' : 'PUT', `/lol-cosmetics/v1/favorites/tft/${from.key}/${encodeURIComponent(it.contentId!)}`);
    await loadFavorites(from);
  });
  // Sem UI otimista: a marca de equipado vem do inventário relido depois do PUT.
  const equip = useAction(async (itemId: number) => {
    const from = tab;
    await request('PUT', `/lol-cosmetics/v1/selection/${from.selection}`, itemId);
    await load(from);
  });

  const q = query.trim().toLowerCase();
  const groups = inventory?.groups ?? [];
  const every = groups.flatMap((g) => g.items ?? []);
  const equipped = every.find((i) => i.selected) ?? null;
  const shown = every.find((i) => i.itemId === focus) ?? equipped;
  const keep = (items: Item[]) =>
    items.filter((i) => (filter === 'all' || (filter === 'owned' ? i.owned : favorites.has(i.itemId))) && (!q || i.name.toLowerCase().includes(q)));
  const sections: Array<[string, Item[]]> = (tab.grouped ? groups.map((g) => [g.groupName || t(tab.label), keep(g.items ?? [])] as [string, Item[]]) : [['', keep(every)] as [string, Item[]]]).filter(
    ([, items]) => items.length > 0,
  );

  const pick = (it: Item) => {
    setFocus(it.itemId);
    if (it.owned && !it.selected) equip.run(it.itemId);
  };

  return (
    <div class="rlc-tft-drawer" role="dialog" aria-label={t('tftCustomize')}>
      <header class="rlc-tft-head">
        <div class="rlc-tft-tabs" role="tablist">
          {TABS.map((tb) => (
            <button type="button" role="tab" key={tb.key} aria-selected={tb === tab} onClick={() => setTab(tb)}>
              {t(tb.label)}
            </button>
          ))}
        </div>
        <button type="button" class="rlc-button" data-variant="pill" onClick={onClose}>
          {t('close')}
        </button>
      </header>
      <aside class="rlc-tft-preview" aria-live="polite">
        {shown ? (
          <>
            <div class="rlc-tft-art" data-wide={tab.wide ? 'true' : undefined}>
              {shown.loadoutsIcon ? <img key={shown.itemId} src={shown.loadoutsIcon} alt="" /> : null}
            </div>
            <h3>{shown.name.trim()}</h3>
            <p class="rlc-tft-meta">
              {RARITY[shown.TFTRarity ?? ''] ? <span data-rarity={RARITY[shown.TFTRarity!]![0]}>{t(RARITY[shown.TFTRarity!]![1])}</span> : null}
              {shown.species && shown.species !== shown.name ? <span>{shown.species}</span> : null}
            </p>
            {shown.description?.trim() ? <p class="rlc-tft-desc">{shown.description.trim()}</p> : null}
            <p class="rlc-tft-state" data-state={shown.selected ? 'on' : shown.owned ? undefined : 'locked'}>
              {shown.selected ? t('tftEquipped') : shown.owned ? t('clickToEquip') : t('tftNotOwned')}
            </p>
            {shown.owned && shown.contentId && supports('PUT', '/lol-cosmetics/v1/favorites/tft/{cosmeticType}/{contentId}') ? (
              <button type="button" class="rlc-button rlc-tft-favorite" data-variant="pill" aria-pressed={favorites.has(shown.itemId)} disabled={favorite.pending} onClick={() => favorite.run(shown)}>
                {favorites.has(shown.itemId) ? `♥ ${t('tftUnfavorite')}` : `♡ ${t('tftFavorite')}`}
              </button>
            ) : null}
          </>
        ) : null}
      </aside>
      <div class="rlc-tft-main">
        <div class="rlc-tft-tools">
          <input type="search" class="rlc-input" placeholder={t('tftSearch')} aria-label={t('search')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
          <div class="rlc-tft-filter" role="radiogroup" aria-label={t('tftFilter')}>
            {FILTERS.map(([key, label]) => (
              <button type="button" role="radio" key={key} aria-checked={filter === key} onClick={() => setFilter(key)}>
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <div class="rlc-tft-body">
          {inventory === null ? (
            <p class="rlc-muted">{t('tftLoading')}</p>
          ) : sections.length === 0 ? (
            <p class="rlc-muted">{filter === 'favorites' && !q ? t('tftNoFavorites') : t('nothingFound')}</p>
          ) : null}
          {sections.map(([name, items], i) => (
            <section key={`${i}-${name}`} class="rlc-tft-section">
              {name ? (
                <h4>
                  {name} <small>{items.length}</small>
                </h4>
              ) : null}
              <div class="rlc-tft-grid" data-wide={tab.wide ? 'true' : undefined}>
                {items.map((it) => (
                  <button
                    type="button"
                    key={it.itemId}
                    class="rlc-tft-item"
                    aria-label={it.name.trim()}
                    title={it.name.trim()}
                    aria-pressed={it.selected === true}
                    data-focus={shown?.itemId === it.itemId ? 'true' : undefined}
                    data-locked={it.owned ? undefined : 'true'}
                    data-rarity={RARITY[it.TFTRarity ?? '']?.[0]}
                    disabled={equip.pending}
                    onClick={() => pick(it)}
                  >
                    <span class="rlc-tft-thumb">{it.loadoutsIcon ? <img src={it.loadoutsIcon} alt="" loading="lazy" decoding="async" /> : null}</span>
                    <span class="rlc-tft-name">{it.name.trim()}</span>
                    {favorites.has(it.itemId) ? <span class="rlc-tft-fav" title={t('favorites')} aria-hidden="true">♥</span> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
