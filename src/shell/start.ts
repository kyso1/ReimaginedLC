import { saveError } from './report';
import { effect, signal } from '@preact/signals';
import { h, render } from 'preact';
import { setLocale, t } from '../i18n';
import { createLcu } from '../lcu';
import { createThemeEngine } from '../theme/engine';
import css from '../ui/styles.css?inline';
import { App, RIOT_ROOT_ID } from './App';
import { Boundary } from './Boundary';
import { registerCommands } from './commands';
import { enabled, syncLayer } from './layer';
import { probeLite } from './perf';
import { effectiveLocale, prefs } from './prefs';
import { watchUpdates } from './update';
import { startFullscreen } from './fullscreen';
import type { LoaderState } from '../../loader/shared';
import { startServices } from '../extensions';
import { startAppearOffline } from '../plugins/appearOffline';
import { startAutoAccept } from '../plugins/autoAccept';
import { startSpotify } from '../plugins/spotify';
import { startCustomCss } from '../theme/customCss';

/**
 * Pasta das fontes e temas. Pelo carregador (loader/), a que ele publica (o bundle chega por blob:); sem ele, a URL do
 * próprio bundle; no servidor de desenvolvimento, a raiz.
 */
const base = import.meta.env.DEV
  ? '/'
  : ((window as Window & { __rlcLoader?: LoaderState }).__rlcLoader?.base ?? new URL(/* @vite-ignore */ '.', import.meta.url).href);

export async function start(): Promise<void> {
  if (document.getElementById('rlc-root')) return;
  syncLayer();

  const style = document.createElement('style');
  style.dataset.rlc = '';
  // Quicksand (OFL, `fonts/OFL.txt`) vem com o plugin: o CSS é injetado inline, então a URL precisa da pasta do plugin.
  const font = (file: string, range: string) =>
    `@font-face { font-family: Quicksand; src: url("${base}fonts/${file}") format("woff2"); font-weight: 300 700; font-display: swap; unicode-range: ${range}; }`;
  style.textContent = [
    font('quicksand-latin.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'),
    font('quicksand-latin-ext.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'),
    css,
  ].join('\n');
  document.head.append(style);

  const root = document.createElement('div');
  root.id = 'rlc-root';
  root.dataset.visible = 'false';
  document.body.append(root);

  let observer: MutationObserver | undefined;
  try {
    const focused = signal(document.hasFocus());
    window.addEventListener('focus', () => void (focused.value = true));
    window.addEventListener('blur', () => void (focused.value = false));
    // Modo leve automático: decidido uma vez, no primeiro minuto (perf.ts).
    probeLite(focused);

    // O boot do client troca os filhos do body: troca nossa raiz por um clone sem árvore e cria a
    // raiz da Riot depois. Mantém a raiz real anexada e avisa o App quando algo mudou.
    const dom = signal(0);
    let riotRoot = document.getElementById(RIOT_ROOT_ID);
    const guard = () => {
      let changed = false;
      for (const el of document.querySelectorAll('#rlc-root')) {
        if (el !== root) el.remove();
      }
      if (!root.isConnected) {
        document.body.append(root);
        changed = true;
      }
      const current = document.getElementById(RIOT_ROOT_ID);
      if (current !== riotRoot) {
        riotRoot = current;
        changed = true;
      }
      if (changed) dom.value++;
    };
    observer = new MutationObserver(guard);
    observer.observe(document.body, { childList: true });
    guard();

    const lcu = createLcu();
    startServices(lcu);
    // Plugins embutidos: rodam com a camada ligada ou não.
    startAutoAccept(lcu);
    startAppearOffline(lcu);
    startSpotify(lcu);
    // CSS do usuário: depois do nosso <style>, para vencer na cascata.
    startCustomCss();
    effect(() => {
      const client = lcu.regionLocale.value.data?.locale;
      const locale = effectiveLocale(prefs.value.locale, typeof client === 'string' ? client : undefined);
      if (locale) setLocale(locale);
    });

    const themes = await createThemeEngine(base);
    registerCommands(themes);
    // Aviso de versão nova pronta (o carregador baixa e verifica em segundo plano).
    watchUpdates(lcu);
    // `h(App, ...)` e não `App(...)`: o Preact precisa montar o componente para os hooks funcionarem.
    const onError = (error: unknown) => {
      console.error('[rlc]', error);
      saveError(error);
      enabled.value = false;
      window.Toast?.error(t('screenFailed'));
    };
    render(h(Boundary, { onError, children: h(App, { root, lcu, themes, base, focused, dom }) }), root);
    // Tela cheia lembrada: entra no primeiro gesto; sai ao trocar para o client da Riot (tamanho de antes).
    startFullscreen();
  } catch (e) {
    observer?.disconnect();
    root.remove();
    style.remove();
    throw e;
  }
}
