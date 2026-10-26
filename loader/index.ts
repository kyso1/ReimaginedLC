import { isNewer, UPDATE_EVENT, type LoaderState } from './shared';

// Carregador: é o que fica na pasta de plugins do Pengu e quase nunca muda. Escolhe o bundle (versão nova já
// verificada, guardada no IndexedDB, ou a cópia local em ./app/), repassa o contexto do Pengu e procura versões novas.
// Regra: só executa bytes que ele mesmo verificou. O bundle do CDN é um arquivo só (sem chunks); o loader baixa,
// confere a assinatura do manifest e o sha256 do index.js, guarda e importa por blob: — nunca import() remoto.
// Fontes e temas (não são código) o bundle busca pela URL versionada do jsDelivr (`__rlcLoader.base`).

/** Repositório público que o CI publica (tags `cdn-v{versão}`). */
export const REPO = 'kyso1/ReimaginedLC';
export const cdnBase = (version: string) => `https://cdn.jsdelivr.net/gh/${REPO}@cdn-v${version}/`;
export const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;

/** Chave pública ECDSA P-256 que assina o manifest.json (a privada fica fora do repo, no secret RLC_SIGNING_KEY). */
export const PUBLIC_KEY: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'KSrJG2QZ1pt1duFZBR1w6eOdc_CaHxuPS5QtQ_EX5Ic',
  y: '1F9zXy1oSbqD4wm7rxQhMESD-H-HtNZTayJRsgSGXJY',
};

/** Plugins da Riot cuja API o bundle pede no `init` (o postInit só vale se registrado no init síncrono). */
export const EARLY_APIS = ['rcp-fe-lol-paw', 'rcp-fe-lol-shared-components'];
const CHECK_EVERY = 6 * 60 * 60 * 1000;
const log = (...a: unknown[]) => console.warn('[rlc-loader]', ...a);

export interface Manifest {
  version: string;
  /** Caminho relativo → sha256 em hex. */
  files: Record<string, string>;
}
/** Versão baixada e verificada, guardada para o próximo início. Re-verificada ao ler. */
export interface Cached {
  version: string;
  manifest: ArrayBuffer;
  sig: string;
  code: ArrayBuffer;
}
type Fetcher = (url: string) => Promise<Response>;
interface AppModule {
  init?: (context: unknown) => unknown;
  load?: () => unknown;
}
interface Rcp {
  postInit?: (name: string, callback: (api: unknown) => unknown, ...rest: unknown[]) => unknown;
  preInit?: (...a: unknown[]) => unknown;
  whenReady?: (...a: unknown[]) => unknown;
}
export interface Deps {
  fetcher: Fetcher;
  importer: (url: string) => Promise<AppModule>;
  cache: { get(): Promise<Cached | null>; set(c: Cached): Promise<void> };
  /** URL da pasta do carregador (termina em /). */
  base: string;
  /** Chave de verificação (testes); padrão PUBLIC_KEY. */
  key?: JsonWebKey;
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const unbase64 = (s: string) => Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0));

/** Confere a assinatura do manifest, a versão e o sha256 do index.js. Lança se algo não bate. */
export async function verify(c: Cached, key: JsonWebKey = PUBLIC_KEY): Promise<Manifest> {
  const pub = await crypto.subtle.importKey('jwk', key, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  if (!(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, unbase64(c.sig), c.manifest))) throw new Error('assinatura inválida');
  const m = JSON.parse(new TextDecoder().decode(c.manifest)) as Manifest;
  if (m.version !== c.version || typeof m.files?.['index.js'] !== 'string') throw new Error(`manifest não é da versão ${c.version}`);
  if (hex(await crypto.subtle.digest('SHA-256', c.code)) !== m.files['index.js']) throw new Error('index.js: sha256 não confere');
  return m;
}

/** Baixa manifest, assinatura e index.js da versão no jsDelivr e verifica. */
export async function download(version: string, fetcher: Fetcher, key?: JsonWebKey): Promise<Cached> {
  const get = async (path: string) => {
    const r = await fetcher(cdnBase(version) + path);
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.arrayBuffer();
  };
  const [manifest, sig, code] = await Promise.all([get('manifest.json'), get('manifest.sig'), get('index.js')]);
  const c = { version, manifest, sig: new TextDecoder().decode(sig), code };
  await verify(c, key);
  return c;
}

/**
 * Contexto que vai para o bundle, que chega depois do `init`. Registra já os postInit de EARLY_APIS e entrega a API
 * na hora (se já chegou) ou quando chegar. Outros nomes e o resto do contexto passam direto para o do Pengu.
 */
export function proxyContext(context: { rcp?: Rcp } | undefined): { rcp: Rcp } {
  const rcp = context?.rcp;
  const apis = new Map<string, unknown>();
  const waiting = new Map<string, Array<(api: unknown) => unknown>>();
  const call = (cb: (api: unknown) => unknown, api: unknown) => {
    try {
      cb(api);
    } catch (e) {
      log(e);
    }
  };
  for (const name of EARLY_APIS) {
    try {
      rcp?.postInit?.(name, (api) => {
        apis.set(name, api);
        for (const cb of waiting.get(name) ?? []) call(cb, api);
        waiting.delete(name);
      });
    } catch (e) {
      log(e);
    }
  }
  const fake: Rcp = {
    preInit: (...a) => rcp?.preInit?.(...a),
    whenReady: (...a) => rcp?.whenReady?.(...a),
    postInit(name, cb, ...rest) {
      if (!EARLY_APIS.includes(name)) return rcp?.postInit?.(name, cb, ...rest);
      if (apis.has(name)) call(cb, apis.get(name));
      else waiting.set(name, [...(waiting.get(name) ?? []), cb]);
    },
  };
  return Object.assign(Object.create(context ?? null) as object, { rcp: fake });
}

