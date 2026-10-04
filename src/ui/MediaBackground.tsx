import { useEffect, useRef, useState } from 'preact/hooks';

export const isVideo = (src: string): boolean => /\.(webm|mp4)(\?|$)/i.test(src);

/** Fundo de tela do tema. Vídeo só toca enquanto `playing`; mídia que falha vira a cor de fundo. */
export function MediaBackground({ src, playing }: { src: string | null; playing: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing, src]);

  if (!src || failed === src) return <div class="rlc-bg" />;
  const onError = () => setFailed(src);
  return isVideo(src) ? (
    <video ref={video} class="rlc-bg" src={src} muted loop playsInline onError={onError} />
  ) : (
    <img class="rlc-bg" src={src} alt="" onError={onError} />
  );
}
