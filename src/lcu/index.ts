import type { Signal } from '@preact/signals';
import { request } from './request';
import { connect } from './socket';
import { createStore, type StoreState } from './store';
import type {
  LolChatFriendResource,
  LolGameflowGameflowPhase,
  LolGameQueuesQueue,
  LolLobbyLobbyCustomGame,
  LolLobbyLobbyDto,
  LolLobbyReceivedInvitationDto,
  LolMatchmakingMatchmakingReadyCheckResource,
  LolMatchmakingMatchmakingSearchResource,
} from './types';

export type { StoreState } from './store';

export interface Profile {
  backgroundSkinId?: number;
}

export interface Lcu {
  gameflowPhase: Signal<StoreState<LolGameflowGameflowPhase>>;
  currentSummoner: Signal<StoreState<unknown>>;
  build: Signal<StoreState<{ version: string }>>;
  regionLocale: Signal<StoreState<{ locale: string }>>;
  lobby: Signal<StoreState<LolLobbyLobbyDto>>;
  search: Signal<StoreState<LolMatchmakingMatchmakingSearchResource>>;
  readyCheck: Signal<StoreState<LolMatchmakingMatchmakingReadyCheckResource>>;
  invitations: Signal<StoreState<LolLobbyReceivedInvitationDto[]>>;
  queues: Signal<StoreState<LolGameQueuesQueue[]>>;
  friends: Signal<StoreState<LolChatFriendResource[]>>;
  /** Lista de salas personalizadas. Não tem eventos: muda só por `refresh`. */
  customGames: { state: Signal<StoreState<LolLobbyLobbyCustomGame[]>>; refresh: () => Promise<void> };
  /** Perfil público de um jogador, com cache por puuid durante a sessão. null se não houver. */
  profile: (puuid: string) => Promise<Profile | null>;
}

/** Busca de perfis com cache em memória. Falha vira null e também fica no cache. */
export function createProfiles(fetcher: (url: string) => Promise<Response> = (u) => fetch(u)) {
  const cache = new Map<string, Promise<Profile | null>>();
  return (puuid: string): Promise<Profile | null> => {
    let entry = cache.get(puuid);
    if (!entry) {
      entry = fetcher(`/lol-summoner/v1/summoner-profile?puuid=${encodeURIComponent(puuid)}`)
        .then((r) => (r.ok ? (r.json() as Promise<Profile>) : null))
        .catch(() => null);
      cache.set(puuid, entry);
    }
    return entry;
  };
}

/** Abre o único WebSocket do plugin e cria os stores. */
export function createLcu(doc: Document = document): Lcu {
  const link = doc.querySelector<HTMLLinkElement>('link[rel="riot:plugins:websocket"]');
  if (!link) throw new Error('link do WebSocket da LCU não encontrado');
  const socket = connect(link.href);
  const games = createStore<LolLobbyLobbyCustomGame[]>('/lol-lobby/v1/custom-games', socket);
  return {
    gameflowPhase: createStore('/lol-gameflow/v1/gameflow-phase', socket),
    currentSummoner: createStore('/lol-summoner/v1/current-summoner', socket),
    build: createStore('/system/v1/builds', socket),
    regionLocale: createStore('/riotclient/region-locale', socket),
    lobby: createStore('/lol-lobby/v2/lobby', socket),
    search: createStore('/lol-matchmaking/v1/search', socket),
    readyCheck: createStore('/lol-matchmaking/v1/ready-check', socket),
    invitations: createStore('/lol-lobby/v2/received-invitations', socket),
    queues: createStore('/lol-game-queues/v1/queues', socket),
    friends: createStore('/lol-chat/v1/friends', socket),
    customGames: {
      state: games,
      refresh: async () => {
        await request('POST', '/lol-lobby/v1/custom-games/refresh').catch(() => {});
        await games.refresh();
      },
    },
    profile: createProfiles(),
  };
}
