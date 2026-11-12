import { num, type Game, type Participant, type Timeline } from './data';

/**
 * Contas dos gráficos da partida, em cima do que a LCU manda: o jogo (`/lol-match-history/v1/games/{id}`) e a linha
 * do tempo (`/game-timelines/{id}`, um quadro por minuto com ouro, XP, farm e posição de cada um, e três tipos de
 * evento: abate de campeão, monstro épico e estrutura). Compras de item, sentinelas e níveis de habilidade não vêm.
 */

export type Metric = 'gold' | 'xp' | 'cs' | 'level';
export type Team = 100 | 200;
export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
export type ObjectiveKind = 'dragon' | 'elder' | 'baron' | 'herald' | 'grubs' | 'atakhan' | 'tower' | 'inhibitor';

export const teamMap = (g: Game): Record<number, number> => Object.fromEntries(g.participants.map((p) => [p.participantId, p.teamId]));
export const other = (team: number): Team => (team === 100 ? 200 : 100);
/** Partida de dois times (Summoner's Rift, ARAM...): Arena e afins ficam só com os rankings. */
export const twoTeams = (g: Game) => g.gameMode !== 'CHERRY' && g.participants.length > 1 && g.participants.every((p) => p.teamId === 100 || p.teamId === 200);

const frameOf = (tl: Timeline, i: number, pid: number) => tl.frames[i]?.participantFrames[String(pid)];

/** Valor do jogador em cada quadro. */
export function metricSeries(tl: Timeline, pid: number, metric: Metric): number[] {
  return tl.frames.map((_, i) => {
    const f = frameOf(tl, i, pid);
    if (!f) return 0;
    if (metric === 'gold') return f.totalGold;
    if (metric === 'xp') return f.xp ?? 0;
    if (metric === 'level') return f.level ?? 0;
    return (f.minionsKilled ?? 0) + (f.jungleMinionsKilled ?? 0);
  });
}

/** Vantagem de ouro do time azul a cada quadro (negativo: vermelho na frente). */
export function goldLead(tl: Timeline, teamOf: Record<number, number>): number[] {
  return tl.frames.map((f) => Object.values(f.participantFrames).reduce((s, pf) => s + (teamOf[pf.participantId] === 100 ? pf.totalGold : teamOf[pf.participantId] === 200 ? -pf.totalGold : 0), 0));
}

const events = (tl: Timeline) => tl.frames.flatMap((f) => f.events ?? []);

export interface Kill {
  t: number;
  x: number;
  y: number;
  killer: number;
  victim: number;
  assists: number[];
  /** Time de quem matou (execução por torre/tropa: o time contrário ao da vítima). */
  team: Team;
}

export function kills(tl: Timeline, teamOf: Record<number, number>): Kill[] {
  return events(tl)
    .filter((e) => e.type === 'CHAMPION_KILL')
    .map((e) => ({
      t: e.timestamp,
      x: e.position?.x ?? 0,
      y: e.position?.y ?? 0,
      killer: e.killerId ?? 0,
      victim: e.victimId ?? 0,
      assists: e.assistingParticipantIds ?? [],
      team: (teamOf[e.killerId ?? 0] as Team | undefined) ?? other(teamOf[e.victimId ?? 0] ?? 100),
    }));
}

/** Abates de cada time por minuto (o minuto 0 vai de 0:00 a 0:59), do tamanho da linha do tempo. */
export function killsPerMinute(list: Kill[], minutes: number): { blue: number[]; red: number[] } {
  const blue = Array<number>(minutes).fill(0);
  const red = Array<number>(minutes).fill(0);
  for (const k of list) {
    const m = Math.min(minutes - 1, Math.floor(k.t / 60000));
    if (m >= 0) (k.team === 100 ? blue : red)[m]!++;
  }
  return { blue, red };
}

export interface Objective {
  t: number;
  kind: ObjectiveKind;
  /** Time que levou (na estrutura, o contrário do dono, que é o `teamId` do evento). */
  team: Team;
  /** Dragão: elemento (`FIRE_DRAGON`...); estrutura: rota. */
  sub?: string;
}

