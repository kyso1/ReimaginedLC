import { expect, test } from 'vitest';
import { screenFor } from './router';

test('None é a tela inicial; Lobby, Matchmaking e ReadyCheck são o lobby', () => {
  expect(screenFor({ status: 'ready', data: 'None' })).toBe('home');
  for (const phase of ['Lobby', 'Matchmaking', 'ReadyCheck']) expect(screenFor({ status: 'ready', data: phase })).toBe('lobby');
});

test('fases do 2b em diante e fases desconhecidas ficam com o client original', () => {
  for (const phase of ['ChampSelect', 'GameStart', 'InProgress', 'Reconnect', 'WaitingForStats', 'PreEndOfGame', 'EndOfGame', 'TerminatedInError', 'FaseNova']) {
    expect(screenFor({ status: 'ready', data: phase })).toBeNull();
  }
});

test('store carregando, indisponível ou sem dados não tem tela', () => {
  expect(screenFor({ status: 'loading', data: null })).toBeNull();
  expect(screenFor({ status: 'unavailable', data: null })).toBeNull();
  expect(screenFor({ status: 'ready', data: null })).toBeNull();
});
