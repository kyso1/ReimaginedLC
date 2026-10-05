import { useEffect, useRef } from 'preact/hooks';

/** Chama `fn` quando Escape é pressionado enquanto o componente está montado. */
export function useEscape(fn: () => void): void {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') latest.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
