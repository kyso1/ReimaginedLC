import en from './en-US.json';
import pt from './pt-BR.json';

// Textos em JSON, um arquivo por idioma, para quem traduz não precisar mexer em código.
const TEXTS: Record<'pt-BR' | 'en-US', Record<string, string>> = { 'pt-BR': pt, 'en-US': en };

export type TextKey = keyof typeof en;

let current: keyof typeof TEXTS = 'en-US';

/** Recebe o locale do client (`pt_BR`, `en_US`...). O que não for português cai em inglês. */
export function setLocale(locale: string): void {
  current = locale.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}

// Chave sem tradução no idioma atual cai no inglês (o teste de paridade impede isso no repositório).
export const t = (key: TextKey): string => TEXTS[current]![key] ?? en[key];

/** Locale BCP 47 dos textos atuais, para formatar números. */
export const locale = (): string => current;
