import { signal } from '@preact/signals';

/**
 * Auxiliar de fundos (helper/rlc-fundos.ps1): roda no Windows e serve, só para o client, a lista e os arquivos da pasta
 * do Wallpaper Engine e da pasta do usuário (Imagens\ReimaginedLC). O client não enxerga pastas sozinho.
 * Escuta numa destas portas, a primeira livre na máquina.
 */
export const HELPER_PORTS = [38611, 41847, 45219, 47863];
const APP = 'reimaginedlc-fundos';
const PROBE_MS = 800;

export interface Wallpaper {
  id: string;
  source: 'engine' | 'user';
  title: string;
  media: 'video' | 'image';
  mime: string;
  /** Tem miniatura (vídeo da pasta do usuário não tem). */
  thumb: boolean;
  /** Cena ou web do Wallpaper Engine: só a prévia (o resto só roda no próprio Wallpaper Engine). */
  preview?: boolean;
}

/** Id que o auxiliar gera: origem (u/e) e 16 hex. Nada de caminho. */
export const WALLPAPER_ID = /^[ue][0-9a-f]{16}$/;

/** Endereço do auxiliar que respondeu; null enquanto não achou (ou não há auxiliar). */
export const helperBase = signal<string | null>(null);
/**
 * Token da execução atual do auxiliar. Ele só entrega o token para a origem do client (CORS), e exige o token em cada
 * arquivo: `<img>`/`<video>` não mandam Origin, então sem token qualquer site poderia carregar os arquivos.
 */
let helperToken = '';
let finding: Promise<string | null> | null = null;

async function probe(port: number, fetcher: typeof fetch): Promise<{ base: string; token: string } | null> {
  const base = `http://127.0.0.1:${port}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), PROBE_MS);
  try {
    const r = await fetcher(`${base}/v1/status`, { signal: ctl.signal });
    const s = r.ok ? ((await r.json()) as { app?: unknown }) : null;
    if (s?.app !== APP) return null;
    const k = await fetcher(`${base}/v1/token`, { signal: ctl.signal });
    const token = k.ok ? ((await k.json()) as { token?: unknown }).token : null;
    return typeof token === 'string' && /^[0-9a-f]{64}$/.test(token) ? { base, token } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Procura o auxiliar nas portas (em paralelo). Guarda o que achou; sem achar, tenta de novo na próxima chamada. */
export function findHelper(fetcher: typeof fetch = (u, i) => fetch(u, i)): Promise<string | null> {
  if (helperBase.value) return Promise.resolve(helperBase.value);
  finding ??= Promise.all(HELPER_PORTS.map((p) => probe(p, fetcher))).then((found) => {
    finding = null;
    const hit = found.find(Boolean) ?? null;
    helperToken = hit?.token ?? '';
    helperBase.value = hit?.base ?? null;
    return helperBase.value;
  });
  return finding;
}

export const resetHelper = () => {
  helperBase.value = null;
  helperToken = '';
  finding = null;
};

export const wallpaperUrl = (base: string, id: string, kind: 'file' | 'thumb' = 'file') => `${base}/v1/${kind}/${id}?k=${helperToken}`;

/** Lista do auxiliar, só com entradas bem formadas (o auxiliar é outro processo: não é confiável). */
export function sanitizeWallpapers(v: unknown): Wallpaper[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x): Wallpaper[] => {
    const o = x as Partial<Wallpaper> | null;
    if (!o || typeof o.id !== 'string' || !WALLPAPER_ID.test(o.id)) return [];
    if (o.media !== 'video' && o.media !== 'image') return [];
    if (typeof o.mime !== 'string' || !/^(image|video)\/[\w.+-]+$/.test(o.mime)) return [];
    return [{ id: o.id, source: o.source === 'engine' ? 'engine' : 'user', title: typeof o.title === 'string' ? o.title.slice(0, 120) : '', media: o.media, mime: o.mime, thumb: o.thumb === true, preview: o.preview === true }];
  });
}

export async function loadWallpapers(base: string, fetcher: typeof fetch = (u, i) => fetch(u, i)): Promise<Wallpaper[]> {
  const r = await fetcher(`${base}/v1/wallpapers`);
  return r.ok ? sanitizeWallpapers(await r.json()) : [];
}

/** Abre a pasta do usuário no Explorer (o auxiliar cria se não existir). */
export const openUserFolder = (base: string) => fetch(`${base}/v1/open-user-folder`, { method: 'POST' }).catch(() => undefined);
