import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Menu pequeno do tema (o das filas do histórico): a pílula desliza até a opção sob o mouse e volta para a escolhida.
 * Fecha com clique fora de `box` (o contêiner com o botão que abre o menu).
 */
export function PillMenu<T extends string>({ box, options, value, onPick, onClose }: { box: RefObject<HTMLElement | null>; options: Array<[T, string]>; value: T; onPick: (v: T) => void; onClose: () => void }) {
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const away = (e: Event) => box.current?.contains(e.target as Node) || onClose();
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, []);
  const index = Math.max(0, options.findIndex(([v]) => v === value));
  return (
    <div class="rlc-pf-menu" role="listbox" style={{ '--i': String(hover ?? index) }} onPointerLeave={() => setHover(null)}>
      <i class="rlc-pf-menu-pill" aria-hidden="true" />
      {options.map(([v, label], i) => (
        <button
          type="button"
          role="option"
          key={v}
          aria-selected={v === value}
          data-pill={i === (hover ?? index) ? 'true' : undefined}
          onPointerEnter={() => setHover(i)}
          onClick={() => (onPick(v), onClose())}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Campo de escolha do tema no lugar do `<select>` nativo (que trava no client): mostra a opção atual e abre o `PillMenu`. */
export function PillSelect<T extends string>({ label, options, value, onChange }: { label: string; options: Array<[T, string]>; value: T; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  return (
    <div class="rlc-pill-select" ref={box} data-open={open ? 'true' : undefined}>
      <button type="button" class="rlc-input" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{options.find(([v]) => v === value)?.[1] ?? ''}</span>
        <svg class="rlc-pf-caret" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open ? <PillMenu box={box} options={options} value={value} onPick={onChange} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
