import { Fragment } from 'preact';

export interface RailItem {
  id: string;
  label: string;
  active?: boolean;
  /** Ponto dourado: há algo para resgatar ali. */
  dot?: boolean;
  onSelect: () => void;
}

// Ícones de traço simples (24x24), por id de item. Item sem ícone mostra a inicial.
const ICONS: Record<string, string> = {
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  // Duas pessoas: a da frente inteira; a de trás só aparece à direita (cabeça menor e o ombro), sem se cruzarem.
  lobby: 'M9 11.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM3 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6M16.3 10.6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.2 14.4c2.2.4 3.8 2.3 3.8 4.9',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9c0-4 3-6 7-6s7 2 7 6',
  collection: 'M4 6h7v7H4zm9 0h7v7h-7zM4 15h7v5H4zm9 0h7v5h-7z',
  // Baú: tampa arqueada, corpo e fecho.
  loot: 'M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 0V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2m-10 0v3h4v-3',
  events: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  store: 'M5 8h14l-1 12H6zm4 0V6a3 3 0 0 1 6 0v2',
  // Troféu do Clash: taça com alças, haste e base.
  clash: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3m-5 4v3m-4 3h8l-1-3H9z',
  // Engrenagem do Feather Icons (MIT).
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
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
            {item.dot ? <span class="rlc-rail-dot" aria-hidden="true" /> : null}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
