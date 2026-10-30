// Quadro da Riot (`component:managed-iframe`) para sites que conversam com o client (Worlds, Pick'Ems).
//
// O que existe no client (patch 16.21):
// - Esses sites mandam `RClientWindowMessenger` para `window.top` e esperam resposta; só o componente Ember
//   `managed-iframe` (de `rcp-fe-lol-shared-components`) responde. Num `<iframe>` comum eles ficam parados.
// - `openIframeModalHandler` (`rcp-fe-lol-navigation`) cria assim:
//   `getApiInstance().__container__.lookupFactory('component:managed-iframe').create({ id, isHidden: false, url, isQuickLoadEnabled: true, audioManager })`,
//   faz `appendTo(div)` e `destroy()` ao fechar. A aba `iframed` usa o mesmo componente com `id = navigationItemID`.
// - `getApiInstance()` é a instância Ember da central de atividades: `Navigation.activityCenter._activityCenterApi._appInstance`.
// - Botões da home chamam `activityCenter.route(type, payload, telemetry)` (`_dispatchRouteAction`). Testado ao vivo:
//   `lc_open_settings` abre um `.modal` em `#lol-uikit-layer-manager`; `lc_loot` troca a tela (a da central de atividades
//   fica `display: none`).
// - A API do plugin chega pelo Pengu: `context.rcp.postInit('rcp-fe-lol-navigation', setNavigationApi)` (src/index.ts).

import { setEnabled } from '../../shell/layer';
import { liftModal } from '../store/purchase';

interface ManagedIframe {
  appendTo(el: Element): void;
  destroy(): void;
}

interface NavigationApi {
  activityCenter?: {
    route?: (type: string, payload: object, telemetry: object) => unknown;
    _activityCenterApi?: { _appInstance?: { __container__?: { lookupFactory?: (name: string) => { create(props: object): ManagedIframe } | undefined } } };
  };
}

let nav: NavigationApi | null = null;

/** Recebe a API do plugin `rcp-fe-lol-navigation` (via `rcp.postInit`). */
export function setNavigationApi(api: unknown): void {
  nav = (api as NavigationApi | null) ?? null;
}

/**
 * Monta o quadro da Riot em `el`. Devolve a limpeza, ou `null` quando o client não oferece o componente
 * (quem chama fica com o `<iframe>` comum). A instância é lida na hora: `activityCenter` só existe depois do init.
 */
export function mountRiotFrame(el: Element, { id, url }: { id: string; url: string }): (() => void) | null {
  try {
    const factory = nav?.activityCenter?._activityCenterApi?._appInstance?.__container__?.lookupFactory?.('component:managed-iframe');
    if (!factory) return null;
    const frame = factory.create({ id, isHidden: false, url, isQuickLoadEnabled: true });
    frame.appendTo(el);
    return () => frame.destroy();
  } catch (e) {
    console.error('[rlc]', e);
    return null;
  }
}

const MODALS = '#lol-uikit-layer-manager .modal';
const HOME_SCREEN = '.screen-root[data-screen-name="rcp-fe-lol-activity-center"]';

/**
 * Ação do CMS que não conhecemos: passa ao client como os botões da home dele fazem. O que o client abrir precisa
 * aparecer: um modal novo sobe acima da nossa camada; se ele trocou de tela, a camada desliga para mostrá-la.
 * Devolve `false` sem a API do client.
 */
export function openClientAction(type: string, payload: object, doc: Document = document): boolean {
  const ac = nav?.activityCenter;
  if (typeof ac?.route !== 'function') return false;
  const before = new Set(doc.querySelectorAll(MODALS));
  try {
    void Promise.resolve(ac.route(type, payload, {})).catch((e) => console.error('[rlc]', e));
  } catch (e) {
    console.error('[rlc]', e);
    return false;
  }
  const started = Date.now();
  const id = setInterval(() => {
    const fresh = [...doc.querySelectorAll<HTMLElement>(MODALS)].find((m) => !before.has(m));
    const home = doc.querySelector<HTMLElement>(HOME_SCREEN);
    if (fresh) {
      clearInterval(id);
      fresh.dataset.rlcLift = '';
      liftModal(doc, '[data-rlc-lift]');
    } else if (home && getComputedStyle(home).display === 'none') {
      clearInterval(id);
      setEnabled(false);
    } else if (Date.now() - started > 3000) clearInterval(id);
  }, 100);
  return true;
}
