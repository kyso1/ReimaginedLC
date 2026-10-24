import { useEffect } from 'preact/hooks';
import { prefs } from './prefs';

/** Sons do próprio client da Riot, servidos pelo `/fe/` de cada módulo. */
export const SOUNDS = {
  ambient: '/fe/lol-navigation/music-ac-home-main.ogg',
  click: '/fe/lol-parties/sfx-soc-ui-click-generic.ogg',
  confirm: '/fe/lol-parties/sfx-gameselect-button-confirm-click.ogg',
  tab: '/fe/lol-parties/sfx-uikit-grid-click.ogg',
  /** O mesmo aviso de mensagem recebida do chat da Riot (rcp-fe-lol-social, `chatMessage`). */
  chat: '/fe/lol-social/sounds/sfx-soc-notif-chat-rcvd.ogg',
} as const;

/** Aviso de mensagem nova, com o volume dos cliques; segue a pref `chatSound`. */
export function playChatSound(): void {
  if (!prefs.value.chatSound) return;
  const a = new Audio(SOUNDS.chat);
  a.volume = prefs.value.clickVolume;
  void a.play().catch(() => {});
}

/** Telas com música ambiente: as de fora da partida. Na seleção e no jogo a Riot já toca a dela. */
const AMBIENT_SCREENS = new Set(['home', 'lobby', 'profile', 'collection', 'events', 'store', 'settings']);

/** Qual clique tocar para o elemento clicado: confirmar (botão principal), aba/chip ou clique comum. */
export function clickSound(target: Element | null): keyof typeof SOUNDS | null {
  const el = target?.closest('button, [role="button"], [role="tab"], a');
  if (!el || (el as HTMLButtonElement).disabled) return null;
  if (el.matches('[data-variant="primary"]')) return 'confirm';
  if (el.matches('[role="tab"], .rlc-queue-chip, .rlc-mode-card, .rlc-rail-item')) return 'tab';
  return 'click';
}

/**
 * Som ambiente em laço nas telas fora da partida (pausa sem foco, como o vídeo de fundo) e um toque curto a cada clique
 * em botões da camada. Os dois seguem as preferências ao vivo.
 */
export function useSound(root: HTMLElement, screen: string, visible: boolean, focused: boolean): void {
  const p = prefs.value;
  const playAmbient = visible && focused && p.ambient && AMBIENT_SCREENS.has(screen);

  useEffect(() => {
    if (!playAmbient) return;
    const music = new Audio(SOUNDS.ambient);
    music.loop = true;
    music.volume = p.ambientVolume;
    void music.play().catch(() => {});
    return () => {
      music.pause();
      music.src = '';
    };
  }, [playAmbient]);

  // Volume muda sem reiniciar a música: o elemento atual é achado pelo laço acima; aqui só os cliques.
  useEffect(() => {
    if (!visible || !p.clicks) return;
    const onClick = (e: MouseEvent) => {
      const kind = clickSound(e.target as Element | null);
      if (!kind) return;
      const a = new Audio(SOUNDS[kind]);
      a.volume = prefs.value.clickVolume;
      void a.play().catch(() => {});
    };
    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [root, visible, p.clicks]);
}
