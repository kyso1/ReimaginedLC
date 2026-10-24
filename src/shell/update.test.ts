import { signal } from '@preact/signals';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { UPDATE_EVENT } from '../../loader/shared';
import { canReload, reloadForUpdate, safeToReload, update, watchUpdates } from './update';

const phase = signal<{ status: 'ready'; data: string | null }>({ status: 'ready', data: 'None' });
const lcu = { gameflowPhase: phase } as unknown as Parameters<typeof watchUpdates>[0];

beforeEach(() => {
  setLocale('pt_BR');
  update.value = null;
  window.Toast = { success: vi.fn(), error: vi.fn() };
});
afterEach(() => {
  delete window.Toast;
});

test('fases seguras: só fora de fila, seleção e partida', () => {
  for (const p of ['None', 'Lobby', 'EndOfGame']) expect(safeToReload(p)).toBe(true);
  for (const p of ['Matchmaking', 'ReadyCheck', 'ChampSelect', 'GameStart', 'InProgress', 'Reconnect', null, undefined]) expect(safeToReload(p)).toBe(false);
});

test('versão pronta do carregador (já publicada ou por evento) aparece uma vez; Recarregar respeita a fase', () => {
  const win = new EventTarget() as Window & { __rlcLoader?: unknown };
  win.__rlcLoader = { version: '0.1.0', base: 'https://x/', ready: '0.2.0' };
  watchUpdates(lcu, win);
  expect(update.value).toEqual({ version: '0.2.0' });
  win.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { version: '0.2.0' } }));
  expect(window.Toast!.success).toHaveBeenCalledTimes(1);
  win.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { version: '0.3.0' } }));
  expect(update.value).toEqual({ version: '0.3.0' });

  const reload = vi.fn();
  phase.value = { status: 'ready', data: 'ChampSelect' };
  expect(canReload.value).toBe(false);
  reloadForUpdate(reload);
  expect(reload).not.toHaveBeenCalled();
  phase.value = { status: 'ready', data: 'Lobby' };
  expect(canReload.value).toBe(true);
  reloadForUpdate(reload);
  expect(reload).toHaveBeenCalledTimes(1);
});

test('sem carregador nada aparece', () => {
  watchUpdates(lcu, new EventTarget() as Window);
  expect(update.value).toBeNull();
  expect(window.Toast!.success).not.toHaveBeenCalled();
});
