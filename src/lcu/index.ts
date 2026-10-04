import type { Signal } from '@preact/signals';
import { connect } from './socket';
import { createStore, type StoreState } from './store';
import type { LolGameflowGameflowPhase } from './types';

export type { StoreState } from './store';

export interface Lcu {
  gameflowPhase: Signal<StoreState<LolGameflowGameflowPhase>>;
  currentSummoner: Signal<StoreState<unknown>>;
  build: Signal<StoreState<{ version: string }>>;
  regionLocale: Signal<StoreState<{ locale: string }>>;
}

/** Abre o único WebSocket do plugin e cria os stores deste subprojeto. */
export function createLcu(doc: Document = document): Lcu {
  const link = doc.querySelector<HTMLLinkElement>('link[rel="riot:plugins:websocket"]');
  if (!link) throw new Error('link do WebSocket da LCU não encontrado');
  const socket = connect(link.href);
  return {
    gameflowPhase: createStore('/lol-gameflow/v1/gameflow-phase', socket),
    currentSummoner: createStore('/lol-summoner/v1/current-summoner', socket),
    build: createStore('/system/v1/builds', socket),
    regionLocale: createStore('/riotclient/region-locale', socket),
  };
}
