import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { request } from '../../lcu/request';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { POSITIONS, positionKey, type Position } from './format';

/** Escolha de duas posições. Preencher como primeira dispensa a segunda, como no client da Riot. */
export function Positions({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState<Position[]>([]);
  useEscape(onClose);
  const done = picked[0] === 'FILL' || picked.length === 2;
  // Atualização funcional: dois cliques antes do próximo desenho não podem se sobrescrever.
  const pick = (p: Position) =>
    setPicked((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      return prev[0] === 'FILL' || prev.length === 2 ? prev : [...prev, p];
    });
  const save = useAction(async () => {
    await request('PUT', '/lol-lobby/v2/lobby/members/localMember/position-preferences', {
      firstPreference: picked[0],
      secondPreference: picked[0] === 'FILL' ? 'UNSELECTED' : picked[1],
    });
    onClose();
  });
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('positions')}>
      <div class="rlc-dialog">
        <p>{t('positions')}</p>
        <div class="rlc-chip-row">
          {POSITIONS.map((p) => {
            const order = picked.indexOf(p);
            return (
              <button type="button" key={p} class="rlc-queue-chip" aria-pressed={order >= 0} disabled={order < 0 && done} onClick={() => pick(p)}>
                {order >= 0 ? `${order + 1}. ` : null}
                {t(positionKey(p)!)}
              </button>
            );
          })}
        </div>
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="primary" disabled={!done || save.pending} onClick={() => save.run()}>
            {t('confirm')}
          </button>
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
