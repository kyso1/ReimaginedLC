import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { useDecoded } from './useDecoded';

let root: HTMLElement;
beforeEach(() => void (root = document.body.appendChild(document.createElement('div'))));
afterEach(() => {
  render(null, root);
  root.remove();
  delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
});
const stubDecode = (fn: () => Promise<void>) => void ((HTMLImageElement.prototype as { decode?: unknown }).decode = fn);
const Probe = ({ url }: { url: string | null }) => <i data-url={useDecoded(url) ?? ''} />;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

test('só devolve a URL depois de a imagem decodificar', async () => {
  let done!: () => void;
  stubDecode(() => new Promise<void>((r) => (done = r)));
  act(() => render(<Probe url="/a.jpg" />, root));
  expect(root.querySelector('i')!.dataset.url).toBe('');
  await act(async () => done());
  await settle();
  expect(root.querySelector('i')!.dataset.url).toBe('/a.jpg');
});

test('falha ao decodificar não mostra a imagem; null limpa', async () => {
  stubDecode(() => Promise.reject(new Error('x')));
  act(() => render(<Probe url="/b.jpg" />, root));
  await settle();
  expect(root.querySelector('i')!.dataset.url).toBe('');
  act(() => render(<Probe url={null} />, root));
  expect(root.querySelector('i')!.dataset.url).toBe('');
});
