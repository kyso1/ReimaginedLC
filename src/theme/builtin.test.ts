import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { BUILTIN } from './engine';
import { resolveTheme } from './resolve';
import { validateTheme, type ThemeManifest } from './validate';

const load = (name: string): unknown => JSON.parse(readFileSync(`public/themes/${name}/theme.json`, 'utf8'));

test('cada tema embutido é válido, tem o nome da pasta e resolve', () => {
  const themes = new Map<string, ThemeManifest>();
  for (const name of BUILTIN) {
    const r = validateTheme(load(name));
    expect(r, name).toMatchObject({ ok: true });
    if (r.ok) {
      expect(r.theme.name).toBe(name);
      themes.set(name, r.theme);
    }
  }
  for (const name of BUILTIN) expect(resolveTheme(name, themes), name).toMatchObject({ ok: true });
});

test('editorial anula o fundo herdado e vidro lúdico o mantém', () => {
  const themes = new Map(BUILTIN.map((n) => [n, load(n) as ThemeManifest]));
  const editorial = resolveTheme('editorial', themes);
  const ludico = resolveTheme('vidro-ludico', themes);
  expect(editorial.ok && editorial.theme.backgrounds.default?.path).toBe('');
  expect(ludico.ok && ludico.theme.backgrounds.default?.path).toMatch(/^\/fe\//);
});

test('a fonte padrão é a Quicksand (embutida no plugin), com reserva do sistema', () => {
  const vidro = load('vidro') as ThemeManifest;
  expect(vidro.tokens['font.body']).toBe('Quicksand, system-ui, sans-serif');
  expect(vidro.tokens['font.display']).toBe('Quicksand, system-ui, sans-serif');
  for (const name of BUILTIN.filter((n) => n !== 'vidro')) {
    const m = load(name) as ThemeManifest;
    expect(m.tokens['font.body'], name).toBeUndefined();
    expect(m.tokens['font.display'], name).toBeUndefined();
  }
});
