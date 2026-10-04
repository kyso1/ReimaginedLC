import { signal } from '@preact/signals';
import { t } from '../i18n';
import { readSetting, writeSetting } from './storage';

/** Camada do ReimaginedLC visível. Desligada, o client original aparece e funciona normalmente. */
export const enabled = signal(false);
/** Com a camada ligada, esconder a interface da Riot (`visibility: hidden`) em vez de só cobri-la. */
export const hideRiot = signal(true);

/** Relê a configuração. Chamado em `load()`, quando o DataStore já existe. */
export function syncLayer(): void {
  enabled.value = readSetting<unknown>('rlc.enabled', false) === true;
  hideRiot.value = readSetting<unknown>('rlc.hideRiot', true) !== false;
}

export function setEnabled(value: boolean): void {
  enabled.value = value;
  writeSetting('rlc.enabled', value);
  window.Toast?.success(value ? t('layerOn') : t('layerOff'));
}

export const toggleEnabled = (): void => setEnabled(!enabled.value);
