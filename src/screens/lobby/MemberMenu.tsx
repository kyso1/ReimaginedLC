import { createPortal } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { useEscape } from '../../ui/useEscape';

export interface MenuItem {
  label: string;
  run: () => void;
}

/** Altura estimada de um item do menu (para decidir se abre para cima). */
const ITEM_H = 34;

/**
 * Botão ⋯ com uma lista de ações. Fecha ao escolher, ao clicar fora ou com Escape.
 * `floating`: a lista abre solta na tela (portal), junto ao botão, para não ser cortada por contêineres com rolagem
 * ou cantos arredondados (o placar); abre para cima quando não cabe embaixo.
 */
export function MemberMenu({ items, floating = false }: { items: MenuItem[]; floating?: boolean }) {
  const [open, setOpen] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    if (open) return setOpen(null);
    if (!floating) return setOpen({ right: 0 });
    const r = button.current!.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    const below = window.innerHeight - r.bottom;
    setOpen(below >= items.length * ITEM_H + 24 ? { top: r.bottom + 6, right } : { bottom: window.innerHeight - r.top + 6, right });
  };
  const list = open ? <MenuList items={items} close={() => setOpen(null)} place={floating ? open : null} /> : null;
  const root = floating ? document.getElementById('rlc-root') : null;
  return (
    <>
      <button type="button" ref={button} class="rlc-col-menu" aria-label={t('memberActions')} aria-expanded={!!open} onClick={toggle}>
        ⋯
      </button>
      {list && root ? createPortal(list, root) : list}
    </>
  );
}

function MenuList({ items, close, place }: { items: MenuItem[]; close: () => void; place: { top?: number; bottom?: number; right: number } | null }) {
  useEscape(close);
  const style = place ? { top: place.top !== undefined ? `${place.top}px` : 'auto', bottom: place.bottom !== undefined ? `${place.bottom}px` : 'auto', right: `${place.right}px` } : undefined;
  return (
    <>
      <div class="rlc-menu-backdrop" data-floating={place ? 'true' : undefined} onClick={close} />
      <div class="rlc-menu" role="menu" data-floating={place ? 'true' : undefined} style={style}>
        {items.map((item) => (
          <button
            type="button"
            role="menuitem"
            key={item.label}
            onClick={() => {
              close();
              item.run();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
