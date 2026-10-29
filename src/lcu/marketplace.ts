import { request } from './request';

const PURCHASE = '/lol-marketplace/v1/products/tft/purchases';
const TRANSACTION = '/lol-marketplace/v1/purchases';

const silent = async <T,>(url: string): Promise<T | null> => {
  try {
    const r = await fetch(url);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Compra no marketplace do TFT como o client (loja de Cristais do Reino, upgrade de Pequena Lenda): cria o pedido e
 * acompanha a transação até sair de CREATED; COMPLETE é sucesso. Sem resposta a tempo conta como falha (quem chama relê o
 * inventário e mostra o que de fato mudou).
 */
export async function marketPurchase(
  body: { storeId: string; catalogEntryId: string; paymentOptionsKeys?: string[]; quantity?: number },
  wait: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  tries = 12,
): Promise<boolean> {
  const created = await request<{ data?: { id?: string } }>('POST', PURCHASE, body);
  const id = created?.data?.id;
  if (!id) return false;
  for (let i = 0; i < tries; i++) {
    await wait(800);
    const t = await silent<{ purchaseState?: string }>(`${TRANSACTION}/${encodeURIComponent(id)}`);
    if (t?.purchaseState && t.purchaseState !== 'CREATED') return t.purchaseState === 'COMPLETE';
  }
  return false;
}
