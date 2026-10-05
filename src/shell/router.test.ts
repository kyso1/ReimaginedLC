import { expect, test } from 'vitest';
import { screenFor } from './router';

const at = (phase: string) => screenFor({ status: 'ready', data: phase });

test('cada fase do gameflow tem tela nossa', () => {
  expect(at('None')).toBe('home');
  expect(at('TerminatedInError')).toBe('home');
  for (const p of ['Lobby', 'Matchmaking', 'ReadyCheck']) expect(at(p)).toBe('lobby');
  expect(at('ChampSelect')).toBe('champselect');
  for (const p of ['GameStart', 'InProgress', 'Reconnect', 'WaitingForStats']) expect(at(p)).toBe('ingame');
  expect(at('PreEndOfGame')).toBe('honor');
  expect(at('EndOfGame')).toBe('postgame');
});

test('fase desconhecida tem a tela de fase desconhecida', () => {
  expect(at('FaseNova')).toBe('unknown');
  expect(at('CheckedIntoTournament')).toBe('unknown');
});

test('store carregando, indisponível ou sem dados não tem tela', () => {
  expect(screenFor({ status: 'loading', data: null })).toBeNull();
  expect(screenFor({ status: 'unavailable', data: null })).toBeNull();
  expect(screenFor({ status: 'ready', data: null })).toBeNull();
});
