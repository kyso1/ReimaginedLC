import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolGameQueuesQueue } from '../../lcu/types';
import { prefs } from '../../shell/prefs';
import { writeSetting } from '../../shell/storage';
import { Button } from '../../ui/Button';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { ModeEmblem, TEAM_SIZE } from './Emblems';
import { Loader } from '../../ui/Loader';
import { customLobbyBody, groupQueues, queueLabel, type ModeGroupId } from './queues';

export const LAST_QUEUE_KEY = 'rlc.lastQueue';

const LABEL: Record<ModeGroupId, TextKey> = { sr: 'modeSr', aram: 'modeAram', tft: 'modeTft', other: 'modeOther' };

/** Categoria da fila como as abas do client (JxJ, Cooperativo vs. IA, Treino). Sem categoria conhecida, conta como JxJ. */
type Category = 'pvp' | 'ai' | 'training';
const CATEGORY: Record<string, Category> = { kPvP: 'pvp', kVersusAI: 'ai', kTraining: 'training' };
const CATEGORY_LABEL: Record<Category, TextKey> = { pvp: 'catPvp', ai: 'catAi', training: 'catTraining' };
const categoryOf = (q: LolGameQueuesQueue): Category => CATEGORY[q.gameSelectCategory] ?? 'pvp';

/** Gaveta desce antes de fechar. Sem Web Animations (testes) ou com movimento desligado, fecha na hora. */
export function useDrawerClose(sheet: { current: HTMLElement | null }, onClose: () => void): () => void {
  const closing = useRef(false);
  return () => {
    if (closing.current) return;
    const el = sheet.current;
    const still = prefs.value.motion === 'off' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || typeof el.animate !== 'function' || still) return onClose();
    closing.current = true;
    const anim = el.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(100%)', opacity: 0.4 }], { duration: 280, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    anim.onfinish = onClose;
  };
}

/**
 * Tela de modos: gaveta de vidro que sobe sobre a tela. Cartões por grupo; as filas do grupo escolhido embaixo,
 * separadas como no client (JxJ, Cooperativo vs. IA, Treino); o resumo mostra o que Confirmar vai criar.
 */
export function Modes({ queues, current, onClose, onCustom }: { queues: LolGameQueuesQueue[]; current: number | null; onClose: () => void; onCustom: () => void }) {
  const groups = groupQueues(queues);
  const initialGroup = groups.find((g) => g.queues.some((q) => q.id === current))?.id ?? groups[0]?.id ?? null;
  const [group, setGroup] = useState<ModeGroupId | null>(initialGroup);
  const [selected, setSelected] = useState<number | null>(current);
  const sheet = useRef<HTMLDivElement>(null);
  // Realce de vidro que desliza até o cartão escolhido; o emblema escolhido se redesenha a cada troca (`picks`).
  const cards = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState<{ left: number; width: number } | null>(null);
  const [picks, setPicks] = useState(0);
  useLayoutEffect(() => {
    const el = cards.current?.querySelector<HTMLElement>('.rlc-mode-card[aria-pressed="true"]');
    setHl(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [group, queues.length]);
  const close = useDrawerClose(sheet, onClose);
  useEscape(close);

  const confirm = useAction(async (queueId: number) => {
    const q = queues.find((x) => x.id === queueId);
    // Fila personalizada (Ferramenta de Treino) recusa `{ queueId }` sozinho: precisa do corpo de sala.
    const body = q?.isCustom ? customLobbyBody(q, { name: q.name, password: '', teamSize: 5, spectators: 'NotAllowed' }) : { queueId };
    await request('POST', '/lol-lobby/v2/lobby', body);
    writeSetting(LAST_QUEUE_KEY, queueId);
    onClose();
  });
  const visibleQueues = groups.find((g) => g.id === group)?.queues ?? [];
  const chosen = queues.find((q) => q.id === selected) ?? null;
  // Trocar de modo já escolhe a fila principal dele; a escolhida antes sumiria da vista e confundiria o Confirmar.
  const pickGroup = (id: ModeGroupId) => {
    setGroup(id);
    setPicks((n) => n + 1);
    const list = groups.find((g) => g.id === id)?.queues ?? [];
    const first = list.find((q) => categoryOf(q) === 'pvp') ?? list[0];
    if (!list.some((q) => q.id === selected)) setSelected(first?.id ?? null);
  };
  const chosenGroup = chosen ? groups.find((g) => g.queues.includes(chosen)) : undefined;
  const summary = chosen ? (chosenGroup ? `${t(LABEL[chosenGroup.id])} · ${queueLabel(chosen)}` : queueLabel(chosen)) : t('pickQueue');
  const categories = (['pvp', 'ai', 'training'] as Category[]).map((c) => [c, visibleQueues.filter((q) => categoryOf(q) === c)] as const).filter(([, list]) => list.length);

  return (
    <div class="rlc-veil rlc-modes" role="dialog" aria-modal="true" aria-label={t('chooseMode')} ref={sheet}>
      <h2>{t('chooseMode')}</h2>
      <div class="rlc-mode-cards" ref={cards}>
        {hl ? <span class="rlc-mode-hl" aria-hidden="true" style={{ left: `${hl.left}px`, width: `${hl.width}px` }} /> : null}
        {groups.map((g) => (
          <button type="button" key={g.id} class="rlc-mode-card" data-group={g.id} aria-pressed={g.id === group} onClick={() => pickGroup(g.id)}>
            <ModeEmblem key={g.id === group ? `on-${picks}` : g.id} id={g.id} />
            {TEAM_SIZE[g.id] ? <small class="rlc-mode-size">{TEAM_SIZE[g.id]}</small> : null}
            <span class="rlc-mode-name">{t(LABEL[g.id])}</span>
          </button>
        ))}
        <button type="button" class="rlc-mode-card" data-group="custom" aria-pressed={false} onClick={onCustom}>
          <ModeEmblem id="custom" />
          <span class="rlc-mode-name">{t('modeCustom')}</span>
        </button>
      </div>
      {groups.length === 0 ? <Loader small label={t('loadingQueues')} /> : null}
      <div class="rlc-queue-groups">
        {categories.map(([c, list]) => (
          <div key={c} class="rlc-queue-group">
            {categories.length > 1 ? <span class="rlc-queue-cat">{t(CATEGORY_LABEL[c])}</span> : null}
            <div class="rlc-queue-chips">
              {list.map((q) => (
                <button type="button" key={q.id} class="rlc-queue-chip" aria-pressed={q.id === selected} onClick={() => setSelected(q.id)} onDblClick={() => confirm.run(q.id)}>
                  {queueLabel(q)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div class="rlc-modes-actions">
        <p class="rlc-modes-summary">{summary}</p>
        <Button onClick={close}>{t('back')}</Button>
        <button type="button" class="rlc-button" data-variant="primary" disabled={!chosen || confirm.pending} onClick={() => confirm.run(selected!)}>
          {t('confirm')}
        </button>
      </div>
    </div>
  );
}
