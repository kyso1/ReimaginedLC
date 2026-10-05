import type { StoreState } from '../lcu';

export type Screen = 'home' | 'lobby' | 'champselect' | 'ingame' | 'honor' | 'postgame' | 'unknown';

const ROUTES: Record<string, Screen> = {
  None: 'home',
  TerminatedInError: 'home',
  Lobby: 'lobby',
  Matchmaking: 'lobby',
  ReadyCheck: 'lobby',
  ChampSelect: 'champselect',
  GameStart: 'ingame',
  InProgress: 'ingame',
  Reconnect: 'ingame',
  WaitingForStats: 'ingame',
  PreEndOfGame: 'honor',
  EndOfGame: 'postgame',
};

/** Tela para a fase atual. Toda fase tem tela nossa; null só enquanto a fase não é conhecida. */
export function screenFor(phase: StoreState<string>): Screen | null {
  if (phase.status !== 'ready' || !phase.data) return null;
  return Object.hasOwn(ROUTES, phase.data) ? ROUTES[phase.data]! : 'unknown';
}
