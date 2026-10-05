import { expect, test } from 'vitest';
import { setLocale, t } from './index';

test('pt_BR usa os textos em português', () => {
  setLocale('pt_BR');
  expect(t('play')).toBe('Jogar');
});

test('locale desconhecido cai em inglês', () => {
  setLocale('ko_KR');
  expect(t('play')).toBe('Play');
});
