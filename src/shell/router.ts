import type { StoreState } from '../lcu';

export type Screen = 'home';

/** Tela nossa para a fase atual, ou null quando o client original deve aparecer. */
export function screenFor(phase: StoreState<string>): Screen | null {
  return phase.status === 'ready' && phase.data === 'None' ? 'home' : null;
}
