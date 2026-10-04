import { toggleEnabled } from './layer';

let registered = false;

/** Ctrl+Shift+F12 alterna a camada. Registrado em `init`, antes de qualquer outro código do plugin. */
export function registerHotkey(target: Window = window): void {
  if (registered) return;
  registered = true;
  target.addEventListener(
    'keydown',
    (e) => {
      if (!(e.ctrlKey && e.shiftKey && e.key === 'F12')) return;
      e.preventDefault();
      e.stopPropagation();
      toggleEnabled();
    },
    true,
  );
}
