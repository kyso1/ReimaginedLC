import { signal, type Signal } from '@preact/signals';
import { t } from '../i18n';
import { readSetting, writeSetting } from '../shell/storage';
import { resolveTheme, type ResolvedTheme } from './resolve';
import { validateTheme, type ThemeManifest } from './validate';

export const BUILTIN: readonly string[] = ['vidro', 'vidro-ludico', 'editorial'];
const FALLBACK = 'vidro';

export type Game = 'lol' | 'tft';

export interface ThemeEngine {
  active: Signal<ResolvedTheme>;
  available: Array<{ name: string; label: string }>;
  /** Troca o tema de um jogo. Neste subprojeto só o de `lol` muda o tema ativo. */
  set(name: string, game?: Game): void;
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

  const resolved = new Map<string, ResolvedTheme>();
  for (const name of manifests.keys()) {
    const result = resolveTheme(name, manifests);
    if (result.ok) resolved.set(name, result.theme);
    else window.Toast?.error(`${t('themeInvalid')}: ${name}: ${result.error}`);
  }

  const fallback = resolved.get(FALLBACK);
  if (!fallback) throw new Error(`tema embutido "${FALLBACK}" indisponível`);

  const stored = readSetting<unknown>('rlc.theme', null);
  const saved = isRecord(stored) ? stored : {};
  const wanted = typeof saved.lol === 'string' ? saved.lol : FALLBACK;
  const active = signal(resolved.get(wanted) ?? fallback);

  return {
    active,
    available: [...resolved.values()].map(({ name, label }) => ({ name, label })),
    set(name, game = 'lol') {
      const theme = resolved.get(name);
      if (!theme) {
        window.Toast?.error(`${t('themeInvalid')}: ${name}`);
        return;
      }
      const current = readSetting<unknown>('rlc.theme', null);
      writeSetting('rlc.theme', { ...(isRecord(current) ? current : {}), [game]: name });
      if (game === 'lol') active.value = theme;
    },
  };
}
