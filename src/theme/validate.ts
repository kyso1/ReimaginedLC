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

const CORE_TOKENS: Record<string, TokenKind> = {
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

// Opcionais: sem valor, cada tela usa a cor padrão do próprio CSS.
const OPTIONAL_KINDS: Record<string, TokenKind> = {
  'color.highlight': 'color',
  'color.danger': 'color',
  'color.onDanger': 'color',
  'color.win': 'color',
  'color.loss': 'color',
  'color.premium': 'color',
  'color.online': 'color',
  'color.away': 'color',
  'color.playing': 'color',
  'color.teamBlue': 'color',
  'color.teamRed': 'color',
  'color.scrim': 'color',
  'color.shade': 'color',
  'color.textShadow': 'color',
  'color.glassTop': 'color',
  'color.glassBottom': 'color',
  'color.glassCard': 'color',
  'color.glassCardHover': 'color',
  'color.bar': 'color',
  'color.sheetTop': 'color',
  'color.sheetBottom': 'color',
  'radius.lg': 'length',
};

export const TOKEN_KINDS: Record<string, TokenKind> = { ...CORE_TOKENS, ...OPTIONAL_KINDS };
/** Tokens que um tema pode deixar de fora mesmo sem `extends`. */
export const OPTIONAL_TOKENS: ReadonlySet<string> = new Set(Object.keys(OPTIONAL_KINDS));

/** Schema publicado (gerado por theme/ai.ts); vai no `$schema` dos temas exportados. */
export const SCHEMA_URL = 'https://raw.githubusercontent.com/kyso1/ReimaginedLC/master/docs/theme.schema.json';

export const TRANSITIONS: readonly Transition[] = ['wipe', 'fade', 'slide', 'zoom'];

// Um tema é só dado. Cada valor precisa casar inteiro com o formato do seu tipo;
// nada com `;`, `{`, `url(` ou `var(` passa, porque nenhum formato abaixo os admite.
// Cada padrão é ancorado e sem ambiguidade (nenhuma parte opcional casa os mesmos caracteres de dois jeitos),
// então o casamento é linear; o limite de tamanho em validateTheme é uma segunda barreira.

// Número decimal com "-" opcional: "12", "1.5", "-.5" (nunca "1." nem vazio).
const NUMBER = String.raw`-?(?:\d+(?:\.\d+)?|\.\d+)`;
// Componente de cor: número com % opcional.
const COMPONENT = `${NUMBER}%?`;
// Matiz: número com % ou deg opcional.
const HUE = `${NUMBER}(?:%|deg)?`;
// Função de cor: `first` e mais 2 componentes e alfa opcional, com vírgulas (", " ou ",") ou espaços simples (alfa após "/").
const colorFn = (names: string, first: string): string =>
  String.raw`(?:${names})\((?:${first}(?:, ?${COMPONENT}){2}(?:, ?${COMPONENT})?|${first}(?: ${COMPONENT}){2}(?: ?/ ?${COMPONENT})?)\)`;
// Cor: hex de 3, 4, 6 ou 8 dígitos, ou rgb()/rgba()/hsl()/hsla().
const COLOR = `#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|${colorFn('rgba?', COMPONENT)}|${colorFn('hsla?', HUE)}`;
// Easing: palavra-chave ou cubic-bezier com 4 números separados por "," ou ", " (só espaço literal).
const EASING = String.raw`linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\( ?${NUMBER}(?:, ?${NUMBER}){3} ?\)`;
// Caracteres de nome de fonte: letra, dígito, "_" e "-".
const FAMILY_CHARS = String.raw`\p{L}\p{N}_-`;
// Exige ao menos uma letra no item: olha à frente só por dígitos, "_", "-" e espaço até achar a letra.
const HAS_LETTER = String.raw`(?=[\p{N}_ -]*\p{L})`;
// Nome entre aspas simples ou duplas (sem aspas dentro), com ao menos uma letra.
const QUOTED = String.raw`(?:'${HAS_LETTER}[ ${FAMILY_CHARS}]+'|"${HAS_LETTER}[ ${FAMILY_CHARS}]+")`;
// Nome sem aspas: palavras separadas por um espaço, com ao menos uma letra.
const BARE = String.raw`${HAS_LETTER}[${FAMILY_CHARS}]+(?: [${FAMILY_CHARS}]+)*`;
// Lista de famílias separadas por "," ou ", ".
const FAMILY = `(?:${QUOTED}|${BARE})`;
const FONT = `${FAMILY}(?:, ?${FAMILY})*`;

export const FORMAT: Record<TokenKind, RegExp> = {
  color: new RegExp(`^(?:${COLOR})$`, 'i'),
  length: /^\d+(\.\d+)?(px|rem|%)$/,
  duration: /^\d+(\.\d+)?(ms|s)$/,
  weight: /^[1-9]\d0$/,
  easing: new RegExp(`^(?:${EASING})$`),
  font: new RegExp(`^${FONT}$`, 'u'),
};

const MAX_VALUE = 200;
const MAX_MEDIA_PATH = 300;
const NAME = /^[a-z0-9-]{1,40}$/;
const SIMPLE = /^[a-z0-9-]{1,40}$/i;
// Extensão de mídia sem diferenciar maiúsculas, escrita em classes de caractere ("[pP][nN][gG]")
// para que o resto do caminho (o prefixo do client) possa ser só minúsculo, sem a flag `i`.
const MEDIA_EXT = ['png', 'jpg', 'webp', 'gif', 'webm', 'mp4'].map((e) => [...e].map((c) => `[${c}${c.toUpperCase()}]`).join('')).join('|');
// Caminho relativo: segmentos de [\w.-] separados por "/", terminando em extensão de mídia.
const RELATIVE_MEDIA = new RegExp(String.raw`^[\w.-]+(?:/[\w.-]+)*\.(?:${MEDIA_EXT})$`);
// Caminho do client: prefixo fixo em minúsculas, segmentos de [\w.-], extensão de mídia.
const CLIENT_MEDIA = new RegExp(String.raw`^/(?:fe|lol-game-data/assets)(?:/[\w.-]+)+\.(?:${MEDIA_EXT})$`);
// `$schema` só serve a editores e IAs (docs/theme.schema.json); é aceito e descartado.
const ROOT_KEYS = new Set(['$schema', 'name', 'label', 'version', 'extends', 'tokens', 'transition', 'backgrounds', 'layouts']);

const isRecord = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null) return false;
  const proto: unknown = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};
