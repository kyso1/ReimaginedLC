import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { prefs } from '../shell/prefs';

/**
 * Cliente da ponte do ROSE (github.com/Alban1911/Rose, MIT). O ROSE é um app à parte (Python, na bandeja) que injeta
 * no jogo a skin escolhida na seleção; os plugins dele falam com ele por WebSocket em 127.0.0.1, porta entre 50000 e
 * 50099 (a porta certa sai de `GET /bridge-port`). As mensagens daqui são as mesmas que os plugins dele mandam:
 * - `{ skin, originalName, timestamp }` (ROSE-SkinMonitor): nome localizado da skin, como no carrossel oficial; o ROSE
 *   acha o id pelo nome e só usa depois de travar o campeão, por isso a escolha é reenviada no `champion-locked`.
 * - `chroma-selection` (ROSE-ChromaWheel), `request-skin-mods` e `select-skin-mod` (ROSE-CustomSkinSelector).
 * Nada aqui escreve na LCU: skin não possuída nunca é equipada, quem a coloca no jogo é o ROSE.
 */

export type RoseStatus = 'off' | 'searching' | 'connected' | 'absent';
export interface RoseChroma {
  id: number;
  name: string;
  championId: number;
  baseSkinId: number;
}
/** Skin personalizada (mod `.fantome`/`.zip`) que o usuário pôs na pasta do ROSE. `raw` volta igual no `select-skin-mod`. */
export interface RoseMod {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  raw: Record<string, unknown>;
}

export const roseStatus = signal<RoseStatus>('off');
/** Última escolha mandada ao ROSE (skin por nome e, se houver, a croma). */
export const roseChoice = signal<{ name: string; chroma: RoseChroma | null } | null>(null);
/** Mods da última skin pedida (`skinId`) e o mod escolhido (`id`), como o ROSE confirmou. */
export const roseMods = signal<{ skinId: number; mods: RoseMod[] } | null>(null);
export const roseModSelected = signal<string | null>(null);

const FIRST_PORT = 50000;
const LAST_PORT = 50099;
// Mesma chave do ROSE-SkinMonitor (mesma origem): reaproveita a porta que ele já achou.
const PORT_KEY = 'rose_bridge_port';
const RETRY_MIN = 1000;
const RETRY_MAX = 30000;

let ws: WebSocket | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let retry = RETRY_MIN;
let wanted = false;
let connecting = false;

const cachedPort = (): number => {
  try {
    return Number(localStorage.getItem(PORT_KEY)) || FIRST_PORT;
  } catch {
    return FIRST_PORT;
  }
};

/** Porta da ponte: a guardada (ou 50000) primeiro, depois todas de uma vez. Null: ROSE não está rodando. */
export async function findPort(): Promise<number | null> {
  const ask = async (port: number) => {
    const r = await fetch(`http://127.0.0.1:${port}/bridge-port`, { signal: AbortSignal.timeout(400) });
    const n = r.ok ? parseInt((await r.text()).trim(), 10) : NaN;
    if (!(n > 0)) throw new Error('no port');
    return n;
  };
  const first = cachedPort();
  try {
    return await ask(first);
  } catch {
    /* segue para a varredura */
  }
  const rest: number[] = [];
  for (let p = FIRST_PORT; p <= LAST_PORT; p++) if (p !== first) rest.push(p);
  try {
    return await Promise.any(rest.map(ask));
  } catch {
    return null;
  }
}

