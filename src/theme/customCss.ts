// CSS do próprio usuário, por cima dos temas: liberdade total de estilo, por conta dele. Fica de fora do formato de tema
// de propósito (tema compartilhado continua sendo só dado), e só vale com a camada ligada: Ctrl+Shift+F12 sempre
// devolve o client da Riot intacto.
import { effect, signal } from '@preact/signals';
import { enabled } from '../shell/layer';
import { readSetting, writeSetting } from '../shell/storage';

export interface CustomCss {
  on: boolean;
  css: string;
}

const KEY = 'rlc.customCss';
export const MAX_CSS = 50_000;

// Nada que carregue coisa de fora ou execute código: @import, url() fora dos arquivos do client, e os vetores antigos de script em CSS.
const BLOCKED: Array<[RegExp, string]> = [
  [/@import/i, '@import'],
  [/url\(\s*(?!['"]?\/(?:fe|lol-game-data\/assets)\/)/i, 'url() (only /fe/ and /lol-game-data/assets/ paths)'],
  // image-set() aceita string sem url(): carregaria de fora.
  [/image-set\s*\(/i, 'image-set()'],
  [/expression\s*\(/i, 'expression()'],
  [/javascript:/i, 'javascript:'],
  [/-moz-binding|behavior\s*:/i, 'binding/behavior'],
  [/<\/?\s*style/i, '<style>'],
];

/** Motivo da recusa, ou null se o CSS pode entrar. */
export function checkCss(css: string): string | null {
  if (css.length > MAX_CSS) return `> ${MAX_CSS} chars`;
  // Escape CSS (`u\72l(`, `@\69mport`) esconderia qualquer palavra da lista: barra invertida não entra.
  // ponytail: recusa também escapes legítimos (content: "\201C"); trocar por parse via CSSOM se alguém precisar.
  if (css.includes('\\')) return 'backslash escapes';
  // Checa o texto cru, sem tirar comentários: "/*" dentro de string esconderia um url() real. Comentário logo após
  // `url(` já cai na regra (não começa com /fe/), e comentário no meio de uma palavra não a forma em CSS.
  for (const [re, what] of BLOCKED) if (re.test(css)) return what;
  return null;
}

const load = (): CustomCss => {
  const v = readSetting<unknown>(KEY, null) as Partial<CustomCss> | null;
  const css = typeof v?.css === 'string' && checkCss(v.css) === null ? v.css : '';
  return { on: v?.on === true && css !== '', css };
};

export const customCss = signal<CustomCss>({ on: false, css: '' });

export function setCustomCss(next: CustomCss): string | null {
  const error = checkCss(next.css);
  if (error) return error;
  customCss.value = next;
  writeSetting(KEY, next);
  return null;
}

/** Mantém um <style> com o CSS do usuário depois do nosso, só enquanto ligado e com a camada à vista. */
export function startCustomCss(): void {
  customCss.value = load();
  const style = document.createElement('style');
  style.dataset.rlcCustom = '';
  effect(() => {
    const { on, css } = customCss.value;
    if (on && enabled.value && css) {
      style.textContent = css;
      if (!style.isConnected) document.head.append(style);
    } else style.remove();
  });
}

/** Prompt para uma IA escrever ou corrigir o CSS. */
export function cssPrompt(css: string, request: string): string {
  return [
    'You are writing custom CSS for ReimaginedLC, a custom League of Legends client UI that runs in the client (Chromium 108).',
    '',
    'Rules:',
    '- Reply with the COMPLETE stylesheet in one ```css code block, then at most 3 short lines in the language the user writes in.',
    '- Every selector must start with #rlc-root. The app root is #rlc-root .rlc-app, and its data-screen attribute names the screen: home, lobby, modes, champselect, ingame, postgame, honor, profile, collection, store, events, settings.',
    '- Classes start with rlc- (e.g. .rlc-button, .rlc-rail, .rlc-input). Do not guess names you are unsure of: ask the user to open DevTools (Ctrl+Shift+I) and copy the element.',
    '- Prefer theme variables over literal values: var(--rlc-color-bg), var(--rlc-color-surface), var(--rlc-color-border), var(--rlc-color-text), var(--rlc-color-textMuted), var(--rlc-color-accent), var(--rlc-color-onAccent), var(--rlc-radius-sm|md|pill), var(--rlc-blur-surface), var(--rlc-motion-duration), var(--rlc-motion-easing), var(--rlc-font-body), var(--rlc-font-display).',
    '- Not allowed (the app rejects it): @import, url() other than /fe/... or /lol-game-data/assets/... client paths, image-set(), backslash escapes, expression(), javascript:. Unsupported in Chromium 108: CSS nesting, :has(), color-mix(), @scope.',
    '- Keep text readable (WCAG 4.5:1) and keep focus outlines visible.',
    '',
    'Current CSS:',
    '```css',
    css || '/* empty */',
    '```',
    '',
    `Request: ${request.trim() || 'Review this CSS: fix bugs and make it cleaner, same look.'}`,
  ].join('\n');
}
