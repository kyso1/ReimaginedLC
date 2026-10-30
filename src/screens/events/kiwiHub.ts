// Hub do passe Mayhem ("Rumo ao Estrelato"): o client não desenha a trilha dele, mostra o plugin `rcp-fe-lol-kiwi-hub`.
//
// O que existe no client (patch 16.21), componente `embedded-plugin-host` (rota `embedded-plugin` do event hub):
// - `getProvider().getOptional('rcp-fe-lol-kiwi-hub')`, depois `plugin.show({ targetDivId })` num div dele e `hide()`
//   ao sair. Se falhar, `onLoadError` → `fallbackToBuiltIn` (a trilha comum).
// - A API chega pelo Pengu: `context.rcp.postInit('rcp-fe-lol-kiwi-hub', setKiwiHubApi)` (src/index.ts).

interface KiwiHubApi {
  show(opts: { targetDivId: string }): unknown;
  hide(): unknown;
}

let kiwi: KiwiHubApi | null = null;
let seq = 0;

/** Recebe a API do plugin `rcp-fe-lol-kiwi-hub` (via `rcp.postInit`). */
export function setKiwiHubApi(api: unknown): void {
  kiwi = (api as KiwiHubApi | null) ?? null;
}

/** Mostra o hub em `el`. Devolve a limpeza, ou `null` sem a API; `onError` quando o `show` falha depois. */
export function mountKiwiHub(el: HTMLElement, onError: () => void): (() => void) | null {
  if (typeof kiwi?.show !== 'function') return null;
  const api = kiwi;
  el.id ||= `rlc-kiwi-${++seq}`;
  const fail = (e: unknown) => {
    console.error('[rlc]', e);
    onError();
  };
  try {
    void Promise.resolve(api.show({ targetDivId: el.id })).catch(fail);
  } catch (e) {
    console.error('[rlc]', e);
    return null;
  }
  return () => {
    try {
      void Promise.resolve(api.hide()).catch((e) => console.error('[rlc]', e));
    } catch (e) {
      console.error('[rlc]', e);
    }
  };
}
