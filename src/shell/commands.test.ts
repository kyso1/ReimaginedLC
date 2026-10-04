import { signal } from '@preact/signals';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { ThemeEngine } from '../theme/engine';
import { registerCommands } from './commands';
import { enabled, syncLayer } from './layer';

type Action = { name: string; group?: string; perform: () => void };
let actions: Action[];
let themes: ThemeEngine;

beforeEach(() => {
  setLocale('pt_BR');
  delete window.DataStore;
  syncLayer();
  actions = [];
  window.CommandBar = { addAction: (a) => void actions.push(a) };
  themes = { active: signal({ name: 'vidro', label: 'Vidro', tokens: {}, transition: 'fade', backgrounds: {} }), available: [{ name: 'vidro', label: 'Vidro' }, { name: 'editorial', label: 'Editorial' }], set: vi.fn() };
});

afterEach(() => {
  delete window.CommandBar;
});

test('registra ligar/desligar e uma ação por tema', () => {
  registerCommands(themes);
  expect(actions.map((a) => a.name)).toEqual(['ReimaginedLC: ligar/desligar', 'ReimaginedLC: tema Vidro', 'ReimaginedLC: tema Editorial']);
  expect(new Set(actions.map((a) => a.group))).toEqual(new Set(['ReimaginedLC']));
});

test('as ações alternam a camada e trocam o tema', () => {
  registerCommands(themes);
  actions[0]!.perform();
  expect(enabled.value).toBe(true);
  actions[2]!.perform();
  expect(themes.set).toHaveBeenCalledWith('editorial');
});

test('sem CommandBar não lança', () => {
  delete window.CommandBar;
  expect(() => registerCommands(themes)).not.toThrow();
});
