import { effect, signal } from '@preact/signals';
import { findHelper, helperVersion } from '../theme/wallpapers';
import { shown } from './layer';
import { prefs, setPrefs } from './prefs';

/**
 * Janela maximizada como num navegador: ocupa a área de trabalho e a barra de tarefas continua à vista. A página não
 * consegue mexer na própria janela e a Riot não tem isso; quem faz é o auxiliar (helper/rlc-fundos.ps1, versão 2+),
 * que também guarda o tamanho de antes para voltar a ele.
 *
 * - A escolha fica guardada (`maximized`) e volta sozinha ao abrir o client (sem precisar de clique).
 * - Trocar para o client da Riot devolve o tamanho de antes; voltar maximiza de novo.
 */

/** Auxiliar com suporte a janela encontrado (o botão só aparece com ele). */
export const canMaximize = signal(false);
/** A janela está maximizada por nós agora. */
export const isMaximized = signal(false);

/**
 * Tamanho da janela da Riot: a página dela tem 1280x720 com o zoom do tamanho de janela escolhido (1600x900 = 1,25).
 * O auxiliar usa quando perdeu o tamanho de antes (reiniciou com a janela maximizada, por exemplo).
 */
export function riotSize(doc: Document = document): [number, number] {
  const zoom = Number.parseFloat(getComputedStyle(doc.documentElement).zoom) || 1;
  return [Math.round(1280 * zoom), Math.round(720 * zoom)];
}

const call = async (what: 'maximize' | 'restore'): Promise<boolean> => {
  const base = await findHelper();
  if (!base || helperVersion.value < 2) return false;
  const [w, h] = riotSize();
  try {
    const r = await fetch(`${base}/v1/window/${what}${what === 'restore' ? `?w=${w}&h=${h}` : ''}`, { method: 'POST' });
    return r.ok && ((await r.json()) as { ok?: unknown }).ok === true;
  } catch {
    return false;
  }
};

// Um pedido por vez: dois maximizar seguidos guardariam o tamanho já maximizado como "o de antes".
let busy: Promise<void> = Promise.resolve();
const queue = (fn: () => Promise<void>) => (busy = busy.then(fn, fn));

/** Depois de sair da tela cheia, o Chromium ainda devolve a janela ao tamanho de antes dela; esperar isso assentar. */
export const SETTLE_MS = 300;
const FULLSCREEN_EXIT_MS = 3000;

/**
 * Nunca mexer na janela em tela cheia: o Chromium, ao sair dela, devolve o tamanho de antes e desfaz o nosso (a Riot
 * ficava maximizada e o tamanho guardado se perdia), ou a janela encolhe ainda "em tela cheia" e tudo trava. Sai da tela
 * cheia (se ninguém saiu ainda) e espera; `false` se ela não saiu.
 */
function windowed(doc: Document = document): Promise<boolean> {
  if (!doc.fullscreenElement) return Promise.resolve(true);
  return new Promise((done) => {
    const end = () => {
      doc.removeEventListener('fullscreenchange', onChange);
      clearTimeout(timer);
      setTimeout(() => done(!doc.fullscreenElement), SETTLE_MS);
    };
    const onChange = () => !doc.fullscreenElement && end();
    const timer = setTimeout(end, FULLSCREEN_EXIT_MS);
    doc.addEventListener('fullscreenchange', onChange);
    void doc.exitFullscreen?.().catch(() => {});
  });
}

/** `fromButton`: o usuário pediu, então sai da tela cheia para maximizar; sozinho (preferência lembrada), não tira dela. */
const maximize = (fromButton = false) =>
  queue(async () => {
    if (isMaximized.value || (document.fullscreenElement && !fromButton)) return;
    if (!(await windowed())) return;
    if (await call('maximize')) isMaximized.value = true;
  });

const restore = () =>
  queue(async () => {
    if (!isMaximized.value || !(await windowed())) return;
    if (await call('restore')) isMaximized.value = false;
  });

/** Botão: maximiza ou volta ao tamanho de antes, e guarda a escolha. */
export function toggleMaximize(): void {
  const next = !isMaximized.value;
  setPrefs({ maximized: next });
  void (next ? maximize(true) : restore());
}

/** Liga o comportamento (uma vez, no início). Devolve a função que desliga (testes). */
export function startWindow(): () => void {
  void findHelper().then(() => (canMaximize.value = helperVersion.value >= 2));
  const stop = effect(() => {
    const want = shown.value && prefs.value.maximized;
    if (want)
      void findHelper().then(() => {
        if (helperVersion.value >= 2) void maximize();
      });
    else void restore();
  });
  // A Riot devolve a janela ao tamanho dela em alguns momentos (fim de partida, por exemplo): ao voltar o foco,
  // se a janela não está na área de trabalho, maximiza de novo.
  const onFocus = () => {
    if (!shown.value || !prefs.value.maximized || document.fullscreenElement) return;
    if (window.outerWidth < screen.availWidth - 8 || window.outerHeight < screen.availHeight - 8) {
      isMaximized.value = false;
      void maximize();
    }
  };
  window.addEventListener('focus', onFocus);
  return () => {
    stop();
    window.removeEventListener('focus', onFocus);
  };
}
