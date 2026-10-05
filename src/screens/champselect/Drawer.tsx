import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Champion } from '../../data/gamedata';

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

const ROLES = ['assassin', 'fighter', 'mage', 'marksman', 'support', 'tank'] as const;

/** Grade de campeões permitidos, com busca por nome e filtro por classe. */
export function ChampionGrid({ ids, champions, selected, onPick }: { ids: number[]; champions: Map<number, Champion>; selected: number; onPick: (id: number) => void }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const list = ids
    .map((id) => champions.get(id) ?? { id, name: String(id), icon: '', roles: [] })
    .filter((c) => (!q || c.name.toLowerCase().includes(q)) && (!role || c.roles.includes(role)))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div class="rlc-cs-grid-wrap">
      <div class="rlc-cs-filters">
        <input type="search" class="rlc-input" placeholder={t('searchChampion')} aria-label={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        {ROLES.map((r) => (
          <button type="button" key={r} class="rlc-queue-chip" aria-pressed={role === r} onClick={() => setRole(role === r ? null : r)}>
            {t(`role_${r}` as TextKey)}
          </button>
        ))}
      </div>
      <div class="rlc-cs-grid">
        {list.map((c) => (
          <button type="button" key={c.id} class="rlc-cs-champ" aria-label={c.name} title={c.name} aria-pressed={c.id === selected} onClick={() => onPick(c.id)}>
            {c.icon ? <img src={c.icon} alt="" /> : <span>{c.name}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
