import { useEffect, useState } from 'preact/hooks';
import { getJson } from '../profile/data';
import { roleOf, type Role } from '../../ui/RoleIcon';
import type { Cell, Session } from './logic';

/**
 * Nomes verdadeiros dos aliados, como o plugin Summoner Name Reveal: a sala de chat da seleção lista Riot ID e puuid
 * de quem está nela, mesmo com os nomes ocultos na seleção. `//riotclient/...` vai para a API do Riot Client
 * (a URL relativa ao protocolo é de propósito; `/riotclient/...` devolve 404).
 */
export const PARTICIPANTS = '//riotclient/chat/v5/participants';
// Liga o puuid ofuscado da seleção ao verdadeiro (usado pelos botões de silenciar do client).
export const MUTES = '/lol-chat/v1/player-mutes';

export interface Participant {
  cid: string;
  game_name?: string;
  game_tag?: string;
  puuid?: string;
}
export interface RealName {
  gameName: string;
  tagLine: string;
  puuid: string;
}

/** Participantes da sala da seleção atual (`chatId` = `chatDetails.multiUserChatId`), sem repetir puuid. */
export function roomOf(list: Participant[], chatId = ''): Participant[] {
  const all = list.filter((p) => p.cid?.includes('champ-select') && p.puuid && p.game_name);
  const room = chatId.split('@')[0]!;
  const mine = room ? all.filter((p) => p.cid.startsWith(room)) : [];
  // Sem id da sala (ou id em outro formato), fica com todas as salas de seleção; normalmente só há uma.
  const pick = mine.length ? mine : all;
  return pick.filter((p, i) => pick.findIndex((q) => q.puuid === p.puuid) === i);
}

/**
 * Casa cada aliado com um participante: pelo puuid, pelo puuid ofuscado (mapa de silenciar) e, se sobrar uma vaga
 * e um participante, um com o outro. Com mais de uma sobra não há como saber quem é quem: a vaga fica sem nome real.
 */
export function matchNames(cells: Cell[], room: Participant[], obfuscated: Map<string, string> = new Map()): Map<number, RealName> {
  const found = new Map<number, RealName>();
  const used = new Set<string>();
  for (const c of cells) {
    const puuid = c.puuid || (c.obfuscatedPuuid ? obfuscated.get(c.obfuscatedPuuid) : undefined);
    const p = puuid ? room.find((x) => x.puuid === puuid) : undefined;
    if (p) {
      found.set(c.cellId, realOf(p));
      used.add(p.puuid!);
    }
  }
  const cellsLeft = cells.filter((c) => !found.has(c.cellId));
  const left = room.filter((p) => !used.has(p.puuid!));
  if (cellsLeft.length === 1 && left.length === 1) found.set(cellsLeft[0]!.cellId, realOf(left[0]!));
  return found;
}

const TRIES = 10;
const RETRY_MS = 2000;

export interface RealNames {
  /** Nome real por vaga, quando dá para saber quem é quem. */
  byCell: Map<number, RealName>;
  /** Quem está na sala mas não deu para casar com uma vaga (nomes ocultos na ranqueada). */
  extra: RealName[];
}
const NONE: RealNames = { byCell: new Map(), extra: [] };
const realOf = (p: Participant): RealName => ({ gameName: p.game_name!, tagLine: p.game_tag ?? '', puuid: p.puuid! });

/**
 * Nomes reais dos aliados (plugin "Revelar nomes"; `on` falso não consulta nada). A sala enche aos poucos no começo
 * da seleção: tenta de novo enquanto falta alguém.
 */
export function useRealNames(session: Session | null, on = true): RealNames {
  const [names, setNames] = useState<RealNames>(NONE);
  const id = session?.id ?? '';
  const cells = session?.myTeam ?? [];
  // Refaz quando entra alguém novo na equipe (troca de vaga, aliado que carregou depois).
  const shape = cells.map((c) => `${c.cellId}:${c.puuid}:${c.obfuscatedPuuid}`).join('|');
  useEffect(() => {
    if (!session || !on) return setNames(NONE);
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async (n: number) => {
      const [list, mutes] = await Promise.all([getJson<{ participants?: Participant[] }>(PARTICIPANTS), getJson<Record<string, { puuid?: string; obfuscatedPuuid?: string }>>(MUTES)]);
      if (!live) return;
      const room = roomOf(list?.participants ?? [], session.chatDetails?.multiUserChatId);
      const obf = new Map(Object.values(mutes ?? {}).flatMap((m) => (m.puuid && m.obfuscatedPuuid ? [[m.obfuscatedPuuid, m.puuid] as [string, string]] : [])));
      const found = matchNames(cells, room, obf);
      const used = new Set([...found.values()].map((r) => r.puuid));
      const mine = new Set(cells.map((c) => c.puuid).filter(Boolean));
      setNames({ byCell: found, extra: room.filter((p) => !used.has(p.puuid!) && !mine.has(p.puuid!)).map(realOf) });
      if (found.size < cells.length && n + 1 < TRIES) timer = setTimeout(() => void run(n + 1), RETRY_MS);
    };
    void run(0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [id, shape, on]);
  return names;
}

/** Resumo das últimas partidas: KDA médio e rota mais jogada (null sem partidas). */
export interface Recent {
  kda: number | null;
  lane: Role | null;
  games: number;
}
interface Game {
  participants?: Array<{ stats?: { kills?: number; deaths?: number; assists?: number }; timeline?: { lane?: string; role?: string } }>;
}

/** KDA somado das partidas e rota que mais aparece (bot com papel de suporte conta como suporte). */
export function summarize(games: Game[]): Recent {
  let k = 0;
  let d = 0;
  let a = 0;
  const lanes = new Map<Role, number>();
  let n = 0;
  for (const g of games) {
    const p = g.participants?.[0];
    if (!p?.stats) continue;
    n++;
    k += p.stats.kills ?? 0;
    d += p.stats.deaths ?? 0;
    a += p.stats.assists ?? 0;
    const role = roleOf(p.timeline?.lane === 'BOTTOM' && /SUPPORT/.test(p.timeline.role ?? '') ? 'UTILITY' : p.timeline?.lane);
    if (role !== 'UNSELECTED') lanes.set(role, (lanes.get(role) ?? 0) + 1);
  }
  const lane = [...lanes].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
  return { kda: n ? (k + a) / Math.max(1, d) : null, lane, games: n };
}

// ponytail: cache da sessão por puuid, sem expirar; o histórico de quem está na sala não muda durante a seleção.
const recent = new Map<string, Promise<Recent | null>>();
export const clearRecentCache = () => recent.clear();
export function recentOf(puuid: string): Promise<Recent | null> {
  let p = recent.get(puuid);
  if (!p) {
    p = getJson<{ games?: { games?: Game[] } }>(`/lol-match-history/v1/products/lol/${encodeURIComponent(puuid)}/matches?begIndex=0&endIndex=20`).then((r) => (r?.games?.games ? summarize(r.games.games) : null));
    recent.set(puuid, p);
  }
  return p;
}
