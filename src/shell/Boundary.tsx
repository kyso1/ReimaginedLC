import { Component, type ComponentChildren } from 'preact';
import { t } from '../i18n';
import { saveError } from './report';

/** Captura exceção de renderização da tela ativa e avisa o shell, que desliga a camada. */
export class Boundary extends Component<{ onError: (error: unknown) => void; children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };

  componentDidCatch(error: unknown) {
    this.setState({ failed: true });
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Erro dentro de uma tela (dado que mudou numa atualização da Riot, endpoint que sumiu): fica só nela, com o aviso e
 * "Tentar de novo"; a camada, o menu e as outras telas continuam. O erro vai para o relatório de erro. Trocar de tela
 * (`key` no App) começa limpo. Com `escalate` (seleção de campeões: o tempo corre), o erro vai para o shell, que
 * devolve a tela da Riot.
 */
export class ScreenBoundary extends Component<{ escalate?: (error: unknown) => void; children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };

  componentDidCatch(error: unknown) {
    if (this.props.escalate) {
      this.setState({ failed: true });
      return this.props.escalate(error);
    }
    console.error('[rlc]', error);
    saveError(error);
    this.setState({ failed: true });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.escalate) return null;
    return (
      <div class="rlc-lazy" data-failed="true" role="alert">
        <p>{t('screenError')}</p>
        <button type="button" class="rlc-button" data-variant="primary" onClick={() => this.setState({ failed: false })}>
          {t('mkRetry')}
        </button>
      </div>
    );
  }
}
