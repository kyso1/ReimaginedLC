import type { ComponentChildren } from 'preact';
import { useId, useMemo, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import { formatClock } from '../lobby/format';
import { niceStep, playerName, type Game, type Participant, type Timeline } from './data';
import {
  damageSplit, diffAt, goldLead, killsPerMinute, kills as killList, laneOpponent, metricSeries, objectives, RANK_VALUE, roles,
  teamMap, teamShare, teamSummaries, twoTeams, type Kill, type Metric, type Objective, type ObjectiveKind, type Rank, type TeamSummary,
} from './matchStats';
import type { Icons } from './Profile';

/**
 * Aba Gráficos da partida (histórico e fim de jogo). Com a linha do tempo: vantagem de ouro com os objetivos, cada
 * jogador minuto a minuto, duelo de rota aos 10 e 15, abates por minuto e mapa de abates. Sempre: comparação por
 * jogador em várias métricas e os objetivos dos dois times. Arena (sem dois times) fica só com a comparação.
 */
export function MatchCharts({ game, timeline, me, icons }: { game: Game; timeline: Timeline | null; me: Participant | undefined; icons: Icons }) {
  const tl = timeline?.frames?.length ? timeline : null;
  const duo = twoTeams(game);
  const teamOf = useMemo(() => teamMap(game), [game]);
  const objs = useMemo(() => (tl && duo ? objectives(tl, teamOf) : []), [tl, duo, teamOf]);
  const roleOf = useMemo(() => roles(game, tl), [game, tl]);
  const opponent = duo ? laneOpponent(game, roleOf, me) : undefined;
  const ctx: Ctx = { game, icons, teamOf, me };
  return (
    <div class="rlc-mc">
      {tl && duo ? <GoldLead ctx={ctx} tl={tl} objs={objs} /> : null}
      {tl ? <PlayerLines ctx={ctx} tl={tl} initial={[me, opponent].filter((p): p is Participant => !!p).map((p) => p.participantId)} /> : null}
      {tl && me && opponent ? <LaneDuel ctx={ctx} tl={tl} me={me} opponent={opponent} /> : null}
      {duo ? <Objectives summaries={teamSummaries(game, objs)} /> : null}
      {tl && duo ? <KillsPerMinute ctx={ctx} tl={tl} /> : null}
      {tl && duo ? <KillMap ctx={ctx} tl={tl} /> : null}
      <Ranking ctx={ctx} />
    </div>
  );
}

interface Ctx {
  game: Game;
  icons: Icons;
  teamOf: Record<number, number>;
  me: Participant | undefined;
}

const champName = (ctx: Ctx, pid: number) => ctx.icons.champions.get(ctx.game.participants.find((p) => p.participantId === pid)?.championId ?? 0)?.name ?? '';
const who = (ctx: Ctx, pid: number) => {
  const c = champName(ctx, pid);
  return c ? `${playerName(ctx.game, pid)} (${c})` : playerName(ctx.game, pid);
};
const compact = () => new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 });
const signed = (v: number, f: Intl.NumberFormat) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${f.format(Math.abs(v))}`;

// Medidas em unidades do viewBox; o SVG escala inteiro (texto junto) sem distorcer. Os de linha inteira são mais
// largos no viewBox para não crescerem em altura (e o texto junto) na tela larga.
const W = 600;
const WIDE = 1100;
const PAD = { l: 52, r: 16, t: 12, b: 28 };

interface Scale {
  w: number;
  x: (m: number) => number;
  y: (v: number) => number;
  ticks: number[];
  minutes: number[];
  h: number;
  last: number;
}

/** Escala de minutos × valor, com passo redondo; `sym` deixa o zero no meio (vantagens). */
function scale(minutes: number[], values: number[], h: number, sym = false, w = W): Scale {
  const last = Math.max(1, minutes[minutes.length - 1] ?? 1);
  let lo = Math.min(0, ...values);
  let hi = Math.max(1, ...values);
  if (sym) hi = lo = Math.max(1, Math.abs(lo), Math.abs(hi));
  const step = niceStep(sym ? hi : hi - Math.min(0, lo), sym ? 2 : 4);
  const top = Math.ceil(hi / step) * step;
  const bottom = sym ? -Math.ceil(lo / step) * step : Math.floor(Math.min(0, lo) / step) * step;
  const x = (m: number) => PAD.l + (m / last) * (w - PAD.l - PAD.r);
  const y = (v: number) => h - PAD.b - ((v - bottom) / (top - bottom || 1)) * (h - PAD.t - PAD.b);
  const ticks = Array.from({ length: Math.round((top - bottom) / step) + 1 }, (_, i) => bottom + i * step);
  return { w, x, y, ticks, minutes, h, last };
}

const minutesOf = (tl: Timeline) => tl.frames.map((f) => f.timestamp / 60000);

/** Grade horizontal com o valor à esquerda e os minutos embaixo. */
function Axes({ s, fmt }: { s: Scale; fmt: (v: number) => string }) {
  const minStep = Math.max(1, niceStep(s.last, 6));
  return (
    <>
      {s.ticks.map((v) => (
        <g key={`y${v}`} class="rlc-md-grid" data-zero={v === 0 ? 'true' : undefined}>
          <line x1={PAD.l} x2={s.w - PAD.r} y1={s.y(v)} y2={s.y(v)} />
          <text x={PAD.l - 8} y={s.y(v)} text-anchor="end" dominant-baseline="middle">
            {fmt(v)}
          </text>
        </g>
      ))}
      {Array.from({ length: Math.floor(s.last / minStep) + 1 }, (_, i) => i * minStep).map((m) => (
        <text key={`x${m}`} class="rlc-md-axis" x={s.x(m)} y={s.h - 8} text-anchor="middle">
          {`${m} min`}
        </text>
      ))}
    </>
  );
}

/**
 * Camada de passar o mouse: uma faixa por minuto (alvo largo), a linha vertical no minuto e o balão em HTML por cima
 * do gráfico. O balão só repete o que a legenda e os eixos já mostram.
 */
function Plot({ s, label, tip, children, after }: { s: Scale; label: string; tip: (i: number) => ComponentChildren; children: ComponentChildren; after?: ComponentChildren }) {
  const [at, setAt] = useState<number | null>(null);
  const svgH = s.h + (after ? 44 : 0);
  return (
    <div class="rlc-mc-plot" onMouseLeave={() => setAt(null)}>
      <svg viewBox={`0 0 ${s.w} ${svgH}`} role="img" aria-label={label}>
        {children}
        {at !== null ? <line class="rlc-mc-cross" x1={s.x(s.minutes[at]!)} x2={s.x(s.minutes[at]!)} y1={PAD.t} y2={s.h - PAD.b} /> : null}
        {after}
        {s.minutes.map((m, i) => {
          const x0 = s.x(Math.max(0, m - 0.5));
          return <rect key={i} class="rlc-md-hit" x={x0} y={0} width={s.x(Math.min(s.last, m + 0.5)) - x0} height={svgH} onMouseEnter={() => setAt(i)} />;
        })}
      </svg>
      {at !== null ? (
        <div class="rlc-mc-tip" style={{ left: `${(s.x(s.minutes[at]!) / s.w) * 100}%` }} data-side={s.x(s.minutes[at]!) > s.w * 0.6 ? 'left' : 'right'}>
          <b>{`${Math.round(s.minutes[at]!)} min`}</b>
          {tip(at)}
        </div>
      ) : null}
    </div>
  );
}

function Pills<K extends string>({ options, value, onChange, label }: { options: Array<[K, TextKey]>; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div class="rlc-mc-pills" role="group" aria-label={label}>
      {options.map(([k, text]) => (
        <button type="button" key={k} aria-pressed={value === k} onClick={() => onChange(k)}>
          {t(text)}
        </button>
      ))}
    </div>
  );
}

const OBJ_GLYPH: Record<ObjectiveKind, string> = { dragon: '▲', elder: '★', baron: '◆', herald: '●', grubs: '•', atakhan: '⬢', tower: '▮', inhibitor: '◇' };
const OBJ_NAME: Record<ObjectiveKind, TextKey> = { dragon: 'mcDragon', elder: 'mcElder', baron: 'mcBaron', herald: 'mcHerald', grubs: 'mcGrub', atakhan: 'mcAtakhan', tower: 'mcTower', inhibitor: 'mcInhibitor' };
const DRAGON: Record<string, TextKey> = { FIRE_DRAGON: 'mcDragonFire', WATER_DRAGON: 'mcDragonWater', EARTH_DRAGON: 'mcDragonEarth', AIR_DRAGON: 'mcDragonAir', HEXTECH_DRAGON: 'mcDragonHextech', CHEMTECH_DRAGON: 'mcDragonChemtech' };
/** Ícones do histórico do próprio client (`/fe/lol-match-history/`). */
const MH = '/fe/lol-match-history/';
const ELEMENT: Record<string, string> = { FIRE_DRAGON: 'fire', WATER_DRAGON: 'water', EARTH_DRAGON: 'earth', AIR_DRAGON: 'air' };
/** Ícone na cor do time (`tower-100.png`, `fire-200.png`...); larvas e Atakhan não têm versão por time. */
export const teamIcon = (kind: ObjectiveKind, team: number, sub?: string) => (kind === 'grubs' || kind === 'atakhan' ? null : `${MH}${kind === 'dragon' ? (ELEMENT[sub ?? ''] ?? 'dragon') : kind}-${team}.png`);
/** Posição no sprite cinza do client (`right_icons_grub.png`, 80×560): torre, inibidor, barão, dragão, arauto, larva. */
const SPRITE: Partial<Record<ObjectiveKind, number>> = { tower: 0, inhibitor: 1, baron: 2, dragon: 3, elder: 3, herald: 4, grubs: 5 };

/** Ícone neutro (cinza) para legendas e a tabela de objetivos; abates e ouro também; o Atakhan, sem ícone no client, fica no glifo. */
function Ico({ kind }: { kind: ObjectiveKind | 'kills' | 'gold' }) {
  if (kind === 'kills') return <span class="rlc-mc-ico" data-ico="kills" aria-hidden="true" />;
  if (kind === 'gold') return <span class="rlc-mc-ico" data-ico="gold" aria-hidden="true" />;
  const at = SPRITE[kind];
  if (at === undefined) return <span class="rlc-mc-ico" aria-hidden="true">{OBJ_GLYPH[kind]}</span>;
  return <span class="rlc-mc-ico" data-ico="sprite" style={{ backgroundPosition: `0 ${-at * 18}px` }} aria-hidden="true" />;
}

/** Marca do objetivo no gráfico: o ícone do time; sem ele, o do sprite; sem nenhum, o glifo. */
function ObjMark({ o, x, y }: { o: Objective; x: number; y: number }) {
  const title = <title>{`${formatClock(o.t / 1000)} · ${objName(o)} · ${teamName(o.team)}`}</title>;
  const href = teamIcon(o.kind, o.team, o.sub);
  if (href) {
    return (
      <image class="rlc-mc-obj" href={href} x={x - 9} y={y} width={18} height={18}>
        {title}
      </image>
    );
  }
  const at = SPRITE[o.kind];
  if (at !== undefined) {
    return (
      <svg class="rlc-mc-obj" x={x - 9} y={y} width={18} height={18} viewBox={`0 ${at * 80} 80 80`}>
        <image href={`${MH}right_icons_grub.png`} width={80} height={560} />
        {title}
      </svg>
    );
  }
  return (
    <text class="rlc-mc-obj" data-team={o.team} x={x} y={y + 2} text-anchor="middle">
      {OBJ_GLYPH[o.kind]}
      {title}
    </text>
  );
}

const objName = (o: Pick<Objective, 'kind' | 'sub'>) => (o.kind === 'dragon' && o.sub && DRAGON[o.sub] ? t('mcDragonOf').replace('{e}', t(DRAGON[o.sub]!)) : t(OBJ_NAME[o.kind]));
const teamName = (team: number) => t(team === 100 ? 'mdBlueTeam' : 'mdRedTeam');

/** Vantagem de ouro: uma linha só (azul acima do zero, vermelho abaixo), com cada objetivo marcado no minuto em que caiu. */
function GoldLead({ ctx, tl, objs }: { ctx: Ctx; tl: Timeline; objs: Objective[] }) {
  const lead = goldLead(tl, ctx.teamOf);
  const s = scale(minutesOf(tl), lead, 240, true, WIDE);
  const c = compact();
  const id = useId();
  const line = lead.map((v, i) => `${s.x(s.minutes[i]!).toFixed(1)},${s.y(v).toFixed(1)}`).join(' ');
  const zero = s.y(0);
  const area = `${s.x(s.minutes[0]!)},${zero} ${line} ${s.x(s.minutes[s.minutes.length - 1]!)},${zero}`;
  const end = lead[lead.length - 1] ?? 0;
  const peak = (sign: 1 | -1) => Math.max(0, ...lead.map((v) => v * sign));
  const minuteObjs = (i: number) => objs.filter((o) => Math.round(o.t / 60000) === Math.round(s.minutes[i]!));
  const kinds = [...new Set(objs.map((o) => o.kind))];
  return (
    <figure class="rlc-md-chart rlc-mc-wide">
      <figcaption>
        <b>{t('mcGoldLead')}</b>
        <span class="rlc-md-legend" data-team="100">{`${t('mcPeak')} ${c.format(peak(1))}`}</span>
        <span class="rlc-md-legend" data-team="200">{`${t('mcPeak')} ${c.format(peak(-1))}`}</span>
        <span class="rlc-mc-note">{end ? `${t('mcFinal')}: ${teamName(end > 0 ? 100 : 200)} +${c.format(Math.abs(end))}` : null}</span>
      </figcaption>
      <Plot
        s={s}
        label={t('mcGoldLead')}
        tip={(i) => (
          <>
            <span>{lead[i] ? `${teamName(lead[i]! > 0 ? 100 : 200)} +${c.format(Math.abs(lead[i]!))}` : t('mcEven')}</span>
            {minuteObjs(i).map((o, k) => (
              <span key={k} data-team={o.team}>{`${OBJ_GLYPH[o.kind]} ${objName(o)} · ${teamName(o.team)}`}</span>
            ))}
          </>
        )}
        after={objs.map((o, i) => (
          <ObjMark key={i} o={o} x={s.x(o.t / 60000)} y={s.h + (o.team === 100 ? 0 : 22)} />
        ))}
      >
        <defs>
          <clipPath id={`${id}a`}>
            <rect x={0} y={0} width={s.w} height={zero} />
          </clipPath>
          <clipPath id={`${id}b`}>
            <rect x={0} y={zero} width={s.w} height={s.h} />
          </clipPath>
        </defs>
        <Axes s={s} fmt={(v) => c.format(Math.abs(v))} />
        <polygon class="rlc-mc-area" data-team="100" points={area} clip-path={`url(#${id}a)`} />
        <polygon class="rlc-mc-area" data-team="200" points={area} clip-path={`url(#${id}b)`} />
        <polyline class="rlc-mc-lead" points={line} />
      </Plot>
      {kinds.length ? (
        <p class="rlc-mc-key">
          {kinds.map((k) => (
            <span key={k}>
              <Ico kind={k} /> {t(OBJ_NAME[k])}
            </span>
          ))}
          <span class="rlc-muted">{t('mcObjRows')}</span>
        </p>
      ) : null}
    </figure>
  );
}

