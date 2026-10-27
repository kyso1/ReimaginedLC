import { useMemo } from 'preact/hooks';
import { clientLocale } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { RoleIcon } from '../../ui/RoleIcon';
import { displayedChampion, type Cell } from './logic';
import {
  baseOf, CAMPS_BLUE, flip, JUNGLE_BLUE, LANES, NEXUS_BLUE, PATHS_BLUE, PITS, RIVER, RIVER_CENTER, riverDist, sideName, SIZE, spotFor, TOWERS_BLUE, TREES_BLUE,
  type Point, type Side,
} from './riftMap';

const svgPt = ([x, y]: Point): Point => [x, SIZE - y];
const pct = ([x, y]: Point) => ({ left: `${(x / SIZE) * 100}%`, top: `${(1 - y / SIZE) * 100}%` });
const pts = (list: Point[]) => list.map((p) => svgPt(p).join(',')).join(' ');
const pathOf = (list: Point[]) => list.map((p, i) => (i ? 'L' : 'M') + svgPt(p).join(' ')).join(' ');
const riverHalf = (h: (typeof RIVER)[number]) => `M ${svgPt(RIVER_CENTER).join(' ')} Q ${svgPt(h.ctrl).join(' ')} ${svgPt(h.end).join(' ')}`;
const arcBase = (side: Side): Point[] => {
  const out: Point[] = [[0, 0]];
  for (let a = 0; a <= 90; a += 6) out.push([4700 * Math.cos((a * Math.PI) / 180), 4700 * Math.sin((a * Math.PI) / 180)]);
  return side === 'blue' ? out : out.map(flip);
};
const JUNGLE = JUNGLE_BLUE.concat(JUNGLE_BLUE.map((q) => q.map(flip)));
const PATHS = PATHS_BLUE.concat(PATHS_BLUE.map((l) => l.map(flip)));
const CAMPS = CAMPS_BLUE.concat(CAMPS_BLUE.map(flip));
const TREES = TREES_BLUE.concat(TREES_BLUE.map((t) => ({ ...t, p: flip(t.p) })));
const TOWERS = TOWERS_BLUE.map((t) => ({ ...t, side: 'blue' as Side })).concat(TOWERS_BLUE.map((t) => ({ ...t, p: flip(t.p), side: 'red' as Side })));
/** Alturas das fatias do relevo da selva (px), de baixo para cima. */
const SLICES = [2, 4, 6, 8, 10, 12, 14, 16];
const TOP_Z = 17;
/** Ondas de árvores, da mais perto do rio para a mais longe. */
const WAVES = 5;
const TREE_WAVES: Array<typeof TREES> = Array.from({ length: WAVES }, (_, w) => TREES.filter((tr) => Math.min(WAVES - 1, Math.floor((riverDist(tr.p) / 7000) * WAVES)) === w));
const view = `0 0 ${SIZE} ${SIZE}`;

/** Larguras (unidades do jogo) dos traços do rio e das rotas. */
const W = { bank: 1650, water: 1250, shallow: 620, lane: 620 } as const;
type StrokeKind = keyof typeof W;
/** Pontos de uma metade do rio (a curva amostrada em trechos retos). */
const riverPoints = (h: (typeof RIVER)[number], steps = 8): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * RIVER_CENTER[0] + 2 * u * t * h.ctrl[0] + t * t * h.end[0], u * u * RIVER_CENTER[1] + 2 * u * t * h.ctrl[1] + t * t * h.end[1]];
  });
const pctOf = (v: number) => `${(v / SIZE) * 100}%`;

/**
 * Traço de uma linha (rio ou rota) desenhado aos poucos, como o `stroke-dashoffset`, mas em trechos retos: cada um é
 * uma barra girada que cresce com `scaleX` (só a GPU anima; o SVG repintava a camada inteira a cada quadro).
 * Pontas arredondadas como `stroke-linecap: round`; `start`/`dur` em segundos, para a linha toda.
 */
