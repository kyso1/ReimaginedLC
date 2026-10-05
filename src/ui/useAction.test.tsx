import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAction } from './useAction';

let root: HTMLElement;
beforeEach(() => void (root = document.body.appendChild(document.createElement('div'))));
afterEach(() => {
  render(null, root);
  root.remove();
});

function Probe({ fn }: { fn: () => Promise<unknown> }) {
  const { run, pending } = useAction(fn);
  return <button disabled={pending} onClick={() => run()}>x</button>;
}

const deferred = () => {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

test('ignora cliques enquanto a ação está pendente e reabilita ao terminar', async () => {
  const d = deferred();
  const fn = vi.fn(() => d.promise);
  act(() => render(<Probe fn={fn} />, root));
  const button = root.querySelector('button')!;
  act(() => button.click());
  act(() => button.click());
  expect(fn).toHaveBeenCalledTimes(1);
  expect(button.disabled).toBe(true);
  await act(async () => { d.resolve(); await new Promise((r) => setTimeout(r, 0)); });
  expect(button.disabled).toBe(false);
});

test('rejeição não escapa e libera o botão', async () => {
  const d = deferred();
  act(() => render(<Probe fn={() => d.promise} />, root));
  const button = root.querySelector('button')!;
  act(() => button.click());
  await act(async () => { d.reject(new Error('lcu')); await new Promise((r) => setTimeout(r, 0)); });
  expect(button.disabled).toBe(false);
});
