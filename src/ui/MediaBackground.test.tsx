import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { isVideo, MediaBackground } from './MediaBackground';

let host: HTMLElement;
let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;

beforeEach(() => {
  host = document.body.appendChild(document.createElement('div'));
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  HTMLMediaElement.prototype.play = play as unknown as HTMLMediaElement['play'];
  HTMLMediaElement.prototype.pause = pause as unknown as HTMLMediaElement['pause'];
});

afterEach(() => {
  render(null, host);
  host.remove();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

test('isVideo reconhece webm e mp4, com ou sem query', () => {
  expect(isVideo('/fe/x/a.WEBM')).toBe(true);
  expect(isVideo('https://x/a.mp4?v=1')).toBe(true);
  expect(isVideo('/fe/x/a.jpg')).toBe(false);
  expect(isVideo('/fe/x/webm.png')).toBe(false);
});

test('sem mídia mostra só a cor de fundo', () => {
  render(<MediaBackground src={null} playing />, host);
  expect(host.querySelector('img, video')).toBeNull();
  expect(host.querySelector('.rlc-bg')).not.toBeNull();
});

test('imagem vira img sem texto alternativo', () => {
  render(<MediaBackground src="/fe/x/a.jpg" playing />, host);
  const img = host.querySelector('img')!;
  expect(img.getAttribute('src')).toBe('/fe/x/a.jpg');
  expect(img.getAttribute('alt')).toBe('');
});

test('vídeo é mudo e em laço, toca quando playing e pausa quando não', async () => {
  render(<MediaBackground src="/fe/x/a.webm" playing />, host);
  await flush();
  const video = host.querySelector('video')!;
  expect(video.muted).toBe(true);
  expect(video.loop).toBe(true);
  await vi.waitFor(() => expect(play).toHaveBeenCalled());
  render(<MediaBackground src="/fe/x/a.webm" playing={false} />, host);
  await flush();
  await vi.waitFor(() => expect(pause).toHaveBeenCalled());
});

test('falha ao carregar cai na cor de fundo, e uma mídia nova tenta de novo', async () => {
  render(<MediaBackground src="/fe/x/quebrada.jpg" playing />, host);
  host.querySelector('img')!.dispatchEvent(new Event('error'));
  await flush();
  expect(host.querySelector('img')).toBeNull();
  render(<MediaBackground src="/fe/x/outra.jpg" playing />, host);
  await flush();
  expect(host.querySelector('img')!.getAttribute('src')).toBe('/fe/x/outra.jpg');
});

test('enquadramento: proporção da tela cobre; quadrada ou de dois monitores entra inteira', async () => {
  const { fitFor } = await import('./MediaBackground');
  expect(fitFor(1920, 1080, 1280, 720)).toBe('cover');
  expect(fitFor(2560, 1440, 1600, 900)).toBe('cover');
  expect(fitFor(900, 900, 1280, 720)).toBe('contain');
  expect(fitFor(3840, 1080, 1280, 720)).toBe('contain');
  expect(fitFor(0, 0, 1280, 720)).toBe('cover');
});