function send(msg: Record<string, unknown>): void {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function resend(): void {
  const c = roseChoice.value;
  if (!c) return;
  send({ skin: c.name, originalName: c.name, timestamp: Date.now() });
  if (c.chroma) sendChroma(c.chroma);
}

const sendChroma = (c: RoseChroma) =>
  send({ type: 'chroma-selection', skinId: c.id, chromaId: c.id, chromaName: c.name, championId: c.championId, baseSkinId: c.baseSkinId, timestamp: Date.now() });

const modOf = (m: Record<string, unknown>): RoseMod => ({
  id: String(m.relativePath || m.modName || ''),
  name: String((typeof m.displayName === 'string' && m.displayName.trim()) || m.modName || ''),
  thumbnailUrl: typeof m.thumbnailUrl === 'string' ? m.thumbnailUrl : null,
  raw: m,
});

function receive(data: Record<string, unknown>): void {
  switch (data.type) {
    case 'champion-locked':
      if (data.locked) resend();
      else roseModSelected.value = null;
      break;
    case 'phase-change':
      if (data.phase === 'Lobby') {
        roseChoice.value = null;
        roseMods.value = null;
        roseModSelected.value = null;
      }
      break;
    case 'skin-mods-response': {
      const skinId = Number(data.skinId);
      const list = Array.isArray(data.mods) ? (data.mods as Array<Record<string, unknown>>) : [];
      // Mesmo filtro do ROSE-CustomSkinSelector: só os mods feitos para esta skin.
      const fits = (m: Record<string, unknown>) =>
        m.availableForRequestedSkin === true || (Array.isArray(m.targetSkinIds) && m.targetSkinIds.map(Number).includes(skinId)) || (m.availableForRequestedSkin == null && Number(m.skinId) === skinId);
      roseMods.value = { skinId, mods: list.filter(fits).map(modOf).filter((m) => m.id) };
      break;
    }
    case 'custom-mod-selection-result':
      if (data.success) roseModSelected.value = data.operation === 'select' ? String(data.relativePath || data.modId || '') || null : null;
      break;
    case 'custom-mod-state':
      roseModSelected.value = data.active === false ? null : String(data.relativePath || data.modName || '') || null;
      break;
  }
}

function schedule(): void {
  if (!wanted || timer) return;
  timer = setTimeout(() => {
    timer = null;
    void connect();
  }, retry);
  retry = Math.min(retry * 2, RETRY_MAX);
}

async function connect(): Promise<void> {
  if (!wanted || ws || connecting) return;
  connecting = true;
  if (roseStatus.value === 'off') roseStatus.value = 'searching';
  const port = await findPort();
  connecting = false;
  if (!wanted) return;
  if (port === null) {
    roseStatus.value = 'absent';
    return schedule();
  }
  try {
    localStorage.setItem(PORT_KEY, String(port));
  } catch {
    /* sem armazenamento, varre de novo na próxima */
  }
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  ws = socket;
  socket.onopen = () => {
    retry = RETRY_MIN;
    roseStatus.value = 'connected';
    resend();
  };
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(String(e.data));
      if (data && typeof data === 'object') receive(data as Record<string, unknown>);
    } catch {
      /* texto solto do ROSE: ignora */
    }
  };
  socket.onclose = () => {
    if (ws !== socket) return;
    ws = null;
    if (!wanted) return;
    roseStatus.value = 'absent';
    schedule();
  };
}

/** Liga a ponte (procura o ROSE e reconecta com recuo de 1 s a 30 s). */
export function startRose(): void {
  wanted = true;
  void connect();
}

export function stopRose(): void {
  wanted = false;
  if (timer) clearTimeout(timer);
  timer = null;
  retry = RETRY_MIN;
  const socket = ws;
  ws = null;
  socket?.close();
  roseStatus.value = 'off';
}

/** Ponte ligada enquanto `on`; ao desmontar, desliga se a preferência estiver desligada (Configurações só sonda). */
export function useRose(on: boolean): void {
  useEffect(() => {
    if (!on) return;
    startRose();
    return () => {
      if (!prefs.value.rose) stopRose();
    };
  }, [on]);
}

/** Escolhe a skin pelo nome localizado (o que o ROSE-SkinMonitor leria no carrossel oficial). Zera a croma. */
export function chooseRoseSkin(name: string): void {
  roseChoice.value = { name, chroma: null };
  send({ skin: name, originalName: name, timestamp: Date.now() });
}

export function chooseRoseChroma(skinName: string, chroma: RoseChroma): void {
  if (roseChoice.value?.name !== skinName) chooseRoseSkin(skinName);
  roseChoice.value = { name: skinName, chroma };
  sendChroma(chroma);
}

export function requestRoseMods(championId: number, skinId: number): void {
  send({ type: 'request-skin-mods', championId, skinId });
}

/** Escolhe um mod para a skin; `null` volta para a skin sem mod. */
export function selectRoseMod(championId: number, skinId: number, mod: RoseMod | null): void {
  const requestId = `rlc-${Date.now()}`;
  if (mod) send({ type: 'select-skin-mod', championId, skinId, modId: mod.id, modData: mod.raw, requestId });
  else send({ type: 'select-skin-mod', championId, skinId, modId: null, expectedModId: roseModSelected.value, requestId });
}
