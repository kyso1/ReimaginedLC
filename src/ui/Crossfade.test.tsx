import { render } from 'preact';
import { act } from 'preact/test-utils';
import { expect, test, vi } from 'vitest';
import { Crossfade } from './Crossfade';

test('troca de splash: a nova entra por cima depois de carregada e a anterior sai no fim da fusão', async () => {
  vi.useFakeTimers();
  const host = document.createElement('div');
  const layers = () => [...host.querySelectorAll<HTMLElement>('.rlc-xfade-layer')].map((l) => l.style.backgroundImage);
  act(() => render(<Crossfade src="a.jpg" />, host));
  expect(layers()).toEqual(['url("a.jpg")']);
  const imgs: HTMLImageElement[] = [];
  const Orig = window.Image;
  window.Image = class extends Orig { constructor() { super(); imgs.push(this); } } as typeof Image;
  act(() => render(<Crossfade src="b.jpg" />, host));
  expect(layers()).toEqual(['url("a.jpg")']);
  act(() => imgs[0]!.onload!(new Event('load')));
  expect(layers()).toEqual(['url("a.jpg")', 'url("b.jpg")']);
  act(() => {
    vi.advanceTimersByTime(800);
  });
  expect(layers()).toEqual(['url("b.jpg")']);
  window.Image = Orig;
  vi.useRealTimers();
});
