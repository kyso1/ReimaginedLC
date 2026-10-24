// Compra sempre pela Riot: este módulo só ABRE a janela de compra oficial; nunca chama endpoint de compra.
//
// O que existe no client (patch 26.21):
// - Nenhum endpoint REST abre a janela. Os de `/lol-purchase-widget` e `/lol-store/v3/purchase` COMPRAM direto (proibido aqui).
// - A janela é o plugin de interface `rcp-fe-lol-paw` ("Purchase Anywhere Widget"). A API pública dele (lida em
//   `/fe/lol-paw/rcp-fe-lol-paw.js`) tem `createPAWModal({ itemId, inventoryType }, source, _, owner, onPurchased, onClosed)`,
//   que monta o modal da Riot (`div.modal > .rcp-fe-lol-paw`) com preço, confirmação e termos; a compra acontece lá.
// - A API só chega pelo Pengu: `init(context)` → `context.rcp.postInit('rcp-fe-lol-paw', setPawApi)` (ligar em src/index.ts).
// Sem a API (ou para Sua Loja e presentes, que a janela não cobre), a tela mostra a página da loja da Riot.
// - Comprar RP: o client chama `Payments.openPayments({ action: 'RP_PURCHASE', openedFrom })`, API do plugin
//   `rcp-fe-lol-shared-components` (`getApi_Payments()`), a mesma da carteira, da Sua Loja e da janela de compra.
//   Ela abre a janela nativa de pagamento da Riot (e um diálogo de fundo no DOM); o pagamento acontece lá.

/** Par que identifica o item para a Riot. */
export interface PurchaseItem {
  itemId: number;
  inventoryType: string;
  yourShop?: boolean;
}

interface PawApi {
  createPAWModal(item: { itemId: number; inventoryType: string }, source: string, unused?: null, owner?: null, onPurchased?: null, onClosed?: (() => void) | null): boolean;
}

let paw: PawApi | null = null;

/** Recebe a API do plugin `rcp-fe-lol-paw` (chamado pelo `init` do plugin, via `rcp.postInit`). */
export function setPawApi(api: unknown): void {
  paw = api && typeof (api as PawApi).createPAWModal === 'function' ? (api as PawApi) : null;
}

interface PaymentsApi {
  openPayments(opts: { action: 'RP_PURCHASE'; openedFrom: string; onClose?: () => void }): Promise<unknown>;
}

let payments: PaymentsApi | null = null;

/** Recebe a API do plugin `rcp-fe-lol-shared-components` (via `rcp.postInit`) e guarda a de pagamentos. */
export function setSharedComponentsApi(api: unknown): void {
  const get = (api as { getApi_Payments?: () => unknown } | null)?.getApi_Payments;
  const p = typeof get === 'function' ? (get.call(api) as PaymentsApi | null) : null;
  payments = p && typeof p.openPayments === 'function' ? p : null;
}

/** Logo acima da nossa raiz (z-index 2147483000): a janela da Riot precisa ficar por cima da loja. */
const PAW_Z = '2147483001';

/**
 * Abre a janela de compra da Riot para o item. 'dialog' quando abriu; 'store' quando quem chama deve mostrar
 * a página da loja da Riot (sem a API, oferta da Sua Loja ou a Riot recusou abrir).
 * TODO(integrador): confirmar no client que o modal aparece acima da camada e que fechar devolve o estilo.
 */
export function openRiotPurchase(item: PurchaseItem, doc: Document = document): 'dialog' | 'store' {
  if (!paw || item.yourShop) return 'store';
  let restore = () => {};
  let opened = false;
  try {
    opened = paw.createPAWModal({ itemId: item.itemId, inventoryType: item.inventoryType }, 'store', null, null, null, () => restore());
  } catch (e) {
    console.error('[rlc] janela de compra', e);
  }
  if (!opened) return 'store';
  restore = liftModal(doc, '.rcp-fe-lol-paw');
  return 'dialog';
}

/**
 * Abre a compra de RP da Riot, como o "+" da carteira do client. 'dialog' quando abriu; 'store' quando quem chama
 * deve mostrar a página da loja da Riot (sem a API ou a Riot recusou abrir).
 */
export async function openRiotRpPurchase(doc: Document = document): Promise<'dialog' | 'store'> {
  if (!payments) return 'store';
  let restore = () => {};
  try {
    await payments.openPayments({ action: 'RP_PURCHASE', openedFrom: 'store_wallet', onClose: () => restore() });
  } catch (e) {
    console.error('[rlc] compra de RP', e);
    return 'store';
  }
  restore = liftModal(doc, '.payments-wrapper');
  return 'dialog';
}

/**
 * A interface da Riot fica com `visibility: hidden` sob a nossa raiz: o modal (achado por `sel`) volta a ser visível e sobe acima dela.
 * Devolve a função que desfaz (também roda sozinha quando o modal sai do DOM).
 */
function liftModal(doc: Document, sel: string): () => void {
  let lifted: { el: HTMLElement; style: string } | null = null;
  const started = Date.now();
  // ponytail: varredura a cada 100 ms enquanto o modal está aberto; troca por MutationObserver se pesar.
  const id = setInterval(() => {
    if (!lifted) {
      const el = doc.querySelector<HTMLElement>(sel);
      const box = el?.closest<HTMLElement>('.modal') ?? el;
      if (box) {
        lifted = { el: box, style: box.getAttribute('style') ?? '' };
        Object.assign(box.style, { visibility: 'visible', zIndex: PAW_Z });
        if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      } else if (Date.now() - started > 5000) clearInterval(id);
    } else if (!lifted.el.isConnected || !(lifted.el.matches(sel) || lifted.el.querySelector(sel))) restore();
  }, 100);
  const restore = () => {
    clearInterval(id);
    if (lifted?.el.isConnected) lifted.el.setAttribute('style', lifted.style);
    lifted = null;
  };
  return restore;
}
