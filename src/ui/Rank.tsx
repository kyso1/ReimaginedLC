import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { getJson, tierLabel } from '../screens/profile/data';

/** Fila ranqueada (chave do `queueMap` da LCU) de cada fila com elo; as outras não mostram elo. */
const RANKED_QUEUES: Record<number, string> = {
  420: 'RANKED_SOLO_5x5',
  440: 'RANKED_FLEX_SR',
  1100: 'RANKED_TFT',
  1160: 'RANKED_TFT_DOUBLE_UP',
};
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
      <img src={`/fe/lol-static-assets/images/ranked-mini-crests/${e.tier!.toLowerCase()}.svg`} alt="" />
      <span>{`• ${label} ${e.leaguePoints ?? 0} ${t('lp')}`}</span>
    </span>
  );
}
