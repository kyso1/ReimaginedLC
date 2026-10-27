import { effect } from '@preact/signals';
import { t } from '../i18n';
import { enabled } from './layer';
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

/** Saída de tela cheia que nós pedimos (troca para o client da Riot): não mexe na preferência. */
let leavingForRiot = false;
let disarm: (() => void) | null = null;

const want = () => enabled.value && prefs.value.fullscreen && prefs.value.fullscreenOn;

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
  const onChange = () => {
    if (doc.fullscreenElement) return;
    if (leavingForRiot) {
      leavingForRiot = false;
      return;
    }
    // Saiu por conta própria (Esc do navegador): fica fora até pedir de novo.
    if (prefs.value.fullscreenOn) setPrefs({ fullscreenOn: false });
  };
  doc.addEventListener('fullscreenchange', onChange);
  const stop = effect(() => {
    const on = enabled.value;
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
  };
}
