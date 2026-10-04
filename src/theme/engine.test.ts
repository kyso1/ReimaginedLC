import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createThemeEngine } from './engine';

let data: Map<string, unknown>;

const files = (overrides: Record<string, string | number> = {}) => async (url: string) => {
  const name = /themes\/([^/]+)\/theme\.json$/.exec(url)?.[1] ?? '';
  const override = overrides[name];
  if (typeof override === 'number') return new Response(null, { status: override });
  if (typeof override === 'string') return new Response(override, { status: 200 });
  return new Response(readFileSync(`public/themes/${name}/theme.json`, 'utf8'), { status: 200 });
};

beforeEach(() => {
  data = new Map();
  window.DataStore = { has: (k) => data.has(k), get: (k) => data.get(k), set: (k, v) => void data.set(k, v), remove: (k) => void data.delete(k) };
  window.Toast = { success: vi.fn(), error: vi.fn() };
});

afterEach(() => {
  delete window.DataStore;
  delete window.Toast;
});

test('carrega os três temas embutidos e ativa o Vidro por padrão', async () => {
  const engine = await createThemeEngine('https://plugins/ReimaginedLC/', files());
  expect(engine.available.map((t) => t.name)).toEqual(['vidro', 'vidro-ludico', 'editorial']);
  expect(engine.active.value.name).toBe('vidro');
});

test('ativa o tema guardado para lol', async () => {
  data.set('rlc.theme', { lol: 'editorial', tft: 'vidro-ludico' });
  const engine = await createThemeEngine('https://x/', files());
  expect(engine.active.value.name).toBe('editorial');
});

test.each([['texto'], [42], [null], [['editorial']], [{ lol: 'nao-existe' }], [{ lol: 7 }]])('configuração inesperada %j cai no Vidro sem lançar', async (stored) => {
  data.set('rlc.theme', stored);
  const engine = await createThemeEngine('https://x/', files());
  expect(engine.active.value.name).toBe('vidro');
});

test('set troca o tema ativo e persiste por jogo, preservando o outro jogo', async () => {
  data.set('rlc.theme', { lol: 'vidro', tft: 'vidro-ludico' });
  const engine = await createThemeEngine('https://x/', files());
  engine.set('editorial');
  expect(engine.active.value.name).toBe('editorial');
  expect(data.get('rlc.theme')).toEqual({ lol: 'editorial', tft: 'vidro-ludico' });
  engine.set('vidro', 'tft');
  expect(engine.active.value.name).toBe('editorial');
  expect(data.get('rlc.theme')).toEqual({ lol: 'editorial', tft: 'vidro' });
});

test('set com tema desconhecido mantém o atual e avisa', async () => {
  const engine = await createThemeEngine('https://x/', files());
  engine.set('nao-existe');
  expect(engine.active.value.name).toBe('vidro');
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  expect(data.has('rlc.theme')).toBe(false);
});

test('tema embutido inválido ou ausente fica fora da lista, com aviso que cita o campo', async () => {
  const engine = await createThemeEngine('https://x/', files({ editorial: '{"name":"editorial","label":"E","version":1,"extends":"vidro","tokens":{"color.bg":"red; x"}}', 'vidro-ludico': 404 }));
  expect(engine.available.map((t) => t.name)).toEqual(['vidro']);
  expect(window.Toast!.error).toHaveBeenCalledWith(expect.stringContaining('tokens.color.bg'));
});

test('tema com nome diferente da pasta é recusado', async () => {
  const other = readFileSync('public/themes/vidro-ludico/theme.json', 'utf8');
  const engine = await createThemeEngine('https://x/', files({ editorial: other }));
  expect(engine.available.map((t) => t.name)).toEqual(['vidro', 'vidro-ludico']);
});

test('sem o Vidro não há motor de temas', async () => {
  await expect(createThemeEngine('https://x/', files({ vidro: 404 }))).rejects.toThrow(/vidro/);
});
