import { effect, signal } from '@preact/signals';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { prefs } from '../shell/prefs';
import { readSetting, writeSetting } from '../shell/storage';

/**
 * Spotify do computador pela Web API (developer.spotify.com/documentation/web-api). Sem segredo no plugin: o usuário cria
 * o próprio app no painel do Spotify e cola o Client ID; o login é Authorization Code com PKCE.
 * Redirecionamento: o Spotify aceita IP de loopback sem porta e completa a porta na hora do pedido
 * (developer.spotify.com/documentation/web-api/concepts/redirect_uri). Registrando `https://127.0.0.1/rlc-spotify`, a
 * volta cai na própria origem da LCU (`https://127.0.0.1:<porta>`), então a janela de login é legível daqui e o código
 * sai sozinho. Se não der, o usuário abre o login no navegador e cola o endereço final.
 */

export interface SpotifyTrack {
  name: string;
  artists: string;
  album: string;
  art: string | null;
  playing: boolean;
  progressMs: number;
  durationMs: number;
  /** Volume do dispositivo (0 a 100); null quando o dispositivo não deixa mudar. */
  volume: number | null;
  /** Quando `progressMs` foi lido (para a barra andar entre as consultas). */
  at: number;
}

interface Saved {
  clientId?: string;
  redirect?: string;
  refresh?: string;
  /** Recado do chat de antes da música (volta ao desligar). Fica gravado para voltar mesmo depois de fechar o client. */
  prevStatus?: string;
}

const KEY = 'rlc.spotify';
const ACCOUNTS = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
export const DEFAULT_REDIRECT = 'https://127.0.0.1/rlc-spotify';
export const FAST_MS = 5000;
export const SLOW_MS = 30000;

export const spotifyConfig = signal<Saved>({});
export const spotifyTrack = signal<SpotifyTrack | null>(null);
/** Falso depois de um 403 em controle: a conta não é Premium (o Spotify só deixa controlar com Premium). */
export const spotifyCanControl = signal(true);
export const spotifyError = signal<string | null>(null);

const save = (patch: Partial<Saved>) => {
  spotifyConfig.value = { ...spotifyConfig.value, ...patch };
  writeSetting(KEY, spotifyConfig.value);
};
export const loadSpotify = () => (spotifyConfig.value = readSetting<Saved>(KEY, {}) ?? {});
export const setSpotifyClient = (clientId: string, redirect?: string) => save({ clientId: clientId.trim(), redirect: redirect?.trim() || undefined });

// ---------- PKCE e redirecionamento ----------

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const randomString = (n = 48) => b64url(crypto.getRandomValues(new Uint8Array(n)));
export async function challengeOf(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}

/** Endereço mandado ao Spotify: o registrado e, se for loopback sem porta no mesmo esquema da página, a porta da página. */
export function redirectFor(registered: string, origin: string = location.origin): string {
  try {
    const u = new URL(registered);
    const page = new URL(origin);
    if ((u.hostname === '127.0.0.1' || u.hostname === '[::1]') && !u.port && u.protocol === page.protocol) u.port = page.port;
    return u.href;
  } catch {
    return registered;
  }
}

/** Lê o endereço de volta do login: o código, um erro do Spotify, ou null se não é a volta deste pedido. */
export function readCallback(href: string, state: string): { code: string } | { error: string } | null {
  let u: URL;
  try {
    u = new URL(href.trim());
  } catch {
    return null;
  }
  const q = u.searchParams;
  if (q.get('state') !== state) return null;
  const error = q.get('error');
  if (error) return { error };
  const code = q.get('code');
  return code ? { code } : null;
}

// ---------- tokens ----------

let access: { token: string; until: number } | null = null;
let pending: { verifier: string; state: string; redirect: string } | null = null;

async function tokenRequest(body: Record<string, string>): Promise<boolean> {
  const r = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: spotifyConfig.peek().clientId ?? '', ...body }),
  });
  const json = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; refresh_token?: string; error?: string };
  if (!r.ok || !json.access_token) {
    // Refresh revogado ou app apagado: desconecta para o usuário entrar de novo.
    if (json.error === 'invalid_grant' || json.error === 'invalid_client') disconnectSpotify();
    spotifyError.value = json.error ?? `HTTP ${r.status}`;
    return false;
  }
  access = { token: json.access_token, until: Date.now() + (json.expires_in ?? 3600) * 1000 - 60000 };
  // O Spotify pode trocar o refresh token a cada renovação.
  if (json.refresh_token) save({ refresh: json.refresh_token });
  spotifyError.value = null;
  return true;
}

