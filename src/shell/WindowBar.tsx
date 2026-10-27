import { t } from '../i18n';
import { request } from '../lcu/request';
import { useAction } from '../ui/useAction';

/**
 * Faixa de arraste da janela, com minimizar e fechar. Substitui a barra da Riot, que fica escondida. A faixa fica por
 * baixo do que mora no topo (a tira do Spotify precisa do mouse); só os botões ficam por cima de tudo.
 */
export function WindowBar({ onClose }: { onClose: () => void }) {
  const minimize = useAction(() => request('POST', '/riotclient/ux-minimize'));
  return (
    <>
      <header class="rlc-windowbar" />
      <div class="rlc-winbtns">
        <button type="button" class="rlc-winbtn" aria-label={t('minimize')} title={t('minimize')} disabled={minimize.pending} onClick={() => minimize.run()}>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2 6.5h8" />
          </svg>
        </button>
        <button type="button" class="rlc-winbtn" data-kind="close" aria-label={t('close')} title={t('close')} onClick={onClose}>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}
