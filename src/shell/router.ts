import type { StoreState } from '../lcu';

export type Screen = 'home' | 'lobby';

const LOBBY_PHASES = new Set(['Lobby', 'Matchmaking', 'ReadyCheck']);

/** Tela nossa para a fase atual, ou null quando o client original deve aparecer. */
export function screenFor(phase: StoreState<string>): Screen | null {
  if (phase.status !== 'ready') return null;
  if (phase.data === 'None') return 'home';
  return LOBBY_PHASES.has(phase.data ?? '') ? 'lobby' : null;
}
