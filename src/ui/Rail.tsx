import { Fragment } from 'preact';

export interface RailItem {
  id: string;
  label: string;
  active?: boolean;
  onSelect: () => void;
}

/** Trilho lateral. O último item fica no pé do trilho. Cada item mostra a inicial e tem o rótulo como nome acessível. */
export function Rail({ items }: { items: RailItem[] }) {
  return (
    <nav class="rlc-rail">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i === items.length - 1 && items.length > 1 ? <div class="rlc-rail-spacer" /> : null}
          <button type="button" class="rlc-rail-item" title={item.label} aria-label={item.label} aria-current={item.active ? 'page' : undefined} onClick={item.onSelect}>
            {item.label.charAt(0).toUpperCase()}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
