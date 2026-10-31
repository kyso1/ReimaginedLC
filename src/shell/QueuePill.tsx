import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { formatClock, useClock } from '../screens/lobby/format';
import { useAction } from '../ui/useAction';
import { prefs } from './prefs';
import { queueLabel } from '../screens/modes/queues';

const BAR = '#rlc-root .rlc-lobby .rlc-bar';
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const MS = 420;

const still = () => prefs.value.motion === 'off' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** Retângulo de `r` relativo ao pai posicionado do elemento animado. */
const box = (r: DOMRect, o: DOMRect | undefined, radius: string): Keyframe => ({
  left: `${r.left - (o?.left ?? 0)}px`,
  top: `${r.top - (o?.top ?? 0)}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
  right: 'auto',
  bottom: 'auto',
  borderRadius: radius,
});

/**
 * Pílula de fila no canto inferior direito, em qualquer tela fora do lobby. Ao voltar ao lobby
 * ela estica até a barra de busca e some; ao sair, a barra encolhe de volta nela.
 */
export function QueuePill({ lcu, onLobby, onOpen }: { lcu: Lcu; onLobby: boolean; onOpen: () => void }) {
  const search = lcu.search.value.data;
  // Só com a busca correndo (fase Lobby/Matchmaking): no aceite, na seleção e na partida a busca pode seguir marcada por um instante.
  const phase = lcu.gameflowPhase.value.data;
  const searching = search?.isCurrentlyInQueue === true && (phase === 'Matchmaking' || phase === 'Lobby');
  const clock = useClock(search?.timeInQueue ?? 0, searching);
  const cancel = useAction(() => request('DELETE', '/lol-lobby/v2/lobby/matchmaking/search'));
  const ref = useRef<HTMLDivElement>(null);
  const was = useRef(onLobby);
  const barRect = useRef<{ rect: DOMRect; radius: string } | null>(null);
  const [stretching, setStretching] = useState(false);
  const [, bump] = useState(0);
  // Entrando no lobby agora: a pílula fica montada um quadro para esticar.
  const entering = searching && onLobby && !was.current;

  useLayoutEffect(() => {
    const prev = was.current;
    was.current = onLobby;
    const bar = onLobby ? document.querySelector<HTMLElement>(BAR) : null;
    if (bar) barRect.current = { rect: bar.getBoundingClientRect(), radius: getComputedStyle(bar).borderRadius };
    const el = ref.current;
    if (!searching || prev === onLobby || !el) return;
    const target = barRect.current;
    const canAnimate = typeof el.animate === 'function' && target && target.rect.width > 0 && !still();
    if (onLobby) {
      if (!canAnimate) return void bump((n) => n + 1);
      setStretching(true);
      const pill = box(el.getBoundingClientRect(), el.offsetParent?.getBoundingClientRect(), `${el.offsetHeight / 2}px`);
      el.querySelector<HTMLElement>('.rlc-qpill-body')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MS * 0.35, fill: 'forwards' });
      const wrap = bar?.parentElement;
      // A barra fica sob a pílula e aparece quando ela termina; a entrada própria do lobby não roda.
      if (wrap) wrap.style.animation = 'none';
      bar?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: MS, easing: 'linear' });
      el.animate([pill, box(target!.rect, el.offsetParent?.getBoundingClientRect(), target!.radius)], { duration: MS, easing: EASE, fill: 'forwards' }).onfinish = () => setStretching(false);
    } else if (canAnimate) {
      const end = box(el.getBoundingClientRect(), el.offsetParent?.getBoundingClientRect(), `${el.offsetHeight / 2}px`);
      el.animate([box(target!.rect, el.offsetParent?.getBoundingClientRect(), target!.radius), end], { duration: MS, easing: EASE });
      el.querySelector<HTMLElement>('.rlc-qpill-body')?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: MS });
    }
  });

  if (!searching || (onLobby && !entering && !stretching)) return null;
  const queueId = search?.queueId ?? lcu.lobby.value.data?.gameConfig.queueId;
  const queueName = queueLabel(lcu.queues.value.data?.find((q) => q.id === queueId));
  const leader = lcu.lobby.value.data?.localMember.isLeader !== false;
  return (
    <div ref={ref} class="rlc-qpill" data-stretch={onLobby ? 'true' : undefined}>
      <div class="rlc-qpill-body">
        <button type="button" class="rlc-qpill-open" title={t('queuePillBack')} aria-label={`${t('queuePillBack')}: ${queueName}`} onClick={onOpen}>
          <span class="rlc-qpill-clock">{formatClock(clock)}</span>
          <span class="rlc-qpill-text">
            <span class="rlc-qpill-queue">{queueName}</span>
            <small>
              {formatClock(search?.estimatedQueueTime ?? 0)} {t('estimated')}
            </small>
          </span>
        </button>
        {leader ? (
          <button type="button" class="rlc-qpill-cancel" aria-label={t('queuePillCancel')} title={t('queuePillCancel')} disabled={cancel.pending} onClick={() => cancel.run()}>
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
