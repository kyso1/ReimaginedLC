export type TokenKind = 'color' | 'length' | 'duration' | 'weight' | 'easing' | 'font';
export type Transition = 'wipe' | 'fade' | 'slide' | 'zoom';

export interface ThemeManifest {
  name: string;
  label: string;
  version: number;
  extends: string | null;
  tokens: Record<string, string>;
  transition?: Transition;
  backgrounds: Record<string, string>;
  layouts: Record<string, string>;
}

export const TOKEN_KINDS: Record<string, TokenKind> = {
  'color.bg': 'color',
  'color.surface': 'color',
  'color.border': 'color',
  'color.text': 'color',
  'color.textMuted': 'color',
  'color.accent': 'color',
  'color.onAccent': 'color',
  'font.body': 'font',
  'font.display': 'font',
  'font.displayWeight': 'weight',
  'radius.sm': 'length',
  'radius.md': 'length',
  'radius.pill': 'length',
  'blur.surface': 'length',
  'motion.duration': 'duration',
  'motion.easing': 'easing',
};

export const TRANSITIONS: readonly Transition[] = ['wipe', 'fade', 'slide', 'zoom'];

// Um tema é só dado. Cada valor precisa casar inteiro com o formato do seu tipo;
// nada com `;`, `{`, `url(` ou `var(` passa, porque nenhum formato abaixo os admite.
const FORMAT: Record<TokenKind, RegExp> = {
  color: /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([\d\s.,%/]+\))$/i,
  length: /^\d+(\.\d+)?(px|rem|%)$/,
  duration: /^\d+(\.\d+)?(ms|s)$/,
  weight: /^[1-9]\d0$/,
  easing: /^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(\s*-?\d*\.?\d+\s*(,\s*-?\d*\.?\d+\s*){3}\))$/,
  font: /^[\p{L}\p{N} ,'"_-]+$/u,
};

const NAME = /^[a-z0-9-]{1,40}$/;
const SIMPLE = /^[a-z0-9-]{1,40}$/i;
const MEDIA_EXT = '(png|jpg|webp|gif|webm|mp4)';
const RELATIVE_MEDIA = new RegExp(`^[\\w.-]+(/[\\w.-]+)*\\.${MEDIA_EXT}$`, 'i');
const CLIENT_MEDIA = new RegExp(`^/(fe|lol-game-data/assets)(/[\\w.-]+)+\\.${MEDIA_EXT}$`, 'i');
const ROOT_KEYS = new Set(['name', 'label', 'version', 'extends', 'tokens', 'transition', 'backgrounds', 'layouts']);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const validMedia = (path: string): boolean =>
  path === '' || (!path.includes('..') && (RELATIVE_MEDIA.test(path) || CLIENT_MEDIA.test(path)));

type Result = { ok: true; theme: ThemeManifest } | { ok: false; error: string };
const fail = (field: string, why: string): Result => ({ ok: false, error: `${field}: ${why}` });

export function validateTheme(input: unknown): Result {
  if (!isRecord(input)) return fail('tema', 'precisa ser um objeto');
  for (const key of Object.keys(input)) if (!ROOT_KEYS.has(key)) return fail(key, 'campo desconhecido');

  const { name, label, version, tokens = {}, transition, backgrounds = {}, layouts = {} } = input;
  const parent = input.extends ?? null;

  if (typeof name !== 'string' || !NAME.test(name)) return fail('name', 'use só minúsculas, dígitos e hífen (até 40)');
  if (typeof label !== 'string' || label.length === 0 || label.length > 60) return fail('label', 'texto de 1 a 60 caracteres');
  if (version !== 1) return fail('version', 'só a versão 1 é suportada');
  if (parent !== null && (typeof parent !== 'string' || !NAME.test(parent))) return fail('extends', 'nome de tema inválido');
  if (transition !== undefined && !TRANSITIONS.includes(transition as Transition)) return fail('transition', `use um de ${TRANSITIONS.join(', ')}`);

  if (!isRecord(tokens)) return fail('tokens', 'precisa ser um objeto');
  for (const [token, value] of Object.entries(tokens)) {
    const kind = TOKEN_KINDS[token];
    if (!kind) return fail(`tokens.${token}`, 'token desconhecido');
    if (typeof value !== 'string' || !FORMAT[kind].test(value)) return fail(`tokens.${token}`, `valor fora do formato de ${kind}`);
    if (kind === 'weight' && Number(value) > 900) return fail(`tokens.${token}`, 'peso de 100 a 900');
  }

  if (!isRecord(backgrounds)) return fail('backgrounds', 'precisa ser um objeto');
  for (const [screen, path] of Object.entries(backgrounds)) {
    if (!SIMPLE.test(screen)) return fail(`backgrounds.${screen}`, 'nome de tela inválido');
    if (typeof path !== 'string' || !validMedia(path)) return fail(`backgrounds.${screen}`, 'caminho de mídia não permitido');
  }

  if (!isRecord(layouts)) return fail('layouts', 'precisa ser um objeto');
  for (const [screen, layout] of Object.entries(layouts)) {
    if (!SIMPLE.test(screen) || typeof layout !== 'string' || !SIMPLE.test(layout)) return fail(`layouts.${screen}`, 'nome de layout inválido');
  }

  return {
    ok: true,
    theme: {
      name,
      label,
      version: 1,
      extends: parent as string | null,
      tokens: tokens as Record<string, string>,
      ...(transition ? { transition: transition as Transition } : {}),
      backgrounds: backgrounds as Record<string, string>,
      layouts: layouts as Record<string, string>,
    },
  };
}
