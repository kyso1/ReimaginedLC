// Contraste WCAG entre os tokens de cor de um tema: o editor avisa (não bloqueia) e o prompt para IA cobra os mesmos mínimos.

type Rgba = [number, number, number, number];

const num = (s: string, scale: number): number => (s.endsWith('%') ? (parseFloat(s) / 100) * scale : parseFloat(s));

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/** Cor nos formatos aceitos pelo validador (hex, rgb[a], hsl[a]) em [r, g, b, a] com r/g/b de 0 a 255; null se não reconhecer. */
export function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const at = (i: number) => parseInt(full.slice(i * 2, i * 2 + 2), 16);
    return [at(0), at(1), at(2), full.length === 8 ? at(3) / 255 : 1];
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(v);
  if (!fn) return null;
  const parts = fn[2]!.split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (parts.length < 3) return null;
  const alpha = parts[3] === undefined ? 1 : num(parts[3], 1);
  if (fn[1]!.startsWith('rgb')) return [num(parts[0]!, 255), num(parts[1]!, 255), num(parts[2]!, 255), alpha];
  const [r, g, b] = hslToRgb(parseFloat(parts[0]!), num(parts[1]!, 1) / (parts[1]!.endsWith('%') ? 1 : 100), num(parts[2]!, 1) / (parts[2]!.endsWith('%') ? 1 : 100));
  return [r, g, b, alpha];
}

/** `top` por cima de `bottom` (alfa composto). */
const over = (top: Rgba, bottom: Rgba): Rgba => {
  const a = top[3];
  return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
};

const luminance = ([r, g, b]: Rgba): number => {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pares checados: texto, fundo (onde o fundo é translúcido, composto sobre `color.bg`) e o mínimo exigido. */
export const CONTRAST_PAIRS: ReadonlyArray<[text: string, background: string, min: number]> = [
  ['color.text', 'color.bg', 4.5],
  ['color.text', 'color.surface', 4.5],
  ['color.textMuted', 'color.bg', 3],
  ['color.onAccent', 'color.accent', 4.5],
  ['color.onDanger', 'color.danger', 4.5],
];

export interface ContrastIssue {
  text: string;
  background: string;
  ratio: number;
  min: number;
}

/** Pares abaixo do mínimo. Pares com token ausente ou cor não reconhecida ficam de fora. */
export function contrastIssues(tokens: Record<string, string>): ContrastIssue[] {
  const color = (token: string) => (tokens[token] ? parseColor(tokens[token]) : null);
  const base = color('color.bg');
  if (!base) return [];
  const solid = over(base, [0, 0, 0, 1]);
  const issues: ContrastIssue[] = [];
  for (const [text, background, min] of CONTRAST_PAIRS) {
    const fg = color(text);
    const bg = color(background);
    if (!fg || !bg) continue;
    const behind = over(bg, solid);
    const ratio = contrastRatio(over(fg, behind), behind);
    if (ratio < min) issues.push({ text, background, ratio: Math.round(ratio * 100) / 100, min });
  }
  return issues;
}
