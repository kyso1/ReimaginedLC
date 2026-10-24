// Ajuda para IAs: o JSON Schema do formato de tema (docs/theme.schema.json, gerado daqui) e o prompt que o editor copia.
// Em inglês de propósito: é lido por modelos, que respondem no idioma do usuário.
import { CONTRAST_PAIRS } from './contrast';
import { BUILTIN } from './engine';
import { FORMAT, OPTIONAL_TOKENS, SCHEMA_URL, TOKEN_KINDS, TRANSITIONS, type ThemeManifest } from './validate';


/** O que cada token pinta, para quem não vê a tela. */
export const TOKEN_HELP: Record<string, string> = {
  'color.bg': 'Base background behind everything (usually dark).',
  'color.surface': 'Panels and cards over the background art. Keep it translucent (alpha 0.08-0.9).',
  'color.border': 'Thin borders of panels, inputs and chips.',
  'color.text': 'Main text.',
  'color.textMuted': 'Secondary text: descriptions, counters, timestamps.',
  'color.accent': 'Primary buttons, selected chips, active tab underline.',
  'color.onAccent': 'Text and icons on top of color.accent.',
  'font.body': 'Font stack for body text. Only fonts installed on Windows, or Quicksand (bundled).',
  'font.display': 'Font stack for big titles.',
  'font.displayWeight': 'Weight of big titles, 100-900 in steps of 10.',
  'radius.sm': 'Corner radius of small controls (chips, inputs).',
  'radius.md': 'Corner radius of cards and panels.',
  'radius.pill': 'Corner radius of pill buttons (999px = fully round).',
  'blur.surface': 'Backdrop blur of glass panels (0px disables the glass look).',
  'motion.duration': 'Duration of hover and screen transitions.',
  'motion.easing': 'Easing of transitions.',
  'color.highlight': 'Active/turn highlight (e.g. the player picking in champion select).',
  'color.danger': 'Destructive actions, errors, enemy team accents.',
  'color.onDanger': 'Text on top of color.danger.',
  'color.win': 'Victory, positive LP, success checks.',
  'color.loss': 'Defeat, negative LP.',
  'color.premium': 'Premium pass rewards and borders.',
  'color.online': 'Friend status dot: online.',
  'color.away': 'Friend status dot: away.',
  'color.playing': 'Friend status dot: in game.',
  'color.teamBlue': 'Blue side tint (lobby slots, champion select).',
  'color.teamRed': 'Red side tint.',
  'color.scrim': 'Dark vignette over splash art so text stays readable.',
  'color.shade': 'Drop shadow color of raised cards and menus.',
  'color.textShadow': 'Shadow behind text drawn over art.',
  'color.glassTop': 'Top of the gradient of glass panels (champion select, drawers).',
  'color.glassBottom': 'Bottom of the gradient of glass panels.',
  'color.glassCard': 'Cards inside glass panels.',
  'color.glassCardHover': 'Cards inside glass panels, on hover.',
  'color.bar': 'Floating bars (lobby bar, queue pill, Spotify widget).',
  'color.sheetTop': 'Top of the match history sheet.',
  'color.sheetBottom': 'Bottom of the match history sheet.',
  'radius.lg': 'Corner radius of large hero panels.',
};

const KIND_HELP: Record<string, string> = {
  color: 'hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() or hsl()/hsla()',
  length: 'number + px, rem or %',
  duration: 'number + ms or s',
  weight: '100-900 in steps of 10',
  easing: 'linear, ease, ease-in, ease-out, ease-in-out or cubic-bezier(a, b, c, d)',
  font: 'comma-separated font families, quoted when they contain spaces',
};

// O validador usa a flag `i` nas cores; JSON Schema não tem flags, então o hex aceita as duas caixas aqui.
const pattern = (kind: string): string => {
  const source = FORMAT[kind as keyof typeof FORMAT].source;
  return kind === 'color' ? source.replaceAll('[0-9a-f]', '[0-9a-fA-F]') : source;
};

