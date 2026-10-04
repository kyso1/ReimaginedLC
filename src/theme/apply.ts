import type { ResolvedTheme } from './resolve';

export const cssVar = (token: string): string => `--rlc-${token.replaceAll('.', '-')}`;

const applied = new WeakMap<HTMLElement, string[]>();

/** Grava os tokens como variáveis CSS no elemento e remove as do tema anterior. */
export function applyTheme(el: HTMLElement, theme: ResolvedTheme): void {
  for (const property of applied.get(el) ?? []) el.style.removeProperty(property);
  const properties = Object.keys(theme.tokens).map(cssVar);
  for (const [token, value] of Object.entries(theme.tokens)) el.style.setProperty(cssVar(token), value);
  applied.set(el, properties);
  el.dataset.theme = theme.name;
  el.dataset.transition = theme.transition;
}

/** URL da mídia de fundo de uma tela, ou null. `base` é a URL da pasta do plugin, terminada em `/`. */
export function mediaUrl(theme: ResolvedTheme, screen: string, base: string): string | null {
  const own = (key: string) => (Object.hasOwn(theme.backgrounds, key) ? theme.backgrounds[key] : undefined);
  const background = own(screen) ?? own('default');
  if (!background || background.path === '') return null;
  if (background.path.startsWith('/')) return background.path;
  return `${base.endsWith('/') ? base : base + '/'}themes/${background.theme}/${background.path}`;
}
