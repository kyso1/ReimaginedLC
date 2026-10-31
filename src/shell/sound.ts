import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { prefs } from './prefs';

/** Sons do próprio client da Riot, servidos pelo `/fe/` de cada módulo. */
export const SOUNDS = {
  /** Tema da tela inicial (rcp-fe-lol-navigation, `CLIENT_AMBIENCE.AC_MAIN`); a Riot troca o arquivo a cada evento. */
  homeMusic: '/fe/lol-navigation/music-ac-home-main.ogg',
  click: '/fe/lol-parties/sfx-soc-ui-click-generic.ogg',
  confirm: '/fe/lol-parties/sfx-gameselect-button-confirm-click.ogg',
  tab: '/fe/lol-parties/sfx-uikit-grid-click.ogg',
  /** O mesmo aviso de mensagem recebida do chat da Riot (rcp-fe-lol-social, `chatMessage`). */
  chat: '/fe/lol-social/sounds/sfx-soc-notif-chat-rcvd.ogg',
} as const;

/** Efeito curto: volume da pref dos cliques vezes o canal de efeitos do client; calado se der zero. */
function playSfx(kind: keyof typeof SOUNDS, audio: ClientAudio | null | undefined): void {
  const volume = prefs.value.clickVolume * sfxVolume(audio);
  if (volume <= 0) return;
  const a = new Audio(SOUNDS[kind]);
  a.volume = volume;
  void a.play().catch(() => {});
}

/** Aviso de mensagem nova, como os cliques; segue a pref `chatSound` e os efeitos do client. */
export function playChatSound(audio: ClientAudio | null | undefined): void {
  if (prefs.value.chatSound) playSfx('chat', audio);
}

/** `/lol-settings/v1/local/lol-audio`: o som do client (Configurações › Som). */
export interface ClientAudio {
  masterSoundEnabled?: boolean;
  masterVolume?: number;
  musicEnabled?: boolean;
  musicVolume?: number;
  clientAmbienceMusicEnabled?: boolean;
  sfxEnabled?: boolean;
  sfxVolume?: number;
}

/** Volume do canal de efeitos do client, de 0 a 1: mudo com o som geral ou os efeitos desligados (ou sem a configuração lida). */
export function sfxVolume(a: ClientAudio | null | undefined): number {
  if (!a || a.masterSoundEnabled === false || a.sfxEnabled === false) return 0;
  return ((a.sfxVolume ?? 100) / 100) * ((a.masterVolume ?? 100) / 100);
}

/**
 * Volume do tema da tela inicial, de 0 a 1, como o rcp-fe-audio calcula para o canal `music-client-ambience`:
 * mudo com o som geral, a música ou a "música ambiente do client" desligados; senão o volume da música (e o geral).
 */
export function homeMusicVolume(a: ClientAudio | null | undefined): number {
  if (!a || a.masterSoundEnabled === false || a.musicEnabled === false || a.clientAmbienceMusicEnabled === false) return 0;
  return ((a.musicVolume ?? 100) / 100) * ((a.masterVolume ?? 100) / 100);
}

/** Aba da tela inicial aberta num quadro (site da Riot, como Worlds): o client cala o tema enquanto ela está aberta. */
export const homeIframe = signal(false);

/** Qual clique tocar para o elemento clicado: confirmar (botão principal), aba/chip ou clique comum. */
export function clickSound(target: Element | null): keyof typeof SOUNDS | null {
  const el = target?.closest('button, [role="button"], [role="tab"], a');
  if (!el || (el as HTMLButtonElement).disabled) return null;
  if (el.matches('[data-variant="primary"]')) return 'confirm';
  if (el.matches('[role="tab"], .rlc-queue-chip, .rlc-mode-card, .rlc-rail-item')) return 'tab';
  return 'click';
}

/**
 * Tema da tela inicial em laço, como o client: só no Início (fora de aba em quadro), com o som do client
 * (`audio`), pausado sem foco como o vídeo de fundo. E um toque curto a cada clique em botões da camada.
 */
export function useSound(root: HTMLElement, screen: string, visible: boolean, focused: boolean, audio: ClientAudio | null | undefined): void {
  const p = prefs.value;
  const volume = homeMusicVolume(audio);
  const playMusic = visible && focused && screen === 'home' && !homeIframe.value && volume > 0;
  const music = useRef<HTMLAudioElement | null>(null);
  // O ouvinte de cliques lê o som do client mais recente sem se registrar de novo.
  const audioNow = useRef(audio);
  audioNow.current = audio;

  useEffect(() => {
    if (!playMusic) return;
    const a = (music.current = new Audio(SOUNDS.homeMusic));
    a.loop = true;
    a.volume = volume;
    void a.play().catch(() => {});
    return () => {
      music.current = null;
      a.pause();
      a.src = '';
    };
  }, [playMusic]);
  // Volume mudado no client vale na hora, sem reiniciar a faixa.
  useEffect(() => {
    if (music.current) music.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!visible || !p.clicks) return;
    const onClick = (e: MouseEvent) => {
      const kind = clickSound(e.target as Element | null);
      if (kind) playSfx(kind, audioNow.current);
    };
    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [root, visible, p.clicks]);
}
