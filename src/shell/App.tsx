import type { Signal } from '@preact/signals';
import { h, type JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { Home } from '../screens/home/Home';
import { Lobby } from '../screens/lobby/Lobby';
import { CustomBrowser } from '../screens/modes/CustomBrowser';
import { LAST_QUEUE_KEY, Modes } from '../screens/modes/Modes';
import { applyTheme, mediaUrl } from '../theme/apply';
import type { ThemeEngine } from '../theme/engine';
import { MediaBackground } from '../ui/MediaBackground';
import { Rail } from '../ui/Rail';
import { Boundary } from './Boundary';
import { enabled, hideRiot, setEnabled } from './layer';
import { Confirm } from './overlays/Confirm';
import { InvitationCards } from './overlays/Invitations';
import { ReadyCheckOverlay, showReadyCheck } from './overlays/ReadyCheck';
import { screenFor, type Screen } from './router';
import { readSetting } from './storage';
import { WindowBar } from './WindowBar';

/** Elemento raiz da interface da Riot. */
export const RIOT_ROOT_ID = 'rcp-fe-viewport-root';

type HomeProps = Parameters<typeof Home>[0];
type LobbyProps = Parameters<typeof Lobby>[0];
interface Screens {
  home?: (props: HomeProps) => JSX.Element;
  lobby?: (props: LobbyProps) => JSX.Element;
}

interface Props {
  root: HTMLElement;
  lcu: Lcu;
  themes: ThemeEngine;
  base: string;
  focused: Signal<boolean>;
  /** Muda quando a raiz da Riot aparece ou é trocada. */
  dom: Signal<number>;
  screens?: Screens;
  /** Ponto de troca para testes. */
  readyCheckOverlay?: typeof ReadyCheckOverlay;
}

export function App({ root, lcu, themes, base, focused, dom, screens = { home: Home, lobby: Lobby }, readyCheckOverlay: ReadyCheck = ReadyCheckOverlay }: Props) {
  const domVersion = dom.value;
  const route = screenFor(lcu.gameflowPhase.value);
  // Tela sem componente (testes que passam só uma) fica com o client original.
  const screen = route && screens[route] ? route : null;
  const visible = enabled.value && screen !== null;
  const theme = themes.active.value;
  const hide = visible && hideRiot.value;
  const [confirmClose, setConfirmClose] = useState(false);
  /** Painel aberto sobre a tela: tela de modos ou lista de salas. Fecha quando a camada some. */
  const [panel, setPanel] = useState<null | 'modes' | 'custom'>(null);
  useEffect(() => {
    if (!visible) setPanel(null);
  }, [visible]);
  const readyVisible = visible && showReadyCheck(lcu.gameflowPhase.value, lcu.readyCheck.value);

  // Aceite com a janela minimizada ou sem foco: traz a janela para frente, uma vez por aceite.
  useEffect(() => {
    if (!readyVisible || focused.peek()) return;
    void request('POST', '/riotclient/ux-show').catch(() => {});
    void request('POST', '/riotclient/ux-flash').catch(() => {});
  }, [readyVisible]);

  // Layout effects: rodam logo após o commit do DOM, antes de qualquer pintura. Se a camada
  // não mostra tela, a Riot precisa estar visível já, não no próximo frame.
  useLayoutEffect(() => applyTheme(root, theme), [root, theme]);

  /** Elemento da Riot que escondemos e o `visibility` inline que ele tinha; null quando não escondemos nada. */
  const hidden = useRef<{ el: HTMLElement; prev: string } | null>(null);
  const sync = (show: boolean, hideIt: boolean) => {
    root.dataset.visible = String(show);
    const riot = document.getElementById(RIOT_ROOT_ID);
    const mine = hidden.current;
    // O valor lembrado pertence ao elemento antigo: nunca é escrito num elemento novo.
    if (mine && mine.el !== riot) {
      if (mine.el.isConnected) mine.el.style.visibility = mine.prev;
      hidden.current = null;
    }
    if (!riot) return;
    if (hideIt) {
      hidden.current ??= { el: riot, prev: riot.style.visibility };
      riot.style.visibility = 'hidden';
    } else if (hidden.current) {
      riot.style.visibility = hidden.current.prev;
      hidden.current = null;
    }
  };
  useLayoutEffect(() => sync(visible, hide), [root, visible, hide, domVersion]);
  useLayoutEffect(() => () => sync(false, false), [root]);

  if (!visible || screen === null) return null;

  const turnOff = () => setEnabled(false);
  const onError = (error: unknown) => {
    console.error('[rlc]', error);
    enabled.value = false;
    window.Toast?.error(t('screenFailed'));
  };

  return (
    <div class="rlc-app" key={theme.name}>
      <Boundary onError={onError}>
        <MediaBackground src={mediaUrl(theme, screen, base)} playing={focused.value} />
        <Rail
          items={[
            // A rota segue a fase do gameflow: os itens indicam onde se está, não navegam livremente.
            { id: 'home', label: t('home'), active: screen === 'home', onSelect: () => {} },
            ...(lcu.lobby.value.data ? [{ id: 'lobby', label: t('lobby'), active: screen === 'lobby', onSelect: () => {} }] : []),
            { id: 'original', label: t('originalClient'), onSelect: turnOff },
          ]}
        />
        <main class="rlc-screen">
          {screen === 'home' ? (
            h(screens.home!, { version: lcu.build.value.data?.version ?? null, locale: lcu.regionLocale.value.data?.locale ?? null, onPlay: () => setPanel('modes') })
          ) : (
            h(screens.lobby!, { lcu, onModes: () => setPanel('modes') })
          )}
        </main>
        {panel === 'modes' ? (
          <Modes
            queues={lcu.queues.value.data ?? []}
            current={lcu.lobby.value.data?.gameConfig.queueId ?? readSetting<number | null>(LAST_QUEUE_KEY, null)}
            onClose={() => setPanel(null)}
            onCustom={() => setPanel('custom')}
          />
        ) : null}
        {panel === 'custom' ? <CustomBrowser lcu={lcu} onClose={() => setPanel(null)} /> : null}
        <InvitationCards invitations={lcu.invitations.value.data ?? []} queues={lcu.queues.value.data ?? []} name={lcu.name} />
        {readyVisible ? <ReadyCheck rc={lcu.readyCheck.value.data!} /> : null}
        <WindowBar onClose={() => setConfirmClose(true)} />
        {confirmClose ? (
          <Confirm
            message={t('quitConfirm')}
            confirmLabel={t('quit')}
            onConfirm={() => {
              setConfirmClose(false);
              void request('POST', '/process-control/v1/process/quit').catch(() => {});
            }}
            onCancel={() => setConfirmClose(false)}
          />
        ) : null}
      </Boundary>
    </div>
  );
}