const MONSTER: Record<string, ObjectiveKind> = { DRAGON: 'dragon', BARON_NASHOR: 'baron', RIFTHERALD: 'herald', HORDE: 'grubs', ATAKHAN: 'atakhan' };

export function objectives(tl: Timeline, teamOf: Record<number, number>): Objective[] {
  const out: Objective[] = [];
  for (const e of events(tl)) {
    if (e.type === 'ELITE_MONSTER_KILL') {
      const kind = e.monsterSubType === 'ELDER_DRAGON' ? 'elder' : MONSTER[e.monsterType ?? ''];
      const team = (teamOf[e.killerId ?? 0] ?? (e.killerTeamId || undefined)) as Team | undefined;
      if (kind && team) out.push({ t: e.timestamp, kind, team, sub: kind === 'dragon' ? e.monsterSubType : undefined });
    } else if (e.type === 'BUILDING_KILL' && (e.teamId === 100 || e.teamId === 200)) {
      const kind = e.buildingType === 'INHIBITOR_BUILDING' ? 'inhibitor' : e.buildingType === 'TOWER_BUILDING' ? 'tower' : null;
      if (kind) out.push({ t: e.timestamp, kind, team: other(e.teamId), sub: e.laneType });
    }
  }
  return out;
}

/**
 * Rota de cada jogador. A `lane`/`role` da LCU erra muito (dois JUNGLE no mesmo time), então: Golpear é selva; os
 * outros pela posição média dos minutos 2 a 10 (topo, meio ou robô); na dupla do robô, o de menos farm é o suporte.
 */
export function roles(g: Game, tl: Timeline | null): Record<number, Role> {
  const out: Record<number, Role> = {};
  const spot = (pid: number) => {
    const pts = (tl?.frames ?? []).slice(2, 11).map((f) => f.participantFrames[String(pid)]?.position).filter((p): p is { x: number; y: number } => !!p && (p.x > 0 || p.y > 0));
    if (!pts.length) return null;
    return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
  };
  for (const team of [100, 200]) {
    const bot: Participant[] = [];
    for (const p of g.participants.filter((x) => x.teamId === team)) {
      if (p.spell1Id === 11 || p.spell2Id === 11) {
        out[p.participantId] = 'JUNGLE';
        continue;
      }
      const s = spot(p.participantId);
      const lane = s ? (s.y - s.x > 4000 ? 'TOP' : s.x - s.y > 4000 ? 'BOTTOM' : 'MIDDLE') : laneFromRiot(p);
      if (lane === 'BOTTOM') bot.push(p);
      else if (lane) out[p.participantId] = lane;
    }
    const farm = (p: Participant) => num(p, 'totalMinionsKilled');
    bot.sort((a, b) => farm(b) - farm(a)).forEach((p, i) => (out[p.participantId] = i === 0 ? 'BOTTOM' : 'UTILITY'));
  }
  return out;
}

function laneFromRiot(p: Participant): Role | null {
  const lane = p.timeline?.lane;
  if (lane === 'BOTTOM') return 'BOTTOM';
  return lane === 'TOP' || lane === 'MIDDLE' || lane === 'JUNGLE' ? lane : null;
}

/** Oponente de rota: mesma rota no outro time, se só um tiver ela. */
export function laneOpponent(g: Game, roleOf: Record<number, Role>, p: Participant | undefined): Participant | undefined {
  if (!p || !roleOf[p.participantId]) return undefined;
  const same = g.participants.filter((x) => x.teamId !== p.teamId && roleOf[x.participantId] === roleOf[p.participantId]);
  return same.length === 1 ? same[0] : undefined;
}

/** Diferença de `metric` entre dois jogadores no minuto `m` (null se a partida não chegou lá). */
export function diffAt(tl: Timeline, a: number, b: number, m: number, metric: Metric): number | null {
  const fa = metricSeries(tl, a, metric)[m];
  const fb = metricSeries(tl, b, metric)[m];
  return fa === undefined || fb === undefined || m >= tl.frames.length ? null : fa - fb;
}

