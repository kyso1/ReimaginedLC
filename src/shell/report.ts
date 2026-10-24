import { prefs } from './prefs';

export const ISSUES_URL = 'https://github.com/kyso1/ReimaginedLC/issues/new?template=bug.yml';

/** Último erro que desligou a camada (start.ts grava em sessionStorage), ou null. */
export function lastError(): string | null {
  try {
    return sessionStorage.getItem('rlc:lastError');
  } catch {
    return null;
  }
}

/** Relatório para colar numa issue ou numa IA: versão, ambiente e o último erro. Sem nome de invocador nem dados da conta. */
export function errorReport(env: { phase: string | null; theme: string; tftTheme: string }): string {
  const p = prefs.value;
  const error = lastError();
  return [
    '### ReimaginedLC report',
    `- Version: ${__RLC_VERSION__}`,
    `- Time: ${new Date().toISOString()}`,
    `- Game phase: ${env.phase ?? 'unknown'}`,
    `- Theme: ${env.theme} (TFT: ${env.tftTheme})`,
    `- Language: ${p.locale}, lite: ${p.lite}, motion: ${p.motion}`,
    `- Plugins: ${[p.autoAccept && 'auto-accept', p.appearOffline && 'appear-offline', p.rose && 'rose', p.spotify && 'spotify'].filter(Boolean).join(', ') || 'none'}`,
    `- Browser: ${navigator.userAgent}`,
    '',
    '### Last error',
    '```',
    error ?? 'none recorded in this session',
    '```',
  ].join('\n');
}
