import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test } from 'vitest';
import { setLocale } from '../../i18n';
import { MemberMenu } from './MemberMenu';

let root: HTMLElement;
afterEach(() => {
  render(null, root);
  root.remove();
});

function open(buttonTop: number) {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  root.id = 'rlc-root';
  const items = [1, 2, 3, 4].map((i) => ({ label: `Ação ${i}`, run: () => {} }));
  act(() => render(<MemberMenu floating items={items} />, root));
  const btn = root.querySelector<HTMLButtonElement>('.rlc-col-menu')!;
  btn.getBoundingClientRect = () => ({ top: buttonTop, bottom: buttonTop + 24, left: 900, right: 924, width: 24, height: 24, x: 900, y: buttonTop, toJSON: () => ({}) });
  act(() => btn.click());
  return root.querySelector<HTMLElement>(':scope > .rlc-menu[data-floating]')!;
}

test('menu solto: abre embaixo do botão quando cabe, alinhado à direita dele', () => {
  const menu = open(100);
  expect(menu.style.top).toBe('130px');
  expect(menu.style.bottom).toBe('auto');
  expect(menu.style.right).toBe(`${window.innerWidth - 924}px`);
});

test('menu solto: perto do pé da tela abre para cima (os últimos jogadores do placar)', () => {
  const menu = open(window.innerHeight - 40);
  expect(menu.style.top).toBe('auto');
  expect(menu.style.bottom).toBe(`${40 + 6}px`);
});
