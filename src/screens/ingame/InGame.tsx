import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { Loader } from '../../ui/Loader';
import { useAction } from '../../ui/useAction';

const TEXT: Record<string, TextKey> = {
  GameStart: 'gameStarting',
  InProgress: 'gameInProgress',
  Reconnect: 'gameReconnect',
  WaitingForStats: 'gameWaitingStats',
};
/** Fases de espera: mostram a animação de carregando no lugar do título. */
const LOADING = new Set(['GameStart', 'WaitingForStats']);

/** Tela durante a partida: fase, mapa e fila; Reconectar quando o jogo caiu. */
export function InGame({ lcu }: { lcu: Lcu }) {
  const phase = lcu.gameflowPhase.value.data ?? '';
  const session = lcu.gameflowSession.value.data;
  const reconnect = useAction(() => request('POST', '/lol-gameflow/v1/reconnect'));
  const where = [session?.map?.name, session?.gameData?.queue?.description].filter(Boolean).join(' · ');
  return (
    <section class="rlc-ingame">
      {LOADING.has(phase) ? <Loader label={t(TEXT[phase]!)} /> : <h2>{t(TEXT[phase] ?? 'gameInProgress')}</h2>}
      {where ? <p class="rlc-muted">{where}</p> : null}
      {phase === 'Reconnect' ? (
        <button type="button" class="rlc-button" data-variant="primary" disabled={reconnect.pending} onClick={() => reconnect.run()}>
          {t('reconnect')}
        </button>
      ) : null}
    </section>
  );
}