/** De onde importar: a versão guardada (re-verificada) se for mais nova que a local, senão a cópia local. */
export async function pickApp(deps: Deps): Promise<{ version: string; base: string; url: string; revoke?: () => void }> {
  let local = '0.0.0';
  try {
    local = ((await (await deps.fetcher(`${deps.base}app/manifest.json`)).json()) as Manifest).version;
  } catch {
    // Sem manifest local (instalação de desenvolvimento): qualquer versão publicada é mais nova.
  }
  try {
    const c = await deps.cache.get();
    if (c && isNewer(local, c.version)) {
      await verify(c, deps.key);
      const url = URL.createObjectURL(new Blob([c.code], { type: 'text/javascript' }));
      return { version: c.version, base: cdnBase(c.version), url, revoke: () => URL.revokeObjectURL(url) };
    }
  } catch (e) {
    log('versão guardada inválida, usando a local', e);
  }
  return { version: local, base: `${deps.base}app/`, url: `${deps.base}app/index.js` };
}

/** Última release no GitHub: se for mais nova que a em execução, baixa, verifica e guarda como pronta. */
export async function checkLatest(state: LoaderState, deps: Deps): Promise<string | null> {
  const r = await deps.fetcher(LATEST_API);
  const tag = r.ok ? ((await r.json()) as { tag_name?: unknown }).tag_name : null;
  if (typeof tag !== 'string') return null;
  const version = tag.trim().replace(/^v/, '');
  if (!isNewer(state.version, version) || version === state.ready) return null;
  await deps.cache.set(await download(version, deps.fetcher, deps.key));
  state.ready = version;
  return version;
}

// IndexedDB do próprio client: uma chave só com a última versão verificada.
const idb = () =>
  new Promise<IDBDatabase>((ok, no) => {
    const r = indexedDB.open('rlc-loader', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const db = await idb();
  return new Promise<T>((ok, no) => {
    const req = fn(db.transaction('kv', mode).objectStore('kv'));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => no(req.error);
  }).finally(() => db.close());
};
const idbCache: Deps['cache'] = {
  get: () => tx('readonly', (s) => s.get('app')).then((v) => (v as Cached | undefined) ?? null),
  set: (c) => tx('readwrite', (s) => s.put(c, 'app')).then(() => undefined),
};

interface Store {
  has(key: string): boolean;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
const STORE_KEY = 'rlc-loader.app';
const base64 = (buf: ArrayBuffer) => {
  const u = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const toBuffer = (s: string) => unbase64(s).buffer as ArrayBuffer;

/**
 * O IndexedDB é da origem `https://127.0.0.1:<porta>` e a porta do client muda a cada abertura: a versão baixada
 * sumia ao reiniciar e o client voltava para a cópia local. A cópia que vale fica no DataStore do Pengu (arquivo);
 * o IndexedDB fica de reserva. Tudo é re-verificado ao ler, então o armazenamento não precisa ser confiável.
 */
export function persistentCache(store: Store | undefined, fallback: Deps['cache']): Deps['cache'] {
  return {
    async get() {
      try {
        const v = store?.has(STORE_KEY) ? (store.get(STORE_KEY) as { version?: unknown; manifest?: unknown; sig?: unknown; code?: unknown }) : null;
        if (v && typeof v.version === 'string' && typeof v.manifest === 'string' && typeof v.sig === 'string' && typeof v.code === 'string')
          return { version: v.version, manifest: toBuffer(v.manifest), sig: v.sig, code: toBuffer(v.code) };
      } catch (e) {
        log('cópia do DataStore ilegível', e);
      }
      return fallback.get().catch(() => null);
    },
    async set(c) {
      try {
        store?.set(STORE_KEY, { version: c.version, manifest: base64(c.manifest), sig: c.sig, code: base64(c.code) });
      } catch (e) {
        log('DataStore não guardou', e);
      }
      await fallback.set(c).catch(() => {});
    },
  };
}

let app: Promise<AppModule | null> = Promise.resolve(null);

/** Inicia o carregamento com dependências dadas (o `init` do Pengu usa as reais). */
export function boot(context: { rcp?: Rcp } | undefined, deps: Deps, win: Window = window): Promise<AppModule | null> {
  const fake = proxyContext(context);
  app = pickApp(deps)
    .then(async ({ version, base, url, revoke }) => {
      // Antes do import: o bundle lê `base` ao carregar (fontes e temas).
      const state: LoaderState = { version, base, ready: null };
      (win as Window & { __rlcLoader?: LoaderState }).__rlcLoader = state;
      const mod = await deps.importer(url).finally(() => revoke?.());
      await mod.init?.(fake);
      const check = () =>
        checkLatest(state, deps)
          .then((v) => v && win.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { version: v } })))
          .catch((e) => log('checagem de versão falhou', e));
      void check();
      setInterval(check, CHECK_EVERY);
      return mod;
    })
    .catch((e) => {
      log('bundle não carregou', e);
      return null;
    });
  return app;
}

/** O Pengu chama `init` (síncrono) antes da interface da Riot carregar. */
export function init(context?: { rcp?: Rcp }): void {
  void boot(context, {
    fetcher: (u) => fetch(u),
    importer: (u) => import(/* @vite-ignore */ u) as Promise<AppModule>,
    cache: persistentCache((globalThis as { DataStore?: Store }).DataStore, idbCache),
    base: new URL(/* @vite-ignore */ '.', import.meta.url).href,
  });
}

/** O Pengu chama `load` quando a janela termina de carregar: repassa ao bundle assim que ele chegar. */
export async function load(): Promise<void> {
  try {
    await (await app)?.load?.();
  } catch (e) {
    log(e);
  }
}
