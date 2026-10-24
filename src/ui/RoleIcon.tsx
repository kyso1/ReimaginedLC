import type { JSX } from 'preact';

export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | 'FILL' | 'UNSELECTED';

// Nomes que chegam da LCU, da OP.GG e do histórico para as rotas do client.
const ALIASES: Record<string, Role> = { TOP: 'TOP', JUNGLE: 'JUNGLE', MIDDLE: 'MIDDLE', MID: 'MIDDLE', BOTTOM: 'BOTTOM', ADC: 'BOTTOM', BOT: 'BOTTOM', UTILITY: 'UTILITY', SUPPORT: 'UTILITY', FILL: 'FILL' };
export const roleOf = (p: string | null | undefined): Role => ALIASES[(p ?? '').toUpperCase()] ?? 'UNSELECTED';

// Parte apagada do desenho (o resto do mapa), como nos ícones oficiais.
const DIM = 0.35;
// Topo: canto superior esquerdo cheio, quadrado pequeno no meio, canto oposto apagado. Atirador é o mesmo girado.
const CORNER = (
  <>
    <path d="M3 3h14l-3 3H6v8l-3 3z" />
    <path d="M10 10h4v4h-4z" />
    <path d="M21 7v14H7l3-3h8v-8z" opacity={DIM} />
  </>
);

const SHAPES: Record<Role, JSX.Element> = {
  TOP: CORNER,
  BOTTOM: <g transform="rotate(180 12 12)">{CORNER}</g>,
  // Meio: a diagonal do mapa entre os dois cantos apagados.
  MIDDLE: (
    <>
      <path d="M17 3h4v4L7 21H3v-4z" />
      <path d="M3 3h11l-3 3H6v5l-3 3z" opacity={DIM} />
      <path d="M21 21H10l3-3h5v-5l3-3z" opacity={DIM} />
    </>
  ),
  // Selva: garra de três lâminas.
  JUNGLE: (
    <>
      <path d="M12 22c-2.6-5-3.4-10.4-1.6-19 2.6 6.2 3.8 12 1.6 19z" />
      <path d="M4.5 6c3.2 2 5.4 5.6 5.6 10.8C7 14 5 10.8 4.5 6z" />
      <path d="M19.5 6c-3.2 2-5.4 5.6-5.6 10.8 3.1-2.8 5.1-6 5.6-10.8z" />
    </>
  ),
  // Suporte: elmo com as duas asas abertas.
  UTILITY: (
    <>
      <path d="M9 3h6l-3 3.2z" />
      <path d="M12 8.2l2.6 1.6L13.1 20h-2.2L9.4 9.8z" />
      <path d="M2 7h6.2l1.4 3-2.2 3.2C5 13.2 3 10.4 2 7z" />
      <path d="M22 7h-6.2l-1.4 3 2.2 3.2c2.4 0 4.4-2.8 5.4-6.2z" />
    </>
  ),
  // Preencher: os quatro quadrantes.
  FILL: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1" opacity={DIM} />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1" opacity={DIM} />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1" />
    </>
  ),
  UNSELECTED: <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" />,
};

/** Ícone de rota desenhado em linha: segue `currentColor`, então pega a cor do tema e o destaque de quem o contém. */
export function RoleIcon({ role, class: cls }: { role: string | null | undefined; class?: string }) {
  const r = roleOf(role);
  return (
    <svg class={cls ? `rlc-role ${cls}` : 'rlc-role'} data-role={r} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {SHAPES[r]}
    </svg>
  );
}
