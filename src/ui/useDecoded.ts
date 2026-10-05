import { useEffect, useState } from 'preact/hooks';

/**
 * URL de uma imagem que só é devolvida depois de decodificada fora da thread de desenho (`img.decode()`).
 * Splashes grandes aplicadas direto como fundo eram decodificadas no meio das animações e travavam a tela.
 * Imagem que falha não aparece (o fundo do tema fica).
 */
export function useDecoded(url: string | null | undefined): string | null {
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    setReady(null);
    if (!url) return;
    let live = true;
    const img = new Image();
    img.src = url;
    const decode = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
    decode.then(() => live && setReady(url)).catch(() => {});
    return () => void (live = false);
  }, [url]);
  return ready;
}
