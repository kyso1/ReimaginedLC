import { t } from '../../i18n';
import type { StoreState } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolMatchmakingMatchmakingReadyCheckResource } from '../../lcu/types';
import { ModeEmblem } from '../../screens/modes/Emblems';
import type { ModeGroupId } from '../../screens/modes/queues';
import { useAction } from '../../ui/useAction';
import { prefs } from '../prefs';

/** Duração do aceite de partida. A LCU informa só os segundos decorridos (`timer`). */
export const READY_CHECK_SECONDS = 10;

/**
 * O aceite aparece enquanto está em andamento, exceto quando o client o resolve sozinho (`suppressUx`, como na
 * Ferramenta de Treino). Não depende da fase: a fila normal nem passa por Matchmaking, e um aceite perdido custa penalidade.
 */
export function showReadyCheck(rc: StoreState<LolMatchmakingMatchmakingReadyCheckResource>): boolean {
  return rc.data?.state === 'InProgress' && rc.data.suppressUx !== true;
}

/**
 * Partida encontrada como cortina de vidro: duas placas se fecham do alto e de baixo, o emblema do modo acende no
 * encontro e o tempo corre numa barra. Animação desligável (`readyCheckAnim`) e ausente com movimento desligado.
 */
export function ReadyCheckOverlay({ rc, mode = 'sr', queueName }: { rc: LolMatchmakingMatchmakingReadyCheckResource; mode?: ModeGroupId | 'custom'; queueName?: string }) {
  const accept = useAction(() => request('POST', '/lol-matchmaking/v1/ready-check/accept'));
  const decline = useAction(() => request('POST', '/lol-matchmaking/v1/ready-check/decline'));
  const remaining = Math.max(0, Math.ceil(READY_CHECK_SECONDS - rc.timer));
  const busy = accept.pending || decline.pending;
  const animate = prefs.value.readyCheckAnim && prefs.value.motion !== 'off';
  return (
    <div class="rlc-veil rlc-readycheck" role="alertdialog" aria-modal="true" aria-label={t('matchFound')} data-anim={animate ? 'true' : undefined} data-response={rc.playerResponse}>
      <span class="rlc-rcheck-plate" data-side="top" aria-hidden="true" />
      <span class="rlc-rcheck-plate" data-side="bottom" aria-hidden="true" />
      <div class="rlc-rcheck-body">
        <ModeEmblem id={mode} />
        <h2>{t('matchFound')}</h2>
        <div class="rlc-rcheck-time">
          <span class="rlc-rcheck-bar" aria-hidden="true">
            <i style={{ width: `${(remaining / READY_CHECK_SECONDS) * 100}%` }} />
          </span>
          <span class="rlc-ring-count">{remaining}</span>
        </div>
        {queueName ? <p class="rlc-rcheck-queue">{queueName}</p> : null}
        {rc.playerResponse === 'None' ? (
          <div class="rlc-readycheck-actions">
            <button type="button" class="rlc-button" data-variant="primary" disabled={busy} onClick={() => accept.run()}>
              {t('accept')}
            </button>
            <button type="button" class="rlc-button" disabled={busy} onClick={() => decline.run()}>
              {t('decline')}
            </button>
          </div>
        ) : (
          <p class="rlc-readycheck-state">{rc.playerResponse === 'Accepted' ? t('acceptedWaiting') : t('declined')}</p>
        )}
      </div>
    </div>
  );
}