const METRICS: Array<[Metric, TextKey]> = [
  ['gold', 'gold'],
  ['xp', 'mcXp'],
  ['cs', 'farm'],
  ['level', 'mcLevel'],
];

/**
 * Cada jogador minuto a minuto. As dez linhas ficam apagadas e só as escolhidas (você e o oponente, de início)
 * ganham cor do time e o nome do campeão no fim da linha.
 */
function PlayerLines({ ctx, tl, initial }: { ctx: Ctx; tl: Timeline; initial: number[] }) {
  const [metric, setMetric] = useState<Metric>('gold');
  const [picked, setPicked] = useState<number[]>(initial.length ? initial : [ctx.game.participants[0]!.participantId]);
  const players = [...ctx.game.participants].sort((a, b) => a.teamId - b.teamId);
  const series = new Map(players.map((p) => [p.participantId, metricSeries(tl, p.participantId, metric)]));
  const s = scale(minutesOf(tl), [...series.values()].flat(), 280, false, WIDE);
  const c = compact();
  const pts = (v: number[]) => v.map((y, i) => `${s.x(s.minutes[i]!).toFixed(1)},${s.y(y).toFixed(1)}`).join(' ');
  const on = (pid: number) => picked.includes(pid);
  const shown = players.filter((p) => on(p.participantId));
  return (
    <figure class="rlc-md-chart rlc-mc-wide">
      <figcaption>
        <b>{t('mcPerPlayer')}</b>
        <Pills options={METRICS} value={metric} onChange={setMetric} label={t('mcPerPlayer')} />
      </figcaption>
      <div class="rlc-mc-who" role="group" aria-label={t('mcPickPlayers')}>
        {players.map((p) => {
          const ch = ctx.icons.champions.get(p.championId);
          return (
            <button type="button" key={p.participantId} data-team={p.teamId} aria-pressed={on(p.participantId)} title={who(ctx, p.participantId)} onClick={() => setPicked(on(p.participantId) ? picked.filter((x) => x !== p.participantId) : [...picked, p.participantId])}>
              {ch?.icon ? <img src={ch.icon} alt={ch.name} /> : <span>{playerName(ctx.game, p.participantId).slice(0, 2)}</span>}
            </button>
          );
        })}
      </div>
      <Plot
        s={s}
        label={t('mcPerPlayer')}
        tip={(i) =>
          [...shown]
            .sort((a, b) => series.get(b.participantId)![i]! - series.get(a.participantId)![i]!)
            .map((p) => <span key={p.participantId} data-team={p.teamId}>{`${champName(ctx, p.participantId) || playerName(ctx.game, p.participantId)}: ${c.format(series.get(p.participantId)![i]!)}`}</span>)
        }
      >
        <Axes s={s} fmt={(v) => c.format(v)} />
        {players.filter((p) => !on(p.participantId)).map((p) => <polyline key={p.participantId} class="rlc-mc-dim" data-team={p.teamId} points={pts(series.get(p.participantId)!)} />)}
        {shown.map((p) => (
          <polyline key={p.participantId} class="rlc-mc-line" data-team={p.teamId} data-me={p === ctx.me ? 'true' : undefined} points={pts(series.get(p.participantId)!)} />
        ))}
        {endLabels(shown.map((p) => ({ id: p.participantId, y: s.y(series.get(p.participantId)!.at(-1) ?? 0) - 12 }))).map(({ id, y }) => (
          <text key={id} class="rlc-mc-end" x={s.x(s.last) - 6} y={y} text-anchor="end" dominant-baseline="middle">
            {champName(ctx, id) || playerName(ctx.game, id)}
          </text>
        ))}
      </Plot>
    </figure>
  );
}

