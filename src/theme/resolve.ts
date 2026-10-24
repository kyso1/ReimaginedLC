import { OPTIONAL_TOKENS, TOKEN_KINDS, type ThemeManifest, type Transition } from './validate';

export interface ResolvedTheme {
  name: string;
  label: string;
  tokens: Record<string, string>;
  transition: Transition;
  /** Cada fundo lembra o tema que o declarou, porque o caminho é relativo à pasta desse tema. */
  backgrounds: Record<string, { theme: string; path: string }>;
}

const MAX_DEPTH = 3;

type Result = { ok: true; theme: ResolvedTheme } | { ok: false; error: string };

export function resolveTheme(name: string, themes: Map<string, ThemeManifest>): Result {
  const chain: ThemeManifest[] = [];
  const seen = new Set<string>();
  for (let current: string | null = name; current !== null; ) {
    if (seen.has(current)) return { ok: false, error: `extends: ciclo em "${current}"` };
    seen.add(current);
    const manifest = themes.get(current);
    if (!manifest) return { ok: false, error: `tema "${current}" não encontrado` };
    chain.push(manifest);
    if (chain.length > MAX_DEPTH) return { ok: false, error: `extends: profundidade acima de ${MAX_DEPTH}` };
    current = manifest.extends;
  }

  const own = chain[0]!;
  const resolved: ResolvedTheme = { name: own.name, label: own.label, tokens: Object.create(null), transition: 'fade', backgrounds: Object.create(null) };
  for (const manifest of chain.reverse()) {
    // Só chaves próprias, em objetos sem protótipo: uma chave "__proto__" vira dado, nunca troca o protótipo.
    for (const [token, value] of Object.entries(manifest.tokens)) resolved.tokens[token] = value;
    if (manifest.transition) resolved.transition = manifest.transition;
    for (const [screen, path] of Object.entries(manifest.backgrounds)) resolved.backgrounds[screen] = { theme: manifest.name, path };
  }

  const missing = Object.keys(TOKEN_KINDS).filter((token) => !OPTIONAL_TOKENS.has(token) && !Object.hasOwn(resolved.tokens, token));
  if (missing.length) return { ok: false, error: `tokens ausentes: ${missing.join(', ')}` };
  return { ok: true, theme: resolved };
}
