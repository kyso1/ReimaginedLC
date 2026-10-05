import { readFileSync } from 'node:fs';
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

// ---- Rodada de correção 1 (V1-V9) ----
const withToken = (token: string, value: unknown) => error((t) => void ((t.tokens as Record<string, unknown>)[token] = value));
const ok = (token: string, value: string) => expect(withToken(token, value)).toBeNull();
const bad = (token: string, value: string) => expect(withToken(token, value)).toContain(token);

test('V1: easing de 100 000 caracteres é recusado em menos de 100 ms', () => {
  for (const value of ['cubic-bezier(' + '1'.repeat(100_000), 'cubic-bezier(' + '1,'.repeat(50_000)]) {
    const start = performance.now();
    bad('motion.easing', value);
    expect(performance.now() - start).toBeLessThan(100);
  }
});

test.each([
  ['color.bg', '#' + 'a'.repeat(200)],
  ['radius.sm', '1'.repeat(199) + 'px'],
  ['motion.duration', '1'.repeat(200) + 's'],
  ['motion.easing', 'cubic-bezier(0.7, 0, 0.2, ' + '1'.repeat(201 - 'cubic-bezier(0.7, 0, 0.2, )'.length) + ')'],
  ['font.body', 'a'.repeat(201)],
  ['font.displayWeight', '4'.repeat(201)],
])('V1: valor de 201 caracteres recusado em %s', (token, value) => {
  expect(value).toHaveLength(201);
  bad(token, value);
});

test('V1: caminho de mídia acima de 300 caracteres é recusado', () => {
  expect(error((t) => void (t.backgrounds.home = 'a'.repeat(300) + '.png'))).toMatch(/backgrounds\.home/);
});

test('V1: easings válidos continuam aceitos e malformados recusados', () => {
  for (const v of ['cubic-bezier(0.7, 0, 0.2, 1)', 'cubic-bezier(.7,-0.5,1,1.5)', 'ease-out', 'linear']) ok('motion.easing', v);
  for (const v of ['cubic-bezier(1.,2,3,4)', 'cubic-bezier(1 ,2,3,4)', 'cubic-bezier(1,,2,3)', 'cubic-bezier(-,1,2,3)', 'cubic-bezier(1,2,3,4,5)']) bad('motion.easing', v);
});

test.each(['constructor', 'toString', 'hasOwnProperty', 'valueOf'])('V2: chave herdada %s é recusada sem lançar', (key) => {
  const r = validateTheme(JSON.parse(`{"name":"x","label":"X","version":1,"tokens":{"${key}":"#fff"}}`));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain(`tokens.${key}`);
});

test('V2: chave __proto__ própria no JSON é recusada', () => {
  const r = validateTheme(JSON.parse('{"name":"x","label":"X","version":1,"tokens":{"__proto__":"#fff"}}'));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain('tokens.__proto__');
});

test('V2: entradas exóticas não lançam e valor objeto não vira [object Object]', () => {
  for (const v of [new Date(), new Map(), /x/, () => 1, Symbol('s'), 1n, new Error('e')]) {
    expect(() => validateTheme(v)).not.toThrow();
    expect(validateTheme(v).ok).toBe(false);
  }
  expect(withToken('color.bg', { a: 1 })).not.toContain('[object Object]');
});

test.each(['#12345', '#1234567', 'rgb(,,,,)', 'rgb(...)', 'rgb(1/2/3/4/5)', 'rgb(\n)', '#ff', '#fffff', '#fffffffff', 'rgb(1,2)', 'rgb(1 2 3 4 5)', 'rgb(1, 2, 3', ' #fff', '#fff\n', 'rgb(1,\t2, 3)', 'rgb(1, 2, 3)\n', 'rgb(1, 2, 3, 4, 5)', 'rgb(1, 2 3)', 'rgb(1  2 3)'])('V3: color recusa %j', (v) => bad('color.bg', v));

