import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';

/** Item da barra da Riot que abre a loja, e o contêiner que a loja da Riot monta. */
const RIOT_NAV = '.menu_item_navbar_store';
const RIOT_STORE = '.__rcp-fe-lol-store';
/** Logo acima da nossa raiz (z-index 2147483000): a página da Riot cobre só o quadro, a nossa barra continua por fora. */
const STORE_Z = '2147483001';

/** Tela da loja da Riot que está montada, ou null. O que se move é a `screen-root` que a contém. */
export const riotStore = (doc: Document = document): HTMLElement | null => doc.querySelector<HTMLElement>(RIOT_STORE)?.parentElement ?? null;

/** Pede à interface da Riot (escondida) para abrir a loja. */
function openRiotStore(): void {
  document.querySelector<HTMLElement>(RIOT_NAV)?.click();
}

/**
 * Reserva da compra: a página da própria loja da Riot (compra, presente, Sua Loja), recortada no retângulo deste quadro.
 * A interface da Riot continua escondida; só a tela da loja volta a ser visível, por cima da nossa raiz.
 */
export function RiotStorePage({ open = openRiotStore }: { open?: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    if (!riotStore()) open();
    let moved: { el: HTMLElement; style: string } | null = null;
    const restore = () => {
      if (moved?.el.isConnected) moved.el.setAttribute('style', moved.style);
      moved = null;
    };
    const place = () => {
      const el = riotStore();
      const box = frame.current?.getBoundingClientRect();
      if (!el || !box) return false;
      if (moved?.el !== el) {
        restore();
        moved = { el, style: el.getAttribute('style') ?? '' };
      }
      // O fundo da loja tem largura fixa (a da coluna da Riot): a imagem dela estica para cobrir o quadro inteiro.
      Object.assign(el.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, zIndex: STORE_Z, visibility: 'visible', background: 'url("/fe/lol-store/background.png") center / cover #010a13' });
      return true;
    };
    const started = Date.now();
    // ponytail: varredura a cada 400 ms enquanto a página está aberta; troca por MutationObserver se pesar.
    const id = setInterval(() => {
      if (place()) setState('ready');
      else if (Date.now() - started > 15000) setState((s) => (s === 'ready' ? s : 'failed'));
    }, 400);
    if (place()) setState('ready');
    window.addEventListener('resize', place);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', place);
      restore();
    };
  }, []);

  return (
    <div class="rlc-sto-riot" ref={frame}>
      {state === 'loading' ? <p class="rlc-muted">{t('storeLoading')}</p> : null}
      {state === 'failed' ? <p class="rlc-muted">{t('storeFailed')}</p> : null}
    </div>
  );
}
