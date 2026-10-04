import type { ComponentChildren } from 'preact';

export function Button({ variant = 'ghost', onClick, children }: { variant?: 'primary' | 'ghost' | 'pill'; onClick: () => void; children: ComponentChildren }) {
  return (
    <button type="button" class="rlc-button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  );
}
