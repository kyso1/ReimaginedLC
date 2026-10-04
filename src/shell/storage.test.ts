import { afterEach, expect, test } from 'vitest';
import { readSetting, writeSetting } from './storage';

function fakeStore(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial));
  window.DataStore = {
    has: (k) => data.has(k),
    get: (k) => data.get(k),
    set: (k, v) => void data.set(k, v),
    remove: (k) => void data.delete(k),
  };
  return data;
}

afterEach(() => {
  delete window.DataStore;
});

test('readSetting devolve o valor guardado', () => {
  fakeStore({ 'rlc.x': 7 });
  expect(readSetting('rlc.x', 0)).toBe(7);
});

test('readSetting devolve o padrão quando a chave não existe', () => {
  fakeStore();
  expect(readSetting('rlc.x', 'padrao')).toBe('padrao');
});

test('readSetting devolve o padrão sem DataStore', () => {
  expect(readSetting('rlc.x', true)).toBe(true);
});

test('readSetting devolve o padrão quando o DataStore lança', () => {
  window.DataStore = { has: () => { throw new Error('quebrado'); }, get: () => 1, set: () => {}, remove: () => {} };
  expect(readSetting('rlc.x', 3)).toBe(3);
});

test('writeSetting grava e não lança sem DataStore', () => {
  const data = fakeStore();
  writeSetting('rlc.x', { a: 1 });
  expect(data.get('rlc.x')).toEqual({ a: 1 });
  delete window.DataStore;
  expect(() => writeSetting('rlc.x', 1)).not.toThrow();
});
