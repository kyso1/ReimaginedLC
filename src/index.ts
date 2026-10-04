import { t } from './i18n';
import { registerHotkey } from './shell/hotkey';
import { start } from './shell/start';

/** O Pengu chama `init` antes de a interface da Riot carregar. Só o atalho de emergência entra aqui. */
export function init(): void {
  registerHotkey();
}

/** O Pengu chama `load` quando a janela termina de carregar. Qualquer falha deixa a camada desligada. */
export async function load(): Promise<void> {
  try {
    await start();
  } catch (e) {
    console.error('[rlc]', e);
    document.getElementById('rlc-root')?.remove();
    window.Toast?.error(t('startFailed'));
  }
}
