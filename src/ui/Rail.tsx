import { Fragment } from 'preact';

export interface RailItem {
  id: string;
  label: string;
  active?: boolean;
  onSelect: () => void;
}

// Ícones de traço simples (24x24), por id de item. Item sem ícone mostra a inicial.
const ICONS: Record<string, string> = {
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  lobby: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5m0-1c1-2 3-4 5-4 2 0 3 1 3 3',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9c0-4 3-6 7-6s7 2 7 6',
  collection: 'M4 6h7v7H4zm9 0h7v7h-7zM4 15h7v5H4zm9 0h7v5h-7z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-3 2-1-2-4-2 1-2-1-1-2h-4l-1 2-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1 1 2h4l1-2 2-1 2 1 2-4-2-1z',
  champselect: 'M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z',
  ingame: 'M6 4l14 8-14 8z',
  honor: 'M12 21 4 13a5 5 0 0 1 8-6 5 5 0 0 1 8 6z',
  postgame: 'M8 4h8v5a4 4 0 0 1-8 0zm4 9v4m-4 3h8M5 5H3a3 3 0 0 0 5 4m11-4h2a3 3 0 0 1-5 4',
  original: 'M14 4h6v6m0-6-9 9M18 14v6H4V6h6',
};

/** Trilho lateral. O último item fica no pé do trilho. Cada item mostra um ícone e tem o rótulo como nome acessível. */
export function Rail({ items }: { items: RailItem[] }) {
  return (
    <nav class="rlc-rail">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i === items.length - 1 && items.length > 1 ? <div class="rlc-rail-spacer" /> : null}
          <button type="button" class="rlc-rail-item" title={item.label} aria-label={item.label} aria-current={item.active ? 'page' : undefined} onClick={item.onSelect}>
            {ICONS[item.id] ? (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d={ICONS[item.id]} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
              </svg>
            ) : (
              item.label.charAt(0).toUpperCase()
            )}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
