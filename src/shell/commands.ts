import { t } from '../i18n';
import type { ThemeEngine } from '../theme/engine';
import { toggleEnabled } from './layer';

const GROUP = 'ReimaginedLC';

/** Ações na barra de comandos do Pengu: ligar e desligar a camada, e uma por tema instalado. */
export function registerCommands(themes: ThemeEngine): void {
  const bar = window.CommandBar;
  if (!bar) return;
  bar.addAction({ name: `${GROUP}: ${t('toggleLayer')}`, group: GROUP, perform: toggleEnabled });
  for (const theme of themes.available) {
    bar.addAction({ name: `${GROUP}: ${t('themeAction')} ${theme.label}`, group: GROUP, perform: () => themes.set(theme.name) });
  }
}