/** Rótulos no fim das linhas, empurrados para baixo até ficarem a pelo menos 15 unidades um do outro. */
export function endLabels<T extends { y: number }>(list: T[], gap = 15): T[] {
  const out = [...list].sort((a, b) => a.y - b.y).map((l) => ({ ...l }));
  for (let i = 1; i < out.length; i++) if (out[i]!.y - out[i - 1]!.y < gap) out[i]!.y = out[i - 1]!.y + gap;
  return out;
}

/** Duelo de rota: diferença de ouro, farm e XP contra o oponente aos 10 e 15 minutos (o que o op.gg chama de GD@15). */
function LaneDuel({ ctx, tl, me, opponent }: { ctx: Ctx; tl: Timeline; me: Participant; opponent: Participant }) {
  const n = new Intl.NumberFormat(locale());
  const rows: Array<[Metric, TextKey]> = [
    ['gold', 'gold'],
    ['cs', 'farm'],
    ['xp', 'mcXp'],
  ];
  const at = [10, 15].filter((m) => m < tl.frames.length);
  if (!at.length) return null;
  return (
    <figure class="rlc-md-chart rlc-mc-duel">
      <figcaption>
        <b>{t('mcLane')}</b>
        <span class="rlc-mc-note">{`${champName(ctx, me.participantId)} ${t('mcVs')} ${champName(ctx, opponent.participantId)}`}</span>
      </figcaption>
      <div class="rlc-mc-tiles">
        {rows.flatMap(([metric, label]) =>
          at.map((m) => {
            const d = diffAt(tl, me.participantId, opponent.participantId, m, metric) ?? 0;
            return (
              <div key={`${metric}${m}`} class="rlc-mc-tile" data-sign={d > 0 ? 'up' : d < 0 ? 'down' : undefined}>
                <small>{`${t(label)} ${t('mcAt')} ${m}`}</small>
                <b>{signed(d, n)}</b>
              </div>
            );
          }),
        )}
      </div>
    </figure>
  );
}

