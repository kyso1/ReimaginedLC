import { expect, test } from 'vitest';
import { screenFor } from './router';

test('só a fase None tem tela nossa', () => {
  expect(screenFor({ status: 'ready', data: 'None' })).toBe('home');
  for (const phase of ['Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'GameStart', 'InProgress', 'Reconnect', 'WaitingForStats', 'PreEndOfGame', 'EndOfGame', 'TerminatedInError', 'FaseNova']) {
    expect(screenFor({ status: 'ready', data: phase })).toBeNull();
  }
});

test('store carregando, indisponível ou sem dados não tem tela', () => {
  expect(screenFor({ status: 'loading', data: null })).toBeNull();
  expect(screenFor({ status: 'unavailable', data: null })).toBeNull();
  expect(screenFor({ status: 'ready', data: null })).toBeNull();
});
