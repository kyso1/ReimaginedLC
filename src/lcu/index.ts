import type { Signal } from '@preact/signals';
import { createGameData, type GameData } from '../data/gamedata';
import { request } from './request';
import { connect } from './socket';
import { createStore, type StoreState } from './store';
import type {
  LolChatFriendResource,
  LolEndOfGameEndOfGameStats,
  LolGameflowGameflowSession,
  LolHonorV2Ballot,
  LolPerksPerkPageResource,
  LolPerksRecommendedPositionsMapResource,
  TeamBuilderDirect_ChampGridChampion,
  TeamBuilderDirect_ChampSelectSession,
  TeamBuilderDirect_SkinSelectorSkin,
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
  /** Nome (Riot ID, sem a tag) por puuid, com cache. A LCU manda `summonerName` vazio desde o Riot ID. */
  name: (puuid: string) => Promise<string | null>;
  /** Campeões, feitiços e splashes, com cache. */
  game: GameData;
  champSelect: Signal<StoreState<TeamBuilderDirect_ChampSelectSession>>;
  skins: Signal<StoreState<TeamBuilderDirect_SkinSelectorSkin[]>>;
  pickable: Signal<StoreState<number[]>>;
  bannable: Signal<StoreState<number[]>>;
  perkPages: Signal<StoreState<LolPerksPerkPageResource[]>>;
  currentPerkPage: Signal<StoreState<LolPerksPerkPageResource>>;
  gameflowSession: Signal<StoreState<LolGameflowGameflowSession>>;
  honorBallot: Signal<StoreState<LolHonorV2Ballot>>;
  endOfGame: Signal<StoreState<LolEndOfGameEndOfGameStats>>;
  /** Rotas recomendadas por campeão (id em texto → posições em maiúsculas). */
  lanes: Signal<StoreState<Record<string, LolPerksRecommendedPositionsMapResource>>>;
  /** Grade da seleção: traz `positionsFavorited` (rotas em minúsculas) por campeão. */
  gridChampions: Signal<StoreState<TeamBuilderDirect_ChampGridChampion[]>>;
}

type Fetcher = (url: string) => Promise<Response>;

/** Leitura por puuid com cache em memória durante a sessão. Falha vira null e também fica no cache. */
function cachedByPuuid<T>(url: (puuid: string) => string, pick: (body: unknown) => T | null, fetcher: Fetcher) {
  const cache = new Map<string, Promise<T | null>>();
  return (puuid: string): Promise<T | null> => {
    let entry = cache.get(puuid);
    if (!entry) {
      entry = fetcher(url(encodeURIComponent(puuid)))
        .then((r) => (r.ok ? r.json() : null))
        .then((body: unknown) => (body ? pick(body) : null))
        .catch(() => null);
      cache.set(puuid, entry);
    }
    return entry;
  };
}

export const createProfiles = (fetcher: Fetcher = (u) => fetch(u)) =>
  cachedByPuuid<Profile>((p) => `/lol-summoner/v1/summoner-profile?puuid=${p}`, (b) => b as Profile, fetcher);

export const createNames = (fetcher: Fetcher = (u) => fetch(u)) =>
  cachedByPuuid<string>((p) => `/lol-summoner/v1/summoners-by-puuid-cached/${p}`, (b) => {
    const n = (b as { gameName?: unknown }).gameName;
    return typeof n === 'string' && n ? n : null;
  }, fetcher);

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
    name: createNames(),
    game: createGameData(),
    champSelect: createStore('/lol-champ-select/v1/session', socket),
    skins: createStore('/lol-champ-select/v1/skin-carousel-skins', socket),
    pickable: createStore('/lol-champ-select/v1/pickable-champion-ids', socket),
    bannable: createStore('/lol-champ-select/v1/bannable-champion-ids', socket),
    perkPages: createStore('/lol-perks/v1/pages', socket),
    currentPerkPage: createStore('/lol-perks/v1/currentpage', socket),
    gameflowSession: createStore('/lol-gameflow/v1/session', socket),
    honorBallot: createStore('/lol-honor-v2/v1/ballot', socket),
    endOfGame: createStore('/lol-end-of-game/v1/eog-stats-block', socket),
    lanes: createStore('/lol-perks/v1/recommended-champion-positions', socket),
    gridChampions: createStore('/lol-champ-select/v1/all-grid-champions', socket),
  };
}
