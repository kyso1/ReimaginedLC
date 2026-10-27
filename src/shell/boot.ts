import { t } from '../i18n';

/**
 * Tela de carregamento: cobre o fundo vazio da Riot desde o `init` do Pengu (antes do nosso CSS e do tema existirem)
 * até o client e o perfil responderem. Por isso o estilo vem junto e as cores são só os padrões dos tokens.
 * Some com fade; nunca fica mais que `BOOT_MAX_MS` (se algo travar, o client aparece).
 */
export const BOOT_ID = 'rlc-boot';
export const BOOT_MAX_MS = 30_000;

const CSS = `
#${BOOT_ID} { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px;
  background: radial-gradient(ellipse 70% 60% at 50% 42%, var(--rlc-color-surface, #141a2e) 0%, var(--rlc-color-bg, #070a14) 70%);
  color: var(--rlc-color-text, #eef1f8); font-family: Quicksand, system-ui, sans-serif; transition: opacity 0.45s ease; -webkit-app-region: drag; }
#${BOOT_ID}[data-leaving] { opacity: 0; pointer-events: none; }
#${BOOT_ID} .rlc-boot-mark { position: relative; width: 84px; height: 84px; }
#${BOOT_ID} .rlc-boot-mark i { position: absolute; border-radius: 50%; border: 2px solid transparent; }
#${BOOT_ID} .rlc-boot-mark i:nth-child(1) { inset: 0; border-top-color: var(--rlc-color-accent, #8fb4ff); border-right-color: var(--rlc-color-accent, #8fb4ff); animation: rlc-boot-spin 1.2s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite; }
#${BOOT_ID} .rlc-boot-mark i:nth-child(2) { inset: 14px; border-bottom-color: var(--rlc-color-highlight, #c8a04a); border-left-color: var(--rlc-color-highlight, #c8a04a); animation: rlc-boot-spin 1.6s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite reverse; }
#${BOOT_ID} .rlc-boot-mark i:nth-child(3) { inset: 34px; background: var(--rlc-color-accent, #8fb4ff); animation: rlc-boot-pulse 1.2s ease-in-out infinite; }
#${BOOT_ID} .rlc-boot-name { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.04em; }
#${BOOT_ID} .rlc-boot-name span { color: var(--rlc-color-accent, #8fb4ff); }
#${BOOT_ID} .rlc-boot-status { margin: 0; min-height: 1.2em; font-size: 13px; color: var(--rlc-color-textMuted, #9aa4b8); }
#${BOOT_ID} .rlc-boot-bar { width: 180px; height: 2px; overflow: hidden; border-radius: 2px; background: var(--rlc-color-border, rgba(255, 255, 255, 0.12)); }
#${BOOT_ID} .rlc-boot-bar::after { content: ''; display: block; width: 40%; height: 100%; background: var(--rlc-color-accent, #8fb4ff); animation: rlc-boot-slide 1.1s ease-in-out infinite; }
@keyframes rlc-boot-spin { to { transform: rotate(360deg); } }
@keyframes rlc-boot-pulse { 50% { transform: scale(0.6); opacity: 0.5; } }
@keyframes rlc-boot-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@media (prefers-reduced-motion: reduce) { #${BOOT_ID} *, #${BOOT_ID} *::after { animation-duration: 3s !important; } }
`;

let timer: ReturnType<typeof setTimeout> | undefined;

/** Põe a tela (uma vez). Chamado no `init`; o `<body>` pode ainda não existir, então vai no `<html>`. */
export function showBoot(doc: Document = document): void {
  if (doc.getElementById(BOOT_ID)) return;
  const el = doc.createElement('div');
  el.id = BOOT_ID;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  const style = doc.createElement('style');
  style.textContent = CSS;
  const mark = doc.createElement('div');
  mark.className = 'rlc-boot-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.append(doc.createElement('i'), doc.createElement('i'), doc.createElement('i'));
  const name = doc.createElement('p');
  name.className = 'rlc-boot-name';
  name.append('Reimagined', Object.assign(doc.createElement('span'), { textContent: 'LC' }));
  const status = doc.createElement('p');
  status.className = 'rlc-boot-status';
  status.textContent = t('bootClient');
  const bar = doc.createElement('div');
  bar.className = 'rlc-boot-bar';
  el.append(style, mark, name, status, bar);
  doc.documentElement.append(el);
  // Diagnóstico (relatório de erro e testes): quando a tela entrou e saiu.
  (window as Window & { __rlcBoot?: { shown: number; hidden?: number } }).__rlcBoot = { shown: performance.now() };
  timer = setTimeout(() => hideBoot(doc), BOOT_MAX_MS);
}

/** Texto embaixo do nome (o que está carregando agora). */
export function bootStatus(text: string, doc: Document = document): void {
  const s = doc.querySelector(`#${BOOT_ID} .rlc-boot-status`);
  if (s && s.textContent !== text) s.textContent = text;
}

/** Tira a tela com fade. Sem a tela, não faz nada. */
export function hideBoot(doc: Document = document): void {
  clearTimeout(timer);
  const el = doc.getElementById(BOOT_ID);
  if (!el || el.dataset.leaving !== undefined) return;
  el.dataset.leaving = '';
  const diag = (window as Window & { __rlcBoot?: { shown: number; hidden?: number } }).__rlcBoot;
  if (diag) diag.hidden = performance.now();
  setTimeout(() => el.remove(), 500);
}