const validMedia = (path: string): boolean =>
  path === '' || (path.length <= MAX_MEDIA_PATH && !path.includes('..') && (RELATIVE_MEDIA.test(path) || CLIENT_MEDIA.test(path)));

type Result = { ok: true; theme: ThemeManifest } | { ok: false; error: string };
// Chaves vêm do manifesto: no erro entram truncadas e sem caractere fora de [\w.-].
const safe = (text: string): string => text.slice(0, 40).replace(/[^\w.-]/g, '?');
const fail = (field: string, why: string): Result => ({ ok: false, error: `${safe(field)}: ${why}` });

export function validateTheme(input: unknown): Result {
  if (!isRecord(input)) return fail('tema', 'precisa ser um objeto');
  for (const key of Object.keys(input)) if (!ROOT_KEYS.has(key)) return fail(key, 'campo desconhecido');

  if (input.$schema !== undefined && (typeof input.$schema !== 'string' || input.$schema.length > MAX_MEDIA_PATH)) return fail('schema', 'precisa ser uma URL');
  const { name, label, version, tokens = {}, transition, backgrounds = {}, layouts = {} } = input;
  const parent = input.extends ?? null;

  if (typeof name !== 'string' || !NAME.test(name)) return fail('name', 'use só minúsculas, dígitos e hífen (até 40)');
  if (typeof label !== 'string' || label.length === 0 || label.length > 60) return fail('label', 'texto de 1 a 60 caracteres');
  if (version !== 1) return fail('version', 'só a versão 1 é suportada');
  if (parent !== null && (typeof parent !== 'string' || !NAME.test(parent))) return fail('extends', 'nome de tema inválido');
  if (transition !== undefined && !TRANSITIONS.includes(transition as Transition)) return fail('transition', `use um de ${TRANSITIONS.join(', ')}`);

  if (!isRecord(tokens)) return fail('tokens', 'precisa ser um objeto');
  const cleanTokens: Record<string, string> = {};
  for (const [token, value] of Object.entries(tokens)) {
    if (!Object.hasOwn(TOKEN_KINDS, token)) return fail(`tokens.${token}`, 'token desconhecido');
    const kind = TOKEN_KINDS[token]!;
    if (typeof value !== 'string' || value.length > MAX_VALUE || !FORMAT[kind].test(value)) return fail(`tokens.${token}`, `valor fora do formato de ${kind}`);
    if (kind === 'weight' && Number(value) > 900) return fail(`tokens.${token}`, 'peso de 100 a 900');
    cleanTokens[token] = value;
  }

  if (!isRecord(backgrounds)) return fail('backgrounds', 'precisa ser um objeto');
  const cleanBackgrounds: Record<string, string> = {};
  for (const [screen, path] of Object.entries(backgrounds)) {
    if (!SIMPLE.test(screen)) return fail(`backgrounds.${screen}`, 'nome de tela inválido');
    if (typeof path !== 'string' || !validMedia(path)) return fail(`backgrounds.${screen}`, 'caminho de mídia não permitido');
    cleanBackgrounds[screen] = path;
  }

  if (!isRecord(layouts)) return fail('layouts', 'precisa ser um objeto');
  const cleanLayouts: Record<string, string> = {};
  for (const [screen, layout] of Object.entries(layouts)) {
    if (!SIMPLE.test(screen) || typeof layout !== 'string' || !SIMPLE.test(layout)) return fail(`layouts.${screen}`, 'nome de layout inválido');
    cleanLayouts[screen] = layout;
  }

  return {
    ok: true,
    theme: {
      name,
      label,
      version: 1,
      extends: parent,
      tokens: cleanTokens,
      ...(transition ? { transition: transition as Transition } : {}),
      backgrounds: cleanBackgrounds,
      layouts: cleanLayouts,
    },
  };
}
