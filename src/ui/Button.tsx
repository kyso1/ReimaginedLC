import type { ComponentChildren } from 'preact';

/** Botão do sistema: primary (ação principal da tela, uma por vez), ghost (vidro), pill (ação curta de barra), danger (sair, excluir). */
export function Button({ variant = 'ghost', onClick, children }: { variant?: 'primary' | 'ghost' | 'pill' | 'danger'; onClick: () => void; children: ComponentChildren }) {
  return (
    <button type="button" class="rlc-button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  );
}
