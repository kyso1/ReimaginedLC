import { t } from '../../i18n';
import { Button } from '../../ui/Button';

/** Fase do gameflow que a camada ainda não conhece. Mostra o nome e a saída para o client original. */
export function Unknown({ phase, onOriginal }: { phase: string; onOriginal: () => void }) {
  return (
    <section class="rlc-unknown">
      <p class="rlc-muted">{t('unknownPhase')}</p>
      <h2>{phase}</h2>
      <Button onClick={onOriginal}>{t('originalClient')}</Button>
    </section>
  );
}
