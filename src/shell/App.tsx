import type { Signal } from '@preact/signals';
import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
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

  useEffect(() => applyTheme(root, theme), [root, theme]);

  useEffect(() => {
    root.dataset.visible = String(visible);
    const riot = document.getElementById(RIOT_ROOT_ID);
    if (riot) riot.style.visibility = hide ? 'hidden' : '';
  }, [root, visible, hide]);

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
      <MediaBackground src={mediaUrl(theme, screen, base)} playing={focused.value} />
      <Rail
        items={[
          { id: 'home', label: t('home'), active: true, onSelect: () => {} },
          { id: 'original', label: t('originalClient'), onSelect: turnOff },
        ]}
      />
      <main class="rlc-screen">
        <Boundary onError={onError}>
          <ScreenComponent version={lcu.build.value.data?.version ?? null} locale={lcu.regionLocale.value.data?.locale ?? null} onPlay={turnOff} />
        </Boundary>
      </main>
    </div>
  );
}
