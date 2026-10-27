import { effect } from '@preact/signals';
import { t } from '../i18n';
import { shown } from './layer';
import { prefs, setPrefs } from './prefs';

/**
 * Tela cheia da nossa interface (Fullscreen API: a janela cobre a tela e a interface ganha o espaço).
 *
 * - O estado fica guardado (`fullscreenOn`): o client volta a abrir em tela cheia.
 * - O Chromium só entra em tela cheia a partir de um gesto do usuário. Ao abrir o client ou ligar a camada, a tela cheia
 *   entra no primeiro clique ou tecla (o atalho Ctrl+Shift+F12 já é esse gesto).
 * - Trocar para o client da Riot sai da tela cheia e o Chromium devolve a janela ao tamanho e à posição de antes; isso
 *   não conta como o usuário desligar.
 */

/** Espera depois do último `resize` antes de conferir se a janela ainda cobre a tela. */
export const RESIZE_SETTLE_MS = 600;

/** Saída de tela cheia que nós pedimos (troca para o client da Riot): não mexe na preferência. */
let leavingForRiot = false;
let disarm: (() => void) | null = null;

const want = () => shown.value && prefs.value.fullscreen && prefs.value.fullscreenOn;

function request(doc: Document, warn: boolean): Promise<void> {
  const r = doc.documentElement.requestFullscreen?.() ?? Promise.reject(new Error('sem Fullscreen API'));
  return r.catch((e: unknown) => {
    if (warn) window.Toast?.error(t('fullscreenFailed'));
    throw e;
  });
}

/** Evento sem ativação do usuário (sintético, ou o Chromium recusou): não conta como o gesto. */
const activated = () => (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation?.isActive !== false;

/** Espera o próximo clique ou tecla para entrar (o gesto que o Chromium exige). */
function arm(doc: Document): void {
  if (disarm) return;
  const go = () => {
    if (!want() || doc.fullscreenElement) return disarm?.();
    if (!activated()) return;
    disarm?.();
    // Recusou mesmo assim: espera o próximo gesto.
    request(doc, false).catch(() => want() && !doc.fullscreenElement && arm(doc));
  };
  doc.addEventListener('pointerdown', go, true);
  doc.addEventListener('keydown', go, true);
  disarm = () => {
    doc.removeEventListener('pointerdown', go, true);
    doc.removeEventListener('keydown', go, true);
    disarm = null;
  };
}

/** Botão e F11: liga ou desliga, e guarda a escolha. */
export function toggleFullscreen(doc: Document = document): void {
  if (doc.fullscreenElement) {
    setPrefs({ fullscreenOn: false });
    void doc.exitFullscreen().catch(() => {});
  } else {
    setPrefs({ fullscreenOn: true });
    void request(doc, true).catch(() => {});
  }
}

/** Liga o comportamento (uma vez, no início). Devolve a função que desliga (testes). */
export function startFullscreen(doc: Document = document): () => void {
  const view = doc.defaultView ?? window;
  // Maior tamanho da janela desde que entrou em tela cheia (o da tela). `screen` não serve: o client informa como "tela"
  // o tamanho da própria janela.
  let full: [number, number] = [0, 0];
  const onChange = () => {
    if (doc.fullscreenElement) {
      full = [view.outerWidth, view.outerHeight];
      return;
    }
    if (leavingForRiot) {
      leavingForRiot = false;
      // Saída por janela fora do tamanho com a nossa interface na tela: volta no próximo clique.
      if (want()) arm(doc);
      return;
    }
    // Saiu por conta própria (Esc do navegador): fica fora até pedir de novo.
    if (prefs.value.fullscreenOn) setPrefs({ fullscreenOn: false });
  };
  doc.addEventListener('fullscreenchange', onChange);
  // Alguém mudou o tamanho da janela com ela em tela cheia (a Riot faz isso em alguns momentos): o documento continua
  // "em tela cheia" numa janela menor e tudo trava. Sai dela sem mexer na preferência; o próximo clique volta.
  // Confere depois de assentar: entrando na tela cheia, a janela cresce em vários passos.
  let check: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(check);
    check = setTimeout(() => {
      if (!doc.fullscreenElement) return;
      const w = view.outerWidth;
      const h = view.outerHeight;
      if (w >= full[0] - 8 && h >= full[1] - 8) {
        full = [Math.max(w, full[0]), Math.max(h, full[1])];
        return;
      }
      leavingForRiot = true;
      void doc.exitFullscreen().catch(() => {});
    }, RESIZE_SETTLE_MS);
  };
  view.addEventListener('resize', onResize);
  const stop = effect(() => {
    const on = shown.value;
    const allowed = prefs.value.fullscreen;
    if (!on || !allowed) {
      disarm?.();
      if (doc.fullscreenElement) {
        // Camada desligada: volta ao client da Riot no tamanho de antes, lembrando de voltar à tela cheia depois.
        leavingForRiot = !on && allowed;
        void doc.exitFullscreen().catch(() => {});
      }
      return;
    }
    if (want() && !doc.fullscreenElement) arm(doc);
  });
  return () => {
    stop();
    disarm?.();
    doc.removeEventListener('fullscreenchange', onChange);
    view.removeEventListener('resize', onResize);
    clearTimeout(check);
  };
}
