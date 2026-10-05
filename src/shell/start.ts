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
import { effectiveLocale, prefs } from './prefs';
import { checkForUpdate } from './update';

/** Pasta do plugin. No client é a URL do próprio bundle; no servidor de desenvolvimento, a raiz. */
const base = import.meta.env.DEV ? '/' : new URL(/* @vite-ignore */ '.', import.meta.url).href;

export async function start(): Promise<void> {
  if (document.getElementById('rlc-root')) return;
  syncLayer();

  const style = document.createElement('style');
  style.dataset.rlc = '';
  style.textContent = css;
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
    effect(() => {
      const client = lcu.regionLocale.value.data?.locale;
      const locale = effectiveLocale(prefs.value.locale, typeof client === 'string' ? client : undefined);
      if (locale) setLocale(locale);
    });

    const themes = await createThemeEngine(base);
    registerCommands(themes);
    // Aviso de versão nova: em segundo plano, sem atrasar a camada.
    void checkForUpdate(__RLC_VERSION__);
    // `h(App, ...)` e não `App(...)`: o Preact precisa montar o componente para os hooks funcionarem.
    const onError = (error: unknown) => {
      console.error('[rlc]', error);
      enabled.value = false;
      window.Toast?.error(t('screenFailed'));
    };
    render(h(Boundary, { onError, children: h(App, { root, lcu, themes, base, focused, dom }) }), root);
  } catch (e) {
    observer?.disconnect();
    root.remove();
    style.remove();
    throw e;
  }
}
