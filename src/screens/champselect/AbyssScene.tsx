import { useLayoutEffect, useRef } from 'preact/hooks';
import { clientLocale } from '../../i18n';
import { freeArea, Pin, type RiftSceneProps } from './RiftScene';
import { abyssSpots } from './scene/abyss';
import { mountAbyss, type AbyssHandle, type AbyssState } from './scene/abyssScene';
import { sideName } from './scene/rift';

/** Cena reaberta dentro deste tempo (na mesma seleção) já aparece pronta, sem repetir a entrada. */
const REPLAY_MS = 90_000;
let seenAt = -Infinity;
/** Só para testes: esquece que a cena já foi vista. */
export const forgetAbyssIntro = (): void => void (seenAt = -Infinity);

export interface AbyssSceneProps extends RiftSceneProps {
  /** As cartas estão na mesa: a cena fica apagada ao fundo, sem os marcadores. */
  dim?: boolean;
}

/**
 * Howling Abyss em 3D na seleção do ARAM: um canvas WebGL com a ponte e, por cima, um marcador em HTML por aliado
 * (os mesmos do Rift, sem rota: o ARAM não tem posição), eu na frente. Com `diving` (meu campeão confirmado: carta
 * escolhida, troca com o banco, rolagem), a câmera mergulha no meu ponto e a cena some na splash do campeão.
 */
export function AbyssScene({ side, cells, localCellId, champions, name, real, diving = false, dim = false, onFail }: AbyssSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<AbyssHandle | null>(null);
  const els = useRef(new Map<number, HTMLElement>());
  const meIndex = cells.findIndex((c) => c.cellId === localCellId);
  // O meu marcador vem por último: cai depois dos outros e fica por cima.
  const order = cells.map((_, i) => i).sort((a, b) => Number(a === meIndex) - Number(b === meIndex));
  const spots = abyssSpots(cells.length, meIndex);
  const state = (): AbyssState => ({
    side,
    diving,
    pins: order.flatMap((i) => {
      const el = els.current.get(cells[i]!.cellId);
      return el ? [{ el, spot: spots[i]!, me: i === meIndex }] : [];
    }),
  });

  useLayoutEffect(() => {
    const host = root.current!;
    const made = mountAbyss(canvas.current!, host, state(), { intro: !diving && !dim && performance.now() - seenAt > REPLAY_MS, area: freeArea(host), onFail });
    if (!made) return onFail();
    handle.current = made;
    return () => {
      seenAt = performance.now();
      handle.current = null;
      made.dispose();
    };
  }, []);
  // Depois de cada render: a cena recebe quem está onde (ela só lê; quem desenha os marcadores é o Preact).
  useLayoutEffect(() => handle.current?.update(state()));

  return (
    <div ref={root} class="rlc-cs-map rlc-rift rlc-abyss" data-side={side} data-diving={diving ? 'true' : undefined} data-dim={dim && !diving ? 'true' : undefined}>
      <canvas ref={canvas} class="rlc-rift-canvas" aria-hidden="true" />
      <div class="rlc-rift-pins">
        {order.map((i) => {
          const c = cells[i]!;
          return <Pin key={c.cellId} cell={c} me={i === meIndex} champions={champions} name={name} real={real?.get(c.cellId)} at={(el) => (el ? els.current.set(c.cellId, el) : els.current.delete(c.cellId))} />;
        })}
      </div>
      <p class="rlc-cs-map-side">{sideName(side, clientLocale())}</p>
    </div>
  );
}
