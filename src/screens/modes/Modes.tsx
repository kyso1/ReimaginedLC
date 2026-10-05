import { useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolGameQueuesQueue } from '../../lcu/types';
import { writeSetting } from '../../shell/storage';
import { Button } from '../../ui/Button';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { customLobbyBody, groupQueues, type ModeGroupId } from './queues';

export const LAST_QUEUE_KEY = 'rlc.lastQueue';

const LABEL: Record<ModeGroupId, TextKey> = { sr: 'modeSr', aram: 'modeAram', tft: 'modeTft', other: 'modeOther' };

/** Tela de modos: cartões por grupo, filas do grupo escolhido embaixo. Confirmar cria ou troca o lobby. */
export function Modes({ queues, current, onClose, onCustom }: { queues: LolGameQueuesQueue[]; current: number | null; onClose: () => void; onCustom: () => void }) {
  const groups = groupQueues(queues);
  const initialGroup = groups.find((g) => g.queues.some((q) => q.id === current))?.id ?? groups[0]?.id ?? null;
  const [group, setGroup] = useState<ModeGroupId | null>(initialGroup);
  const [selected, setSelected] = useState<number | null>(current);
  useEscape(onClose);

  const confirm = useAction(async (queueId: number) => {
    const q = queues.find((x) => x.id === queueId);
    // Fila personalizada (Ferramenta de Treino) recusa `{ queueId }` sozinho: precisa do corpo de sala.
    const body = q?.isCustom ? customLobbyBody(q, { name: q.name, password: '', teamSize: 5, spectators: 'NotAllowed' }) : { queueId };
    await request('POST', '/lol-lobby/v2/lobby', body);
    writeSetting(LAST_QUEUE_KEY, queueId);
    onClose();
  });
  const visibleQueues = groups.find((g) => g.id === group)?.queues ?? [];
  const canConfirm = selected !== null && queues.some((q) => q.id === selected);

  return (
    <div class="rlc-veil rlc-modes" role="dialog" aria-modal="true" aria-label={t('chooseMode')}>
      <h2>{t('chooseMode')}</h2>
      <div class="rlc-mode-cards">
        {groups.map((g) => (
          <button type="button" key={g.id} class="rlc-mode-card" data-group={g.id} aria-pressed={g.id === group} onClick={() => setGroup(g.id)}>
            {t(LABEL[g.id])}
          </button>
        ))}
        <button type="button" class="rlc-mode-card" data-group="custom" aria-pressed={false} onClick={onCustom}>
          {t('modeCustom')}
        </button>
      </div>
      {groups.length === 0 ? <p class="rlc-muted">{t('loadingQueues')}</p> : null}
      <div class="rlc-queue-chips">
        {visibleQueues.map((q) => (
          <button type="button" key={q.id} class="rlc-queue-chip" aria-pressed={q.id === selected} onClick={() => setSelected(q.id)}>
            {q.name}
          </button>
        ))}
      </div>
      <div class="rlc-modes-actions">
        <Button onClick={onClose}>{t('back')}</Button>
        <button type="button" class="rlc-button" data-variant="primary" disabled={!canConfirm || confirm.pending} onClick={() => confirm.run(selected!)}>
          {t('confirm')}
        </button>
      </div>
    </div>
  );
}