async function accessToken(force = false): Promise<string | null> {
  if (!force && access && access.until > Date.now()) return access.token;
  const refresh = spotifyConfig.peek().refresh;
  if (!refresh) return null;
  return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh })) ? access!.token : null;
}

let backoffUntil = 0;

/** Chamada à Web API com renovação no 401 e espera do Retry-After no 429. Null: sem conexão ou esperando. */
export async function api(method: string, path: string, now: () => number = Date.now): Promise<Response | null> {
  if (now() < backoffUntil) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await accessToken(attempt > 0);
    if (!token) return null;
    const r = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) continue;
    if (r.status === 429) {
      backoffUntil = now() + (Number(r.headers.get('Retry-After')) || 5) * 1000;
      return null;
    }
    return r;
  }
  return null;
}

// ---------- login ----------

async function authorizeUrl(): Promise<string | null> {
  const { clientId, redirect } = spotifyConfig.peek();
  if (!clientId) return null;
  const verifier = randomString();
  pending = { verifier, state: randomString(16), redirect: redirectFor(redirect || DEFAULT_REDIRECT) };
  const q = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: pending.redirect,
    code_challenge_method: 'S256',
    code_challenge: await challengeOf(verifier),
    scope: SCOPES,
    state: pending.state,
  });
  return `${ACCOUNTS}/authorize?${q}`;
}

/** Termina o login com o endereço de volta (lido da janela ou colado). Verdadeiro se conectou. */
export async function finishSpotifyLogin(href: string): Promise<boolean> {
  if (!pending) return false;
  const got = readCallback(href, pending.state);
  if (!got) return false;
  if ('error' in got) {
    spotifyError.value = got.error;
    return false;
  }
  const { verifier, redirect } = pending;
  pending = null;
  const ok = await tokenRequest({ grant_type: 'authorization_code', code: got.code, redirect_uri: redirect, code_verifier: verifier });
  if (ok) kick();
  return ok;
}

/** Login numa janela do próprio client: quando ela volta para a nossa origem, lê o código e fecha. */
export async function connectSpotify(): Promise<void> {
  const url = await authorizeUrl();
  if (!url) return;
  const popup = window.open(url, 'rlc-spotify', 'width=480,height=720');
  if (!popup) return;
  const target = pending!.redirect.split('?')[0]!;
  const watch = setInterval(() => {
    if (popup.closed) return clearInterval(watch);
    let href = '';
    try {
      href = popup.location.href;
    } catch {
      return; // ainda no Spotify (outra origem)
    }
    if (!href.startsWith(target)) return;
    clearInterval(watch);
    popup.close();
    void finishSpotifyLogin(href);
  }, 500);
}

/** Alternativa: login no navegador do sistema; o usuário cola o endereço em que ele parar. */
export async function connectSpotifyInBrowser(): Promise<void> {
  const url = await authorizeUrl();
  if (url) void request('POST', '/riotclient/open-url-in-browser', url).catch(() => {});
}

export function disconnectSpotify(): void {
  access = null;
  save({ refresh: undefined });
  spotifyTrack.value = null;
}

// ---------- tocando agora ----------

type Img = { url?: string; width?: number | null };
type PlayerJson = {
  is_playing?: boolean;
  progress_ms?: number | null;
  device?: { volume_percent?: number | null; supports_volume?: boolean };
  item?: { name?: string; duration_ms?: number; artists?: Array<{ name?: string }>; album?: { name?: string; images?: Img[] }; show?: { name?: string; images?: Img[] }; images?: Img[] } | null;
};

export function trackOf(j: PlayerJson, at: number = Date.now()): SpotifyTrack | null {
  const item = j.item;
  if (!item?.name) return null;
  // Menor capa que ainda fica nítida no widget (o Spotify manda da maior para a menor).
  const images = item.album?.images ?? item.images ?? item.show?.images ?? [];
  const art = images.filter((i) => (i.width ?? 300) >= 64).pop()?.url ?? images[0]?.url ?? null;
  return {
    name: item.name,
    artists: (item.artists ?? []).map((a) => a.name).filter(Boolean).join(', ') || item.show?.name || '',
    album: item.album?.name ?? item.show?.name ?? '',
    art,
    playing: !!j.is_playing,
    progressMs: j.progress_ms ?? 0,
    durationMs: item.duration_ms ?? 0,
    volume: j.device?.supports_volume === false ? null : (j.device?.volume_percent ?? null),
    at,
  };
}

