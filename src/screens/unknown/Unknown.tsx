import { t } from '../../i18n';
import { Button } from '../../ui/Button';

/** "WaitingForStats" vira "Waiting for stats": a fase vem em PascalCase da LCU e não tem tradução. */
export const humanizePhase = (phase: string) => {
  const words = phase.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Fase do gameflow que a camada ainda não conhece. Mostra o nome legível e a saída para o client original. */
export function Unknown({ phase, onOriginal }: { phase: string; onOriginal: () => void }) {
  return (
    <section class="rlc-unknown">
      <p class="rlc-muted">{t('unknownPhase')}</p>
      <h2>{humanizePhase(phase)}</h2>
      <Button onClick={onOriginal}>{t('originalClient')}</Button>
    </section>
  );
}
