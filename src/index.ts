import { t } from './i18n';
import { RIOT_ROOT_ID } from './shell/App';
import { registerHotkey } from './shell/hotkey';
import { start } from './shell/start';
import { enabled, syncLayer } from './shell/layer';
import { hideBoot, showBoot } from './shell/boot';
import { setPawApi, setSharedComponentsApi } from './screens/store/purchase';
import { loadInstalled } from './plugins/market';
import { setNavigationApi } from './screens/home/riotFrame';
import { setKiwiHubApi } from './screens/events/kiwiHub';

/** Contexto que o Pengu passa ao `init`: `rcp.postInit` entrega a API de um plugin da Riot quando ele sobe. */
interface PenguContext {
  rcp?: { postInit?: (name: string, callback: (api: unknown) => void) => void };
}

/**
 * O Pengu chama `init` antes de a interface da Riot carregar. Entra o atalho de emergência e a captura da API da
 * janela de compra da Riot (`rcp-fe-lol-paw`), usada pela nossa loja para abrir a confirmação oficial.
 */
export function init(context?: PenguContext): void {
  registerHotkey();
  // Tela de carregamento nossa no lugar do fundo vazio da Riot, só com a camada ligada.
  try {
    syncLayer();
    if (enabled.value) showBoot();
  } catch (e) {
    console.error('[rlc]', e);
  }
  try {
    context?.rcp?.postInit?.('rcp-fe-lol-paw', (api) => setPawApi(api as Parameters<typeof setPawApi>[0]));
    // Compra de RP (o "+" da carteira da loja).
    context?.rcp?.postInit?.('rcp-fe-lol-shared-components', setSharedComponentsApi);
    // Quadro da Riot para Worlds e Pick'Ems (sites que falam com o client).
    context?.rcp?.postInit?.('rcp-fe-lol-navigation', setNavigationApi);
    // Hub do passe Mayhem na aba Eventos.
    context?.rcp?.postInit?.('rcp-fe-lol-kiwi-hub', setKiwiHubApi);
  } catch (e) {
    console.error('[rlc]', e);
  }
  // Plugins instalados pela loja (jsDelivr, fixados no commit): recebem o mesmo contexto.
  void loadInstalled(context);
}

/** O Pengu chama `load` quando a janela termina de carregar. Qualquer falha deixa a camada desligada. */
export async function load(): Promise<void> {
  try {
    await start();
  } catch (e) {
    console.error('[rlc]', e);
    hideBoot();
    document.getElementById('rlc-root')?.remove();
    const riot = document.getElementById(RIOT_ROOT_ID);
    if (riot) riot.style.visibility = '';
    window.Toast?.error(t('startFailed'));
  }
}
