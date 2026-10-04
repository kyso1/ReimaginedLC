import { expect, test } from 'vitest';
import { resolveTheme } from './resolve';
import { TOKEN_KINDS, type ThemeManifest } from './validate';

const SAMPLE: Record<string, string> = { color: '#000', length: '1px', duration: '1ms', weight: '400', easing: 'ease', font: 'serif' };
const fullTokens = () => Object.fromEntries(Object.entries(TOKEN_KINDS).map(([k, kind]) => [k, SAMPLE[kind]!]));

const mk = (name: string, patch: Partial<ThemeManifest> = {}): ThemeManifest => ({ name, label: name, version: 1, extends: null, tokens: {}, backgrounds: {}, layouts: {}, ...patch });
const map = (...themes: ThemeManifest[]) => new Map(themes.map((t) => [t.name, t]));

test('tema base resolve com seus próprios tokens e transição padrão fade', () => {
  const r = resolveTheme('base', map(mk('base', { tokens: fullTokens() })));
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.theme.tokens['color.bg']).toBe('#000');
    expect(r.theme.transition).toBe('fade');
  }
});

test('filho sobrescreve tokens, transição e fundos do pai, e cada fundo lembra de qual tema veio', () => {
  const base = mk('base', { tokens: fullTokens(), transition: 'wipe', backgrounds: { default: 'a.png', home: 'h.webm' } });
  const child = mk('filho', { extends: 'base', tokens: { 'color.bg': '#111' }, backgrounds: { home: 'h2.webm' } });
  const r = resolveTheme('filho', map(base, child));
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.theme.tokens['color.bg']).toBe('#111');
    expect(r.theme.tokens['color.text']).toBe('#000');
    expect(r.theme.transition).toBe('wipe');
    expect(r.theme.backgrounds.default).toEqual({ theme: 'base', path: 'a.png' });
    expect(r.theme.backgrounds.home).toEqual({ theme: 'filho', path: 'h2.webm' });
  }
});

test('recusa tema inexistente, pai inexistente e tokens faltando', () => {
  expect(resolveTheme('nada', map())).toMatchObject({ ok: false });
  expect(resolveTheme('filho', map(mk('filho', { extends: 'sumiu' })))).toMatchObject({ ok: false, error: expect.stringMatching(/sumiu/) });
  const r = resolveTheme('base', map(mk('base', { tokens: { 'color.bg': '#000' } })));
  expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/color\.surface/) });
});

test('recusa ciclo e profundidade acima de 3', () => {
  const a = mk('a', { extends: 'b', tokens: fullTokens() });
  const b = mk('b', { extends: 'a' });
  expect(resolveTheme('a', map(a, b))).toMatchObject({ ok: false, error: expect.stringMatching(/ciclo/) });

  const chain = [mk('t1', { tokens: fullTokens() }), mk('t2', { extends: 't1' }), mk('t3', { extends: 't2' }), mk('t4', { extends: 't3' })];
  expect(resolveTheme('t3', map(...chain)).ok).toBe(true);
  expect(resolveTheme('t4', map(...chain))).toMatchObject({ ok: false, error: expect.stringMatching(/profundidade/) });
});

test('V8: chave __proto__ própria no manifesto não troca o protótipo dos tokens resolvidos', () => {
  const hostile = mk('base', { tokens: { ...fullTokens(), ...JSON.parse('{"__proto__":{"polluted":"1"}}') }, backgrounds: JSON.parse('{"__proto__":"x.png"}') });
  const r = resolveTheme('base', map(hostile));
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(Object.getPrototypeOf(r.theme.tokens)).toBeNull();
    expect(Object.getPrototypeOf(r.theme.backgrounds)).toBeNull();
    expect((r.theme.tokens as Record<string, unknown>).polluted).toBeUndefined();
  }
  const manifest = JSON.parse('{"name":"base","label":"b","version":1,"extends":null,"tokens":{"__proto__":{"polluted":"1"}},"backgrounds":{},"layouts":{}}');
  expect(resolveTheme('base', map(manifest))).toMatchObject({ ok: false });
});

test('V8: token herdado de Object.prototype não conta como presente', () => {
  const tokens = fullTokens();
  delete tokens['color.bg'];
  (Object.prototype as Record<string, unknown>)['color.bg'] = '#000';
  try {
    expect(resolveTheme('base', map(mk('base', { tokens })))).toMatchObject({ ok: false, error: expect.stringMatching(/color\.bg/) });
  } finally {
    delete (Object.prototype as Record<string, unknown>)['color.bg'];
  }
});
