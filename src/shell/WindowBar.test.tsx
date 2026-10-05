import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { Confirm } from './overlays/Confirm';
import { WindowBar } from './WindowBar';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

const button = (label: string) => root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

test('minimizar chama ux-minimize', () => {
  act(() => render(<WindowBar onClose={() => {}} />, root));
  expect(root.querySelector('.rlc-windowbar')).not.toBeNull();
  act(() => button('Minimizar').click());
  expect(fetchMock).toHaveBeenCalledWith('/riotclient/ux-minimize', { method: 'POST' });
});

test('fechar só avisa o shell, sem chamar a LCU', () => {
  const onClose = vi.fn();
  act(() => render(<WindowBar onClose={onClose} />, root));
  act(() => button('Fechar').click());
  expect(onClose).toHaveBeenCalledOnce();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('Confirm: confirmar, cancelar e Escape', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  act(() => render(<Confirm message="Fechar o League of Legends?" confirmLabel="Fechar" onConfirm={onConfirm} onCancel={onCancel} />, root));
  expect(root.querySelector('[role="dialog"]')!.textContent).toContain('Fechar o League of Legends?');
  expect(document.activeElement?.textContent).toBe('Cancelar');
  const [confirm, cancel] = root.querySelectorAll<HTMLButtonElement>('.rlc-dialog button');
  act(() => confirm!.click());
  act(() => cancel!.click());
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(onConfirm).toHaveBeenCalledOnce();
  expect(onCancel).toHaveBeenCalledTimes(2);
});
