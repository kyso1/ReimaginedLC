import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { BOOT_ID, BOOT_MAX_MS, bootStatus, hideBoot, showBoot } from './boot';

afterEach(() => {
  vi.useRealTimers();
  document.getElementById(BOOT_ID)?.remove();
});

test('tela de carregamento: uma só, troca o texto e sai com fade', () => {
  vi.useFakeTimers();
  setLocale('pt_BR');
  showBoot();
  showBoot();
  expect(document.querySelectorAll(`#${BOOT_ID}`)).toHaveLength(1);
  expect(document.querySelector('.rlc-boot-status')!.textContent).toBe('Conectando ao client…');
  bootStatus('Carregando seu perfil…');
  expect(document.querySelector('.rlc-boot-status')!.textContent).toBe('Carregando seu perfil…');
  hideBoot();
  expect(document.getElementById(BOOT_ID)!.dataset.leaving).toBe('');
  vi.advanceTimersByTime(600);
  expect(document.getElementById(BOOT_ID)).toBeNull();
});

test('nunca prende o client: sai sozinha depois do limite', () => {
  vi.useFakeTimers();
  showBoot();
  vi.advanceTimersByTime(BOOT_MAX_MS + 600);
  expect(document.getElementById(BOOT_ID)).toBeNull();
});
