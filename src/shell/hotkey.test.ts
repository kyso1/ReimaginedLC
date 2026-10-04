import { beforeEach, expect, test } from 'vitest';
import { registerHotkey } from './hotkey';
import { enabled, syncLayer } from './layer';

beforeEach(() => {
  delete window.DataStore;
  syncLayer();
});

const press = (init: KeyboardEventInit) => window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

test('Ctrl+Shift+F12 alterna a camada', () => {
  registerHotkey();
  press({ key: 'F12', ctrlKey: true, shiftKey: true });
  expect(enabled.value).toBe(true);
  press({ key: 'F12', ctrlKey: true, shiftKey: true });
  expect(enabled.value).toBe(false);
});

test('outras combinações não alteram a camada', () => {
  registerHotkey();
  press({ key: 'F12' });
  press({ key: 'F12', ctrlKey: true });
  press({ key: 'F11', ctrlKey: true, shiftKey: true });
  expect(enabled.value).toBe(false);
});

test('registrar duas vezes não duplica o atalho', () => {
  registerHotkey();
  registerHotkey();
  press({ key: 'F12', ctrlKey: true, shiftKey: true });
  expect(enabled.value).toBe(true);
});
