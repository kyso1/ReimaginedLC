import { signal } from '@preact/signals';
import { t } from '../i18n';
import { readSetting, writeSetting } from './storage';

export const RELEASES_API = 'https://api.github.com/repos/kyso1/ReimaginedLC/releases/latest';
const KEY = 'rlc.update';
const DAY = 24 * 60 * 60 * 1000;
// Só abre a página de release deste projeto (a URL vai para o navegador do sistema).
const RELEASES_PAGE = 'https://github.com/kyso1/ReimaginedLC/releases/tag/v';

/** Versão nova publicada, ou null. Só avisa: a atualização é manual (a spec proíbe atualizar sozinho). */
export const update = signal<{ version: string; url: string } | null>(null);

const parse = (v: string): number[] | null => {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** `latest` é mais nova que `current`? Pré-lançamentos (`-beta`) e textos fora do formato contam como não. */
export function isNewer(current: string, latest: string): boolean {
  const a = parse(current);
  const b = parse(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i]! > a[i]!;
  return false;
}

interface Cached {
  checkedAt: number | null;
  version: string | null;
  url: string | null;
  notified: string | null;
}

/**
 * Consulta a última release no GitHub no máximo uma vez por dia (falha também conta, para não insistir).
 * Versão nova: guarda em `update` e avisa num Toast uma vez por versão.
 */
export async function checkForUpdate(current: string, now = Date.now(), fetcher: (url: string) => Promise<Response> = (u) => fetch(u)): Promise<void> {
  const raw = readSetting<Partial<Cached> | null>(KEY, null);
  const cached: Cached = {
    checkedAt: typeof raw?.checkedAt === 'number' ? raw.checkedAt : null,
    version: typeof raw?.version === 'string' ? raw.version : null,
    url: typeof raw?.url === 'string' && raw.url.startsWith(RELEASES_PAGE) ? raw.url : null,
    notified: typeof raw?.notified === 'string' ? raw.notified : null,
  };
  let { version, url } = cached;
  // checkedAt no futuro (relógio mudou, armazenamento adulterado) conta como vencido.
  const due = cached.checkedAt === null || cached.checkedAt > now || now - cached.checkedAt >= DAY;
  if (due) {
    version = null;
    url = null;
    try {
      const r = await fetcher(RELEASES_API);
      const body = r.ok ? ((await r.json()) as { tag_name?: unknown; html_url?: unknown }) : null;
      if (typeof body?.tag_name === 'string' && typeof body.html_url === 'string' && body.html_url.startsWith(RELEASES_PAGE)) {
        version = body.tag_name.trim().replace(/^v/, '');
        url = body.html_url;
      }
    } catch {
      // Sem rede ou bloqueado: tenta de novo amanhã.
    }
  }
  // Versão e URL precisam concordar: a URL é a página da tag dessa versão.
  const fresh = version && url === `${RELEASES_PAGE}${version}` && isNewer(current, version) ? { version, url } : null;
  update.value = fresh;
  let notified = cached.notified;
  if (fresh && notified !== fresh.version) {
    window.Toast?.success(`${t('updateAvailable')} ${fresh.version}`);
    notified = fresh.version;
  }
  writeSetting(KEY, { checkedAt: due ? now : cached.checkedAt, version, url, notified });
}
