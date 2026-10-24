import { effect } from '@preact/signals';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { prefs } from '../shell/prefs';

/**
 * Aceita a partida depois do atraso escolhido. Cada ready check é aceito uma vez só: um que o jogador
 * recusou, ou que já foi respondido, não é aceito de novo. O temporizador some se o ready check acabar antes.
 */
export function startAutoAccept(lcu: Lcu): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let handled = false;
  const stop = effect(() => {
    const check = lcu.readyCheck.value.data;
    const { autoAccept, acceptDelay } = prefs.value;
    const pending = check?.state === 'InProgress' && check.playerResponse === 'None';
    if (!pending) {
      if (timer) clearTimeout(timer);
      timer = null;
      // Respondido (aceito ou recusado) segura até o fim; encerrado libera o próximo.
      handled = check?.state === 'InProgress';
      return;
    }
    if (!autoAccept) {
      if (timer) clearTimeout(timer);
      timer = null;
      return;
    }
    if (handled || timer) return;
    timer = setTimeout(() => {
      timer = null;
      handled = true;
      void request('POST', '/lol-matchmaking/v1/ready-check/accept').catch(() => {});
    }, acceptDelay * 1000);
  });
  return () => {
    stop();
    if (timer) clearTimeout(timer);
  };
}
