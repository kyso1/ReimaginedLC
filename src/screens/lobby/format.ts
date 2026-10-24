import { useEffect, useState } from 'preact/hooks';
import type { TextKey } from '../../i18n';

export const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL'] as const;
export type Position = (typeof POSITIONS)[number];

/** Texto da posição, ou null para valores vazios e desconhecidos (`UNSELECTED`, `''`). */
export const positionKey = (p: string): TextKey | null => ((POSITIONS as readonly string[]).includes(p) ? (`pos${p}` as TextKey) : null);

/** Segundos em `m:ss`, sem negativos. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Tempo na fila contado localmente a partir do último valor da LCU, que só chega em eventos esparsos. */
export function useClock(base: number, active: boolean): number {
  const [anchor, setAnchor] = useState(() => ({ base, at: Date.now() }));
  const [, tick] = useState(0);
  useEffect(() => setAnchor({ base, at: Date.now() }), [base]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return active ? anchor.base + (Date.now() - anchor.at) / 1000 : base;
}
