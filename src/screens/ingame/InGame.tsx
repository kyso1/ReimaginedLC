import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { useAction } from '../../ui/useAction';

const TEXT: Record<string, TextKey> = {
  GameStart: 'gameStarting',
  InProgress: 'gameInProgress',
  Reconnect: 'gameReconnect',
  WaitingForStats: 'gameWaitingStats',
};

/** Tela durante a partida: fase, mapa e fila; Reconectar quando o jogo caiu. */
export function InGame({ lcu }: { lcu: Lcu }) {
  const phase = lcu.gameflowPhase.value.data ?? '';
  const session = lcu.gameflowSession.value.data;
  const reconnect = useAction(() => request('POST', '/lol-gameflow/v1/reconnect'));
  const where = [session?.map?.name, session?.gameData?.queue?.description].filter(Boolean).join(' · ');
  return (
    <section class="rlc-ingame">
      <h2>{t(TEXT[phase] ?? 'gameInProgress')}</h2>
      {where ? <p class="rlc-muted">{where}</p> : null}
      {phase === 'Reconnect' ? (
        <button type="button" class="rlc-button" data-variant="primary" disabled={reconnect.pending} onClick={() => reconnect.run()}>
          {t('reconnect')}
        </button>
      ) : null}
    </section>
  );
}
