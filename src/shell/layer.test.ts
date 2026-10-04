import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { enabled, hideRiot, setEnabled, syncLayer, toggleEnabled } from './layer';

let data: Map<string, unknown>;

beforeEach(() => {
  data = new Map();
  window.DataStore = { has: (k) => data.has(k), get: (k) => data.get(k), set: (k, v) => void data.set(k, v), remove: (k) => void data.delete(k) };
  window.Toast = { success: vi.fn(), error: vi.fn() };
});

afterEach(() => {
  delete window.DataStore;
  delete window.Toast;
});

test('a camada começa desligada quando não há configuração', () => {
  syncLayer();
  expect(enabled.value).toBe(false);
  expect(hideRiot.value).toBe(true);
});

test('syncLayer lê a configuração guardada', () => {
  data.set('rlc.enabled', true);
  data.set('rlc.hideRiot', false);
  syncLayer();
  expect(enabled.value).toBe(true);
  expect(hideRiot.value).toBe(false);
});

test('valor que não é booleano conta como desligada', () => {
  data.set('rlc.enabled', 'sim');
  data.set('rlc.hideRiot', 0);
  syncLayer();
  expect(enabled.value).toBe(false);
  expect(hideRiot.value).toBe(true);
});

test('setEnabled persiste e avisa', () => {
  syncLayer();
  setEnabled(true);
  expect(enabled.value).toBe(true);
  expect(data.get('rlc.enabled')).toBe(true);
  expect(window.Toast!.success).toHaveBeenCalledTimes(1);
});

test('toggleEnabled alterna', () => {
  syncLayer();
  toggleEnabled();
  expect(enabled.value).toBe(true);
  toggleEnabled();
  expect(enabled.value).toBe(false);
  expect(data.get('rlc.enabled')).toBe(false);
});
