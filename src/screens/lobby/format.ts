import type { TextKey } from '../../i18n';

export const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL'] as const;
export type Position = (typeof POSITIONS)[number];

/** Texto da posição, ou null para valores vazios e desconhecidos (`UNSELECTED`, `''`). */
export const positionKey = (p: string): TextKey | null => ((POSITIONS as readonly string[]).includes(p) ? (`pos${p}` as TextKey) : null);

/** Splash da skin de fundo do perfil. O id do campeão são os milhares do id da skin. */
export function splashUrl(skinId: number | undefined): string | null {
  if (!skinId) return null;
  return `/lol-game-data/assets/v1/champion-splashes/${Math.floor(skinId / 1000)}/${skinId}.jpg`;
}

/** Segundos em `m:ss`, sem negativos. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
