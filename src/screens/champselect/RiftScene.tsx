import { useLayoutEffect, useRef } from 'preact/hooks';
import { clientLocale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { Champion } from '../../data/gamedata';
import { RoleIcon, roleOf } from '../../ui/RoleIcon';
import { positionKey } from '../lobby/format';
import { displayedChampion, type Cell } from './logic';
import type { RealName } from './names';
import type { Area } from './scene/camera';
import { laneOf, sideName, spotsFor, type Side } from './scene/rift';
import { mountRift, type RiftHandle, type RiftState } from './scene/riftScene';
import { useCellName } from './Teams';

/** Mapa reaberto dentro deste tempo (fechar a grade na mesma seleção) já aparece pronto, sem repetir a entrada. */
const REPLAY_MS = 90_000;
let seenAt = -Infinity;
/** Só para testes: esquece que o mapa já foi visto. */
export const forgetRiftIntro = (): void => void (seenAt = -Infinity);

interface PinProps {
  cell: Cell;
  me: boolean;
  champions: Map<number, Champion>;
  name: Lcu['name'];
  real?: RealName;
  at: (el: HTMLElement | null) => void;
}
/**
 * Marcador de um aliado: retrato do campeão em destaque (declarado ou travado), rota, nome e o que está fazendo.
 * A posição na tela (o `transform`) é escrita pela cena a cada quadro, não por aqui.
 */
export function Pin({ cell, me, champions, name, real, at }: PinProps) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const label = useCellName(cell, name);
  const who = real?.gameName || label;
  const role = roleOf(cell.assignedPosition);
  const pos = positionKey(role);
  return (
    <div ref={at} class="rlc-rift-pin" data-me={me ? 'true' : undefined} data-state={!champ ? 'empty' : shown!.locked ? 'locked' : 'hover'}>
      <div class="rlc-rift-pin-in">
        <span class="rlc-rift-face">
          {champ?.icon ? <img src={champ.icon} alt="" /> : <b aria-hidden="true">?</b>}
          {pos ? (
            <span class="rlc-rift-role" role="img" aria-label={t(pos)} title={t(pos)}>
              <RoleIcon role={role} />
            </span>
          ) : null}
        </span>
        <span class="rlc-rift-tag">
          {who ? <span class="rlc-rift-who">{who}</span> : null}
          <i>{champ?.name ?? t('cellPicking')}</i>
          {me ? <u>{t('socYou')}</u> : null}
        </span>
        <span class="rlc-rift-stem" />
      </div>
    </div>
  );
}

/** Área livre para a cena: a coluna do meio da seleção, abaixo do cabeçalho e acima do rótulo do lado. */
export const freeArea =
  (host: HTMLElement) =>
  (w: number, h: number): Area => {
    const o = host.getBoundingClientRect();
    const center = host.parentElement?.querySelector('.rlc-cs-center')?.getBoundingClientRect();
    const head = host.parentElement?.querySelector('.rlc-cs-head')?.getBoundingClientRect();
    const label = host.querySelector('.rlc-cs-map-side')?.getBoundingClientRect();
    if (!center?.width) return [w * 0.2, h * 0.16, w * 0.82, h * 0.8];
    return [center.left - o.left, (head?.bottom ?? center.top) - o.top + 8, center.right - o.left, (label?.height ? label.top : center.bottom) - o.top - 12];
  };

export interface RiftSceneProps {
  side: Side;
  cells: Cell[];
  localCellId: number;
  champions: Map<number, Champion>;
  name: Lcu['name'];
  /** Nomes reais por vaga (sala de chat da seleção). */
  real?: Map<number, RealName>;
  diving?: boolean;
  /** Sem WebGL (ou a cena não montou): quem chama mostra a arte do mapa. */
  onFail: () => void;
}

/**
 * Summoner's Rift em 3D antes da escolha: um canvas WebGL com o mapa e, por cima, um marcador em HTML por aliado no
 * ponto da própria rota (o meu por último, pulsando). A rota da minha função fica acesa. Com `diving`, a câmera
 * mergulha no meu ponto e a cena some na splash do campeão travado.
 */
export function RiftScene({ side, cells, localCellId, champions, name, real, diving = false, onFail }: RiftSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<RiftHandle | null>(null);
  const els = useRef(new Map<number, HTMLElement>());
  const meIndex = cells.findIndex((c) => c.cellId === localCellId);
  const lane = laneOf(cells[meIndex]?.assignedPosition);
  // O meu marcador vem por último: cai depois dos outros e fica por cima.
  const order = cells.map((_, i) => i).sort((a, b) => Number(a === meIndex) - Number(b === meIndex));
  const spots = spotsFor(side, cells.map((c) => c.assignedPosition));
  const state = (): RiftState => ({
    side,
    lane,
    diving,
    pins: order.flatMap((i) => {
      const el = els.current.get(cells[i]!.cellId);
      return el ? [{ el, spot: spots[i]!, me: i === meIndex }] : [];
    }),
  });

  useLayoutEffect(() => {
    const host = root.current!;
    const area = freeArea(host);
    const made = mountRift(canvas.current!, host, state(), { intro: !diving && performance.now() - seenAt > REPLAY_MS, area, onFail });
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
    <div ref={root} class="rlc-cs-map rlc-rift" data-side={side} data-lane={lane ?? undefined} data-diving={diving ? 'true' : undefined}>
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
