import { useRef, useState } from 'preact/hooks';

/** Roda uma ação da LCU uma vez por vez. A rejeição já foi mostrada por `request`. */
export function useAction<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const run = (...args: A) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    fn(...args)
      .catch(() => {})
      .finally(() => {
        busy.current = false;
        setPending(false);
      });
  };
  return { run, pending };
}