/** Abates por minuto: barras do azul para cima e do vermelho para baixo, do mesmo zero. */
function KillsPerMinute({ ctx, tl }: { ctx: Ctx; tl: Timeline }) {
  const list = killList(tl, ctx.teamOf);
  const { blue, red } = killsPerMinute(list, tl.frames.length);
  const s = scale(
    tl.frames.map((_, i) => i),
    [...blue, ...red.map((v) => -v)],
    300,
    true,
  );
  const n = new Intl.NumberFormat(locale());
  const band = (s.w - PAD.l - PAD.r) / Math.max(1, s.last) - 2;
  return (
    <figure class="rlc-md-chart">
      <figcaption>
        <b>{t('mcKillsPerMin')}</b>
        <span class="rlc-md-legend" data-team="100">{`${teamName(100)} ${blue.reduce((a, b) => a + b, 0)}`}</span>
        <span class="rlc-md-legend" data-team="200">{`${teamName(200)} ${red.reduce((a, b) => a + b, 0)}`}</span>
      </figcaption>
      <Plot s={s} label={t('mcKillsPerMin')} tip={(i) => [<span key="b" data-team="100">{`${teamName(100)}: ${n.format(blue[i]!)}`}</span>, <span key="r" data-team="200">{`${teamName(200)}: ${n.format(red[i]!)}`}</span>]}>
        <Axes s={s} fmt={(v) => n.format(Math.abs(v))} />
        {blue.map((v, i) => (v ? <rect key={`b${i}`} class="rlc-mc-bar" data-team="100" x={s.x(i) - band / 2} y={s.y(v)} width={Math.max(2, band)} height={s.y(0) - s.y(v) - 1} rx={2} /> : null))}
        {red.map((v, i) => (v ? <rect key={`r${i}`} class="rlc-mc-bar" data-team="200" x={s.x(i) - band / 2} y={s.y(0) + 1} width={Math.max(2, band)} height={s.y(-v) - s.y(0) - 1} rx={2} /> : null))}
      </Plot>
    </figure>
  );
}

