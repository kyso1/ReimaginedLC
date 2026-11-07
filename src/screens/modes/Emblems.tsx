import type { ModeGroupId } from './queues';

/**
 * Emblema de cada modo, os mesmos do seletor do client (Rift em losango com o rio, ponte do ARAM, frasco da Arena)
 * redesenhados só em traço; o Rift Clássico usa o losango do Rift. `data-part="core"` é o miolo que se acende no cartão escolhido.
 */
export function ModeEmblem({ id }: { id: ModeGroupId | 'custom' }) {
  return (
    <svg class="rlc-emblem" viewBox="0 0 64 64" aria-hidden="true">
      {id === 'sr' || id === 'classic' ? (
        <g>
          <rect x="9" y="9" width="46" height="46" rx="11" />
          <rect data-part="core" x="16" y="16" width="32" height="32" rx="6" />
          <path d="M20 44 44 20" data-part="river" />
        </g>
      ) : null}
      {id === 'aram' ? (
        <g>
          <path d="M10 42 36 10h18v12L28 54H10z" />
          <path data-part="core" d="M17 42 38 17h9v4L26 47h-9z" />
        </g>
      ) : null}
      {id === 'other' ? (
        <g>
          <path d="M25 8h14M28 8v14L13 49a4 4 0 0 0 3.5 6h31a4 4 0 0 0 3.5-6L36 22V8" />
          <path data-part="core" d="M20 40h24l5 9a2 2 0 0 1-2 3H17a2 2 0 0 1-2-3z" />
        </g>
      ) : null}
      {id === 'custom' ? (
        <g>
          <rect x="9" y="9" width="46" height="46" rx="11" stroke-dasharray="4 4" />
          <path data-part="core" d="M32 21v22M21 32h22" />
        </g>
      ) : null}
    </svg>
  );
}

/** Tamanho dos times, como o client mostra acima do nome. */
export const TEAM_SIZE: Partial<Record<ModeGroupId, string>> = { sr: '5v5', classic: '5v5', aram: '5v5' };
