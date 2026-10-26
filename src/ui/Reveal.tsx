import { createPortal } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n';
import { prefs } from '../shell/prefs';
import { useEscape } from './useEscape';

export interface RevealItem {
  name: string;
  art?: string;
  /** Quantidade ganha; 1 não aparece. */
  count?: number;
  /** Destaque (item raro, prêmio principal). */
  chase?: boolean;
}

/** Tempo do baú tremendo antes de abrir. */
export const OPEN_MS = 1100;

/**
 * Revelação do que saiu de um baú, cápsula, invocação ou recompensa: o baú treme e brilha, abre num clarão e os
 * cartões viram um a um. Clique ou Esc pula a abertura; depois, OK fecha. Cobre a tela toda (portal na raiz).
 */
export function Reveal({ title, chest, items, onClose }: { title: string; chest?: string; items: RevealItem[]; onClose: () => void }) {
  const instant = prefs.value.motion !== 'full' || !chest;
  const [open, setOpen] = useState(instant);
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setOpen(true), OPEN_MS);
    return () => clearTimeout(id);
  }, [open]);
  useEscape(() => (open ? onClose() : setOpen(true)));
  const body = (
    <div class="rlc-veil rlc-lt-reveal rlc-reveal" role="dialog" aria-modal="true" aria-label={title} data-open={open ? 'true' : undefined} onClick={() => !open && setOpen(true)}>
      {open ? (
        <>
          <span class="rlc-reveal-burst" aria-hidden="true" />
          <h2>{title}</h2>
          <div class="rlc-lt-reveal-cards">
            {items.length ? (
              items.map((it, i) => (
                <div key={i} class="rlc-lt-reveal-card" data-chase={it.chase ? 'true' : undefined} style={{ animationDelay: `${i * 140}ms` }}>
                  {it.art ? <img src={it.art} alt="" /> : <span class="rlc-reveal-noart" aria-hidden="true" />}
                  <span>
                    {it.name}
                    {it.count && it.count > 1 ? ` ×${it.count}` : ''}
                  </span>
                </div>
              ))
            ) : (
              <p class="rlc-muted">{t('lootRevealEmpty')}</p>
            )}
          </div>
          <button type="button" class="rlc-button" data-variant="primary" onClick={onClose}>
            {t('ok')}
          </button>
        </>
      ) : (
        <div class="rlc-reveal-chest" aria-hidden="true">
          <img src={chest} alt="" />
        </div>
      )}
    </div>
  );
  const root = document.getElementById('rlc-root');
  return root ? createPortal(body, root) : body;
}