/** Tamanho do mapa em unidades do jogo (posições dos eventos); o fundo é a arte do histórico do client. */
const MAP_SIZE: Record<number, number> = { 11: 14870, 12: 12988 };

/** Onde cada abate aconteceu, na cor do time de quem matou. "Com você": seus abates (●) e suas mortes (✕). */
function KillMap({ ctx, tl }: { ctx: Ctx; tl: Timeline }) {
  const [mode, setMode] = useState<'all' | 'me'>('all');
  const all = killList(tl, ctx.teamOf).filter((k) => k.x || k.y);
  const me = ctx.me?.participantId;
  const list = mode === 'me' && me ? all.filter((k) => k.killer === me || k.victim === me || k.assists.includes(me)) : all;
  const size = MAP_SIZE[ctx.game.mapId ?? 0] ?? Math.max(1, ...all.flatMap((k) => [k.x, k.y]));
  const art = MAP_SIZE[ctx.game.mapId ?? 0] ? `/fe/lol-match-history/map${ctx.game.mapId}.png` : null;
  const at = (k: Kill) => ({ cx: (k.x / size) * 1000, cy: 1000 - (k.y / size) * 1000 });
  const text = (k: Kill) => `${formatClock(k.t / 1000)} · ${k.killer ? who(ctx, k.killer) : t('mcExecuted')} → ${who(ctx, k.victim)}`;
  return (
    <figure class="rlc-md-chart rlc-mc-map">
      <figcaption>
        <b>{t('mcKillMap')}</b>
        {me ? (
          <Pills
            options={[
              ['all', 'mcAll'],
              ['me', 'mcWithYou'],
            ]}
            value={mode}
            onChange={setMode}
            label={t('mcKillMap')}
          />
        ) : null}
      </figcaption>
      <svg viewBox="0 0 1000 1000" role="img" aria-label={t('mcKillMap')}>
        {art ? <image href={art} x={0} y={0} width={1000} height={1000} /> : <rect class="rlc-mc-mapbg" x={0} y={0} width={1000} height={1000} rx={24} />}
        {list.map((k, i) =>
          mode === 'me' && k.victim === me ? (
            <g key={i} class="rlc-mc-death" data-team={k.team} transform={`translate(${at(k).cx} ${at(k).cy})`}>
              <path d="M-11 -11 11 11M11 -11 -11 11" />
              <circle r={18} class="rlc-md-hit" />
              <title>{text(k)}</title>
            </g>
          ) : (
            <circle key={i} class="rlc-mc-kill" data-team={k.team} {...at(k)} r={12}>
              <title>{text(k)}</title>
            </circle>
          ),
        )}
      </svg>
      <p class="rlc-mc-key">
        <span class="rlc-md-legend" data-team="100">{teamName(100)}</span>
        <span class="rlc-md-legend" data-team="200">{teamName(200)}</span>
        {mode === 'me' ? <span>{`● ${t('mcYourKills')} · ✕ ${t('mcYourDeaths')}`}</span> : null}
      </p>
    </figure>
  );
}

