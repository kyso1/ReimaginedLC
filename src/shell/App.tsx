import type { Signal } from '@preact/signals';
import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { t } from '../i18n';
import type { Lcu } from '../lcu';
import { Home } from '../screens/home/Home';
import { applyTheme, mediaUrl } from '../theme/apply';
import type { ThemeEngine } from '../theme/engine';
import { MediaBackground } from '../ui/MediaBackground';
import { Rail } from '../ui/Rail';
import { Boundary } from './Boundary';
import { enabled, hideRiot, setEnabled } from './layer';
import { screenFor, type Screen } from './router';

/** Elemento raiz da interface da Riot. */
export const RIOT_ROOT_ID = 'rcp-fe-viewport-root';

type HomeProps = Parameters<typeof Home>[0];

interface Props {
  root: HTMLElement;
  lcu: Lcu;
  themes: ThemeEngine;
  base: string;
  focused: Signal<boolean>;
  screens?: Record<Screen, (props: HomeProps) => JSX.Element>;
}

export function App({ root, lcu, themes, base, focused, screens = { home: Home } }: Props) {
  const screen = screenFor(lcu.gameflowPhase.value);
  const visible = enabled.value && screen !== null;
  const theme = themes.active.value;
  const hide = visible && hideRiot.value;

  // Layout effects: rodam logo após o commit do DOM, antes de qualquer pintura. Se a camada
  // não mostra tela, a Riot precisa estar visível já, não no próximo frame.
  useLayoutEffect(() => applyTheme(root, theme), [root, theme]);

  /** Valor inline de `visibility` da Riot antes de a escondermos; null quando não fomos nós. */
  const hidden = useRef<string | null>(null);
  const sync = (show: boolean, hideIt: boolean) => {
    root.dataset.visible = String(show);
    const riot = document.getElementById(RIOT_ROOT_ID);
    if (!riot) return;
    if (hideIt) {
      hidden.current ??= riot.style.visibility;
      riot.style.visibility = 'hidden';
    } else if (hidden.current !== null) {
      riot.style.visibility = hidden.current;
      hidden.current = null;
    }
  };
  useLayoutEffect(() => sync(visible, hide), [root, visible, hide]);
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
      </Boundary>
    </div>
  );
}
