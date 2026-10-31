import { computed, type Signal } from '@preact/signals';
import { createGameData, type GameData } from '../data/gamedata';
import { request } from './request';
import { connect } from './socket';
import { createListStore, createStore, type StoreState } from './store';
import type { ClientAudio } from '../shell/sound';
import type {
  LolChatFriendResource,
  LolChatGroupResource,
  LolChatConversationResource,
  LolChatFriendRequestResource,
  LolChatUserResource,
  LolLootPlayerLoot,
  LolEndOfGameEndOfGameStats,
  LolGameflowGameflowSession,
  LolHonorV2Ballot,
  LolHonorV2Honor,
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
  /** Pastas de amigos (a padrão vem como `**Default`). */
  friendGroups: Signal<StoreState<LolChatGroupResource[]>>;
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
  /** Cartões do ARAM (2 ou 3 campeões para escolher um); 404 fora dele. O terceiro, quando há, é a carta da sorte. */
  subset: Signal<StoreState<number[]>> & { refresh: () => Promise<void> };
  /** Favoritos da torcida da Arena (bigorna na grade: escolher um dá bônus); 404 ou vazio fora dela. */
  crowdFavorites: Signal<StoreState<number[]>>;
  perkPages: Signal<StoreState<LolPerksPerkPageResource[]>>;
  currentPerkPage: Signal<StoreState<LolPerksPerkPageResource>>;
  gameflowSession: Signal<StoreState<LolGameflowGameflowSession>>;
  honorBallot: Signal<StoreState<LolHonorV2Ballot>>;
  /** Honras que você recebeu na última partida (quem mandou e se era aliado ou inimigo). */
  honorRecognition: Signal<StoreState<LolHonorV2Honor[]>>;
  endOfGame: Signal<StoreState<LolEndOfGameEndOfGameStats>>;
  /** Rotas recomendadas por campeão (id em texto → posições em maiúsculas). */
  lanes: Signal<StoreState<Record<string, LolPerksRecommendedPositionsMapResource>>>;
  /** Grade da seleção: traz `positionsFavorited` (rotas em minúsculas) por campeão. */
  gridChampions: Signal<StoreState<TeamBuilderDirect_ChampGridChampion[]>>;
  chatMe: Signal<StoreState<LolChatUserResource>>;
  /** RP e Essência Azul. A rota sem `currencyTypes` responde 400; não há evento para a URI com query (atualizar com `refresh`). */
  wallet: Signal<StoreState<Record<string, number>>> & { refresh: () => Promise<void> };
  /** Essência Laranja (espólio `CURRENCY_cosmetic`). */
  orangeEssence: Signal<StoreState<LolLootPlayerLoot>> & { refresh: () => Promise<void> };
  friendRequests: Signal<StoreState<LolChatFriendRequestResource[]>>;
  /** Som do client (Configurações › Som): o mesmo que o rcp-fe-audio da Riot segue. */
  audioSettings: Signal<StoreState<{ data?: ClientAudio }>>;
  conversations: Signal<StoreState<LolChatConversationResource[]>> & { refresh: () => Promise<void> };
  /** Espólio; a LCU não manda evento na lista ao criar/abrir: `refresh` relê. */
  loot: Signal<StoreState<LolLootPlayerLoot[]>> & { refresh: () => Promise<void> };
  /** Eventos por prefixo de URI (mensagens de chat têm o id da mensagem na URI). */
  events: { onPrefix: (prefix: string, fn: (uri: string, eventType: string, data: unknown) => void) => () => void };
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

/** Eventos de um mesmo assunto chegam em rajada: uma releitura só, agrupada nesse intervalo. */
export const REFRESH_BATCH_MS = 300;

/**
 * Relê o store a cada evento de `prefix` (fora o próprio `skip`, que o store já trata), agrupado em REFRESH_BATCH_MS.
 * Para URIs que não recebem evento próprio ou cujo endereço tem query string (os eventos da LCU nunca trazem query).
 */
export function refreshOnPrefix<S extends { refresh: () => Promise<void> }>(store: S, socket: Pick<ReturnType<typeof connect>, 'subscribePrefix'>, prefix: string, skip?: string): S {
  let timer: ReturnType<typeof setTimeout> | null = null;
  socket.subscribePrefix(prefix, (uri) => {
    if (uri === skip || timer) return;
    timer = setTimeout(() => {
      timer = null;
      void store.refresh();
    }, REFRESH_BATCH_MS);
  });
  return store;
}

/**
 * Espólio: a lista não recebe evento quando algo é criado, aberto ou ganho; os avisos chegam em outras URIs do
 * lol-loot (mapa, item, notificações). Qualquer um deles relê a lista.
 */
/** O primeiro estado com dados entre leituras equivalentes (o mesmo recurso por caminhos que mudam entre versões do client). */
function firstWithData<T>(stores: Array<Signal<StoreState<T>>>): Signal<StoreState<T>> {
  return computed(() => stores.find((s) => s.value.data != null)?.value ?? stores[0]!.value) as Signal<StoreState<T>>;
}

/**
 * Pedidos de amizade: o client lê a lista na v2, mas a LCU só avisa na v1 (`/lol-chat/v1/friend-requests/...`).
 * Sem isto, um pedido novo só aparecia ao reconectar (tocava o som e nada surgia).
 */
export const friendRequestsStore = (socket: ReturnType<typeof connect>) => refreshOnPrefix(createStore<LolChatFriendRequestResource[]>('/lol-chat/v2/friend-requests', socket), socket, '/lol-chat/v1/friend-requests');

const lootStore = (socket: ReturnType<typeof connect>) => refreshOnPrefix(createStore<LolLootPlayerLoot[]>('/lol-loot/v1/player-loot', socket), socket, '/lol-loot/', '/lol-loot/v1/player-loot');

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
    friends: createListStore('/lol-chat/v1/friends', socket),
    friendGroups: createStore('/lol-chat/v1/friend-groups', socket),
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
    subset: createStore('/lol-lobby-team-builder/champ-select/v1/subset-champion-list', socket),
    crowdFavorites: firstWithData([
      // A LCU registra o caminho com a grafia "favorte"; o client da Riot pede "favorite". Lê os dois: se a Riot corrigir,
      // continua funcionando sem atualização nossa.
      createStore<number[]>('/lol-lobby-team-builder/champ-select/v1/crowd-favorte-champion-list', socket),
      createStore<number[]>('/lol-lobby-team-builder/champ-select/v1/crowd-favorite-champion-list', socket),
    ]),
    perkPages: createStore('/lol-perks/v1/pages', socket),
    currentPerkPage: createStore('/lol-perks/v1/currentpage', socket),
    gameflowSession: createStore('/lol-gameflow/v1/session', socket),
    honorBallot: createStore('/lol-honor-v2/v1/ballot', socket),
    honorRecognition: createStore('/lol-honor-v2/v1/recognition', socket),
    endOfGame: createStore('/lol-end-of-game/v1/eog-stats-block', socket),
    lanes: createStore('/lol-perks/v1/recommended-champion-positions', socket),
    gridChampions: createStore('/lol-champ-select/v1/all-grid-champions', socket),
    chatMe: createStore('/lol-chat/v1/me', socket),
    // O endereço tem query string e os eventos da LCU não: sem isto o saldo só mudava ao reabrir (compra na loja,
    // campeão desbloqueado no espólio). Qualquer mudança no inventário relê.
    wallet: refreshOnPrefix(createStore('/lol-inventory/v1/wallet?currencyTypes=' + encodeURIComponent('["RP","lol_blue_essence"]'), socket), socket, '/lol-inventory/'),
    orangeEssence: createStore('/lol-loot/v1/player-loot/CURRENCY_cosmetic', socket),
    friendRequests: friendRequestsStore(socket),
    audioSettings: createStore('/lol-settings/v1/local/lol-audio', socket),
    conversations: createListStore('/lol-chat/v1/conversations', socket),
    loot: lootStore(socket),
    events: { onPrefix: (prefix, fn) => socket.subscribePrefix(prefix, fn) },
  };
}
