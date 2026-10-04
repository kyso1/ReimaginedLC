import { t } from './i18n';
import { registerHotkey } from './shell/hotkey';
import { syncLayer } from './shell/layer';

/** O Pengu chama `init` antes de a interface da Riot carregar. Só o atalho de emergência entra aqui. */
export function init(): void {
  registerHotkey();
}

/** O Pengu chama `load` quando a janela termina de carregar. */
export async function load(): Promise<void> {
  try {
    syncLayer();
  } catch (e) {
    console.error('[rlc]', e);
    window.Toast?.error(t('startFailed'));
  }
}
