import { signal } from '@preact/signals';
import { readSetting, writeSetting } from './storage';

export interface Prefs {
  /** Transições: completa, reduzida (só esmaecer) ou desligada. */
  motion: 'full' | 'reduced' | 'off';
  /** Vídeo de fundo toca (desligado, fica parado no primeiro quadro). */
  video: boolean;
  champSelectLayout: 'cinematic' | 'classic';
  /** Idioma da camada; `auto` segue o client. */
  locale: 'auto' | 'pt' | 'en';
  /** Camada ao abrir o client: ligada, desligada ou como ficou da última vez (null). */
  openOnStart: boolean | null;
}

export const DEFAULT_PREFS: Prefs = { motion: 'full', video: true, champSelectLayout: 'cinematic', locale: 'auto', openOnStart: null };
const KEY = 'rlc.prefs';
const oneOf = <T extends string>(v: unknown, options: readonly T[], def: T): T => (options.includes(v as T) ? (v as T) : def);

export function sanitizePrefs(v: unknown): Prefs {
  const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  return {
    motion: oneOf(o.motion, ['full', 'reduced', 'off'], 'full'),
    video: o.video !== false,
    champSelectLayout: oneOf(o.champSelectLayout, ['cinematic', 'classic'], 'cinematic'),
    locale: oneOf(o.locale, ['auto', 'pt', 'en'], 'auto'),
    openOnStart: typeof o.openOnStart === 'boolean' ? o.openOnStart : null,
  };
}

export const prefs = signal<Prefs>(DEFAULT_PREFS);
export const loadPrefs = (): Prefs => (prefs.value = sanitizePrefs(readSetting<unknown>(KEY, null)));
export function setPrefs(patch: Partial<Prefs>): void {
  prefs.value = { ...prefs.value, ...patch };
  writeSetting(KEY, prefs.value);
}

/** Locale a aplicar: o fixado nas preferências ou o do client (null enquanto o do client não chegou). */
export function effectiveLocale(pref: Prefs['locale'], client: string | undefined): string | null {
  if (pref === 'pt') return 'pt_BR';
  if (pref === 'en') return 'en_US';
  return client ?? null;
}
