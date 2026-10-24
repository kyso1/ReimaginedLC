import { afterEach, expect, test } from 'vitest';
import { errorReport } from './report';

afterEach(() => sessionStorage.clear());

test('relatório leva versão, fase, tema e o último erro', () => {
  sessionStorage.setItem('rlc:lastError', '2026-10-24T00:00:00Z TypeError: boom\n    at Lobby');
  const text = errorReport({ phase: 'Lobby', theme: 'vidro', tftTheme: 'vidro-ludico' });
  expect(text).toContain(`Version: ${__RLC_VERSION__}`);
  expect(text).toContain('Game phase: Lobby');
  expect(text).toContain('Theme: vidro (TFT: vidro-ludico)');
  expect(text).toContain('TypeError: boom');
});

test('sem erro na sessão, diz isso', () => {
  expect(errorReport({ phase: null, theme: 'vidro', tftTheme: 'vidro' })).toContain('none recorded in this session');
});
