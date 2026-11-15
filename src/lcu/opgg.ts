import { getJson } from '../screens/profile/data';

/**
 * Derrotas de outros jogadores pelo op.gg. A LCU (16.22) manda `losses: 0` no ranked-stats de quem não é você, abaixo
 * de Mestre: a taxa de vitórias saía sempre 100%. O op.gg lê a API pública da Riot, que ainda tem o número, e responde
 * com CORS aberto. Só Solo/Duo e Flex, as filas que o op.gg separa.
 */
const OPGG_QUEUE: Record<string, string> = { RANKED_SOLO_5x5: 'SOLORANKED', RANKED_FLEX_SR: 'FLEXRANKED' };
const API = 'https://lol-api-summoner.op.gg/api';

/** Região do client (`BR`, `LA1`, `EUN1`...) no formato do op.gg (`br`, `lan`, `eune`...). */
export function opggRegion(region: string): string {
  const r = region.toLowerCase();
  const odd: Record<string, string> = { la1: 'lan', la2: 'las', oc1: 'oce', eun1: 'eune', sg2: 'sea', ph2: 'sea', th2: 'sea', tw2: 'tw', vn2: 'vn' };
  return odd[r] ?? r.replace(/\d+$/, '');
}

interface Counts {
  tier?: string;
  wins?: number;
  losses?: number;
}

/** Elo com vitórias e nenhuma derrota: a LCU escondeu as derrotas. */
export const hidesLosses = (q: string, e: Counts | undefined) => q in OPGG_QUEUE && !!e?.tier && (e.wins ?? 0) > 0 && !e.losses;

type OpggLeague = { game_type?: string; win?: number | null; lose?: number | null };

/** Vitórias e derrotas por fila (chave do `queueMap`) no op.gg; null se não achou o jogador. */
async function lookup(puuid: string): Promise<Record<string, { wins: number; losses: number }> | null> {
  const [who, where] = await Promise.all([
    getJson<{ gameName?: string; tagLine?: string }>(`/lol-summoner/v2/summoners/puuid/${encodeURIComponent(puuid)}`),
    getJson<{ region?: string }>('/riotclient/region-locale'),
  ]);
  if (!who?.gameName || !who.tagLine || !where?.region) return null;
  const region = opggRegion(where.region);
  const found = await getJson<{ data?: Array<{ summoner_id?: string; game_name?: string; tagline?: string }> }>(
    `${API}/v3/${region}/summoners?riot_id=${encodeURIComponent(`${who.gameName}#${who.tagLine}`)}`,
  );
  const same = (a: string | undefined, b: string) => (a ?? '').toLowerCase() === b.toLowerCase();
  const hit = found?.data?.find((d) => same(d.game_name, who.gameName!) && same(d.tagline, who.tagLine!));
  if (!hit?.summoner_id) return null;
  const summary = await getJson<{ data?: { summoner?: { league_stats?: OpggLeague[] } } }>(`${API}/${region}/summoners/${encodeURIComponent(hit.summoner_id)}/summary`);
  const out: Record<string, { wins: number; losses: number }> = {};
  for (const [q, type] of Object.entries(OPGG_QUEUE)) {
    const l = summary?.data?.summoner?.league_stats?.find((x) => x.game_type === type);
    if (typeof l?.win === 'number' && typeof l.lose === 'number') out[q] = { wins: l.win, losses: l.lose };
  }
  return out;
}

// ponytail: cache por sessão sem expirar; o número do op.gg só muda quando alguém atualiza o perfil lá.
const cache = new Map<string, ReturnType<typeof lookup>>();

/**
 * O `queueMap` com as derrotas escondidas preenchidas pelo op.gg. Vitórias e derrotas vêm juntas do op.gg para a taxa
 * não misturar dois momentos. Sem nada escondido, não pergunta ao op.gg; falhando, devolve como veio.
 */
export async function withLosses<E extends Counts>(puuid: string, map: Record<string, E> | null | undefined): Promise<Record<string, E> | null> {
  if (!map) return null;
  if (!Object.entries(map).some(([q, e]) => hidesLosses(q, e))) return map;
  let p = cache.get(puuid);
  if (!p) cache.set(puuid, (p = lookup(puuid).catch(() => null)));
  const opgg = await p;
  if (!opgg) return map;
  const out = { ...map };
  for (const [q, e] of Object.entries(map)) if (hidesLosses(q, e) && opgg[q]) out[q] = { ...e, ...opgg[q] };
  return out;
}

export const resetOpgg = () => cache.clear();