function Strokes({ points, kind, start, dur }: { points: Point[]; kind: StrokeKind; start: number; dur: number }) {
  const w = W[kind];
  const segs = points.slice(1).map((b, i) => {
    const [x1, y1] = svgPt(points[i]!);
    const [x2, y2] = svgPt(b);
    return { x1, y1, len: Math.hypot(x2 - x1, y2 - y1), ang: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI };
  });
  const total = segs.reduce((n, sg) => n + sg.len, 0) || 1;
  let done = 0;
  return (
    <>
      {segs.map((sg, i) => {
        const delay = start + (done / total) * dur;
        done += sg.len;
        return (
          <i
            key={i}
            class="rlc-rift-stroke"
            data-k={kind}
            style={{
              left: pctOf(sg.x1 - w / 2),
              top: pctOf(sg.y1 - w / 2),
              width: pctOf(sg.len + w),
              height: pctOf(w),
              transformOrigin: `${((w / 2 / (sg.len + w)) * 100).toFixed(3)}% 50%`,
              '--a': `${sg.ang.toFixed(2)}deg`,
              animationDelay: `${delay.toFixed(3)}s`,
              animationDuration: `${((sg.len / total) * dur).toFixed(3)}s`,
            }}
          />
        );
      })}
    </>
  );
}

