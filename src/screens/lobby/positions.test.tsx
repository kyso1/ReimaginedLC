import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { inDemand, PositionIcons } from './Positions';

let root: HTMLElement;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});
const slots = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-pos-slot')];
const options = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-pos-option')].map((b) => b.getAttribute('aria-label'));

test('rotas em alta: Preencher sempre conta; o seletor marca as da fila', () => {
  expect(inDemand(['UTILITY'], 'FILL')).toBe(true);
  expect(inDemand(['UTILITY'], 'UTILITY')).toBe(true);
  expect(inDemand(['UTILITY'], 'TOP')).toBe(false);
  act(() => render(<PositionIcons first="TOP" second="MIDDLE" editable scarce={['UTILITY', 'JUNGLE']} />, root));
  act(() => slots()[0]!.click());
  expect(options()).toContain('Suporte · Rota em alta');
  expect(options()).toContain('Selva · Rota em alta');
  expect(options()).toContain('Topo');
  expect(root.querySelectorAll('.rlc-pos-option[data-scarce="true"]')).toHaveLength(2);
});

test('ranqueada: principal fora das rotas em alta deixa a secundária só com elas', () => {
  act(() => render(<PositionIcons first="TOP" second="MIDDLE" editable scarce={['UTILITY', 'JUNGLE']} force />, root));
  act(() => slots()[1]!.click());
  expect(options()).toEqual(['Selva · Rota em alta', 'Suporte · Rota em alta']);
});

test('ranqueada: principal em alta dispensa a secundária; a escolhida em alta vem marcada', () => {
  act(() => render(<PositionIcons first="UTILITY" second="MIDDLE" editable scarce={['UTILITY']} force />, root));
  expect(slots()).toHaveLength(1);
  expect(slots()[0]!.dataset.scarce).toBe('true');
});
