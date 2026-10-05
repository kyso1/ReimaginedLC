import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';

interface Item {
  itemId: number;
  name: string;
  owned: boolean;
  loadoutsIcon?: string;
  selected?: boolean;
}
interface Inventory {
  groups?: Array<{ groupName?: string; items?: Item[] }>;
}

/** Aba: inventório, favoritos (só os tipos que têm) e o tipo do PUT de seleção. */
const TABS: Array<{ key: string; label: TextKey; favorites: boolean; selection: string }> = [
  { key: 'companions', label: 'tftLegend', favorites: true, selection: 'companion' },
  { key: 'map-skins', label: 'tftArena', favorites: true, selection: 'tft-map-skin' },
  { key: 'damage-skins', label: 'tftBoom', favorites: true, selection: 'tft-damage-skin' },
  { key: 'zoom-skins', label: 'tftZoom', favorites: true, selection: 'tft-zoom-skin' },
  { key: 'playbooks', label: 'tftPlaybook', favorites: false, selection: 'playbook' },
  { key: 'augment-pillars', label: 'tftPillar', favorites: false, selection: 'tft-augment-pillar' },
];

/** Gaveta Personalizar do lobby de TFT: busca e seções horizontais (Favoritos, depois os grupos da LCU). */
export function TftCustomize({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  const [tab, setTab] = useState(TABS[0]!);
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const load = () => getJson<Inventory>(`/lol-cosmetics/v1/inventories/tft/${tab.key}`).then(setInventory);
  useEffect(() => {
    setInventory(null);
    setFavorites([]);
    void load();
    if (tab.favorites) void getJson<{ favoriteItems?: Item[] }>(`/lol-cosmetics/v1/favorites/tft/${tab.key}`).then((f) => setFavorites(f?.favoriteItems ?? []));
  }, [tab]);
  // Sem UI otimista: a marca de equipado vem do inventário relido depois do PUT.
  const equip = useAction(async (itemId: number) => {
    await request('PUT', `/lol-cosmetics/v1/selection/${tab.selection}`, itemId);
    await load();
  });

  const q = query.trim().toLowerCase();
  const groups = inventory?.groups ?? [];
  const selected = new Set(groups.flatMap((g) => g.items ?? []).filter((i) => i.selected).map((i) => i.itemId));
  const keep = (items: Item[]) => items.filter((i) => i.owned && (!q || i.name.toLowerCase().includes(q)));
  const sections: Array<[string, Item[]]> = [
    [t('favorites'), keep(favorites)] as [string, Item[]],
    ...groups.map((g) => [g.groupName || t(tab.label), keep(g.items ?? [])] as [string, Item[]]),
  ].filter(([, items]) => items.length > 0);

  return (
    <div class="rlc-tft-drawer" role="dialog" aria-label={t('tftCustomize')}>
      <header class="rlc-tft-head">
        <div class="rlc-cs-tabs" role="tablist">
          {TABS.map((tb) => (
            <button type="button" role="tab" key={tb.key} aria-selected={tb === tab} onClick={() => setTab(tb)}>
              {t(tb.label)}
            </button>
          ))}
        </div>
        <input type="search" class="rlc-input" placeholder={t('search')} aria-label={t('search')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        <button type="button" class="rlc-button" onClick={onClose}>
          {t('close')}
        </button>
      </header>
      <div class="rlc-tft-body">
        {inventory === null ? <p class="rlc-muted">{t('loadingQueues')}</p> : sections.length === 0 ? <p class="rlc-muted">{t('nothingFound')}</p> : null}
        {sections.map(([name, items], i) => (
          <section key={`${i}-${name}`} class="rlc-tft-section">
            <h4>{name}</h4>
            <div class="rlc-tft-row">
              {items.map((it) => (
                <button type="button" key={it.itemId} class="rlc-tft-item" aria-label={it.name} title={it.name} aria-pressed={selected.has(it.itemId)} disabled={equip.pending} onClick={() => equip.run(it.itemId)}>
                  {it.loadoutsIcon ? <img src={it.loadoutsIcon} alt="" loading="lazy" /> : null}
                  <span>{it.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
