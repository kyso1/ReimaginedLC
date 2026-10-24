import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolHonorV2EligiblePlayer } from '../../lcu/types';
import { Loader } from '../../ui/Loader';
import { useAction } from '../../ui/useAction';

/** Conclui uma etapa do fim de jogo: é o que a interface da Riot faria, mas ela fica escondida pela camada. */
export const completeStep = (name: string) => fetch(`/lol-pre-end-of-game/v1/complete/${encodeURIComponent(name)}`, { method: 'POST' }).catch(() => undefined);

/** Etapa parada por mais que isso, sem tela nossa para ela, é concluída. */
export const STUCK_MS = 3000;
/** Sem cédula depois disso, não há votação (a LCU não a publica em toda partida). */
export const NO_BALLOT_MS = 2000;

/** Depois do último voto, o tempo de ver o cartão marcado antes de seguir. */
export const AFTER_VOTE_MS = 800;

/** Fecha a votação como o client da Riot: envia a cédula e conclui a etapa. */
const submit = () => request('POST', '/lol-honor/v1/ballot').catch(() => undefined).then(() => completeStep('honor-vote'));

/**
 * Votação de honra: aliados e inimigos elegíveis, até acabarem os votos da cédula. A fase PreEndOfGame só avança quando
 * cada etapa registrada pela Riot é concluída, e a tela da Riot está escondida; então nós concluímos: depois do último
 * voto, ao pular/concluir, quando não há ninguém para honrar (TFT, por exemplo) e em qualquer outra etapa que fique parada.
 */
export function Honor({ lcu }: { lcu: Lcu }) {
  const ballot = lcu.honorBallot.value.data;
  const [done, setDone] = useState(false);
  const [voted, setVoted] = useState<string[]>([]);
  const allies = ballot?.eligibleAllies ?? [];
  const opponents = ballot?.eligibleOpponents ?? [];
  const given = [...new Set([...(ballot?.honoredPlayers ?? []).map((h) => h.recipientPuuid), ...voted])];
  const left = Math.max(0, (ballot?.votePool?.votes ?? 1) - given.length);
  // Mesmo pedido do client da Riot (rcp-fe-lol-postgame): um voto por jogador, aliado ou inimigo.
  const honor = useAction(async (p: LolHonorV2EligiblePlayer) => {
    await request('POST', '/lol-honor/v1/honor', { recipientPuuid: p.puuid, honorType: 'HEART' });
    setVoted((v) => [...v, p.puuid]);
  });
  // Acabaram os votos: fecha a cédula sozinho.
  useEffect(() => {
    if (!ballot || done || !given.length || left > 0) return;
    const id = setTimeout(() => {
      setDone(true);
      void submit();
    }, AFTER_VOTE_MS);
    return () => clearTimeout(id);
  }, [!!ballot, done, given.length, left]);
  // TFT não tem honra: a etapa é concluída na hora, sem esperar a cédula (que às vezes nem chega).
  const tft = lcu.gameflowSession.value.data?.map?.gameMode === 'TFT';
  const [noBallot, setNoBallot] = useState(false);
  useEffect(() => {
    if (ballot) return;
    const id = setTimeout(() => setNoBallot(true), NO_BALLOT_MS);
    return () => clearTimeout(id);
  }, [!!ballot]);
  const nobody = tft || (ballot ? !allies.length && !opponents.length : noBallot);
  useEffect(() => {
    if (nobody) void completeStep('honor-vote');
  }, [nobody]);
  useStuckSteps(nobody || done);
  const row = (title: TextKey, players: LolHonorV2EligiblePlayer[], side: 'ally' | 'enemy') =>
    players.length ? (
      <div class="rlc-honor-team" data-side={side}>
        <h3>{t(title)}</h3>
        <div class="rlc-honor-cards">
          {players.map((p) => (
            <HonorCard key={p.puuid} player={p} name={lcu.name} voted={given.includes(p.puuid)} disabled={honor.pending || (!given.includes(p.puuid) && left === 0)} onHonor={() => honor.run(p)} />
          ))}
        </div>
      </div>
    ) : null;
  if (!ballot || done || nobody) return <section class="rlc-honor"><Loader label={t('honorWaiting')} /></section>;
  return (
    <section class="rlc-honor">
      <h2>{t('honorTitle')}</h2>
      <p class="rlc-honor-votes">{t('honorVotesLeft').replace('{n}', String(left))}</p>
      {row('honorAllies', allies, 'ally')}
      {row('honorEnemies', opponents, 'enemy')}
      <button
        type="button"
        class="rlc-button"
        onClick={() => {
          setDone(true);
          void submit();
        }}
      >
        {t(given.length ? 'honorDone' : 'skip')}
      </button>
    </section>
  );
}

function HonorCard({ player, name, voted, disabled, onHonor }: { player: LolHonorV2EligiblePlayer; name: Lcu['name']; voted: boolean; disabled: boolean; onHonor: () => void }) {
  const [found, setFound] = useState<string | null>(null);
  useEffect(() => {
    if (player.summonerName || !player.puuid) return;
    let live = true;
    void name(player.puuid).then((n) => live && setFound(n));
    return () => void (live = false);
  }, [player.puuid, player.summonerName, name]);
  return (
    <button type="button" class="rlc-honor-card" data-voted={voted ? 'true' : undefined} disabled={disabled || voted} style={player.skinSplashPath ? { backgroundImage: `url("${player.skinSplashPath}")` } : undefined} onClick={onHonor}>
      <strong>{player.summonerName || found || ''}</strong>
      <span>{player.championName}</span>
    </button>
  );
}

/**
 * Vigia a etapa atual do fim de jogo: a que não for a de honra (ou a de honra, quando já não há voto a dar) e ficar
 * parada por STUCK_MS é concluída.
 */
export function useStuckSteps(honorDone: boolean) {
  useEffect(() => {
    let last = '';
    let since = Date.now();
    const tick = async () => {
      const r = await fetch('/lol-pre-end-of-game/v1/currentSequenceEvent').catch(() => null);
      const body = r?.ok ? ((await r.json().catch(() => null)) as { name?: string } | null) : null;
      const name = body?.name ?? '';
      if (name !== last) {
        last = name;
        since = Date.now();
        return;
      }
      if (name && (name !== 'honor-vote' || honorDone) && Date.now() - since >= STUCK_MS) {
        since = Date.now();
        await completeStep(name);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 1000);
    return () => clearInterval(id);
  }, [honorDone]);
}
