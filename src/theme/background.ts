import { signal } from '@preact/signals';
import { readSetting, writeSetting } from '../shell/storage';

/** Fonte do fundo: splash de uma skin, arquivo do usuário (IndexedDB) ou nenhuma (fica o fundo do tema). */
export type BgSource = { kind: 'none' } | { kind: 'splash'; skinId: number } | { kind: 'file'; key: string; mime: string };
export const BG_SCREENS = ['home', 'lobby', 'profile', 'collection', 'postgame'] as const;
export type BgScreen = (typeof BG_SCREENS)[number];

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
const MEDIA = /^(image\/(png|jpeg|webp|gif)|video\/(webm|mp4))$/;

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

/** Fonte da tela, ou null quando a tela fica com o fundo do tema (seleção, partida e telas sem configuração). */
export function sourceFor(b: BgSettings, screen: string): BgSource | null {
  if (!(BG_SCREENS as readonly string[]).includes(screen)) return null;
  const own = b.scope === 'screens' ? b.screens[screen as BgScreen] : undefined;
  const src = own && own.kind !== 'none' ? own : b.global;
  return src.kind === 'none' ? null : src;
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
function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function putMedia(key: string, blob: Blob): Promise<boolean> {
  const db = await open();
  if (!db) return false;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

export async function getMedia(key: string): Promise<Blob | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => resolve(null);
  });
}
