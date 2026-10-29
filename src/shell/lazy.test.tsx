import { render } from 'preact';
import { expect, test } from 'vitest';
import { lazyView } from './lazy';

const tick = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

test('mostra o fallback leve e depois a tela; já carregada, renderiza direto', async () => {
  let resolve!: (c: (p: { name: string }) => preact.JSX.Element) => void;
  const View = lazyView<{ name: string }>(() => new Promise((r) => (resolve = r)));
  const root = document.body.appendChild(document.createElement('div'));
  render(<View name="Ahri" />, root);
  expect(root.querySelector('.rlc-lazy[aria-busy="true"]')).not.toBeNull();
  await tick();
  resolve(({ name }) => <p class="tela">{name}</p>);
  await tick();
  await tick();
  expect(root.querySelector('.tela')!.textContent).toBe('Ahri');
  render(null, root);
  render(<View name="Lux" />, root);
  expect(root.querySelector('.tela')!.textContent).toBe('Lux');
  render(null, root);
  root.remove();
});

test('preload baixa uma vez só e falha deixa tentar de novo', async () => {
  let calls = 0;
  const View = lazyView(() => (++calls === 1 ? Promise.reject(new Error('rede')) : Promise.resolve(() => <i />)));
  await expect(View.preload()).rejects.toThrow('rede');
  await View.preload();
  await View.preload();
  expect(calls).toBe(2);
});

test('download que falha (chunk apagado por uma atualização) mostra aviso na tela em vez de derrubar a camada', async () => {
  const View = lazyView(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')));
  const root = document.body.appendChild(document.createElement('div'));
  render(<View />, root);
  await tick();
  await tick();
  expect(root.querySelector('.rlc-lazy[data-failed="true"]')).not.toBeNull();
  expect(root.querySelector('.rlc-lazy button')).not.toBeNull();
  render(null, root);
  root.remove();
});
