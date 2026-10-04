import { expect, test } from 'vitest';
import { validateTheme } from './validate';

const base = () => ({
  name: 'vidro',
  label: 'Vidro',
  version: 1,
  extends: null,
  tokens: {
    'color.bg': '#0b1020',
    'color.surface': 'rgba(255, 255, 255, 0.12)',
    'color.border': 'hsla(0, 0%, 100%, 0.22)',
    'color.text': '#fff',
    'color.textMuted': 'rgb(200 200 200 / 75%)',
    'color.accent': '#ffffffff',
    'color.onAccent': 'hsl(240, 20%, 13%)',
    'font.body': 'system-ui, sans-serif',
    'font.display': "'Beaufort for LoL', serif",
    'font.displayWeight': '650',
    'radius.sm': '6px',
    'radius.md': '0.5rem',
    'radius.pill': '999px',
    'blur.surface': '10px',
    'motion.duration': '320ms',
    'motion.easing': 'cubic-bezier(0.7, 0, 0.2, 1)',
  },
  transition: 'wipe',
  backgrounds: { default: 'media/fundo.webm', home: '/fe/lol-static-assets/videos/x.webm' },
  layouts: {},
});

const error = (patch: (t: ReturnType<typeof base>) => unknown) => {
  const t = base();
  const input = patch(t) ?? t;
  const r = validateTheme(input);
  return r.ok ? null : r.error;
};

test('aceita um manifesto completo e válido', () => {
  const r = validateTheme(base());
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.theme.name).toBe('vidro');
});

test('aceita tema filho com poucos tokens, fundo vazio e easing por nome', () => {
  const r = validateTheme({ name: 'editorial', label: 'Editorial', version: 1, extends: 'vidro', tokens: { 'blur.surface': '0px', 'motion.easing': 'ease-out', 'motion.duration': '0.2s' }, backgrounds: { default: '' }, layouts: {} });
  expect(r.ok).toBe(true);
});

test('recusa o que não é objeto', () => {
  for (const v of [null, 'x', 3, [], undefined]) expect(validateTheme(v).ok).toBe(false);
});

test('recusa nome fora do padrão e diz o campo', () => {
  expect(error((t) => void (t.name = 'Vidro Azul'))).toMatch(/name/);
  expect(error((t) => void (t.name = '../x'))).toMatch(/name/);
});

test('recusa token desconhecido', () => {
  expect(error((t) => void ((t.tokens as Record<string, string>)['color.novo'] = '#fff'))).toMatch(/color\.novo/);
});

test.each([
  ['color.bg', 'red; background: url(http://x)'],
  ['color.bg', 'url(http://x)'],
  ['color.bg', 'var(--x)'],
  ['radius.sm', '6px; position: fixed'],
  ['radius.sm', 'calc(1px + 2px)'],
  ['blur.surface', '10'],
  ['motion.duration', '320'],
  ['motion.duration', '1s; animation: x'],
  ['motion.easing', 'steps(4)'],
  ['motion.easing', 'cubic-bezier(1,2,3)'],
  ['font.displayWeight', 'bold'],
  ['font.displayWeight', '1000'],
  ['font.body', 'x; } body { display: none'],
  ['font.body', 'url(http://x/f.woff)'],
])('recusa valor fora do formato em %s: %s', (token, value) => {
  expect(error((t) => void ((t.tokens as Record<string, string>)[token] = value))).toContain(token);
});

test('recusa valor de token que não é string', () => {
  expect(error((t) => void ((t.tokens as Record<string, unknown>)['radius.sm'] = 6))).toMatch(/radius\.sm/);
});

test.each([
  '../fora.png',
  'media/../../x.png',
  '/etc/passwd.png',
  'http://x/a.png',
  'https://x/a.webm',
  '//x/a.png',
  'data:image/png;base64,AAAA',
  'javascript:alert(1)',
  'media/a.svg',
  'media/a.exe',
  'media/a',
  '/fe/../lol-secret/a.png',
  '/lol-chat/v1/a.png',
  'media\\a.png',
  'media/a b.png',
])('recusa caminho de mídia %s', (path) => {
  expect(error((t) => void (t.backgrounds.home = path))).toMatch(/backgrounds\.home/);
});

test('aceita mídia do próprio client e relativa', () => {
  for (const path of ['/fe/lol-static-assets/images/a.jpg', '/lol-game-data/assets/v1/x/y.png', 'media/fundo.mp4', 'a.gif', 'A-b_c.d/e.WEBP']) {
    expect(error((t) => void (t.backgrounds.home = path))).toBeNull();
  }
});

test('recusa transição desconhecida, extends inválido e version que não é 1', () => {
  expect(error((t) => void ((t as { transition: string }).transition = 'girar'))).toMatch(/transition/);
  expect(error((t) => void ((t as { extends: unknown }).extends = '../x'))).toMatch(/extends/);
  expect(error((t) => void (t.version = 2))).toMatch(/version/);
});

test('recusa campo desconhecido na raiz', () => {
  expect(error((t) => ({ ...t, css: 'body{}' }))).toMatch(/css/);
});

test('recusa layouts que não sejam texto simples', () => {
  expect(error((t) => void ((t.layouts as Record<string, unknown>).home = 'a b; c'))).toMatch(/layouts\.home/);
});