let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let slow: () => boolean = () => false;

async function poll(): Promise<void> {
  timer = null;
  if (!running) return;
  try {
    const r = await api('GET', '/me/player?additional_types=episode');
    if (r?.status === 204) spotifyTrack.value = null;
    else if (r?.ok) spotifyTrack.value = trackOf((await r.json()) as PlayerJson);
  } catch {
    /* sem rede: tenta na próxima */
  }
  if (!running) return;
  if (!spotifyConfig.peek().refresh) spotifyTrack.value = null;
  timer = setTimeout(poll, Math.max(slow() ? SLOW_MS : FAST_MS, backoffUntil - Date.now()));
}

/** Consulta já (depois de conectar ou de um controle). */
function kick(delay = 0): void {
  if (!running) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(poll, delay);
}

/** Controle do player. 403 = conta sem Premium (ou dispositivo sem controle): mostra os botões desligados com aviso. */
export async function spotifyControl(action: 'play' | 'pause' | 'next' | 'previous' | 'volume' | 'seek', value?: number): Promise<void> {
  const path =
    action === 'volume' ? `/me/player/volume?volume_percent=${Math.round(value ?? 0)}` : action === 'seek' ? `/me/player/seek?position_ms=${Math.round(value ?? 0)}` : `/me/player/${action}`;
  const t = spotifyTrack.peek();
  // Resposta imediata na tela; a próxima consulta confirma.
  if (t && (action === 'play' || action === 'pause')) spotifyTrack.value = { ...t, playing: action === 'play', progressMs: t.progressMs + (t.playing ? Date.now() - t.at : 0), at: Date.now() };
  if (t && action === 'seek') spotifyTrack.value = { ...t, progressMs: value ?? 0, at: Date.now() };
  if (t && action === 'volume') spotifyTrack.value = { ...t, volume: value ?? 0 };
  const r = await api(action === 'next' || action === 'previous' ? 'POST' : 'PUT', path).catch(() => null);
  if (r?.status === 403) spotifyCanControl.value = false;
  else if (r?.ok) spotifyCanControl.value = true;
  kick(400);
}

// ---------- recado do chat ----------

/** Texto do recado do chat (a LCU corta recados longos; 120 caracteres cabe no cartão de amigo). */
export const statusText = (t: SpotifyTrack) => `♪ ${t.name}${t.artists ? ` — ${t.artists}` : ''}`.slice(0, 120);

/** Último recado mandado: a LCU demora a avisar a troca, e sem isso o mesmo texto iria duas vezes. */
let sent: string | null = null;

function syncStatus(lcu: Lcu, want: string | null): void {
  const current = lcu.chatMe.peek().data?.statusMessage ?? '';
  const prev = spotifyConfig.peek().prevStatus;
  if (want === null) {
    if (prev === undefined) return;
    save({ prevStatus: undefined });
    sent = null;
    if (current !== prev) void request('PUT', '/lol-chat/v1/me', { statusMessage: prev }).catch(() => {});
    return;
  }
  if (!lcu.chatMe.peek().data) return;
  // ponytail: se o jogador editar o recado com a música tocando, o texto dele some ao trocar de faixa; detectar edição manual se incomodar.
  if (prev === undefined) save({ prevStatus: current });
  if (current === want || sent === want) return;
  sent = want;
  void request('PUT', '/lol-chat/v1/me', { statusMessage: want }).catch(() => {});
}

/** Liga a consulta enquanto o plugin estiver ligado (5 s visível, 30 s escondido ou em partida) e o recado do chat. */
export function startSpotify(lcu: Lcu): () => void {
  loadSpotify();
  slow = () => document.hidden || lcu.gameflowPhase.peek().data === 'InProgress';
  const onVisible = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVisible);
  const stopPoll = effect(() => {
    const on = prefs.value.spotify && !!spotifyConfig.value.refresh;
    if (on === running) return;
    running = on;
    if (on) kick();
    else {
      if (timer) clearTimeout(timer);
      timer = null;
      spotifyTrack.value = null;
    }
  });
  const stopStatus = effect(() => {
    const t = spotifyTrack.value;
    const on = prefs.value.spotify && prefs.value.spotifyStatus;
    // Lê chatMe para reafirmar quando o chat chegar; o texto só é mandado se mudou.
    void lcu.chatMe.value;
    syncStatus(lcu, on && t?.playing ? statusText(t) : null);
  });
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    stopPoll();
    stopStatus();
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
  };
}