/** Chão, rio, fossos, acampamentos e relevo da selva. Não depende de quem está escolhendo: monta uma vez por lado. */
function Terrain({ side }: { side: Side }) {
  const own = svgPt(baseOf(side));
  const foe = svgPt(baseOf(side === 'blue' ? 'red' : 'blue'));
  const mid = svgPt(RIVER_CENTER);
  // Névoa: a metade do inimigo (além do rio, a diagonal x + y = 15000).
  const fog = side === 'blue' ? [[0, SIZE], [SIZE, SIZE], [SIZE, 0]] : [[0, SIZE], [0, 0], [SIZE, 0]];
  return (
    <>
      <div class="rlc-rift-layer">
        <svg viewBox={view} aria-hidden="true">
          <defs>
            <radialGradient id="rlc-rift-ground" cx="50%" cy="50%" r="70%">
              <stop offset="0" class="rlc-rift-s-ground-in" />
              <stop offset="1" class="rlc-rift-s-ground-out" />
            </radialGradient>
            <radialGradient id="rlc-rift-pit">
              <stop offset="0" class="rlc-rift-s-pit-in" />
              <stop offset=".7" class="rlc-rift-s-pit-mid" />
              <stop offset="1" class="rlc-rift-s-pit-out" />
            </radialGradient>
            <radialGradient id="rlc-rift-glow" gradientUnits="userSpaceOnUse" cx={own[0]} cy={own[1]} r={SIZE * 0.8}>
              <stop offset="0" class="rlc-rift-s-team" stop-opacity=".5" />
              <stop offset=".55" class="rlc-rift-s-team" stop-opacity=".08" />
              <stop offset="1" class="rlc-rift-s-team" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="rlc-rift-fog" gradientUnits="userSpaceOnUse" x1={mid[0]} y1={mid[1]} x2={foe[0]} y2={foe[1]}>
              <stop offset="0" class="rlc-rift-s-fog" stop-opacity=".15" />
              <stop offset=".35" class="rlc-rift-s-fog" stop-opacity=".72" />
              <stop offset="1" class="rlc-rift-s-fog" stop-opacity=".88" />
            </linearGradient>
            {/* Recorte do relevo: a selva menos os corredores e as clareiras (branco fica, preto some). */}
            <mask id="rlc-rift-cut" maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
              <rect width={SIZE} height={SIZE} fill="black" />
              {JUNGLE.map((q, i) => (
                <polygon key={i} points={pts(q)} fill="white" />
              ))}
              {PATHS.map((l, i) => (
                <path key={i} d={pathOf(l)} fill="none" stroke="black" stroke-width="760" stroke-linecap="round" stroke-linejoin="round" />
              ))}
              {CAMPS.map((c, i) => (
                <circle key={i} cx={svgPt(c)[0]} cy={svgPt(c)[1]} r="780" fill="black" />
              ))}
            </mask>
          </defs>
          <rect class="rlc-rift-ground" width={SIZE} height={SIZE} />
          {PATHS.map((l, i) => (
            <path key={i} class="rlc-rift-trail" d={pathOf(l)} />
          ))}
          <polygon class="rlc-rift-base" data-team={side === 'blue' ? 'own' : 'foe'} points={pts(arcBase('blue'))} />
          <polygon class="rlc-rift-base" data-team={side === 'red' ? 'own' : 'foe'} points={pts(arcBase('red'))} />
        </svg>
      </div>
      {/* Rio: margem, água e faixa clara enchem do centro para as duas pontas. */}
      <div class="rlc-rift-layer" style={{ '--z': '0.4px' }}>
        {(
          [
            ['bank', 0.95, 0.7],
            ['water', 1.1, 0.95],
            ['shallow', 1.1, 0.95],
          ] as const
        ).map(([k, start, dur]) => RIVER.map((h, i) => <Strokes key={k + i} points={riverPoints(h)} kind={k} start={start} dur={dur} />))}
      </div>
      {/* Correnteza: duas cópias paradas que deslizam ao longo do rio e se alternam no brilho (só GPU, sem repintar). */}
      {[0, 1].map((n) => (
        <div key={n} class="rlc-rift-layer rlc-rift-flows" data-phase={n} style={{ '--z': '0.6px' }}>
          <svg viewBox={view} aria-hidden="true">
            {RIVER.map((h, i) => (
              <path key={i} class="rlc-rift-flow" d={riverHalf(h)} />
            ))}
          </svg>
        </div>
      ))}
      <div class="rlc-rift-layer" style={{ '--z': '0.8px' }}>
        <svg viewBox={view} aria-hidden="true">
          {PITS.map((p, i) => (
            <g key={i} class="rlc-rift-pit">
              <circle class="rlc-rift-pit-rim" cx={svgPt(p)[0]} cy={svgPt(p)[1]} r="980" />
              <circle cx={svgPt(p)[0]} cy={svgPt(p)[1]} r="830" fill="url(#rlc-rift-pit)" />
            </g>
          ))}
          {CAMPS.map((c, i) => (
            <circle key={i} class="rlc-rift-camp" data-buff={i % 6 < 2 ? 'true' : undefined} style={{ '--t': `${(1.75 + (i % 6) * 0.05).toFixed(2)}s` }} cx={svgPt(c)[0]} cy={svgPt(c)[1]} r={i % 6 < 2 ? 360 : 250} />
          ))}
        </svg>
      </div>
      {SLICES.map((z, i) => (
        <div key={z} class="rlc-rift-layer rlc-rift-slice" style={{ '--z': `${z}px`, '--i': i }}>
          <svg viewBox={view} aria-hidden="true">
            <g mask="url(#rlc-rift-cut)">
              {JUNGLE.map((q, k) => (
                <polygon key={k} class={i === SLICES.length - 1 ? 'rlc-rift-jungle' : 'rlc-rift-jungle-side'} points={pts(q)} />
              ))}
            </g>
          </svg>
        </div>
      ))}
      {/* Árvores em ondas a partir do rio: cada onda é uma camada que sobe inteira (uma animação por onda, não por árvore). */}
      {TREE_WAVES.map((wave, i) => (
        <div key={i} class="rlc-rift-layer rlc-rift-trees" style={{ '--z': `${TOP_Z - 0.5}px`, '--t': `${(1.05 + i * 0.22).toFixed(2)}s` }}>
          <svg viewBox={view} aria-hidden="true">
            {wave.map((tr, k) => {
              const [x, y] = svgPt(tr.p);
              return (
                <g key={k} class="rlc-rift-tree" data-shade={tr.shade}>
                  <circle cx={x} cy={y} r={tr.r} />
                  <circle class="rlc-rift-leaf" cx={x - tr.r * 0.28} cy={y - tr.r * 0.3} r={tr.r * 0.5} />
                </g>
              );
            })}
          </svg>
        </div>
      ))}
      {/* Rotas desenhadas a partir da minha base. */}
      <div class="rlc-rift-layer" style={{ '--z': '1px' }}>
        {LANES.map((l, i) => (
          <Strokes key={i} points={side === 'blue' ? l : [...l].reverse()} kind="lane" start={1 + i * 0.08} dur={0.9} />
        ))}
      </div>
      <div class="rlc-rift-layer" style={{ '--z': `${TOP_Z}px` }}>
        <svg viewBox={view} aria-hidden="true">
          <rect class="rlc-rift-glow" width={SIZE} height={SIZE} fill="url(#rlc-rift-glow)" />
          <polygon class="rlc-rift-fog" points={fog.map((p) => p.join(',')).join(' ')} fill="url(#rlc-rift-fog)" />
        </svg>
      </div>
    </>
  );
}

