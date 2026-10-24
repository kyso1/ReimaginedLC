import { signal } from '@preact/signals';
import { t } from '../i18n';
import { loadPrefs } from './prefs';
import { readSetting, writeSetting } from './storage';

/** Camada do ReimaginedLC visível. Desligada, o client original aparece e funciona normalmente. */
export const enabled = signal(false);
/** Com a camada ligada, esconder a interface da Riot (`visibility: hidden`) em vez de só cobri-la. */
export const hideRiot = signal(true);

/** Relê a configuração. Chamado em `load()`, quando o DataStore já existe. */
export function syncLayer(): void {
  // Preferência "ao abrir o client" fixa o estado; sem ela, fica como estava da última vez. Na primeira vez (nada
  // gravado) já abre ligada: quem instalou quer ver a interface sem procurar atalho.
  enabled.value = loadPrefs().openOnStart ?? readSetting<unknown>('rlc.enabled', true) === true;
  hideRiot.value = readSetting<unknown>('rlc.hideRiot', true) !== false;
}

export function setEnabled(value: boolean): void {
  enabled.value = value;
  writeSetting('rlc.enabled', value);
  window.Toast?.success(value ? t('layerOn') : t('layerOff'));
}

export const toggleEnabled = (): void => setEnabled(!enabled.value);
