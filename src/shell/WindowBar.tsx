import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { request } from '../lcu/request';
import { useAction } from '../ui/useAction';

/**
 * Tela cheia como nos navegadores (a janela cobre a tela e a interface ganha espaço). O Chromium só aceita a partir de
 * um gesto do usuário (clique ou tecla), então não dá para abrir já em tela cheia.
 */
export function toggleFullscreen(doc: Document = document): void {
  if (doc.fullscreenElement) void doc.exitFullscreen().catch(() => {});
  else void doc.documentElement.requestFullscreen?.().catch(() => window.Toast?.error(t('fullscreenFailed')));
}

function useFullscreen(enabled: boolean): boolean {
  const [on, setOn] = useState(!!document.fullscreenElement);
  useEffect(() => {
    if (!enabled) return;
    const sync = () => setOn(!!document.fullscreenElement);
    // F11 como no navegador; a tecla conta como gesto do usuário.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F11') return;
      e.preventDefault();
      toggleFullscreen();
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('keydown', onKey);
    };
  }, [enabled]);
  return on;
}

/**
 * Faixa de arraste da janela, com minimizar, tela cheia e fechar. Substitui a barra da Riot, que fica escondida. A faixa
 * fica por baixo do que mora no topo (a tira do Spotify precisa do mouse); só os botões ficam por cima de tudo.
 */
export function WindowBar({ onClose, fullscreen = false }: { onClose: () => void; fullscreen?: boolean }) {
  const minimize = useAction(() => request('POST', '/riotclient/ux-minimize'));
  const full = useFullscreen(fullscreen);
  // Opção desligada com a janela em tela cheia (desligou agora): sai dela, senão não haveria botão para sair.
  useEffect(() => {
    if (!fullscreen && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, [fullscreen]);
  const fullLabel = t(full ? 'fullscreenExit' : 'fullscreenEnter');
  return (
    <>
      <header class="rlc-windowbar" />
      <div class="rlc-winbtns">
        <button type="button" class="rlc-winbtn" aria-label={t('minimize')} title={t('minimize')} disabled={minimize.pending} onClick={() => minimize.run()}>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2 6.5h8" />
          </svg>
        </button>
        {fullscreen ? (
          <button type="button" class="rlc-winbtn" data-kind="fullscreen" aria-label={fullLabel} title={`${fullLabel} (F11)`} aria-pressed={full} onClick={() => toggleFullscreen()}>
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              {full ? <path d="M4.5 1.5v3h-3M7.5 1.5v3h3M4.5 10.5v-3h-3M7.5 10.5v-3h3" /> : <path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />}
            </svg>
          </button>
        ) : null}
        <button type="button" class="rlc-winbtn" data-kind="close" aria-label={t('close')} title={t('close')} onClick={onClose}>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}
