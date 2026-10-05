import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolHonorV2EligiblePlayer } from '../../lcu/types';
import { useAction } from '../../ui/useAction';

/**
 * Votação de honra: um cartão por aliado elegível. A LCU avança a fase sozinha depois do voto ou do tempo.
 * `honorType` e o efeito de Pular ainda não foram vistos numa partida real (a confirmar na gravação do dono).
 */
export function Honor({ lcu }: { lcu: Lcu }) {
  const ballot = lcu.honorBallot.value.data;
  const [skipped, setSkipped] = useState(false);
  const honor = useAction((puuid: string) => request('POST', '/lol-honor-v2/v1/honor-player', { recipientPuuid: puuid, honorType: 'HEART' }));
  const allies = ballot?.eligibleAllies ?? [];
  return (
    <section class="rlc-honor">
      <h2>{ballot && !skipped ? t('honorTitle') : t('honorWaiting')}</h2>
      {ballot && !skipped ? (
        <>
          <div class="rlc-honor-cards">
            {allies.map((p) => (
              <HonorCard key={p.puuid} player={p} name={lcu.name} disabled={honor.pending} onHonor={() => honor.run(p.puuid)} />
            ))}
          </div>
          <button type="button" class="rlc-button" onClick={() => setSkipped(true)}>
            {t('skip')}
          </button>
        </>
      ) : null}
    </section>
  );
}

function HonorCard({ player, name, disabled, onHonor }: { player: LolHonorV2EligiblePlayer; name: Lcu['name']; disabled: boolean; onHonor: () => void }) {
  const [found, setFound] = useState<string | null>(null);
  useEffect(() => {
    if (player.summonerName || !player.puuid) return;
    let live = true;
    void name(player.puuid).then((n) => live && setFound(n));
    return () => void (live = false);
  }, [player.puuid, player.summonerName, name]);
  return (
    <button type="button" class="rlc-honor-card" disabled={disabled} style={player.skinSplashPath ? { backgroundImage: `url("${player.skinSplashPath}")` } : undefined} onClick={onHonor}>
      <strong>{player.summonerName || found || ''}</strong>
      <span>{player.championName}</span>
    </button>
  );
}
