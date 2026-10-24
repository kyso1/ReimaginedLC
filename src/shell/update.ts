import { computed, signal, type ReadonlySignal } from '@preact/signals';
import { t } from '../i18n';
import type { Lcu } from '../lcu';
import { UPDATE_EVENT, type LoaderState } from '../../loader/shared';

// O carregador (loader/) procura, baixa e verifica versões novas; aqui só o aviso "Atualização pronta — Recarregar".
// Nunca recarrega sozinho.

/** Versão nova já baixada e verificada, que entra ao recarregar; ou null. */
export const update = signal<{ version: string } | null>(null);

/** Fases em que recarregar não atrapalha: fora de fila, seleção e partida. */
const SAFE = new Set(['None', 'Lobby', 'EndOfGame', 'PreEndOfGame', 'WaitingForStats']);
export const safeToReload = (phase: unknown): boolean => typeof phase === 'string' && SAFE.has(phase);

const phase = signal<ReadonlySignal<{ data: unknown }> | null>(null);
/** O botão Recarregar só fica ativo nas fases seguras. */
export const canReload = computed(() => safeToReload(phase.value?.value.data));

/** Recarrega a janela (o carregador importa a versão nova), só numa fase segura. */
export function reloadForUpdate(reload = () => window.location.reload()): void {
  if (canReload.value) reload();
}

/** Liga o aviso: lê a versão pronta publicada pelo carregador e escuta as próximas. Sem carregador, nada aparece. */
export function watchUpdates(lcu: Pick<Lcu, 'gameflowPhase'>, win: Window = window): void {
  phase.value = lcu.gameflowPhase;
  const ready = (version: unknown) => {
    if (typeof version !== 'string' || update.peek()?.version === version) return;
    update.value = { version };
    window.Toast?.success(`${t('updReady')} ${version}`);
  };
  ready((win as Window & { __rlcLoader?: LoaderState }).__rlcLoader?.ready);
  win.addEventListener(UPDATE_EVENT, (e) => ready((e as CustomEvent<{ version?: unknown }>).detail?.version));
}
