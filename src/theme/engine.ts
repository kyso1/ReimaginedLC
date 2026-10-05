import { signal, type Signal } from '@preact/signals';
import { t } from '../i18n';
import { readSetting, writeSetting } from '../shell/storage';
import { resolveTheme, type ResolvedTheme } from './resolve';
import { validateTheme, type ThemeManifest } from './validate';

export const BUILTIN: readonly string[] = ['vidro', 'vidro-ludico', 'editorial'];
const FALLBACK = 'vidro';
const USER_KEY = 'rlc.userThemes';

export type Game = 'lol' | 'tft';
export type SaveResult = { ok: true } | { ok: false; error: string };
export interface ThemeEntry {
  name: string;
  label: string;
  user: boolean;
}

export interface ThemeEngine {
  /** Tema ativo do LoL (o mesmo que `forGame.lol`). */
  active: Signal<ResolvedTheme>;
  /** Tema ativo por jogo; o shell escolhe pelo jogo do lobby atual. */
  forGame: Record<Game, Signal<ResolvedTheme>>;
  /** Temas disponíveis (embutidos e do usuário). */
  list: Signal<ThemeEntry[]>;
  /** Instantâneo de `list`, mantido por compatibilidade. */
  readonly available: Array<{ name: string; label: string }>;
  set(name: string, game?: Game): void;
  /** Valida e guarda um tema do usuário; um tema ativo com o mesmo nome é atualizado na hora. */
  saveUser(input: unknown): SaveResult;
  /** Recusa enquanto outro tema do usuário herda deste (o filho ficaria guardado e invisível). */
  deleteUser(name: string): SaveResult;
  /** Manifesto em JSON para exportar, ou null. */
  exportTheme(name: string): string | null;
  manifest(name: string): ThemeManifest | null;
  /** Resolve um rascunho do editor sem salvar (para a pré-visualização). */
  resolveDraft(input: unknown): { ok: true; theme: ResolvedTheme } | { ok: false; error: string };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

async function loadManifest(base: string, name: string, get: (url: string) => Promise<Response>): Promise<ThemeManifest | string> {
  try {
    const response = await get(`${base}themes/${name}/theme.json`);
    if (!response.ok) return `${name}: HTTP ${response.status}`;
    const result = validateTheme(await response.json());
    if (!result.ok) return `${name}: ${result.error}`;
    if (result.theme.name !== name) return `${name}: name diferente da pasta`;
    return result.theme;
  } catch (e) {
    return `${name}: ${e instanceof Error ? e.message : 'falha ao carregar'}`;
  }
}

export async function createThemeEngine(base: string, get: (url: string) => Promise<Response> = (url) => fetch(url)): Promise<ThemeEngine> {
  const manifests = new Map<string, ThemeManifest>();
  for (const name of BUILTIN) {
    const loaded = await loadManifest(base, name, get);
    if (typeof loaded === 'string') window.Toast?.error(`${t('themeInvalid')}: ${loaded}`);
    else manifests.set(name, loaded);
  }
  const userNames = new Set<string>();
  // Temas do usuário guardados no DataStore passam de novo pela validação: o armazenamento não é confiável.
  const storedUser = readSetting<unknown>(USER_KEY, []);
  for (const raw of Array.isArray(storedUser) ? storedUser : []) {
    const result = validateTheme(raw);
    if (result.ok && !BUILTIN.includes(result.theme.name)) {
      manifests.set(result.theme.name, result.theme);
      userNames.add(result.theme.name);
    }
  }

  const resolved = new Map<string, ResolvedTheme>();
  const resolveAll = () => {
    resolved.clear();
    for (const name of manifests.keys()) {
      const result = resolveTheme(name, manifests);
      if (result.ok) resolved.set(name, result.theme);
      else if (!userNames.has(name)) window.Toast?.error(`${t('themeInvalid')}: ${name}: ${result.error}`);
    }
  };
  resolveAll();

  const fallback = resolved.get(FALLBACK);
  if (!fallback) throw new Error(`tema embutido "${FALLBACK}" indisponível`);

  const stored = readSetting<unknown>('rlc.theme', null);
  const saved = isRecord(stored) ? stored : {};
  const pick = (game: Game, def: string) => resolved.get(typeof saved[game] === 'string' ? (saved[game] as string) : def) ?? resolved.get(def) ?? fallback;
  const forGame: Record<Game, Signal<ResolvedTheme>> = { lol: signal(pick('lol', FALLBACK)), tft: signal(pick('tft', 'vidro-ludico')) };
  const entries = (): ThemeEntry[] => [...resolved.values()].map(({ name, label }) => ({ name, label, user: userNames.has(name) }));
  const list = signal(entries());

  const persistUser = () => writeSetting(USER_KEY, [...userNames].map((n) => manifests.get(n)));
  const refresh = () => {
    resolveAll();
    list.value = entries();
    for (const game of ['lol', 'tft'] as const) forGame[game].value = resolved.get(forGame[game].value.name) ?? fallback;
  };
  const setFor = (name: string, game: Game) => {
    const theme = resolved.get(name);
    if (!theme) {
      window.Toast?.error(`${t('themeInvalid')}: ${name}`);
      return;
    }
    const current = readSetting<unknown>('rlc.theme', null);
    writeSetting('rlc.theme', { ...(isRecord(current) ? current : {}), [game]: name });
    forGame[game].value = theme;
  };

  return {
    active: forGame.lol,
    forGame,
    list,
    get available() {
      return list.value.map(({ name, label }) => ({ name, label }));
    },
    set: (name, game = 'lol') => setFor(name, game),
    saveUser(input) {
      const result = validateTheme(input);
      if (!result.ok) return { ok: false, error: result.error };
      if (BUILTIN.includes(result.theme.name)) return { ok: false, error: `name: "${result.theme.name}" é de um tema embutido` };
      const probe = new Map(manifests).set(result.theme.name, result.theme);
      const check = resolveTheme(result.theme.name, probe);
      if (!check.ok) return { ok: false, error: check.error };
      manifests.set(result.theme.name, result.theme);
      userNames.add(result.theme.name);
      persistUser();
      refresh();
      return { ok: true };
    },
    deleteUser(name) {
      if (!userNames.has(name)) return { ok: false, error: `"${name}" não é um tema do usuário` };
      const children = [...userNames].map((n) => manifests.get(n)).filter((m) => m?.extends === name);
      if (children.length) return { ok: false, error: `usado por ${children.map((m) => m!.label).join(', ')}` };
      userNames.delete(name);
      manifests.delete(name);
      persistUser();
      for (const game of ['lol', 'tft'] as const) if (forGame[game].value.name === name) setFor(game === 'tft' ? 'vidro-ludico' : FALLBACK, game);
      refresh();
      return { ok: true };
    },
    exportTheme: (name) => (manifests.has(name) ? JSON.stringify(manifests.get(name), null, 2) : null),
    manifest: (name) => manifests.get(name) ?? null,
    resolveDraft(input) {
      const result = validateTheme(input);
      if (!result.ok) return { ok: false, error: result.error };
      return resolveTheme(result.theme.name, new Map(manifests).set(result.theme.name, result.theme));
    },
  };
}
