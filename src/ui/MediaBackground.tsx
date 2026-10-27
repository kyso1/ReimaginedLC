import { useEffect, useRef, useState } from 'preact/hooks';

export const isVideo = (src: string): boolean => /\.(webm|mp4)(\?|$)/i.test(src);

/** Diferença de proporção (relativa) a partir da qual cobrir a tela cortaria demais. */
export const FIT_TOLERANCE = 0.12;

/**
 * Como a mídia ocupa a tela: `cover` quando a proporção é parecida com a da tela (preenche sem cortar quase nada);
 * `contain` quando é bem diferente (prévia quadrada do Wallpaper Engine, wallpaper de dois monitores): entra inteira,
 * com uma cópia desfocada preenchendo o resto.
 */
export function fitFor(mediaW: number, mediaH: number, boxW: number, boxH: number): 'cover' | 'contain' {
  if (!mediaW || !mediaH || !boxW || !boxH) return 'cover';
  const media = mediaW / mediaH;
  const box = boxW / boxH;
  return Math.abs(media - box) / box > FIT_TOLERANCE ? 'contain' : 'cover';
}

/** Fundo de tela do tema. Vídeo só toca enquanto `playing`; mídia que falha vira a cor de fundo. */
export function MediaBackground({ src, playing, video: forceVideo }: { src: string | null; playing: boolean; video?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [fit, setFit] = useState<{ src: string; mode: 'cover' | 'contain' } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    for (const el of [video.current, fill.current]) {
      if (!el) continue;
      if (playing) void el.play().catch(() => {});
      else el.pause();
    }
  }, [playing, src, fit?.mode]);

  if (!src || failed === src) return <div class="rlc-bg" />;
  const onError = () => setFailed(src);
  const measure = (w: number, h: number, el: HTMLElement) => {
    const box = el.parentElement?.getBoundingClientRect();
    setFit({ src, mode: fitFor(w, h, box?.width || window.innerWidth, box?.height || window.innerHeight) });
  };
  const mode = fit?.src === src ? fit.mode : 'cover';
  const isVid = forceVideo || isVideo(src);
  // Cópia desfocada atrás, só quando a mídia entra inteira (sobra espaço nas bordas).
  const backdrop =
    mode === 'contain' ? (
      isVid ? (
        <video ref={fill} class="rlc-bg-fill" src={src} muted loop playsInline preload="auto" aria-hidden="true" />
      ) : (
        <img class="rlc-bg-fill" src={src} alt="" aria-hidden="true" />
      )
    ) : null;
  return (
    <>
      {backdrop}
      {isVid ? (
        <video
          ref={video}
          class="rlc-bg"
          data-fit={mode}
          src={src}
          muted
          loop
          playsInline
          // Primeiro quadro carregado mesmo parado (sem foco), para não ficar preto.
          preload="auto"
          onLoadedMetadata={(e) => measure(e.currentTarget.videoWidth, e.currentTarget.videoHeight, e.currentTarget)}
          onError={onError}
        />
      ) : (
        <img class="rlc-bg" data-fit={mode} src={src} alt="" onLoad={(e) => measure(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, e.currentTarget)} onError={onError} />
      )}
    </>
  );
}
