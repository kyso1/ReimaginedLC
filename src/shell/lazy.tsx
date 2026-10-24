import type { ComponentType, JSX } from 'preact';
import { Loader } from '../ui/Loader';
import { useEffect, useState } from 'preact/hooks';

/** Tela carregada sob demanda (chunk ao lado do index.js). `preload` baixa antes, sem renderizar. */
export function lazyView<P extends object>(load: () => Promise<ComponentType<P>>) {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<void> | null = null;
  const preload = () =>
    (pending ??= load().then(
      (c) => void (Loaded = c),
      (e) => {
        pending = null; // deixa tentar de novo na próxima abertura
        throw e;
      },
    ));
  function Lazy(props: P): JSX.Element {
    const [failed, setFailed] = useState<unknown>(null);
    const [, setReady] = useState(false);
    useEffect(() => {
      if (!Loaded) preload().then(() => setReady(true), setFailed);
    }, []);
    // Falha no download vai para o Boundary, que devolve o client original.
    if (failed) throw failed;
    return Loaded ? <Loaded {...props} /> : <div class="rlc-lazy" aria-busy="true"><Loader /></div>;
  }
  return Object.assign(Lazy, { preload });
}

/** Pré-carrega no ocioso; sem requestIdleCallback, logo depois. */
export function idle(fn: () => unknown) {
  const run = () => void Promise.resolve().then(fn).catch(() => {});
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 200);
}
