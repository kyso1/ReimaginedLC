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

/**
 * O vídeo não decodifica nesta máquina (resolução acima do que o decodificador aceita, como 7680x2160, ou o decodificador
 * do Chromium travou): tentar o mesmo arquivo de novo não adianta.
 */
export const isDecodeError = (e: MediaError | null): boolean => !!e && (e.code === 3 || e.message.startsWith('DECODER_ERROR'));

/**
 * Fundo de tela do tema. Vídeo só toca enquanto `playing`; mídia que falha vira a cor de fundo.
 * `poster` é uma imagem do mesmo fundo (prévia do Wallpaper Engine): aparece enquanto o vídeo carrega, preenche as bordas
 * no modo `contain` (sem um segundo vídeo) e fica no lugar do vídeo que não decodifica.
 * `onFail` só é chamado quando tentar de novo pode resolver (rede, auxiliar reiniciando).
 */
export function MediaBackground({ src, playing, video: forceVideo, poster, onFail }: { src: string | null; playing: boolean; video?: boolean; poster?: string; onFail?: () => void }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [posterFailed, setPosterFailed] = useState<string | null>(null);
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

  const still = poster && posterFailed !== poster ? poster : null;
  const measure = (key: string, w: number, h: number, el: HTMLElement) => {
    const box = el.parentElement?.getBoundingClientRect();
    setFit({ src: key, mode: fitFor(w, h, box?.width || window.innerWidth, box?.height || window.innerHeight) });
  };
  const mode = fit?.src === src ? fit.mode : 'cover';
  if (src && failed === src && still) {
    const stillMode = fit?.src === still ? fit.mode : 'cover';
    return (
      <>
        {stillMode === 'contain' ? <img class="rlc-bg-fill" src={still} alt="" aria-hidden="true" /> : null}
        <img
          class="rlc-bg"
          data-fit={stillMode}
          src={still}
          alt=""
          onLoad={(e) => measure(still, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, e.currentTarget)}
          onError={() => setPosterFailed(still)}
        />
      </>
    );
  }
  if (!src || failed === src) return <div class="rlc-bg" />;
  const onError = (e: Event) => {
    setFailed(src);
    if (!isDecodeError((e.currentTarget as HTMLMediaElement).error)) onFail?.();
  };
  const isVid = forceVideo || isVideo(src);
  // Cópia desfocada atrás, só quando a mídia entra inteira (sobra espaço nas bordas). Com prévia, a imagem basta: um
  // segundo vídeo decodificaria e baixaria o arquivo inteiro de novo (o auxiliar atende um pedido por vez).
  const backdrop =
    mode === 'contain' ? (
      still ? (
        <img class="rlc-bg-fill" src={still} alt="" aria-hidden="true" />
      ) : isVid ? (
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
          poster={still ?? undefined}
          muted
          loop
          playsInline
          // Primeiro quadro carregado mesmo parado (sem foco), para não ficar preto.
          preload="auto"
          onLoadedMetadata={(e) => measure(src, e.currentTarget.videoWidth, e.currentTarget.videoHeight, e.currentTarget)}
          onError={onError}
        />
      ) : (
        <img class="rlc-bg" data-fit={mode} src={src} alt="" onLoad={(e) => measure(src, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, e.currentTarget)} onError={onError} />
      )}
    </>
  );
}
