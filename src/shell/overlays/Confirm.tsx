import { useEffect, useRef } from 'preact/hooks';
import { t } from '../../i18n';
import { useEscape } from '../../ui/useEscape';

/** Diálogo de confirmação sobre a camada. Foco começa em cancelar; Escape cancela. */
export function Confirm({ message, confirmLabel, onConfirm, onCancel }: { message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEscape(onCancel);
  useEffect(() => cancel.current?.focus(), []);
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true">
      <div class="rlc-dialog">
        <p>{message}</p>
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" class="rlc-button" ref={cancel} onClick={onCancel}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
