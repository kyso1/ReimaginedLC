import { signal } from '@preact/signals';
import { readSetting, writeSetting } from '../shell/storage';

/** Fonte do fundo: splash de uma skin, arquivo do usuário (IndexedDB) ou nenhuma (fica o fundo do tema). */
export type BgSource = { kind: 'none' } | { kind: 'splash'; skinId: number } | { kind: 'file'; key: string; mime: string };
export const BG_SCREENS = ['home', 'lobby', 'profile', 'collection', 'postgame'] as const;
export type BgScreen = (typeof BG_SCREENS)[number];
/** Telas fora da partida: todas recebem o fundo global. Na seleção, a splash do campeão (quando há) fica por cima dele. */
export const GLOBAL_SCREENS: readonly string[] = [...BG_SCREENS, 'loot', 'events', 'store', 'settings', 'champselect', 'honor'];

export interface BgSettings {
  scope: 'global' | 'screens';
  global: BgSource;
  screens: Partial<Record<BgScreen, BgSource>>;
  /** Uma splash diferente a cada abertura, entre as skins possuídas (vale para o fundo global). */
  random: boolean;
  /** Escurecer, 0 a 0,9. */
  dim: number;
  /** Desfoque em px, 0 a 20. */
  blur: number;
  /** Enquadramento em %, 0 a 100. */
  posX: number;
  posY: number;
}

export const DEFAULT_BG: BgSettings = { scope: 'global', global: { kind: 'none' }, screens: {}, random: false, dim: 0, blur: 0, posX: 50, posY: 30 };
const KEY = 'rlc.background';
export const MEDIA = /^(image\/(png|jpeg|webp|gif)|video\/(webm|mp4))$/;
/** Teto do arquivo de fundo: vídeo grande pesa no IndexedDB e na memória do client. */
export const MAX_MEDIA_BYTES = 150 * 1024 * 1024;

const clamp = (v: unknown, min: number, max: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeSource(v: unknown): BgSource {
  if (!isRecord(v)) return { kind: 'none' };
  if (v.kind === 'splash' && typeof v.skinId === 'number' && Number.isInteger(v.skinId) && v.skinId > 0) return { kind: 'splash', skinId: v.skinId };
  if (v.kind === 'file' && typeof v.key === 'string' && /^[\w-]{1,64}$/.test(v.key) && typeof v.mime === 'string' && MEDIA.test(v.mime)) return { kind: 'file', key: v.key, mime: v.mime };
  return { kind: 'none' };
}

/** Configuração vinda do DataStore passa por aqui: o armazenamento não é confiável. */
export function sanitizeBg(v: unknown): BgSettings {
  if (!isRecord(v)) return DEFAULT_BG;
  const screens: BgSettings['screens'] = {};
  if (isRecord(v.screens)) for (const s of BG_SCREENS) if (Object.hasOwn(v.screens, s)) screens[s] = sanitizeSource(v.screens[s]);
  return {
    scope: v.scope === 'screens' ? 'screens' : 'global',
    global: sanitizeSource(v.global),
    screens,
    random: v.random === true,
    dim: clamp(v.dim, 0, 0.9, 0),
    blur: clamp(v.blur, 0, 20, 0),
    posX: clamp(v.posX, 0, 100, 50),
    posY: clamp(v.posY, 0, 100, 30),
  };
}

export const loadBg = () => sanitizeBg(readSetting<unknown>(KEY, null));

/** Configuração ativa; lida do DataStore quando o shell sobe e trocada ao vivo pelas configurações. */
export const background = signal<BgSettings>(DEFAULT_BG);
export function setBackground(b: BgSettings): void {
  background.value = b;
  writeSetting(KEY, b);
}
/** Semente da escolha aleatória: uma por abertura do client. */
export const SESSION_SEED = Math.random();

/** Fonte da tela, ou null quando a tela fica com o fundo do tema (partida e telas sem configuração). */
export function sourceFor(b: BgSettings, screen: string): BgSource | null {
  if (!GLOBAL_SCREENS.includes(screen)) return null;
  const own = b.scope === 'screens' ? b.screens[screen as BgScreen] : undefined;
  const src = own && own.kind !== 'none' ? own : b.global;
  return src.kind === 'none' ? null : src;
}

/** Skin aleatória vale nas telas com fundo personalizado que não têm fonte própria. */
export function wantsRandom(b: BgSettings, screen: string): boolean {
  if (!b.random || !GLOBAL_SCREENS.includes(screen)) return false;
  const own = b.scope === 'screens' ? b.screens[screen as BgScreen] : undefined;
  return !own || own.kind === 'none';
}

/** Skin aleatória entre as possuídas, estável para a mesma semente (uma por abertura do client). */
export function pickRandom(skins: Array<{ id: number; owned: boolean }>, seed: number): number | null {
  const owned = skins.filter((s) => s.owned);
  if (!owned.length) return null;
  return owned[Math.floor(seed * owned.length) % owned.length]!.id;
}

// Arquivos do usuário ficam em IndexedDB (o DataStore guarda só texto). Sem IndexedDB, nada é guardado.
const DB = 'reimaginedlc';
const STORE = 'media';
// Uma conexão por sessão; falha não fica guardada para tentar de novo.
let db: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  db ??= new Promise<IDBDatabase | null>((resolve) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  }).then((d) => (d ? d : ((db = null), null)));
  return db;
}

