import { Component, type ComponentChildren } from 'preact';

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