test.each(['#fff', '#ffff', '#0b1020', '#0b1020cc', 'rgb(1, 2, 3)', 'rgba(255, 255, 255, 0.12)', 'rgb(200 200 200 / 75%)', 'hsl(240, 20%, 13%)', 'hsla(0, 0%, 100%, 0.22)', 'hsl(240deg 20% 13% / 0.5)', 'rgb(1,2,3)', 'RGB(1, 2, 3)'])('V3: color aceita %s', (v) => ok('color.bg', v));

test.each(['   ', ',', ',,,', "'", '"', "'a", 'a"b', "'a\"b'", '-', '_', "'a', ", ', a', 'a,', 'a,,b', "''", 'a; b', "'1'", 'a\nb'])('V4: font recusa %j', (v) => bad('font.body', v));

test.each(['system-ui, sans-serif', "'Beaufort for LoL', serif", '"Spiegel", Arial, sans-serif', 'Noto Sans JP', 'serif', 'Fira 2 Code', 'Fonte-Ñandú'])('V4: font aceita %s', (v) => ok('font.body', v));

test('V5: mutar a entrada depois não altera o tema validado', () => {
  const input = base();
  const r = validateTheme(input);
  expect(r.ok).toBe(true);
  (input.tokens as Record<string, string>)['color.bg'] = 'red;x:url(y)';
  input.backgrounds.home = 'http://x/a.png';
  (input.layouts as Record<string, string>).home = 'x';
  if (r.ok) {
    expect(r.theme.tokens['color.bg']).toBe('#0b1020');
    expect(r.theme.backgrounds.home).toBe('/fe/lol-static-assets/videos/x.webm');
    expect(r.theme.layouts).toEqual({});
    expect(r.theme.tokens).not.toBe(input.tokens);
  }
});

test('V5: tokens, backgrounds e layouts precisam ser objetos simples', () => {
  expect(error((t) => ({ ...t, tokens: new Map() }))).toMatch(/tokens/);
  expect(error((t) => ({ ...t, backgrounds: new Date() }))).toMatch(/backgrounds/);
  expect(error((t) => ({ ...t, layouts: [] }))).toMatch(/layouts/);
  expect(error((t) => ({ ...t, tokens: /x/ }))).toMatch(/tokens/);
  expect(validateTheme(new Date()).ok).toBe(false);
});

test('V6: prefixo do client é só minúsculo; extensão pode variar', () => {
  for (const p of ['/FE/a.png', '/LOL-GAME-DATA/ASSETS/a.png', '/Fe/a.png']) expect(error((t) => void (t.backgrounds.home = p))).toMatch(/backgrounds\.home/);
  for (const p of ['/fe/x/a.PNG', '/lol-game-data/assets/a.Webm']) expect(error((t) => void (t.backgrounds.home = p))).toBeNull();
});

test('V9: chave enorme gera erro curto, sem quebra de linha', () => {
  const key = 'x\n'.repeat(5000);
  for (const patch of [
    (t: ReturnType<typeof base>) => void ((t.tokens as Record<string, string>)[key] = '#fff'),
    (t: ReturnType<typeof base>) => void ((t.backgrounds as Record<string, string>)[key] = 'a.png'),
    (t: ReturnType<typeof base>) => void ((t.layouts as Record<string, string>)[key] = 'x'),
    (t: ReturnType<typeof base>) => ({ ...t, [key]: 1 }),
  ]) {
    const e = error(patch)!;
    expect(e.length).toBeLessThan(200);
    expect(e).not.toMatch(/[\n\r]/);
  }
});

test('o exemplo do guia de temas (docs/THEMES.md) é um tema válido', () => {
  const doc = readFileSync('docs/THEMES.md', 'utf8');
  const example = /```json\n([\s\S]*?)```/.exec(doc.replace(/\r\n/g, '\n'))![1]!;
  expect(validateTheme(JSON.parse(example))).toMatchObject({ ok: true });
});
