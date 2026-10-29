import { t } from '../../i18n';

/** "WaitingForStats" vira "Waiting for stats": a fase vem em PascalCase da LCU e não tem tradução. */
export const humanizePhase = (phase: string) => {
  const words = phase.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Fase do gameflow que a camada ainda não conhece (fase nova numa atualização da Riot). Mostra o nome legível; o menu
 * continua à mão e a tela troca sozinha quando a fase muda.
 */
export function Unknown({ phase }: { phase: string }) {
  return (
    <section class="rlc-unknown">
      <p class="rlc-muted">{t('unknownPhase')}</p>
      <h2>{humanizePhase(phase)}</h2>
      <p class="rlc-muted">{t('unknownPhaseHint')}</p>
    </section>
  );
}