export function themeSchema(): object {
  const tokens = Object.fromEntries(
    Object.entries(TOKEN_KINDS).map(([token, kind]) => [
      token,
      { type: 'string', maxLength: 200, pattern: pattern(kind), description: `${TOKEN_HELP[token] ?? ''} Format: ${KIND_HELP[kind]}.${OPTIONAL_TOKENS.has(token) ? ' Optional.' : ''}`.trim() },
    ]),
  );
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: SCHEMA_URL,
    title: 'ReimaginedLC theme',
    description: 'A ReimaginedLC theme: data only, no CSS or code. See docs/THEMES.md.',
    type: 'object',
    additionalProperties: false,
    required: ['name', 'label', 'version', 'extends', 'tokens'],
    properties: {
      $schema: { type: 'string' },
      name: { type: 'string', pattern: '^[a-z0-9-]{1,40}$', not: { enum: BUILTIN }, description: 'Identifier: lowercase letters, digits and -. Cannot be a built-in theme name.' },
      label: { type: 'string', minLength: 1, maxLength: 60, description: 'Name shown in Settings.' },
      version: { const: 1 },
      extends: {
        type: ['string', 'null'],
        pattern: '^[a-z0-9-]{1,40}$',
        description: `Parent theme (${BUILTIN.join(', ')} or a user theme). With a parent, list only the tokens you change. With null, every non-optional token is required.`,
      },
      tokens: { type: 'object', additionalProperties: false, properties: tokens },
      transition: { enum: TRANSITIONS, description: 'Screen change animation.' },
      backgrounds: {
        type: 'object',
        description: 'Background per screen (default, home, lobby, profile, collection, postgame): a client asset path.',
        additionalProperties: { type: 'string', maxLength: 300, pattern: String.raw`^(|/(fe|lol-game-data/assets)(/[\w.-]+)+\.(png|jpg|webp|gif|webm|mp4))$` },
      },
      layouts: { type: 'object', maxProperties: 0, description: 'Reserved. Use {}.' },
    },
  };
}

/** Prompt para colar numa IA: regras, tokens e o tema atual; a resposta volta pelo "Colar JSON" do editor. */
export function themePrompt(current: ThemeManifest, request = ''): string {
  const lines = Object.entries(TOKEN_KINDS).map(([token, kind]) => `- ${token} (${kind}${OPTIONAL_TOKENS.has(token) ? ', optional' : ''}): ${TOKEN_HELP[token] ?? ''}`);
  const contrast = CONTRAST_PAIRS.map(([fg, bg, min]) => `${fg} on ${bg} >= ${min}:1`).join('; ');
  return [
    'You are editing a theme for ReimaginedLC, a custom League of Legends client UI. A theme is a JSON file (data only: no CSS, no code, no url()).',
    `JSON Schema: ${SCHEMA_URL}`,
    '',
    'Rules:',
    '- Reply with ONE complete JSON object in a ```json code block, then at most 3 short lines explaining the changes, in the language the user writes in.',
    `- Keep "version": 1. "name" is lowercase letters, digits and "-", and must not be ${BUILTIN.join(', ')}. Keep the current "name" unless asked for a new theme.`,
    '- Keep "extends" as is; with a parent, list only tokens that differ. Unknown tokens or fields are rejected.',
    `- Values must match the formats below exactly. Colors: ${KIND_HELP.color}. No named colors (e.g. "red"), no var(), no gradients.`,
    `- Contrast (WCAG): ${contrast}. Translucent colors are composited over color.bg.`,
    '- color.surface sits over background art, so keep it translucent. The UI is mostly dark; light themes need dark text and a less transparent surface.',
    `- "transition": one of ${TRANSITIONS.join(', ')}. "backgrounds": client paths starting with /fe/ or /lol-game-data/assets/, or omit. "layouts": {}.`,
    '- If the app rejects the theme, it shows "field: reason". Fix that field and send the full JSON again.',
    '',
    'Tokens:',
    ...lines,
    '',
    'Current theme:',
    '```json',
    JSON.stringify({ $schema: SCHEMA_URL, ...current }, null, 2),
    '```',
    '',
    `Request: ${request.trim() || 'Improve this theme: better contrast and a more cohesive palette, same mood.'}`,
  ].join('\n');
}

/** Mensagem de erro do validador pronta para devolver à IA. */
export const fixPrompt = (error: string): string => `ReimaginedLC rejected the theme with: "${error}". Fix only what is needed and reply with the full corrected JSON.`;

/** Primeiro objeto JSON da resposta de uma IA: aceita bloco ```json, texto em volta ou o JSON puro. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1];
  const body = fenced ?? text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object');
  return JSON.parse(body.slice(start, end + 1));
}
