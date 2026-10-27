import { locale, t, type TextKey } from '../../i18n';

/** Leitura silenciosa da LCU (sem Toast): telas de consulta mostram vazio quando falha. */
export const getJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const r = await fetch(url);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

export interface Participant {
  participantId: number;
  teamId: number;
  championId: number;
  spell1Id?: number;
  spell2Id?: number;
  stats: Record<string, number | boolean | undefined>;
  /** Rota que a Riot atribuiu: lane TOP/JUNGLE/MIDDLE/BOTTOM; no BOTTOM o role diz se foi suporte. */
  timeline?: { lane?: string; role?: string };
}
export interface Identity {
  participantId: number;
  player: { gameName?: string; tagLine?: string; summonerName?: string; puuid?: string; summonerId?: number; profileIcon?: number };
}
export interface Game {
  gameId: number;
  queueId: number;
  gameDuration: number;
  gameCreation: number;
  mapId?: number;
  participants: Participant[];
  participantIdentities: Identity[];
}
export interface Timeline {
  frames: Array<{ timestamp: number; participantFrames: Record<string, { participantId: number; totalGold: number }> }>;
}

export const num = (p: Participant | undefined, key: string) => Number(p?.stats?.[key] ?? 0);
export const kda = (p: Participant) => `${num(p, 'kills')}/${num(p, 'deaths')}/${num(p, 'assists')}`;
export const playerName = (g: Game, participantId: number) => {
  const p = g.participantIdentities.find((i) => i.participantId === participantId)?.player;
  return p?.gameName || p?.summonerName || '—';
};
/** Participante do jogador: o que tem o puuid dele, ou o único (a lista do histórico só traz o próprio). */
export const mine = (g: Game, puuid: string) => {
  const id = g.participantIdentities.find((i) => i.player.puuid === puuid)?.participantId ?? g.participants[0]?.participantId;
  return g.participants.find((p) => p.participantId === id) ?? g.participants[0];
};

export type QueueFilter = 'all' | 'ranked' | 'normal' | 'aram';
const GROUPS: Record<Exclude<QueueFilter, 'all'>, number[]> = { ranked: [420, 440], normal: [400, 430, 480, 490], aram: [450, 2400] };
export const inFilter = (queueId: number, f: QueueFilter) => f === 'all' || GROUPS[f].includes(queueId);

const LANES: Record<string, TextKey> = { TOP: 'posTOP', JUNGLE: 'posJUNGLE', MIDDLE: 'posMIDDLE', MID: 'posMIDDLE', BOTTOM: 'posBOTTOM' };
/** Rota da partida (chave de texto), só em Summoner's Rift; fora dele (ARAM etc.) a lane da Riot não diz nada. */
export function laneOf(g: Game, p: Participant | undefined): TextKey | null {
  if (g.mapId !== 11) return null;
  const lane = LANES[p?.timeline?.lane ?? ''];
  if (lane === 'posBOTTOM' && p?.timeline?.role?.includes('SUPPORT')) return 'posUTILITY';
  return lane ?? null;
}

/** (abates + assistências) / mortes, com morte zero contando como 1. */
export const kdaRatio = (p: Participant | undefined) => (num(p, 'kills') + num(p, 'assists')) / Math.max(1, num(p, 'deaths'));

/** Partidas agrupadas por dia (na ordem em que vieram, a mais recente primeiro), com o rótulo de `relativeDay`. */
export function byDay<G extends { gameCreation: number }>(games: G[], now = Date.now()): Array<{ label: string; games: G[] }> {
  const out = new Map<string, { label: string; games: G[] }>();
  for (const g of games) {
    const key = new Date(g.gameCreation).toDateString();
    let d = out.get(key);
    if (!d) out.set(key, (d = { label: relativeDay(g.gameCreation, now), games: [] }));
    d.games.push(g);
  }
  return [...out.values()];
}

/** Colocação curta: "4º" em português, "#4" nos outros. */
export const ordinal = (n: number) => (locale() === 'pt-BR' ? `${n}º` : `#${n}`);

/** "hoje", "ontem" ou a data curta. */
export function relativeDay(ts: number, now = Date.now()): string {
  const day = (x: number) => new Date(x).toDateString();
  if (day(ts) === day(now)) return t('today');
  if (day(ts) === day(now - 86400000)) return t('yesterday');
  return new Date(ts).toLocaleDateString(locale(), { day: '2-digit', month: 'short' });
}

/** Ouro somado por time a cada quadro da linha do tempo (um por minuto). */
export function teamGold(tl: Timeline, teamOf: Record<number, number>) {
  const blue: number[] = [];
  const red: number[] = [];
  for (const f of tl.frames) {
    let b = 0;
    let r = 0;
    for (const pf of Object.values(f.participantFrames)) {
      if (teamOf[pf.participantId] === 100) b += pf.totalGold;
      else if (teamOf[pf.participantId] === 200) r += pf.totalGold;
    }
    blue.push(b);
    red.push(r);
  }
  return { blue, red, minutes: tl.frames.map((f) => Math.round(f.timestamp / 60000)) };
}

/** Passo "redondo" do eixo (1, 2 ou 5 × 10ⁿ) para caber em até `count` marcas até `max`. */
export function niceStep(max: number, count = 4): number {
  const raw = Math.max(1, max) / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
}

export interface Perk {
  name: string;
  icon: string;
}
// ponytail: cache por sessão sem expirar; runas só mudam com patch (e o client reinicia).
let perkMap: Promise<Map<number, Perk>> | null = null;
/** Runas e árvores (perks.json + perkstyles.json) por id, com nome e ícone. */
export const perks = () =>
  (perkMap ??= Promise.all([
    getJson<Array<{ id: number; name?: string; iconPath?: string }>>('/lol-game-data/assets/v1/perks.json'),
    getJson<{ styles?: Array<{ id: number; name?: string; iconPath?: string }> }>('/lol-game-data/assets/v1/perkstyles.json'),
  ]).then(([list, styles]) => {
    const map = new Map<number, Perk>();
    for (const p of [...(Array.isArray(list) ? list : []), ...(styles?.styles ?? [])]) if (p.iconPath) map.set(p.id, { name: p.name ?? '', icon: p.iconPath });
    return map;
  }));

const TIERS: Record<string, TextKey> = {
  IRON: 'tierIron', BRONZE: 'tierBronze', SILVER: 'tierSilver', GOLD: 'tierGold', PLATINUM: 'tierPlatinum', EMERALD: 'tierEmerald',
  DIAMOND: 'tierDiamond', MASTER: 'tierMaster', GRANDMASTER: 'tierGrandmaster', CHALLENGER: 'tierChallenger',
};
/** "Ouro II"; elos de topo sem divisão; vazio quando sem classificação. */
export function tierLabel(tier: string | undefined, division: string | undefined): string {
  const key = TIERS[tier ?? ''];
  if (!key) return '';
  return ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier!) || !division || division === 'NA' ? t(key) : `${t(key)} ${division}`;
}
