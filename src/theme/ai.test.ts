import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractJson, themePrompt, themeSchema } from './ai';
import { validateTheme } from './validate';

const SCHEMA_FILE = 'docs/theme.schema.json';

describe('ajuda para IA', () => {
  it('docs/theme.schema.json está em dia com o validador (UPDATE_SCHEMA=1 regrava)', () => {
    const fresh = `${JSON.stringify(themeSchema(), null, 2)}\n`;
    if (process.env.UPDATE_SCHEMA) writeFileSync(SCHEMA_FILE, fresh);
    expect(readFileSync(SCHEMA_FILE, 'utf8').replace(/\r\n/g, '\n')).toBe(fresh);
  });

  it('os padrões do schema aceitam e recusam o mesmo que o validador', () => {
    const tokens = (themeSchema() as { properties: { tokens: { properties: Record<string, { pattern: string }> } } }).properties.tokens.properties;
    const accent = new RegExp(tokens['color.accent']!.pattern, 'u');
    expect(accent.test('#8AB4FF')).toBe(true);
    expect(accent.test('rgba(255, 255, 255, 0.12)')).toBe(true);
    expect(accent.test('red')).toBe(false);
    expect(new RegExp(tokens['font.body']!.pattern, 'u').test('"Segoe UI", sans-serif')).toBe(true);
  });

  it('extrai o JSON da resposta da IA, com ou sem bloco de código', () => {
    expect(extractJson('Aqui está:\n```json\n{"a": 1}\n```\nMudei o fundo.')).toEqual({ a: 1 });
    expect(extractJson('{"b": 2}')).toEqual({ b: 2 });
    expect(() => extractJson('sem json')).toThrow();
  });

  it('o prompt leva o tema atual com $schema, que o validador aceita de volta', () => {
    const theme = { name: 'meu', label: 'Meu', version: 1, extends: 'vidro', tokens: { 'color.accent': '#ff0000' }, backgrounds: {}, layouts: {} };
    const prompt = themePrompt(theme, 'mais roxo');
    expect(prompt).toContain('Request: mais roxo');
    expect(prompt).toContain('color.onAccent on color.accent >= 4.5:1');
    const back = validateTheme(JSON.parse(prompt.split('```json\n')[1]!.split('```')[0]!));
    expect(back.ok).toBe(true);
  });
});