/** Rankings por jogador: valor e a parte dele no time. */
export type Rank = 'damage' | 'taken' | 'mitigated' | 'gold' | 'cs' | 'vision' | 'heal' | 'cc' | 'objectives' | 'turrets' | 'kp' | 'dmgPerGold';
export const RANK_VALUE: Record<Rank, (p: Participant, g: Game) => number> = {
  damage: (p) => num(p, 'totalDamageDealtToChampions'),
  taken: (p) => num(p, 'totalDamageTaken'),
  mitigated: (p) => num(p, 'damageSelfMitigated'),
  gold: (p) => num(p, 'goldEarned'),
  cs: (p) => num(p, 'totalMinionsKilled') + num(p, 'neutralMinionsKilled'),
  vision: (p) => num(p, 'visionScore'),
  heal: (p) => num(p, 'totalHeal'),
  cc: (p) => num(p, 'timeCCingOthers'),
  objectives: (p) => num(p, 'damageDealtToObjectives'),
  turrets: (p) => num(p, 'damageDealtToTurrets'),
  kp: (p, g) => {
    const teamKills = g.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + num(x, 'kills'), 0);
    return teamKills ? (num(p, 'kills') + num(p, 'assists')) / teamKills : 0;
  },
  dmgPerGold: (p) => num(p, 'totalDamageDealtToChampions') / Math.max(1, num(p, 'goldEarned')),
};

/** Parte do jogador no total do time (0 a 1); a participação em abates já é uma fração. */
export function teamShare(g: Game, p: Participant, rank: Rank): number | null {
  if (rank === 'kp' || rank === 'dmgPerGold') return null;
  const total = g.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + RANK_VALUE[rank](x, g), 0);
  return total ? RANK_VALUE[rank](p, g) / total : 0;
}

/** Quanto do dano a campeões foi físico, mágico e verdadeiro. */
export const damageSplit = (p: Participant) => [num(p, 'physicalDamageDealtToChampions'), num(p, 'magicDamageDealtToChampions'), num(p, 'trueDamageDealtToChampions')] as const;

export interface TeamSummary {
  team: Team;
  win: boolean;
  kills: number;
  gold: number;
  towers: number;
  inhibitors: number;
  dragons: string[];
  elders: number;
  barons: number;
  heralds: number;
  grubs: number;
  atakhans: number;
  firsts: Array<'blood' | 'tower' | 'dragon' | 'baron' | 'inhibitor'>;
}

/** Objetivos de cada time: do bloco `teams` do jogo, com os tipos de dragão e o Atakhan tirados dos eventos. */
export function teamSummaries(g: Game, objs: Objective[]): TeamSummary[] {
  return ([100, 200] as Team[]).map((team) => {
    const t = g.teams?.find((x) => x.teamId === team);
    const mine = objs.filter((o) => o.team === team);
    const count = (k: ObjectiveKind) => mine.filter((o) => o.kind === k).length;
    const players = g.participants.filter((p) => p.teamId === team);
    const firsts: TeamSummary['firsts'] = [];
    if (t?.firstBlood) firsts.push('blood');
    if (t?.firstTower) firsts.push('tower');
    // A LCU escreve `firstDargon`.
    if (t?.firstDargon || t?.firstDragon) firsts.push('dragon');
    if (t?.firstBaron) firsts.push('baron');
    if (t?.firstInhibitor) firsts.push('inhibitor');
    return {
      team,
      win: t ? t.win === 'Win' : !!players[0]?.stats.win,
      kills: players.reduce((s, p) => s + num(p, 'kills'), 0),
      gold: players.reduce((s, p) => s + num(p, 'goldEarned'), 0),
      towers: t?.towerKills ?? count('tower'),
      inhibitors: t?.inhibitorKills ?? count('inhibitor'),
      // Sem linha do tempo, só a contagem: os elementos ficam sem nome.
      dragons: objs.length ? mine.filter((o) => o.kind === 'dragon').map((o) => o.sub ?? '') : Array<string>(t?.dragonKills ?? 0).fill(''),
      elders: count('elder'),
      barons: t?.baronKills ?? count('baron'),
      heralds: t?.riftHeraldKills ?? count('herald'),
      grubs: t?.hordeKills ?? count('grubs'),
      atakhans: count('atakhan'),
      firsts,
    };
  });
}
