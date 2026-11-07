import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { getJson, tierLabel } from '../screens/profile/data';

/** Fila ranqueada (chave do `queueMap` da LCU) de cada fila com elo; as outras não mostram elo. */
const RANKED_QUEUES: Record<number, string> = {
  420: 'RANKED_SOLO_5x5',
  440: 'RANKED_FLEX_SR',
  4310: 'JADE_RANKED_SOLO_5x5',
};
/**
 * Arte do elo: o mini brasão (linhas, cartões) ou o emblema grande. Com o plugin "League Old Ranks" instalado
 * (`window.__leagueOldRanks` = URL do index.js dele), usa os brasões antigos que ele traz, como no client da Riot.
 */
export function crestUrl(tier: string, kind: 'mini' | 'emblem' = 'mini'): string {
  const t = tier.toLowerCase();
  const old = (window as { __leagueOldRanks?: unknown }).__leagueOldRanks;
  if (typeof old === 'string') {
    try {
      return new URL(`./assets/full%20crests/${t}.webp`, old).href;
    } catch {
      // URL inválida: cai na arte do client.
    }
  }
  return kind === 'emblem' ? `/fe/lol-static-assets/images/ranked-emblem/emblem-${t}.png` : `/fe/lol-static-assets/images/ranked-mini-crests/${t}.svg`;
}

export const rankedQueueOf = (queueId: number | undefined): string | null => (queueId ? (RANKED_QUEUES[queueId] ?? null) : null);

export interface Entry {
  tier?: string;
  division?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
}

// ponytail: cache por sessão sem expirar; o elo de quem está na sala muda pouco enquanto ela existe.
const cache = new Map<string, Promise<Record<string, Entry> | null>>();
export const statsOf = (puuid: string) => {
  let p = cache.get(puuid);
  if (!p) {
    p = getJson<{ queueMap?: Record<string, Entry> }>(`/lol-ranked/v1/ranked-stats/${puuid}`).then((r) => r?.queueMap ?? null);
    cache.set(puuid, p);
  }
  return p;
};

/** Elo do jogador na fila: `{ícone} • {elo} {PDL}`. Some quando a fila não tem elo ou o jogador não tem classificação. */
export function Rank({ puuid, queue }: { puuid: string | undefined; queue: string | null }) {
  const [e, setE] = useState<Entry | null>(null);
  useEffect(() => {
    setE(null);
    if (!puuid || !queue) return;
    let live = true;
    void statsOf(puuid).then((m) => live && setE(m?.[queue] ?? null));
    return () => {
      live = false;
    };
  }, [puuid, queue]);
  const label = tierLabel(e?.tier, e?.division);
  if (!e || !label) return null;
  return (
    <span class="rlc-rank" title={label}>
      <img src={crestUrl(e.tier!)} alt="" />
      <span>{`• ${label} ${e.leaguePoints ?? 0} ${t('lp')}`}</span>
    </span>
  );
}
