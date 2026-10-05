import type { Signal } from '@preact/signals';
import type { JSX } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { Home } from '../screens/home/Home';
import { applyTheme, mediaUrl } from '../theme/apply';
import type { ThemeEngine } from '../theme/engine';
import { MediaBackground } from '../ui/MediaBackground';
import { Rail } from '../ui/Rail';
import { Boundary } from './Boundary';
import { enabled, hideRiot, setEnabled } from './layer';
import { Confirm } from './overlays/Confirm';
import { screenFor, type Screen } from './router';
import { WindowBar } from './WindowBar';

/** Elemento raiz da interface da Riot. */
export const RIOT_ROOT_ID = 'rcp-fe-viewport-root';

type HomeProps = Parameters<typeof Home>[0];

interface Props {
  root: HTMLElement;
  lcu: Lcu;
  themes: ThemeEngine;
  base: string;
  focused: Signal<boolean>;
  /** Muda quando a raiz da Riot aparece ou é trocada. */
  dom: Signal<number>;
  screens?: Record<Screen, (props: HomeProps) => JSX.Element>;
}

export function App({ root, lcu, themes, base, focused, dom, screens = { home: Home } }: Props) {
  const domVersion = dom.value;
  const screen = screenFor(lcu.gameflowPhase.value);
  const visible = enabled.value && screen !== null;
  const theme = themes.active.value;
  const hide = visible && hideRiot.value;
  const [confirmClose, setConfirmClose] = useState(false);

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
  const ScreenComponent = screens[screen];

  return (
    <div class="rlc-app" key={theme.name}>
      <Boundary onError={onError}>
        <MediaBackground src={mediaUrl(theme, screen, base)} playing={focused.value} />
        <Rail
          items={[
            { id: 'home', label: t('home'), active: true, onSelect: () => {} },
            { id: 'original', label: t('originalClient'), onSelect: turnOff },
          ]}
        />
        <main class="rlc-screen">
          <ScreenComponent version={lcu.build.value.data?.version ?? null} locale={lcu.regionLocale.value.data?.locale ?? null} onPlay={turnOff} />
        </main>
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
