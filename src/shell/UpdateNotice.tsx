import { useState } from 'preact/hooks';
import { t } from '../i18n';
import { update } from './update';

/**
 * Aviso de versão nova do tema (já baixada e verificada pelo carregador): fica na tela até a pessoa abrir as opções,
 * onde está o Recarregar, ou dispensar esta versão. O toast de quando ela chega some sozinho; este não.
 */
export function UpdateNotice({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const ready = update.value;
  if (!ready || dismissed === ready.version) return null;
  return (
    <div class="rlc-update-notice" role="status">
      <span class="rlc-update-notice-text">
        <b>{`${t('updNoticeTitle')} ${ready.version}`}</b>
        <span>{t('updNoticeText')}</span>
      </span>
      <button type="button" class="rlc-button" data-variant="primary" onClick={onOpen}>
        {t('updNoticeOpen')}
      </button>
      <button type="button" class="rlc-update-notice-close" aria-label={t('close')} title={t('close')} onClick={() => setDismissed(ready.version)}>
        ✕
      </button>
    </div>
  );
}