/**
 * O IndexedDB é da origem `https://127.0.0.1:<porta>`, e a porta do client muda a cada abertura: o que foi guardado
 * lá some ao reiniciar. Uma cópia fica no DataStore do Pengu (arquivo, sobrevive) como data URL. Imagem grande é
 * reduzida antes (até `PERSIST_SIDE` px, WebP); vídeo e GIF só vão se couberem em `PERSIST_BYTES`.
 */
export const PERSIST_BYTES = 6 * 1024 * 1024;
const PERSIST_SIDE = 2560;
const persistKey = (key: string) => `rlc.media.${key}`;

async function shrink(blob: Blob): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp)$/.test(blob.type) || typeof createImageBitmap === 'undefined') return blob;
  try {
    const img = await createImageBitmap(blob);
    const scale = Math.min(1, PERSIST_SIDE / Math.max(img.width, img.height));
    if (scale === 1 && blob.size <= PERSIST_BYTES) return blob;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? blob), 'image/webp', 0.9));
  } catch {
    return blob;
  }
}

const toDataUrl = (blob: Blob) =>
  new Promise<string | null>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });

function fromDataUrl(url: unknown): Blob | null {
  const m = typeof url === 'string' ? /^data:([\w/+.-]+);base64,(.*)$/s.exec(url) : null;
  if (!m || !MEDIA.test(m[1]!)) return null;
  try {
    const bin = atob(m[2]!);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  } catch {
    return null;
  }
}

async function persist(key: string, blob: Blob): Promise<boolean> {
  const small = await shrink(blob);
  if (small.size > PERSIST_BYTES) return false;
  const url = await toDataUrl(small);
  if (!url) return false;
  writeSetting(persistKey(key), url);
  return true;
}

async function idbDelete(key: string): Promise<void> {
  const d = await open();
  if (!d) return;
  await new Promise<void>((resolve) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function idbPut(key: string, blob: Blob): Promise<boolean> {
  const d = await open();
  if (!d) return false;
  return new Promise((resolve) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

async function idbGet(key: string): Promise<Blob | null> {
  const d = await open();
  if (!d) return null;
  return new Promise((resolve) => {
    const req = d.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => resolve(null);
  });
}

export async function deleteMedia(key: string): Promise<void> {
  try {
    window.DataStore?.remove(persistKey(key));
  } catch {
    // sem DataStore não há cópia
  }
  await idbDelete(key);
}

/**
 * Guarda o arquivo. Devolve 'kept' quando ficou também a cópia que sobrevive ao reiniciar, 'session' quando só o
 * IndexedDB guardou (arquivo grande demais: vale até fechar o client) e false quando nada guardou.
 */
export async function putMedia(key: string, blob: Blob): Promise<'kept' | 'session' | false> {
  const [idb, kept] = await Promise.all([idbPut(key, blob), persist(key, blob)]);
  return kept ? 'kept' : idb ? 'session' : false;
}

/** Arquivo do IndexedDB; senão a cópia do DataStore, que volta para o IndexedDB desta origem. */
export async function getMedia(key: string): Promise<Blob | null> {
  const hit = await idbGet(key);
  if (hit) return hit;
  const copy = fromDataUrl(readSetting<unknown>(persistKey(key), null));
  if (copy) void idbPut(key, copy);
  return copy;
}
