import { t } from '../../i18n';
import type { StoreState } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolMatchmakingMatchmakingReadyCheckResource } from '../../lcu/types';
import { useAction } from '../../ui/useAction';

/** Duração do aceite de partida. A LCU informa só os segundos decorridos (`timer`). */
export const READY_CHECK_SECONDS = 10;

/** O aceite aparece em ReadyCheck em andamento, exceto quando o client o resolve sozinho (`suppressUx`, como na Ferramenta de Treino). */
export function showReadyCheck(phase: StoreState<string>, rc: StoreState<LolMatchmakingMatchmakingReadyCheckResource>): boolean {
  return phase.data === 'ReadyCheck' && rc.data?.state === 'InProgress' && rc.data.suppressUx !== true;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ReadyCheckOverlay({ rc }: { rc: LolMatchmakingMatchmakingReadyCheckResource }) {
  const accept = useAction(() => request('POST', '/lol-matchmaking/v1/ready-check/accept'));
  const decline = useAction(() => request('POST', '/lol-matchmaking/v1/ready-check/decline'));
  const remaining = Math.max(0, Math.ceil(READY_CHECK_SECONDS - rc.timer));
  const busy = accept.pending || decline.pending;
  return (
    <div class="rlc-veil rlc-readycheck" role="alertdialog" aria-modal="true" aria-label={t('matchFound')}>
      <h2>{t('matchFound')}</h2>
      <div class="rlc-ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="rlc-ring-track" cx="60" cy="60" r={RADIUS} />
          <circle class="rlc-ring-bar" cx="60" cy="60" r={RADIUS} stroke-dasharray={CIRCUMFERENCE} stroke-dashoffset={CIRCUMFERENCE * (1 - remaining / READY_CHECK_SECONDS)} />
        </svg>
        <span class="rlc-ring-count">{remaining}</span>
      </div>
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
  );
}
