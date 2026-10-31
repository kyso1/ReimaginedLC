import type { Lcu } from '../lcu';
import { endpoints, supports } from '../lcu/capabilities';
import { enabled, hideRiot, setEnabled, shown } from './layer';
import { prefs, setPrefs, type Prefs } from './prefs';
import { lastError } from './report';

/**
 * Gancho do MCP do ReimaginedLC: `window.__rlc`. Só existe no build de dev (`vite build --mode client`): o App chama
 * `exposeShell` dentro de `if (import.meta.env.MODE === 'client')`, que o build de release elimina junto com este
 * módulo.
 *
 * O estado de navegação do shell mora em `useState` do App, então o App entrega um controle novo a cada render.
 */
export interface ShellControl {
  state: {
    screen: string | null;
    page: string | null;
    view: string | null;
    panel: string | null;
    chat: { open: boolean; active: string | null };
    profilePuuid: string | null;
    settingsArea: string | null;
  };
  /** Telas livres do trilho (perfil, coleção, loja...); null volta à tela da fase. */
  setView: (view: string | null) => void;
  setPanel: (panel: null | 'modes' | 'custom') => void;
  goHome: () => void;
  openChat: (friendId: string | null) => void;
  openProfile: (puuid: string | null) => void;
  openSettings: (area: string | null) => void;
}

let shell: ShellControl | null = null;

export function exposeShell(lcu: Lcu, views: readonly string[], control: ShellControl): void {
  shell = control;
  if (!(window as Window & { __rlc?: unknown }).__rlc) install(lcu, views);
}

const need = (): ShellControl => {
  if (!shell) throw new Error('shell not mounted (layer off or client still loading)');
  return shell;
};

function install(lcu: Lcu, views: readonly string[]): void {
  const stores = Object.keys(lcu).filter((k) => {
    const v = (lcu as unknown as Record<string, unknown>)[k];
    return !!v && typeof v === 'object' && 'value' in v;
  });
  (window as Window & { __rlc?: unknown }).__rlc = {
    version: __RLC_VERSION__,
    views,
    stores,
    state: () => ({
      version: __RLC_VERSION__,
      layer: { enabled: enabled.value, shown: shown.value, hideRiot: hideRiot.value },
      phase: lcu.gameflowPhase.value.data ?? null,
      ...(shell?.state ?? { mounted: false }),
      lastError: lastError(),
      endpoints: endpoints.value?.size ?? null,
    }),
    /** Um store da LCU (`gameflowPhase`, `lobby`, `champSelect`...): status, dado e erro. */
    store: (name: string) => {
      const s = (lcu as unknown as Record<string, { value: unknown } | undefined>)[name];
      if (!s || !stores.includes(name)) throw new Error(`unknown store ${name}; known: ${stores.join(', ')}`);
      return s.value;
    },
    /** `home`, `play` (tela de modos), `custom` (salas), `lobby`/fase atual (`phase`) ou uma tela livre de `views`. */
    go: (to: string) => {
      const s = need();
      if (to === 'home') return s.goHome();
      if (to === 'play' || to === 'modes') return s.setPanel('modes');
      if (to === 'custom') return s.setPanel('custom');
      if (to === 'phase' || to === 'lobby') return s.setView(null);
      if (!views.includes(to)) throw new Error(`unknown view ${to}; known: home, play, custom, phase, ${views.join(', ')}`);
      s.setPanel(null);
      s.setView(to);
    },
    closePanel: () => need().setPanel(null),
    openChat: (friendId: string | null) => need().openChat(friendId),
    openProfile: (puuid: string | null) => need().openProfile(puuid),
    openSettings: (area: string | null) => need().openSettings(area),
    setLayer: (on: boolean) => setEnabled(on),
    prefs: () => prefs.value,
    /** Aplica e devolve os valores anteriores das chaves trocadas (para restaurar depois). */
    setPrefs: (patch: Partial<Prefs>) => {
      const before = Object.fromEntries(Object.keys(patch).map((k) => [k, prefs.value[k as keyof Prefs]]));
      setPrefs(patch);
      return before;
    },
    supports: (method: string, path: string) => supports(method, path),
  };
}
