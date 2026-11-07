// Avisos nativos da Riot por cima da camada.
//
// O client mostra avisos que só ele sabe montar e confirmar: banimento, cartão de reforma, restrição de chat, fila de
// baixa prioridade, mensagens da Riot, cerimônia de promoção de elo, toasts de elo, novidades (o modal do TFT novo)...
// Todos entram pelo gerenciador de camadas da Riot (`#lol-uikit-layer-manager`, filho do body, fora da raiz que
// escondemos): `.modal` (modalManager), `.lol-uikit-vignette-celebration-layer` (cerimônias) e
// `.lol-uikit-toast-celebration-layer` (toasts de elo). Por baixo da nossa raiz eles abrem invisíveis e nunca são
// confirmados. Enquanto houver um deles, o gerenciador sobe acima da camada (styles.css, `[data-rlc-notice]`); o
// clique em OK é o do próprio client, que confirma na LCU e fecha como sempre.

const MANAGER = 'lol-uikit-layer-manager';
export const NOTICES = [
  '#lol-uikit-layer-manager-wrapper > .modal',
  '.lol-uikit-vignette-celebration-layer > *',
  '.lol-uikit-toast-celebration-layer > *',
].join(', ');

/** Liga ou desliga a subida conforme há aviso aberto. Devolve se subiu. */
export function syncRiotNotices(doc: Document = document): boolean {
  const manager = doc.getElementById(MANAGER);
  if (!manager) return false;
  const open = !!manager.querySelector(NOTICES);
  if (open) manager.setAttribute('data-rlc-notice', '');
  else manager.removeAttribute('data-rlc-notice');
  return open;
}

/**
 * Observa o gerenciador de camadas. Ele pode nascer ou ser trocado depois de nós (boot do client): o body é observado
 * só nos filhos diretos, e a árvore do gerenciador por inteiro. Devolve a limpeza.
 */
export function watchRiotNotices(doc: Document = document): () => void {
  let watched: HTMLElement | null = null;
  const inner = new MutationObserver(() => void syncRiotNotices(doc));
  const attach = () => {
    const manager = doc.getElementById(MANAGER);
    if (manager !== watched) {
      inner.disconnect();
      watched = manager;
      if (manager) inner.observe(manager, { childList: true, subtree: true });
    }
    syncRiotNotices(doc);
  };
  const outer = new MutationObserver(attach);
  outer.observe(doc.body, { childList: true });
  attach();
  return () => {
    outer.disconnect();
    inner.disconnect();
    watched?.removeAttribute('data-rlc-notice');
  };
}
