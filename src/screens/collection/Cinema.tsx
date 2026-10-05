import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { useDecoded } from '../../ui/useDecoded';

export interface CinemaItem {
  id: number | string;
  name: string;
  /** Imagem do cartão no trilho. */
  tile: string;
  /** Imagem de fundo em tela cheia quando em foco; sem ela, o fundo usa o cartão desfocado. */
  splash?: string;
  owned: boolean;
  /** Linha pequena acima do nome (título do campeão, raridade). */
  kicker?: string;
  /** Linha abaixo do nome. */
  detail?: string;
}

/**
 * Linguagem cinematográfica da Coleção: o item em foco ocupa a tela (fundo, nome grande),
 * o trilho de cartões fica na base, os chips trocam a seção. Passar o mouse num cartão muda o foco.
 */
export function Cinema({ items, chips, onEnter, extra, square = false }: { items: CinemaItem[]; chips: ComponentChildren; onEnter?: (item: CinemaItem) => void; extra?: (item: CinemaItem) => ComponentChildren; square?: boolean }) {
  const [focusId, setFocusId] = useState<CinemaItem['id'] | null>(null);
  const focus = items.find((i) => i.id === focusId) ?? items[0];
  const bg = useDecoded(focus ? (focus.splash ?? focus.tile) : null);
  return (
    <div class="rlc-cn" data-square={square ? 'true' : undefined}>
      <div class="rlc-cn-bg" key={bg ?? 'none'} data-blur={focus && !focus.splash ? 'true' : undefined} style={bg ? { backgroundImage: `url("${bg}")` } : undefined} />
      {focus ? (
        <div class="rlc-cn-focus">
          {focus.kicker ? <small class="rlc-cn-kicker">{focus.kicker}</small> : null}
          <h1 class="rlc-cn-title">{focus.name}</h1>
          {focus.detail ? <p class="rlc-cn-detail">{focus.detail}</p> : null}
          {extra?.(focus)}
        </div>
      ) : null}
      <div class="rlc-cn-chips">{chips}</div>
      <div class="rlc-cn-strip">
        {items.map((i) => (
          <button
            type="button"
            key={i.id}
            class="rlc-cn-card"
            aria-label={i.name}
            title={i.name}
            data-owned={i.owned ? 'true' : 'false'}
            aria-pressed={i === focus}
            style={i.tile ? { backgroundImage: `url("${i.tile}")` } : undefined}
            onMouseEnter={() => setFocusId(i.id)}
            onFocus={() => setFocusId(i.id)}
            onClick={() => onEnter?.(i)}
          >
            <span>{i.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Chip de alternância da Coleção. */
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ComponentChildren }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
