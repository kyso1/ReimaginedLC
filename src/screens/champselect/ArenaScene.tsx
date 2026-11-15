import { useLayoutEffect, useRef } from 'preact/hooks';
import { t } from '../../i18n';
import type { Subteam } from './logic';
import { freeArea, Pin, type RiftSceneProps } from './RiftScene';
import { mountArena, type ArenaHandle, type ArenaState } from './scene/arenaScene';
import { subteamLabel } from './Teams';

/** Cena reaberta dentro deste tempo (na mesma seleção) já aparece pronta, sem repetir a entrada. */
const REPLAY_MS = 90_000;
let seenAt = -Infinity;
/** Só para testes: esquece que a cena já foi vista. */
export const forgetArenaIntro = (): void => void (seenAt = -Infinity);

export interface ArenaSceneProps extends Omit<RiftSceneProps, 'side' | 'cells'> {
  /** Todos os times da partida (duplas ou trios, quantos a sessão trouxer), com o meu marcado. */
  subteams: Subteam[];
}

/**
 * Arena em 3D antes da escolha: um canvas WebGL com a arena e, por cima, um marcador em HTML por jogador (os mesmos
 * do Rift, sem rota), cada time no seu pedestal e na sua cor, o meu no centro. Com `diving` (travei), a câmera
 * mergulha no centro e a cena some na splash do campeão.
 */
export function ArenaScene({ subteams, localCellId, champions, name, real, diving = false, onFail }: ArenaSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ArenaHandle | null>(null);
  const els = useRef(new Map<number, HTMLElement>());
  const mine = subteams.findIndex((g) => g.mine);
  // O meu time vem por último: cai depois dos outros e fica por cima.
  const order = subteams.map((_, i) => i).sort((a, b) => Number(a === mine) - Number(b === mine));
  const state = (): ArenaState => ({
    teams: subteams.length,
    mine,
    colors: subteams.map((g) => g.index % 8),
    diving,
    pins: order.flatMap((i) =>
      subteams[i]!.cells.flatMap((c, slot, all) => {
        const el = els.current.get(c.cellId);
        return el ? [{ el, team: i, slot, of: all.length, me: c.cellId === localCellId }] : [];
      }),
    ),
  });

  useLayoutEffect(() => {
    const host = root.current!;
    const made = mountArena(canvas.current!, host, state(), { intro: !diving && performance.now() - seenAt > REPLAY_MS, area: freeArea(host), onFail });
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
    <div ref={root} class="rlc-cs-map rlc-rift rlc-arena" data-diving={diving ? 'true' : undefined}>
      <canvas ref={canvas} class="rlc-rift-canvas" aria-hidden="true" />
      <div class="rlc-rift-pins">
        {order.map((i) => {
          const team = subteams[i]!;
          return team.cells.map((c) => (
            <Pin
              key={c.cellId}
              cell={c}
              me={c.cellId === localCellId}
              champions={champions}
              name={name}
              real={real?.get(c.cellId)}
              at={(el) => {
                if (!el) return void els.current.delete(c.cellId);
                // Cor e time do marcador: o `Pin` é o do Rift, que não sabe de times.
                el.dataset.team = String(team.index % 8);
                el.dataset.mine = team.mine ? 'true' : 'false';
                el.title = subteamLabel(team.index);
                els.current.set(c.cellId, el);
              }}
            />
          ));
        })}
      </div>
      <p class="rlc-cs-map-side">{mine >= 0 ? `${t('csYourTeam')} · ${subteamLabel(subteams[mine]!.index)}` : ''}</p>
    </div>
  );
}
