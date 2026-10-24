import { signal } from '@preact/signals';
import { readSetting, writeSetting } from './storage';

export interface Prefs {
  /** Transições: completa, reduzida (só esmaecer) ou desligada. */
  motion: 'full' | 'reduced' | 'off';
  /** Vídeo de fundo toca (desligado, fica parado no primeiro quadro). */
  video: boolean;
  /** Idioma da camada; `auto` segue o client. */
  locale: 'auto' | 'pt' | 'en';
  /** Camada ao abrir o client: ligada, desligada ou como ficou da última vez (null). */
  openOnStart: boolean | null;
  /** Som ambiente (música das telas do client) e volume de 0 a 1. */
  ambient: boolean;
  ambientVolume: number;
  /** Som de clique em botões e abas, e volume de 0 a 1. */
  clicks: boolean;
  clickVolume: number;
  /** Animação de partida encontrada (cortina de vidro) e de entrada no lobby. */
  readyCheckAnim: boolean;
  lobbyAnim: boolean;
  /** Runas recomendadas (OP.GG) na seleção; usar a matchup; aplicar sozinho ao confirmar o campeão. */
  runesAuto: boolean;
  runesMatchup: boolean;
  runesApplyOnLock: boolean;
  /** Fundo do perfil pode ser a splash de qualquer skin, mesmo não possuída. */
  allSplashes: boolean;
  /** Aceitar a partida sozinho, depois de `acceptDelay` segundos (0 a 10). */
  autoAccept: boolean;
  acceptDelay: number;
  /** Manter o status do chat em offline, inclusive em partida. */
  appearOffline: boolean;
  /** Gaveta de amigos fixa aberta (recolhe só na seleção de campeões); as telas encolhem para caber ao lado. */
  socialPinned: boolean;
  /** Modo leve para PCs fracos (sem desfoque de vidro, sem vídeo de fundo, transições reduzidas); `auto` decide pelo hardware e pelos quadros. */
  lite: 'auto' | 'on' | 'off';
  /** Som de mensagem nova no chat (de outra pessoa), com o volume dos cliques. */
  chatSound: boolean;
  /** Integração com o ROSE (skins não possuídas e mods pelo app ROSE, que precisa estar rodando). */
  rose: boolean;
  /** Spotify do computador (widget tocando agora) e a música como recado do chat. */
  spotify: boolean;
  spotifyStatus: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  motion: 'full',
  video: true,
  locale: 'auto',
  openOnStart: null,
  ambient: true,
  ambientVolume: 0.35,
  clicks: true,
  clickVolume: 0.6,
  readyCheckAnim: true,
  lobbyAnim: true,
  runesAuto: true,
  runesMatchup: true,
  runesApplyOnLock: false,
  allSplashes: false,
  autoAccept: false,
  acceptDelay: 3,
  appearOffline: false,
  socialPinned: false,
  lite: 'auto',
  chatSound: true,
  rose: false,
  spotify: false,
  spotifyStatus: false,
};
const KEY = 'rlc.prefs';
const oneOf = <T extends string>(v: unknown, options: readonly T[], def: T): T => (options.includes(v as T) ? (v as T) : def);
const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);
const unit = (v: unknown, def: number): number => (typeof v === 'number' && v >= 0 && v <= 1 ? v : def);

export function sanitizePrefs(v: unknown): Prefs {
  const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  return {
    motion: oneOf(o.motion, ['full', 'reduced', 'off'], 'full'),
    video: o.video !== false,
    locale: oneOf(o.locale, ['auto', 'pt', 'en'], 'auto'),
    openOnStart: typeof o.openOnStart === 'boolean' ? o.openOnStart : null,
    ambient: bool(o.ambient, DEFAULT_PREFS.ambient),
    ambientVolume: unit(o.ambientVolume, DEFAULT_PREFS.ambientVolume),
    clicks: bool(o.clicks, DEFAULT_PREFS.clicks),
    clickVolume: unit(o.clickVolume, DEFAULT_PREFS.clickVolume),
    readyCheckAnim: bool(o.readyCheckAnim, DEFAULT_PREFS.readyCheckAnim),
    lobbyAnim: bool(o.lobbyAnim, DEFAULT_PREFS.lobbyAnim),
    runesAuto: bool(o.runesAuto, DEFAULT_PREFS.runesAuto),
    runesMatchup: bool(o.runesMatchup, DEFAULT_PREFS.runesMatchup),
    runesApplyOnLock: bool(o.runesApplyOnLock, DEFAULT_PREFS.runesApplyOnLock),
    allSplashes: bool(o.allSplashes, DEFAULT_PREFS.allSplashes),
    autoAccept: bool(o.autoAccept, DEFAULT_PREFS.autoAccept),
    acceptDelay: typeof o.acceptDelay === 'number' && Number.isFinite(o.acceptDelay) ? Math.min(10, Math.max(0, Math.round(o.acceptDelay))) : DEFAULT_PREFS.acceptDelay,
    appearOffline: bool(o.appearOffline, DEFAULT_PREFS.appearOffline),
    socialPinned: bool(o.socialPinned, DEFAULT_PREFS.socialPinned),
    lite: oneOf(o.lite, ['auto', 'on', 'off'], 'auto'),
    chatSound: bool(o.chatSound, DEFAULT_PREFS.chatSound),
    rose: bool(o.rose, DEFAULT_PREFS.rose),
    spotify: bool(o.spotify, DEFAULT_PREFS.spotify),
    spotifyStatus: bool(o.spotifyStatus, DEFAULT_PREFS.spotifyStatus),
  };
}

export const prefs = signal<Prefs>(DEFAULT_PREFS);
export const loadPrefs = (): Prefs => (prefs.value = sanitizePrefs(readSetting<unknown>(KEY, null)));
export function setPrefs(patch: Partial<Prefs>): void {
  prefs.value = { ...prefs.value, ...patch };
  writeSetting(KEY, prefs.value);
}

/** Locale a aplicar: o fixado nas preferências ou o do client (null enquanto o do client não chegou). */
export function effectiveLocale(pref: Prefs['locale'], client: string | undefined): string | null {
  if (pref === 'pt') return 'pt_BR';
  if (pref === 'en') return 'en_US';
  return client ?? null;
}