const RANKS: Array<[Rank, TextKey]> = [
  ['damage', 'mcRankDamage'],
  ['taken', 'mcRankTaken'],
  ['mitigated', 'mcRankMitigated'],
  ['gold', 'gold'],
  ['cs', 'farm'],
  ['vision', 'vision'],
  ['kp', 'mcRankKp'],
  ['heal', 'mcRankHeal'],
  ['cc', 'mcRankCc'],
  ['objectives', 'objectives'],
  ['turrets', 'mcRankTurrets'],
  ['dmgPerGold', 'mcRankDmgPerGold'],
];
const SPLIT: TextKey[] = ['mcPhysical', 'mcMagic', 'mcTrue'];

/**
 * Comparação por jogador: uma barra por jogador na escala do maior valor da partida, com a parte dele no time.
 * No dano a campeões a barra se divide em físico, mágico e verdadeiro.
 */
function Ranking({ ctx }: { ctx: Ctx }) {
  const [rank, setRank] = useState<Rank>('damage');
  const n = new Intl.NumberFormat(locale(), { maximumFractionDigits: rank === 'dmgPerGold' ? 2 : 0 });
  const pct = new Intl.NumberFormat(locale(), { style: 'percent' });
  const value = (p: Participant) => RANK_VALUE[rank](p, ctx.game);
  const max = Math.max(rank === 'kp' ? 1 : 0, ...ctx.game.participants.map(value)) || 1;
  const show = (p: Participant) => (rank === 'kp' ? pct.format(value(p)) : rank === 'cc' ? `${n.format(value(p))} s` : n.format(value(p)));
  return (
    <figure class="rlc-md-chart rlc-mc-wide">
      <figcaption>
        <b>{t('mcCompare')}</b>
        {rank === 'damage' ? (
          <span class="rlc-mc-key">
            {SPLIT.map((k, i) => (
              <span key={k} class="rlc-mc-swatch" data-split={i}>
                {t(k)}
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
      <Pills options={RANKS} value={rank} onChange={setRank} label={t('mcCompare')} />
      <ul class="rlc-md-bars">
        {[...ctx.game.participants]
          .sort((a, b) => a.teamId - b.teamId)
          .map((p) => {
            const ch = ctx.icons.champions.get(p.championId);
            const share = teamShare(ctx.game, p, rank);
            const split = rank === 'damage' ? damageSplit(p) : null;
            return (
              <li key={p.participantId} data-team={p.teamId} data-me={p === ctx.me ? 'true' : undefined}>
                {ch?.icon ? <img class="rlc-md-mini" src={ch.icon} alt="" title={ch.name} /> : <span class="rlc-md-mini" />}
                <span class="rlc-md-barname">{playerName(ctx.game, p.participantId)}</span>
                <span class="rlc-md-track" title={split ? split.map((v, i) => `${t(SPLIT[i]!)}: ${n.format(v)}`).join(' · ') : undefined}>
                  {split && split.some(Boolean) ? (
                    <span class="rlc-mc-stack" style={{ width: `${(value(p) / max) * 100}%` }}>
                      {split.map((v, i) => (v ? <span key={i} class="rlc-mc-seg" data-split={i} style={{ flexGrow: v }} /> : null))}
                    </span>
                  ) : (
                    <span class="rlc-md-fill" style={{ width: `${(value(p) / max) * 100}%` }} />
                  )}
                </span>
                <span class="rlc-md-barval">
                  {show(p)}
                  {share !== null ? <small>{pct.format(share)}</small> : null}
                </span>
              </li>
            );
          })}
      </ul>
    </figure>
  );
}

const FIRST: Record<TeamSummary['firsts'][number], TextKey> = { blood: 'mcFirstBlood', tower: 'mcFirstTower', dragon: 'mcFirstDragon', baron: 'mcFirstBaron', inhibitor: 'mcFirstInhibitor' };

/** Objetivos lado a lado: o maior de cada linha em destaque; os dragões com o elemento de cada um. */
function Objectives({ summaries }: { summaries: TeamSummary[] }) {
  const [blue, red] = summaries as [TeamSummary, TeamSummary];
  const c = compact();
  const rows: Array<[TextKey, ObjectiveKind | 'kills' | 'gold', (s: TeamSummary) => number, ((s: TeamSummary) => string)?]> = [
    ['mcKills', 'kills', (s) => s.kills],
    ['gold', 'gold', (s) => s.gold, (s) => c.format(s.gold)],
    ['mcTowers', 'tower', (s) => s.towers],
    ['mcInhibitors', 'inhibitor', (s) => s.inhibitors],
    ['mcDragons', 'dragon', (s) => s.dragons.length],
    ['mcElder', 'elder', (s) => s.elders],
    ['mcGrubs', 'grubs', (s) => s.grubs],
    ['mcHeralds', 'herald', (s) => s.heralds],
    ['mcBarons', 'baron', (s) => s.barons],
    ['mcAtakhan', 'atakhan', (s) => s.atakhans],
  ];
  // Cada dragão com o ícone do elemento na cor do time (o nome no balão).
  const dragons = (s: TeamSummary) =>
    s.dragons.map((d, i) => <img key={i} class="rlc-mc-drake" src={teamIcon('dragon', s.team, d)!} alt={objName({ kind: 'dragon', sub: d })} title={objName({ kind: 'dragon', sub: d })} />);
  return (
    <figure class="rlc-md-chart rlc-mc-objs">
      <figcaption>
        <b>{t('mcObjectives')}</b>
      </figcaption>
      <table>
        <colgroup>
          <col class="rlc-mc-side" />
          <col />
          <col class="rlc-mc-side" />
        </colgroup>
        <thead>
          <tr>
            <th class="rlc-md-legend" data-team="100">{teamName(100)}</th>
            <th />
            <th class="rlc-md-legend" data-team="200">{teamName(200)}</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter(([, , v], i) => i < 5 || v(blue) || v(red))
            .map(([label, ico, v, fmt]) => (
              <tr key={label}>
                <td data-best={v(blue) > v(red) ? 'true' : undefined}>
                  <span class="rlc-mc-val">
                    {fmt ? fmt(blue) : v(blue)}
                    {ico === 'dragon' ? dragons(blue) : null}
                  </span>
                </td>
                <th>
                  <span class="rlc-mc-objname">
                    <Ico kind={ico} />
                    {t(label)}
                  </span>
                </th>
                <td data-best={v(red) > v(blue) ? 'true' : undefined}>
                  <span class="rlc-mc-val">
                    {fmt ? fmt(red) : v(red)}
                    {ico === 'dragon' ? dragons(red) : null}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {blue.firsts.length || red.firsts.length ? (
        <div class="rlc-mc-firsts">
          {[blue, red].map((s) => (
            <p key={s.team} data-team={s.team}>
              {s.firsts.map((f) => (
                <span key={f} class="rlc-md-legend" data-team={s.team}>
                  {t(FIRST[f])}
                </span>
              ))}
            </p>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
