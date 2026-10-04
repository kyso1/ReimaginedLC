import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { load } from './index';

let other: HTMLElement | null = null;

beforeEach(() => {
  window.Toast = { success: vi.fn(), error: vi.fn() };
});

afterEach(() => {
  other?.remove();
  other = null;
  document.getElementById('rlc-root')?.remove();
  document.querySelectorAll('style[data-rlc]').forEach((el) => el.remove());
  delete window.Toast;
});

test('start que falha não deixa raiz, estilo nem observador', async () => {
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  await load();
  expect(document.getElementById('rlc-root')).toBeNull();
  expect(document.querySelector('style[data-rlc]')).toBeNull();
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  other = document.body.appendChild(document.createElement('p'));
  await new Promise((r) => setTimeout(r, 0));
  expect(document.getElementById('rlc-root')).toBeNull();
  noise.mockRestore();
});
