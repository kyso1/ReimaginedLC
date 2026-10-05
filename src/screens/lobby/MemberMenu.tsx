import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { useEscape } from '../../ui/useEscape';

export interface MenuItem {
  label: string;
  run: () => void;
}

/** Botão ⋯ com uma lista de ações. Fecha ao escolher, ao clicar fora ou com Escape. */
export function MemberMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" class="rlc-col-menu" aria-label={t('memberActions')} aria-expanded={open} onClick={() => setOpen(!open)}>
        ⋯
      </button>
      {open ? <MenuList items={items} close={() => setOpen(false)} /> : null}
    </>
  );
}

function MenuList({ items, close }: { items: MenuItem[]; close: () => void }) {
  useEscape(close);
  return (
    <>
      <div class="rlc-menu-backdrop" onClick={close} />
      <div class="rlc-menu" role="menu">
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
