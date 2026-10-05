import { useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolEndOfGameEndOfGamePlayer } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { formatClock } from '../lobby/format';

type Stats = Record<string, number | undefined>;
const stat = (p: LolEndOfGameEndOfGamePlayer | undefined, key: string) => Number((p?.stats as Stats | undefined)?.[key] ?? 0);
const kda = (p: LolEndOfGameEndOfGamePlayer) => `${stat(p, 'CHAMPIONS_KILLED')}/${stat(p, 'NUM_DEATHS')}/${stat(p, 'ASSISTS')}`;
const farm = (p: LolEndOfGameEndOfGamePlayer) => stat(p, 'MINIONS_KILLED') + stat(p, 'NEUTRAL_MINIONS_KILLED');
const nameOf = (p: LolEndOfGameEndOfGamePlayer) => p.riotIdGameName || p.summonerName || '—';

/** Pós-jogo "destaque seu": sua partida sobre a splash do seu campeão; placar completo numa gaveta. */
export function PostGame({ lcu }: { lcu: Lcu }) {
  const eog = lcu.endOfGame.value.data;
  const [board, setBoard] = useState(false);
  const again = useAction(() => request('POST', '/lol-lobby/v2/play-again'));
  // As duas independentes: dismiss-stats falha quando não há resultados (404), e a recusa precisa sair mesmo assim.
  const leave = useAction(() => Promise.allSettled([request('POST', '/lol-end-of-game/v1/state/dismiss-stats'), request('POST', '/lol-lobby/v2/play-again-decline')]));
  const num = new Intl.NumberFormat(locale());
  const me = eog?.localPlayer;
  const myTeam = eog?.teams?.find((tm) => tm.isPlayerTeam);
  const everyone = eog?.teams?.flatMap((tm) => tm.players ?? []) ?? [];
  const topDamage = Math.max(1, ...everyone.map((p) => stat(p, 'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS')));
  const myDamage = stat(me, 'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS');
  const result = !myTeam ? '—' : myTeam.isWinningTeam ? t('victory') : t('defeat');

  return (
    <section class="rlc-postgame">
      <div class="rlc-pg-bg" style={me?.skinSplashPath ? { backgroundImage: `url("${me.skinSplashPath}")` } : undefined} />
      <div class="rlc-pg-main">
        <h1 class="rlc-pg-result">{result}</h1>
        {typeof eog?.gameLength === 'number' ? <p class="rlc-muted">{formatClock(eog.gameLength)}</p> : null}
        {me ? (
          <>
            <div class="rlc-pg-stats">
              <div>
                <b>{kda(me)}</b>
                {t('kda')}
              </div>
              <div>
                <b>{num.format(farm(me))}</b>
                {t('farm')}
              </div>
              <div>
                <b>{num.format(myDamage)}</b>
                {t('damage')}
              </div>
              <div>
                <b>{num.format(stat(me, 'GOLD_EARNED'))}</b>
                {t('gold')}
              </div>
            </div>
            <div class="rlc-pg-bar" title={t('damage')}>
              <b style={{ width: `${Math.round((myDamage / topDamage) * 1000) / 10}%` }} />
            </div>
          </>
        ) : null}
        {eog ? (
          <button type="button" class="rlc-button" data-variant="pill" aria-expanded={board} onClick={() => setBoard(!board)}>
            {t('fullScoreboard')}
          </button>
        ) : null}
      </div>
      {board && eog ? (
        <div class="rlc-pg-board">
          {(eog.teams ?? []).map((tm, i) => (
            <table key={i}>
              <tbody>
                {(tm.players ?? []).map((p) => (
                  <tr key={p.puuid || nameOf(p)} data-me={p.puuid === me?.puuid ? 'true' : undefined}>
                    <td>{nameOf(p)}</td>
                    <td>{kda(p)}</td>
                    <td>{num.format(farm(p))}</td>
                    <td>{num.format(stat(p, 'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS'))}</td>
                    <td>{num.format(stat(p, 'GOLD_EARNED'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      ) : null}
      <div class="rlc-pg-actions">
        <button type="button" class="rlc-button" data-variant="pill" disabled={leave.pending} onClick={() => leave.run()}>
          {t('leave')}
        </button>
        <button type="button" class="rlc-button" data-variant="primary" disabled={again.pending} onClick={() => again.run()}>
          {t('playAgain')}
        </button>
      </div>
    </section>
  );
}
