import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { StoreState } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolMatchmakingMatchmakingReadyCheckResource } from '../../lcu/types';
import { ModeEmblem } from '../../screens/modes/Emblems';
import type { ModeGroupId } from '../../screens/modes/queues';
import { useAction } from '../../ui/useAction';
import { prefs, type ReadyStyle } from '../prefs';

/** Duração do aceite de partida. A LCU informa só os segundos decorridos (`timer`). */
export const READY_CHECK_SECONDS = 10;

/** Estilos do aviso de partida encontrada, na ordem do seletor da aparência. */
export const READY_STYLES: readonly ReadyStyle[] = ['iris', 'curtain', 'wave', 'band', 'card', 'cinema'];

/**
 * O aceite aparece enquanto está em andamento, exceto quando o client o resolve sozinho (`suppressUx`, como na
 * Ferramenta de Treino). Não depende da fase: a fila normal nem passa por Matchmaking, e um aceite perdido custa penalidade.
 */
export function showReadyCheck(rc: StoreState<LolMatchmakingMatchmakingReadyCheckResource>): boolean {
  return rc.data?.state === 'InProgress' && rc.data.suppressUx !== true;
}

/** Comprimento do anel do tempo (raio 46 no viewBox 100): o traço que falta é o tempo que já passou. */
const RING = 2 * Math.PI * 46;

/** Peças decorativas de cada estilo (o resto é CSS em readycheck.css). */
function Fx({ style }: { style: ReadyStyle }) {
  if (style === 'curtain') return (
    <>
      <span class="rlc-rcheck-plate" data-side="top" />
      <span class="rlc-rcheck-plate" data-side="bottom" />
    </>
  );
  if (style === 'wave') return (
    <span class="rlc-rcheck-fx">
      <i class="rlc-rcheck-wave" />
      <i class="rlc-rcheck-wave" />
      <i class="rlc-rcheck-wave" />
    </span>
  );
  if (style === 'band') return (
    <>
      <span class="rlc-rcheck-fx" />
      <span class="rlc-rcheck-band" />
    </>
  );
  if (style === 'cinema') return (
    <>
      <span class="rlc-rcheck-fx" />
      <span class="rlc-rcheck-letterbox" data-side="top" />
      <span class="rlc-rcheck-letterbox" data-side="bottom" />
    </>
  );
  return <span class="rlc-rcheck-fx" />;
}

/**
 * Partida encontrada, no estilo escolhido na aparência (`readyCheckStyle`): íris (padrão), cortina de vidro, onda,
 * faixa, cartão ou cinema. A animação de entrada é desligável (`readyCheckAnim`) e some com movimento desligado; o
 * estilo continua. `onRespond` troca a LCU por outra ação (a prévia das configurações não aceita partida nenhuma).
 */
export function ReadyCheckOverlay({ rc, mode = 'sr', queueName, onRespond }: { rc: LolMatchmakingMatchmakingReadyCheckResource; mode?: ModeGroupId | 'custom'; queueName?: string; onRespond?: (accept: boolean) => void }) {
  const accept = useAction(() => (onRespond ? Promise.resolve(onRespond(true)) : request('POST', '/lol-matchmaking/v1/ready-check/accept')));
  const decline = useAction(() => (onRespond ? Promise.resolve(onRespond(false)) : request('POST', '/lol-matchmaking/v1/ready-check/decline')));
  const remaining = Math.max(0, Math.ceil(READY_CHECK_SECONDS - rc.timer));
  const left = Math.max(0, Math.min(1, (READY_CHECK_SECONDS - rc.timer) / READY_CHECK_SECONDS));
  const busy = accept.pending || decline.pending;
  const animate = prefs.value.readyCheckAnim && prefs.value.motion !== 'off';
  const style = prefs.value.readyCheckStyle;
  return (
    <div class="rlc-veil rlc-readycheck" role="alertdialog" aria-modal="true" aria-label={t('matchFound')} data-style={style} data-anim={animate ? 'true' : undefined} data-response={rc.playerResponse} style={{ '--rlc-rc-left': String(left) }}>
      <Fx style={style} />
      <div class="rlc-rcheck-body">
        <span class="rlc-rcheck-emblem" aria-hidden="true">
          {style === 'wave' ? (
            <svg class="rlc-rcheck-ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" />
              <circle cx="50" cy="50" r="46" data-part="left" stroke-dasharray={RING} stroke-dashoffset={RING * (1 - left)} />
            </svg>
          ) : null}
          <ModeEmblem id={mode} />
        </span>
        <div class="rlc-rcheck-text">
          <h2>{t('matchFound')}</h2>
          {queueName ? <p class="rlc-rcheck-queue">{queueName}</p> : null}
        </div>
        <div class="rlc-rcheck-time">
          <span class="rlc-rcheck-bar" aria-hidden="true">
            <i style={{ width: `${left * 100}%` }} />
          </span>
          <span class="rlc-ring-count">{remaining}</span>
        </div>
        {rc.playerResponse === 'None' ? (
          <div class="rlc-readycheck-actions">
            <button type="button" class="rlc-button" data-variant="primary" disabled={busy} onClick={() => accept.run()}>
              {t('accept')}
              {style === 'iris' ? (
                <span class="rlc-rcheck-in" aria-hidden="true">
                  {remaining}
                </span>
              ) : null}
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

/** Prévia do aviso aberta pela aparência. Só a camada mostra: nada vai para a LCU. */
export const readyCheckPreview = signal(false);

/** Prévia: conta os 10 segundos e fecha um pouco depois do fim ou de responder. */
export function ReadyCheckPreview({ mode = 'sr', queueName }: { mode?: ModeGroupId | 'custom'; queueName?: string }) {
  const [timer, setTimer] = useState(0);
  const [response, setResponse] = useState<'None' | 'Accepted' | 'Declined'>('None');
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setTimer((Date.now() - start) / 1000), 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (timer < READY_CHECK_SECONDS + 1 && response === 'None') return;
    const id = setTimeout(() => (readyCheckPreview.value = false), 1500);
    return () => clearTimeout(id);
  }, [timer >= READY_CHECK_SECONDS + 1, response]);
  const rc = { state: 'InProgress', playerResponse: response, timer, declinerIds: [], suppressUx: false, dodgeWarning: 'None' } as LolMatchmakingMatchmakingReadyCheckResource;
  return <ReadyCheckOverlay rc={rc} mode={mode} queueName={queueName} onRespond={(ok) => setResponse(ok ? 'Accepted' : 'Declined')} />;
}
