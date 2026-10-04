import { expect, test } from 'vitest';
import { applyTheme, cssVar, mediaUrl } from './apply';
import type { ResolvedTheme } from './resolve';

const theme = (backgrounds: ResolvedTheme['backgrounds'] = {}): ResolvedTheme => ({ name: 'vidro', label: 'Vidro', tokens: { 'color.bg': '#0b1020', 'color.textMuted': '#ccc' }, transition: 'wipe', backgrounds });

test('cssVar troca pontos por hífens e prefixa', () => {
  expect(cssVar('color.textMuted')).toBe('--rlc-color-textMuted');
});

test('applyTheme grava variáveis, nome e transição no elemento', () => {
  const el = document.createElement('div');
  applyTheme(el, theme());
  expect(el.style.getPropertyValue('--rlc-color-bg')).toBe('#0b1020');
  expect(el.dataset.theme).toBe('vidro');
  expect(el.dataset.transition).toBe('wipe');
});

test('applyTheme remove variáveis do tema anterior que o novo não define', () => {
  const el = document.createElement('div');
  applyTheme(el, theme());
  applyTheme(el, { ...theme(), tokens: { 'color.bg': '#fff' } });
  expect(el.style.getPropertyValue('--rlc-color-bg')).toBe('#fff');
  expect(el.style.getPropertyValue('--rlc-color-textMuted')).toBe('');
});

test('mediaUrl usa o fundo da tela, cai no default e resolve relativo à pasta do tema dono', () => {
  const t = theme({ default: { theme: 'vidro', path: 'media/a.png' }, home: { theme: 'filho', path: 'h.webm' } });
  expect(mediaUrl(t, 'home', 'https://plugins/ReimaginedLC/')).toBe('https://plugins/ReimaginedLC/themes/filho/h.webm');
  expect(mediaUrl(t, 'lobby', 'https://plugins/ReimaginedLC/')).toBe('https://plugins/ReimaginedLC/themes/vidro/media/a.png');
});

test('mediaUrl devolve a URL do client como está e null quando não há fundo', () => {
  expect(mediaUrl(theme({ default: { theme: 'vidro', path: '/fe/lol-static-assets/a.jpg' } }), 'home', 'https://x/')).toBe('/fe/lol-static-assets/a.jpg');
  expect(mediaUrl(theme({ default: { theme: 'vidro', path: '' } }), 'home', 'https://x/')).toBeNull();
  expect(mediaUrl(theme(), 'home', 'https://x/')).toBeNull();
});
