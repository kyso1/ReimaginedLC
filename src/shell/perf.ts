import { effect, signal, type Signal } from '@preact/signals';
import { request } from '../lcu/request';
import type { Prefs } from './prefs';

/** Quadro da nossa loja que mostra a página da Riot por cima (RiotStore.tsx): com ele aberto, nada fica congelado. */
const RIOT_PAGE = '.rlc-sto-riot';

/**
 * Congela a interface escondida da Riot: pausa os vídeos dela (inclusive os que tocarem depois) e marca a raiz com
 * `data-rlc-frozen`, que tira a árvore da renderização (styles.css). Os modais da Riot (compra, pagamento) ficam no
 * gerenciador de camadas, fora da raiz, e não são afetados. Devolve a função que desfaz: retoma só o que pausamos.
 */
export function freezeRiot(riot: HTMLElement, ours: HTMLElement, doc: Document = document): () => void {
  const paused = new Set<HTMLVideoElement>();
  let held = false;
  const pause = (v: HTMLVideoElement) => {
    if (v.paused) return;
    v.pause();
    paused.add(v);
  };
  // Vídeo novo com autoplay ou play() da Riot: o evento `play` não sobe, mas passa pela captura do documento.
  const onPlay = (e: Event) => {
    if (!held && e.target instanceof HTMLVideoElement && riot.contains(e.target)) pause(e.target);
  };
  const freeze = () => {
    riot.dataset.rlcFrozen = '';
    riot.querySelectorAll('video').forEach(pause);
  };
  const thaw = () => {
    delete riot.dataset.rlcFrozen;
    for (const v of paused) if (v.isConnected && !v.ended) void v.play()?.catch(() => {});
    paused.clear();
  };
  const check = () => {
    const page = !!ours.querySelector(RIOT_PAGE);
    if (page === held) return;
    held = page;
    if (page) thaw();
    else freeze();
  };
  // ponytail: observa a nossa árvore inteira só para achar o quadro da loja da Riot; um aviso direto da loja dispensaria isto.
  const observer = new MutationObserver(check);
  observer.observe(ours, { childList: true, subtree: true });
  doc.addEventListener('play', onPlay, true);
  held = !!ours.querySelector(RIOT_PAGE);
  if (!held) freeze();
  return () => {
    observer.disconnect();
    doc.removeEventListener('play', onPlay, true);
    thaw();
  };
}

/** Modo leve automático: ligado por hardware fraco ou pela medição de quadros. */
export const liteAuto = signal(false);

/** PC fraco pelo que o navegador informa (núcleos ou memória em GB). */
export const weakHardware = (nav: Pick<Navigator, 'hardwareConcurrency'> & { deviceMemory?: number } = navigator): boolean =>
  (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) || (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4);

export const isLite = (pref: Prefs['lite'], auto: boolean): boolean => (pref === 'auto' ? auto : pref === 'on');

/** Quadros por segundo medidos com requestAnimationFrame durante `ms`. */
export function measureFps(ms = 3000, raf: (fn: () => void) => unknown = (fn) => requestAnimationFrame(fn), now = () => performance.now()): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = now();
    const tick = () => {
      frames++;
      const elapsed = now() - start;
      if (elapsed < ms) raf(tick);
      else resolve((frames * 1000) / elapsed);
    };
    raf(tick);
  });
}

const MIN_FPS = 40;
const PROBE_WINDOW_MS = 60_000;

/**
 * Decide o modo leve automático uma vez por sessão: hardware fraco liga na hora; senão, uma medição de 3 s no
 * primeiro minuto, só com a janela focada (sem foco o navegador segura os quadros). Média abaixo de 40 liga.
 */
export function probeLite(focused: Signal<boolean>, nav?: Parameters<typeof weakHardware>[0], measure: () => Promise<number> = () => measureFps()): void {
  if (weakHardware(nav)) {
    liteAuto.value = true;
    return;
  }
  let done = false;
  let running = false;
  const stop = effect(() => {
    // Lido antes de tudo: o efeito só volta a rodar pelo foco se o signal foi lido.
    const isFocused = focused.value;
    if (done || running || !isFocused) return;
    running = true;
    void measure().then((fps) => {
      running = false;
      // Perdeu o foco no meio: a medição não vale, tenta no próximo foco.
      if (done || !focused.peek()) return;
      done = true;
      if (fps < MIN_FPS) liteAuto.value = true;
    });
  });
  setTimeout(() => {
    done = true;
    stop();
  }, PROBE_WINDOW_MS);
}

/** Configuração do client oficial "Ativar modo de especificação baixa" (local, sem conta). */
const UX = '/lol-settings/v1/local/lol-user-experience';

/** Valor atual do modo de baixo consumo da Riot; null quando a LCU não respondeu. */
export async function readPotato(fetcher: typeof fetch = (u) => fetch(u)): Promise<boolean | null> {
  try {
    const r = await fetcher(UX);
    if (!r.ok) return null;
    const body = (await r.json()) as { data?: { potatoModeEnabled?: unknown } } | null;
    return body?.data?.potatoModeEnabled === true;
  } catch {
    return null;
  }
}

/** Grava como o client oficial (persistence.saveSetting): PATCH com o esquema 3 e só o campo mudado. */
export const writePotato = (on: boolean) => request('PATCH', UX, { schemaVersion: 3, data: { potatoModeEnabled: on } });
