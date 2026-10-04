import { effect, signal } from '@preact/signals';
import { h, render } from 'preact';
import { setLocale } from '../i18n';
import { createLcu } from '../lcu';
import { createThemeEngine } from '../theme/engine';
import css from '../ui/styles.css?inline';
import { App } from './App';
import { registerCommands } from './commands';
import { syncLayer } from './layer';

/** Pasta do plugin. No client é a URL do próprio bundle; no servidor de desenvolvimento, a raiz. */
const base = import.meta.env.DEV ? '/' : new URL('.', import.meta.url).href;

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

  const focused = signal(document.hasFocus());
  window.addEventListener('focus', () => void (focused.value = true));
  window.addEventListener('blur', () => void (focused.value = false));

  const lcu = createLcu();
  effect(() => {
    const locale = lcu.regionLocale.value.data?.locale;
    if (locale) setLocale(locale);
  });

  const themes = await createThemeEngine(base);
  registerCommands(themes);
  // `h(App, ...)` e não `App(...)`: o Preact precisa montar o componente para os hooks funcionarem.
  render(h(App, { root, lcu, themes, base, focused }), root);
}
