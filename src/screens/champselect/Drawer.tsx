import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { positionKey } from '../lobby/format';

export type Tab = 'champions' | 'skins' | 'runes';
const TABS: Array<[Tab, TextKey]> = [
  ['champions', 'tabChampions'],
  ['skins', 'tabSkins'],
  ['runes', 'tabRunes'],
];

/** Gaveta inferior com abas. O conteúdo de cada aba vem de quem usa. */
export function Drawer({ tab, onTab, children, action }: { tab: Tab; onTab: (tab: Tab) => void; children: ComponentChildren; action?: ComponentChildren }) {
  return (
    <div class="rlc-cs-drawer">
      <div class="rlc-cs-tabs" role="tablist">
        {TABS.map(([id, key]) => (
          <button type="button" key={id} role="tab" aria-selected={tab === id} onClick={() => onTab(id)}>
            {t(key)}
          </button>
        ))}
        <div class="rlc-cs-action">{action}</div>
      </div>
      <div class="rlc-cs-panel" role="tabpanel">
        {children}
      </div>
    </div>
  );
}

export const LANES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const;
export type Lane = (typeof LANES)[number];

interface GridProps {
  ids: number[];
  champions: Map<number, Champion>;
  selected: number;
  onPick: (id: number) => void;
  /** Rotas recomendadas pela Riot por campeão (id em texto → posições em maiúsculas). */
  lanes: Record<string, { recommendedPositions?: string[] }>;
  /** Rotas favoritadas por campeão, em minúsculas, como a LCU manda. */
  favorites: Map<number, string[]>;
  initialLane: Lane | null;
  onFavorite: (id: number, lane: Lane) => void;
}

/** Grade de campeões permitidos: busca por nome, separador por rota e favoritos da rota na frente. */
export function ChampionGrid({ ids, champions, selected, onPick, lanes, favorites, initialLane, onFavorite }: GridProps) {
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Lane | null>(initialLane);
  const q = query.trim().toLowerCase();
  const isFav = (id: number) => lane !== null && (favorites.get(id) ?? []).includes(lane.toLowerCase());
  const list = ids
    .filter((id) => id > 0)
    .map((id) => champions.get(id) ?? { id, name: String(id), icon: '', roles: [] })
    // Campeão sem rota recomendada (dados ausentes, campeão novo) continua visível em qualquer rota.
    .filter((c) => (!q || c.name.toLowerCase().includes(q)) && (!lane || !lanes[String(c.id)]?.recommendedPositions?.length || lanes[String(c.id)]!.recommendedPositions!.includes(lane)))
    .sort((a, b) => Number(isFav(b.id)) - Number(isFav(a.id)) || a.name.localeCompare(b.name));
  return (
    <div class="rlc-cs-grid-wrap">
      <div class="rlc-cs-filters">
        <input type="search" class="rlc-input" placeholder={t('searchChampion')} aria-label={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        {LANES.map((l) => (
          <button type="button" key={l} class="rlc-queue-chip" aria-pressed={lane === l} onClick={() => setLane(lane === l ? null : l)}>
            {t(positionKey(l)!)}
          </button>
        ))}
      </div>
      <div class="rlc-cs-grid">
        {list.map((c) => (
          <div key={c.id} class="rlc-cs-tile">
            <button type="button" class="rlc-cs-champ" aria-label={c.name} title={c.name} aria-pressed={c.id === selected} onClick={() => onPick(c.id)}>
              {c.icon ? <img src={c.icon} alt="" /> : <span>{c.name}</span>}
            </button>
            {lane ? (
              <button type="button" class="rlc-cs-fav" aria-label={t('favorite')} title={t('favorite')} aria-pressed={isFav(c.id)} onClick={() => onFavorite(c.id, lane)}>
                ★
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
