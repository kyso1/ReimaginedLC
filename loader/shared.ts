// Comparação de versões, usada pelo carregador e pelo bundle (sem dependências: o carregador fica pequeno).

const parse = (v: string): number[] | null => {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** `latest` é mais nova que `current`? Pré-lançamentos (`-beta`) e textos fora do formato contam como não. */
export function isNewer(current: string, latest: string): boolean {
  const a = parse(current);
  const b = parse(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i]! > a[i]!;
  return false;
}

/** Evento que o carregador emite na `window` quando uma versão nova foi baixada e verificada. `detail: { version }`. */
export const UPDATE_EVENT = 'rlc:update-ready';

/** Estado que o carregador publica em `window.__rlcLoader` antes de chamar o `init` do bundle. */
export interface LoaderState {
  /** Versão em execução. */
  version: string;
  /** Pasta (URL, termina em /) das fontes e temas da versão em execução: o bundle chega por blob: e não tem import.meta.url útil. */
  base: string;
  /** Versão nova pronta (verificada), que entra ao recarregar; ou null. */
  ready: string | null;
}