/**
 * Summoner's Rift em 3D antes da escolha: o mapa sobe a partir da sua base, a câmera gira até a diagonal, a selva
 * cresce, o rio enche, as torres sobem e cada aliado cai no ponto da própria rota. Com `diving`, o mapa já pronto
 * mergulha na sua rota e some (o campeão travado vira o fundo).
 */
export function Rift({ side, cells, localCellId, champions, diving = false }: { side: Side; cells: Cell[]; localCellId: number; champions: Map<number, Champion>; diving?: boolean }) {
  const terrain = useMemo(() => <Terrain side={side} />, [side]);
  const own = baseOf(side);
  const spots = cells.map((c, i) => spotFor(side, c.assignedPosition, i, cells.length));
  const meIndex = cells.findIndex((c) => c.cellId === localCellId);
  const focus = pct(spots[meIndex] ?? own);
  // O meu marcador cai por último.
  const order = cells.map((c, i) => i).sort((a, b) => Number(a === meIndex) - Number(b === meIndex));
  const style = { '--fx': focus.left, '--fy': focus.top };
  return (
    <div class="rlc-cs-map rlc-rift" data-side={side} data-diving={diving ? 'true' : undefined} style={style}>
      <div class="rlc-rift-cam">
        <div class="rlc-rift-plane">
          <div class="rlc-rift-shadow" />
          <div class="rlc-rift-wall" data-edge="s" />
          <div class="rlc-rift-wall" data-edge="n" />
          <div class="rlc-rift-wall" data-edge="w" />
          <div class="rlc-rift-wall" data-edge="e" />
          {terrain}
          {TOWERS.map((tw, i) => (
            <div key={i} class="rlc-rift-stand rlc-rift-tower" data-team={tw.side === side ? 'own' : 'foe'} data-big={tw.big ? 'true' : undefined} style={{ ...pct(tw.p), '--dl': `${(1.8 + (Math.hypot(tw.p[0] - own[0], tw.p[1] - own[1]) / SIZE) * 0.7).toFixed(2)}s` }}>
              <div class="rlc-rift-up" />
            </div>
          ))}
          {(['blue', 'red'] as const).map((s) => (
            <div key={s} class="rlc-rift-stand rlc-rift-nexus" data-team={s === side ? 'own' : 'foe'} style={{ ...pct(s === 'blue' ? NEXUS_BLUE : flip(NEXUS_BLUE)), '--dl': s === side ? '1.8s' : '2.4s' }}>
              <div class="rlc-rift-up" />
            </div>
          ))}
          {order.map((i, k) => {
            const c = cells[i]!;
            const shown = displayedChampion(c);
            const champ = shown ? champions.get(shown.championId) : undefined;
            const me = i === meIndex;
            // O caçador fica em cima do relevo da selva.
            const onJungle = (c.assignedPosition ?? '').toUpperCase() === 'JUNGLE';
            return (
              <div
                key={c.cellId}
                class="rlc-rift-stand rlc-rift-pin"
                data-locked={shown?.locked ? 'true' : undefined}
                data-me={me ? 'true' : undefined}
                title={champ?.name}
                style={{ ...pct(spots[i]!), '--z': `${onJungle ? TOP_Z : 1}px`, '--dl': `${(3 + k * 0.12).toFixed(2)}s` }}
              >
                <i class="rlc-rift-spot" aria-hidden="true" />
                <div class="rlc-rift-up">
                  {me && champ ? <span class="rlc-rift-name">{champ.name}</span> : null}
                  <span class="rlc-rift-head">
                    {champ?.icon ? <img src={champ.icon} alt={champ.name} /> : c.assignedPosition ? <RoleIcon role={c.assignedPosition} /> : null}
                  </span>
                  <span class="rlc-rift-stem" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p class="rlc-cs-map-side">{sideName(side, clientLocale())}</p>
    </div>
  );
}
