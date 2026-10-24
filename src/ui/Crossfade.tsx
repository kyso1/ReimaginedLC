import { useEffect, useRef, useState } from 'preact/hooks';

interface Layer {
  src: string;
  key: number;
}

/** Tempo da troca; o CSS (`.rlc-xfade`) usa o mesmo valor. */
const MS = 700;

/**
 * Imagem de fundo que troca com fusão: a nova só entra depois de carregada e cobre a anterior com um leve recuo de zoom;
 * a anterior sai do DOM quando a troca termina. Ocupa o pai inteiro (`position: absolute; inset: 0`).
 */
export function Crossfade({ src, class: cls, position }: { src: string | null | undefined; class?: string; position?: string }) {
  const [layers, setLayers] = useState<Layer[]>(() => (src ? [{ src, key: 0 }] : []));
  const seq = useRef(0);
  useEffect(() => {
    if (!src || layers[layers.length - 1]?.src === src) return;
    let live = true;
    const img = new Image();
    const show = () => {
      if (!live) return;
      const key = ++seq.current;
      setLayers((l) => [...l.slice(-1), { src, key }]);
      setTimeout(() => live && setLayers((l) => l.filter((x) => x.key >= key)), MS);
    };
    img.onload = show;
    img.onerror = show;
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);
  return (
    <div class={`rlc-xfade${cls ? ` ${cls}` : ''}`} aria-hidden="true">
      {layers.map((l, i) => {
        const style: Record<string, string> = { backgroundImage: `url("${l.src}")` };
        if (position) style.backgroundPosition = position;
        return <div key={l.key} class="rlc-xfade-layer" data-enter={i > 0 || l.key > 0 ? 'true' : undefined} style={style} />;
      })}
    </div>
  );
}
