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
  stats: Record<string, number | boolean | undefined>;
}
export interface Identity {
  participantId: number;
  player: { gameName?: string; summonerName?: string; puuid?: string };
}
export interface Game {
  gameId: number;
  queueId: number;
  gameDuration: number;
  gameCreation: number;
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
