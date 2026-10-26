import { useEffect, useRef } from 'preact/hooks';

/** Chama `fn` quando Escape é pressionado enquanto o componente está montado. */
export function useEscape(fn: () => void): void {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') latest.current();
    };
    // A limpeza usa o mesmo documento: pode rodar depois que o global já saiu (fim de teste, camada desligando).
    const doc = document;
    doc.addEventListener('keydown', onKey);
    return () => doc.removeEventListener('keydown', onKey);
  }, []);
}
