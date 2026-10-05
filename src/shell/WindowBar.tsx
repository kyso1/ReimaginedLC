import { t } from '../i18n';
import { request } from '../lcu/request';
import { useAction } from '../ui/useAction';

/** Faixa de arraste da janela, com minimizar e fechar. Substitui a barra da Riot, que fica escondida. */
export function WindowBar({ onClose }: { onClose: () => void }) {
  const minimize = useAction(() => request('POST', '/riotclient/ux-minimize'));
  return (
    <header class="rlc-windowbar">
      <button type="button" class="rlc-winbtn" aria-label={t('minimize')} title={t('minimize')} disabled={minimize.pending} onClick={() => minimize.run()}>
        —
      </button>
      <button type="button" class="rlc-winbtn" data-kind="close" aria-label={t('close')} title={t('close')} onClick={onClose}>
        ✕
      </button>
    </header>
  );
}
