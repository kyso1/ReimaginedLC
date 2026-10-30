// Barra de rolagem "achatada" na ponta: o CSS não sabe onde o polegar está, então marcamos cada caixa que rola.
// Sem atributo = no começo (toda caixa nasce no topo); `mid` = no meio; `end` = no fim. Valem `data-rlc-y` e `data-rlc-x`.

const edge = (pos: number, size: number, view: number) => (pos <= 0 ? null : pos + view >= size - 1 ? 'end' : 'mid');

const mark = (el: HTMLElement, key: 'rlcY' | 'rlcX', value: string | null) => {
  if ((el.dataset[key] ?? null) === value) return;
  if (value) el.dataset[key] = value;
  else delete el.dataset[key];
};

/** Marca as pontas das caixas que rolam dentro de `root` (escuta em captura: `scroll` não sobe). */
export function watchScrollEdges(root: HTMLElement): void {
  root.addEventListener(
    'scroll',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      mark(el, 'rlcY', edge(el.scrollTop, el.scrollHeight, el.clientHeight));
      mark(el, 'rlcX', edge(el.scrollLeft, el.scrollWidth, el.clientWidth));
    },
    { capture: true, passive: true },
  );
}
