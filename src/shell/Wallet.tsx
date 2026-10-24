import { useEffect } from 'preact/hooks';
import { locale, t, type TextKey } from '../i18n';
import type { Lcu } from '../lcu';

export type Currency = 'be' | 'rp' | 'oe';

/** Ícones do próprio client, os mesmos da barra da Riot e da bandeja do espólio. */
const ICON: Record<Currency, string> = {
  be: '/fe/lol-static-assets/images/icon-be-150.png',
  rp: '/fe/lol-static-assets/images/icon-rp-72.png',
  oe: '/fe/lol-loot/assets/tray_icons/currency_cosmetic.png',
};
const LABEL: Record<Currency, TextKey> = { be: 'blueEssence', rp: 'riotPoints', oe: 'orangeEssence' };

/**
 * Saldo das moedas pedidas, com ícone. Aparece só onde a moeda se gasta: Essência Azul e RP na loja,
 * Essência Laranja na coleção (criação de itens). Relê ao montar: a carteira não tem evento para a URI com consulta.
 * Com `onBuyRp`, um "+" ao lado do RP abre a compra de RP da Riot.
 */
export function Wallet({ lcu, show, onBuyRp }: { lcu: Lcu; show: Currency[]; onBuyRp?: () => void }) {
  useEffect(() => {
    if (show.includes('be') || show.includes('rp')) void lcu.wallet.refresh();
    if (show.includes('oe')) void lcu.orangeEssence.refresh();
  }, [show.join()]);
  const wallet = lcu.wallet.value.data ?? {};
  const value: Record<Currency, number | undefined> = { be: wallet.lol_blue_essence, rp: wallet.RP, oe: lcu.orangeEssence.value.data?.count };
  const num = new Intl.NumberFormat(locale());
  const shown = show.filter((c) => typeof value[c] === 'number');
  if (!shown.length) return null;
  return (
    <div class="rlc-wallet">
      {shown.map((c) => (
        <span key={c} class="rlc-cur" data-cur={c} title={t(LABEL[c])}>
          <img src={ICON[c]} alt={t(LABEL[c])} />
          {num.format(value[c]!)}
          {c === 'rp' && onBuyRp ? (
            <button type="button" class="rlc-cur-add" aria-label={t('storeBuyRp')} title={t('storeBuyRp')} onClick={onBuyRp}>
              +
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}
