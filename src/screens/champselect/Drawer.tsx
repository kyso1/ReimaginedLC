import { createPortal, type ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { RoleIcon } from '../../ui/RoleIcon';
import { positionKey } from '../lobby/format';

/** Grade de campeões por cima do palco, com título e o botão de fechar (Esc também fecha). */
export function Drawer({ onClose, children }: { onClose: () => void; children: ComponentChildren }) {
  return (
    <div class="rlc-cs-drawer">
      <div class="rlc-cs-drawer-head">
        <h2>{t('tabChampions')}</h2>
        <button type="button" class="rlc-cs-drawer-close" aria-label={t('csDrawerClose')} title={t('csDrawerClose')} onClick={onClose}>
          ✕
        </button>
      </div>
      {children}
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
  /** Campeão sob o mouse (null ao sair da grade): o palco mostra a splash dele. */
  onHover?: (id: number | null) => void;
}

/** Grade de campeões permitidos: busca por nome, separador por rota e favoritos da rota na frente. */
export function ChampionGrid({ ids, champions, selected, onPick, lanes, favorites, initialLane, onFavorite, onHover }: GridProps) {
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Lane | null>(initialLane);
  // Menu do clique direito (ou tecla de menu / Shift+F10): ponto de abertura e o botão para devolver o foco.
  const [menu, setMenu] = useState<{ id: number; x: number; y: number; from: HTMLElement } | null>(null);
  const openMenu = (e: MouseEvent | KeyboardEvent, id: number) => {
    e.preventDefault();
    const from = e.currentTarget as HTMLElement;
    const r = from.getBoundingClientRect();
    // Pelo teclado não há ponteiro: abre sob o campeão.
    const mouse = e instanceof MouseEvent && (e.clientX || e.clientY);
    setMenu({ id, x: mouse ? e.clientX : r.left, y: mouse ? e.clientY : r.bottom, from });
  };
  const closeMenu = () => {
    menu?.from.focus();
    setMenu(null);
  };
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
          <button type="button" key={l} class="rlc-queue-chip rlc-cs-lane" aria-pressed={lane === l} onClick={() => setLane(lane === l ? null : l)}>
            <RoleIcon role={l} />
            {t(positionKey(l)!)}
          </button>
        ))}
      </div>
      <div class="rlc-cs-grid" onMouseLeave={() => onHover?.(null)}>
        {list.map((c) => (
          <div key={c.id} class="rlc-cs-tile">
            <button type="button" class="rlc-cs-champ" aria-label={c.name} title={c.name} aria-pressed={c.id === selected} onMouseEnter={() => onHover?.(c.id)} onClick={() => onPick(c.id)}
              onContextMenu={(e) => openMenu(e, c.id)}
              onKeyDown={(e) => (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && openMenu(e, c.id)}
            >
              {c.icon ? <img src={c.icon} alt="" loading="lazy" decoding="async" /> : null}
            </button>
            <span class="rlc-cs-tile-name" aria-hidden="true">
              {c.name}
            </span>
            {lane ? (
              <button type="button" class="rlc-cs-fav" aria-label={t('favorite')} title={t('favorite')} aria-pressed={isFav(c.id)} onClick={() => onFavorite(c.id, lane)}>
                ★
              </button>
            ) : (favorites.get(c.id)?.length ?? 0) > 0 ? (
              <span class="rlc-cs-fav-mark" aria-hidden="true">
                ★
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {menu ? (
        <FavMenu
          name={champions.get(menu.id)?.name ?? ''}
          at={menu}
          favorited={favorites.get(menu.id) ?? []}
          onToggle={(l) => {
            onFavorite(menu.id, l);
            closeMenu();
          }}
          onClose={closeMenu}
        />
      ) : null}
    </div>
  );
}

const MARGIN = 8;
const fit = (at: number, size: number, room: number) => Math.max(MARGIN, Math.min(at, room - size - MARGIN));

/**
 * Menu flutuante do campeão, como no client oficial: favoritar ou desfavoritar em cada rota. Vai para a raiz da
 * camada (o vidro da grade prende `position: fixed`), fica dentro da tela e fecha no Esc, no clique fora ou ao escolher.
 */
function FavMenu({ name, at, favorited, onToggle, onClose }: { name: string; at: { x: number; y: number }; favorited: string[]; onToggle: (lane: Lane) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: at.x, y: at.y });
  useLayoutEffect(() => {
    const el = ref.current!;
    setPos({ x: fit(at.x, el.offsetWidth, innerWidth), y: fit(at.y, el.offsetHeight, innerHeight) });
    el.querySelector<HTMLElement>('[role="menuitemcheckbox"]')?.focus();
  }, [at.x, at.y]);
  const onKey = (e: KeyboardEvent) => {
    // O Esc é do menu: não chega à seleção, que fecharia a grade.
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...ref.current!.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
    }
  };
  return createPortal(
    <>
      <div
        class="rlc-cs-ctx-backdrop"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div ref={ref} class="rlc-cs-ctx" role="menu" aria-label={name} style={{ left: pos.x, top: pos.y }} onKeyDown={onKey}>
        <p class="rlc-cs-ctx-title" aria-hidden="true">
          {name}
        </p>
        {LANES.map((l) => (
          <button type="button" key={l} role="menuitemcheckbox" aria-checked={favorited.includes(l.toLowerCase())} onClick={() => onToggle(l)}>
            <RoleIcon role={l} />
            <span>
              {t('csFavFor')} {t(positionKey(l)!)}
            </span>
            <span class="rlc-cs-ctx-check" aria-hidden="true">
              ★
            </span>
          </button>
        ))}
      </div>
    </>,
    document.getElementById('rlc-root') ?? document.body,
  );
}
