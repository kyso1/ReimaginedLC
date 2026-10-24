/**
 * Recomendações de runas e feitiços da OP.GG (endpoint não documentado). Falha nunca vira erro de tela: devolve null.
 * A resposta tem `Access-Control-Allow-Origin: *`; se o client bloquear mesmo assim, troque `opgg.get` por outro transporte.
 */

export type OpggPosition = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
export const OPGG_POSITIONS: OpggPosition[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

/** Uma página recomendada: os 9 ids na ordem da LCU, taxas de 0 a 1 e os dois feitiços mais usados. */
export interface Rec {
  primary: number;
  sub: number;
  perks: number[];
  win: number;
  pick: number;
  spells: [number, number] | null;
}

/** Transporte trocável: recebe a URL e devolve o JSON (ou null). */
export const opgg = {
  get: async (url: string): Promise<unknown> => {
    const r = await fetch(url);
    return r.ok ? r.json() : null;
  },
};

// Região da Riot (com ou sem o número da plataforma) para a da OP.GG.
/**
 * Região de onde vêm as estatísticas: a global da OP.GG. As regionais têm amostra pequena (no BR, páginas com 6 partidas
 * apareciam com 66% de vitória), e o jeito de montar runas não muda de servidor para servidor.
 */
export const OPGG_REGION = 'global';
/** Página com menos partidas que isso é ruído estatístico: fica de fora. */
export const MIN_GAMES = 30;

// Posição da seleção (`middle`) ou da LCU (`MIDDLE`) para a da OP.GG.
const POSITIONS: Record<string, OpggPosition> = { TOP: 'TOP', JUNGLE: 'JUNGLE', MIDDLE: 'MID', MID: 'MID', BOTTOM: 'ADC', ADC: 'ADC', UTILITY: 'SUPPORT', SUPPORT: 'SUPPORT' };
export const opggPosition = (pos: string | undefined): OpggPosition | null => POSITIONS[(pos ?? '').toUpperCase()] ?? null;

interface Build {
  primary_page_id?: number;
  primary_rune_ids?: number[];
  secondary_page_id?: number;
  secondary_rune_ids?: number[];
  stat_mod_ids?: number[];
  play?: number;
  win?: number;
}
interface Body {
  data?: { rune_pages?: Array<{ pick_rate?: number; builds?: Build[] }>; summoner_spells?: Array<{ ids?: number[] }> };
}

/** As 3 primeiras páginas (uma por pedra angular), cada uma com a build mais jogada. */
export function parseOpgg(body: unknown): Rec[] | null {
  const d = (body as Body | null)?.data;
  if (!d || !Array.isArray(d.rune_pages)) return null;
  const ids = d.summoner_spells?.[0]?.ids;
  const spells: Rec['spells'] = ids?.length === 2 ? [ids[0]!, ids[1]!] : null;
  const recs: Rec[] = [];
  for (const page of d.rune_pages) {
    const b = page.builds?.[0];
    const perks = [...(b?.primary_rune_ids ?? []), ...(b?.secondary_rune_ids ?? []), ...(b?.stat_mod_ids ?? [])];
    if (!b?.primary_page_id || !b.secondary_page_id || perks.length !== 9 || (b.play ?? 0) < MIN_GAMES) continue;
    recs.push({ primary: b.primary_page_id, sub: b.secondary_page_id, perks, win: b.play ? (b.win ?? 0) / b.play : 0, pick: page.pick_rate ?? 0, spells });
    if (recs.length === 3) break;
  }
  return recs;
}

// Cache da sessão por (região, campeão, rota, inimigo). Falha sai do cache para tentar de novo depois.
const cache = new Map<string, Promise<Rec[] | null>>();
export const clearOpggCache = () => cache.clear();

export function recommend(region: string, championId: number, position: OpggPosition, enemyId = 0): Promise<Rec[] | null> {
  const key = `${region}/${championId}/${position}/${enemyId}`;
  let entry = cache.get(key);
  if (!entry) {
    const url = `https://lol-api-champion.op.gg/api/${region}/champions/ranked/${championId}/${position}${enemyId > 0 ? `?target_champion=${enemyId}` : ''}`;
    entry = opgg
      .get(url)
      .then(parseOpgg)
      .catch(() => null)
      .then((recs) => {
        if (!recs) cache.delete(key);
        return recs;
      });
    cache.set(key, entry);
  }
  return entry;
}

/**
 * Recomendação contra `enemyId`. Matchup com poucas partidas fica vazia depois do MIN_GAMES (na OP.GG global, até
 * duelos comuns têm 1 ou 2 páginas com amostra); aí cai para as gerais da rota e avisa com `general`.
 */
export async function recommendVs(region: string, championId: number, position: OpggPosition, enemyId: number): Promise<{ recs: Rec[] | null; general: boolean }> {
  if (enemyId > 0) {
    const vs = await recommend(region, championId, position, enemyId);
    if (vs?.length) return { recs: vs, general: false };
  }
  return { recs: await recommend(region, championId, position), general: enemyId > 0 };
}
