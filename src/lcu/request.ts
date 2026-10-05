import { t } from '../i18n';

export class LcuError extends Error {}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Ação na LCU. Em erro mostra a mensagem da LCU num Toast e rejeita; quem chama não muda estado local. */
export async function request<T = unknown>(method: Method, path: string, body?: unknown, fetcher: typeof fetch = (u, i) => fetch(u, i)): Promise<T | null> {
  const init: RequestInit = body === undefined ? { method } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  let response: Response;
  try {
    response = await fetcher(path, init);
  } catch (error) {
    window.Toast?.error(t('lcuOffline'));
    throw new LcuError(String(error));
  }
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const message = lcuMessage(text) ?? `${t('lcuError')} (${response.status})`;
    window.Toast?.error(message);
    throw new LcuError(message);
  }
  return text ? (JSON.parse(text) as T) : null;
}

function lcuMessage(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as { message?: unknown } | null;
    return typeof parsed?.message === 'string' && parsed.message ? parsed.message : null;
  } catch {
    return null;
  }
}
