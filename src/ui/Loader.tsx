/**
 * Animação de carregando: dois arcos girando em sentidos opostos em volta de um núcleo que pulsa, com o texto embaixo.
 * `small` é a versão em linha (dentro de um painel); a cheia ocupa o centro da tela.
 */
export function Loader({ label, small }: { label?: string; small?: boolean }) {
  return (
    <div class="rlc-loader" data-size={small ? 'sm' : undefined} role="status" aria-live="polite">
      <span class="rlc-loader-ring" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {label ? <span class="rlc-loader-label">{label}</span> : null}
    </div>
  );
}
