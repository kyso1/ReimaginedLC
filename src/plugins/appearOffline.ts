import { effect } from '@preact/signals';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { prefs } from '../shell/prefs';

/** Espera antes de reafirmar (a LCU às vezes troca o status duas vezes seguidas) e intervalo mínimo entre envios. */
export const SETTLE_MS = 1500;
export const MIN_GAP_MS = 5000;

/**
 * Aparecer offline: enquanto ligado, põe o status do chat em `offline` e reafirma sempre que a LCU mudar
 * (ao entrar em partida o client põe `dnd`). O intervalo mínimo entre envios impede laço com a LCU.
 * Ao desligar, volta para `chat`. Só vale com o client aberto; a troca pode aparecer por um instante.
 */
export function startAppearOffline(lcu: Lcu, now: () => number = Date.now): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSent = -Infinity;
  let wasOn = false;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const stop = effect(() => {
    const on = prefs.value.appearOffline;
    const availability = lcu.chatMe.value.data?.availability;
    if (!on) {
      cancel();
      if (wasOn && availability === 'offline') void request('PUT', '/lol-chat/v1/me', { availability: 'chat' }).catch(() => {});
      wasOn = false;
      return;
    }
    wasOn = true;
    if (!availability || availability === 'offline') return cancel();
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      // Confere de novo: a LCU pode ter voltado sozinha, ou o jogador desligou.
      if (!prefs.peek().appearOffline || lcu.chatMe.peek().data?.availability === 'offline') return;
      lastSent = now();
      void request('PUT', '/lol-chat/v1/me', { availability: 'offline' }).catch(() => {});
    }, Math.max(SETTLE_MS, lastSent + MIN_GAP_MS - now()));
  });
  return () => {
    stop();
    cancel();
  };
}
