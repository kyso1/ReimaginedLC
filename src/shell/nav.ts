import { signal } from '@preact/signals';

/**
 * Pedido de abrir o perfil de alguém vindo de fora do shell (placar do fim de jogo, histórico). O App atende e zera.
 */
export const profileRequest = signal<string | null>(null);
export const openProfile = (puuid: string): void => void (profileRequest.value = puuid);
