// Dados sintéticos para testes. Nomes neutros e UUIDs falsos; nunca dados reais de jogadores.
import { signal } from '@preact/signals';
import type { Lcu, StoreState } from '../lcu';
import type {
  LolChatFriendResource,
  LolGameQueuesQueue,
  LolLobbyLobbyDto,
  LolLobbyLobbyParticipantDto,
  LolLobbyReceivedInvitationDto,
  LolMatchmakingMatchmakingReadyCheckResource,
  LolMatchmakingMatchmakingSearchResource,
} from '../lcu/types';

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

export const ready = <T,>(data: T | null): StoreState<T> => ({ status: 'ready', data });

export function member(over: Partial<LolLobbyLobbyParticipantDto> = {}): LolLobbyLobbyParticipantDto {
  const id = ++n;
  return {
    summonerId: id, summonerIconId: 1, summonerName: 'Fulano', summonerInternalName: `fulano${id}`, puuid: uuid(), summonerLevel: 30,
    allowedStartActivity: false, allowedChangeActivity: false, allowedToggleInvite: false, allowedKickOthers: false, allowedInviteOthers: false,
    isLeader: false, isSpectator: false, teamId: 100, firstPositionPreference: '', secondPositionPreference: '', playerSlots: [], ready: true,
    showGhostedBanner: false, autoFillEligible: false, autoFillProtectedForStreaking: false, autoFillProtectedForPromos: false,
    autoFillProtectedForSoloing: false, autoFillProtectedForRemedy: false, isBot: false, botId: '', botDifficulty: 'NONE',
    botChampionId: 0, botPosition: '', botUuid: '', ...over,
  };
}

export const leader = (over: Partial<LolLobbyLobbyParticipantDto> = {}) =>
  member({ isLeader: true, allowedStartActivity: true, allowedChangeActivity: true, allowedToggleInvite: true, allowedKickOthers: true, allowedInviteOthers: true, ...over });

export function lobby(members: LolLobbyLobbyParticipantDto[], local = members[0]!, config: Partial<LolLobbyLobbyDto['gameConfig']> = {}): LolLobbyLobbyDto {
  return {
    partyId: uuid(), partyType: 'closed', members, localMember: local, invitations: [], canStartActivity: true,
    multiUserChatId: '', multiUserChatPassword: '', mucJwtDto: {} as LolLobbyLobbyDto['mucJwtDto'], scarcePositions: [], popularChampions: [],
    gameConfig: {
      gameMode: 'CLASSIC', mapId: 11, queueId: 400, pickType: '', maxTeamSize: 5, maxLobbySize: 5, maxHumanPlayers: 5, numberOfTeamsInLobby: 1,
      maxLobbySpectatorCount: 0, numPlayersPerTeam: 5, allowablePremadeSizes: [1, 2, 3, 5], premadeSizeAllowed: true, isTeamBuilderManaged: true,
      isCustom: false, showPositionSelector: true, showQuickPlaySlotSelection: false, isLobbyFull: false, shouldForceScarcePositionSelection: false,
      customLobbyName: '', customMutatorName: '', customTeam100: [], customTeam200: [], customSpectators: [], customSpectatorPolicy: 'NotAllowed',
      customRewardsDisabledReasons: [], ...config,
    },
  };
}

export const queue = (over: Partial<LolGameQueuesQueue>): LolGameQueuesQueue =>
  ({
    id: 400, mapId: 11, name: 'Normal', shortName: '', description: '', gameMode: 'CLASSIC', category: 'PvP', isCustom: false, isVisible: true,
    queueAvailability: 'Available', gameSelectModeGroup: 'kSummonersRift', gameSelectCategory: 'kPvP', gameSelectPriority: 0,
    numPlayersPerTeam: 5, showPositionSelector: false, gameTypeConfig: { id: 1 }, ...over,
  }) as LolGameQueuesQueue;

export const invitation = (over: Partial<LolLobbyReceivedInvitationDto> = {}): LolLobbyReceivedInvitationDto =>
  ({
    invitationId: uuid(), fromPuuid: uuid(), fromSummonerId: 9, state: 'Pending', timestamp: '', fromSummonerName: 'Zeca', canAcceptInvitation: true,
    restrictions: [], gameConfig: { queueId: 440 }, isSelfInvite: false, invitationType: 'party', ...over,
  }) as LolLobbyReceivedInvitationDto;

export const readyCheck = (over: Partial<LolMatchmakingMatchmakingReadyCheckResource> = {}): LolMatchmakingMatchmakingReadyCheckResource =>
  ({ state: 'InProgress', playerResponse: 'None', dodgeWarning: 'None', timer: 2, declinerIds: [], suppressUx: false, ...over }) as LolMatchmakingMatchmakingReadyCheckResource;

export const search = (over: Partial<LolMatchmakingMatchmakingSearchResource> = {}): LolMatchmakingMatchmakingSearchResource =>
  ({
    queueId: 400, isCurrentlyInQueue: true, lobbyId: '', searchState: 'Searching', timeInQueue: 72, estimatedQueueTime: 150,
    readyCheck: readyCheck({ state: 'Invalid' }), errors: [], ...over,
  }) as LolMatchmakingMatchmakingSearchResource;

export const friend = (over: Partial<LolChatFriendResource> = {}): LolChatFriendResource =>
  ({ summonerId: ++n, puuid: uuid(), gameName: 'Beltrano', gameTag: 'TAG', availability: 'chat', ...over }) as LolChatFriendResource;

/** Lcu de teste: tudo pronto e vazio, com sobrescritas por campo. */
export function fakeLcu(over: Partial<Lcu> = {}): Lcu {
  return {
    gameflowPhase: signal(ready('None')) as Lcu['gameflowPhase'],
    currentSummoner: signal(ready(null)),
    build: signal(ready({ version: '16.19.823.0722' })),
    regionLocale: signal(ready({ locale: 'pt_BR' })),
    lobby: signal(ready<LolLobbyLobbyDto>(null)),
    search: signal(ready<LolMatchmakingMatchmakingSearchResource>(null)),
    readyCheck: signal(ready<LolMatchmakingMatchmakingReadyCheckResource>(null)),
    invitations: signal(ready([])),
    queues: signal(ready([])),
    friends: signal(ready([])),
    customGames: { state: signal(ready([])), refresh: async () => {} },
    profile: async () => null,
    name: async () => null,
    game: { champions: async () => new Map(), spells: async () => new Map(), splash: async () => null, items: async () => new Map() },
    champSelect: signal(ready<Lcu['champSelect']['value']['data'] & object>(null)),
    skins: signal(ready([])),
    pickable: signal(ready([])),
    bannable: signal(ready([])),
    perkPages: signal(ready([])),
    currentPerkPage: signal(ready<Lcu['currentPerkPage']['value']['data'] & object>(null)),
    gameflowSession: signal(ready<Lcu['gameflowSession']['value']['data'] & object>(null)),
    honorBallot: signal(ready<Lcu['honorBallot']['value']['data'] & object>(null)),
    endOfGame: signal(ready<Lcu['endOfGame']['value']['data'] & object>(null)),
    lanes: signal(ready({})),
    gridChampions: signal(ready([])),
    chatMe: signal(ready<Lcu['chatMe']['value']['data'] & object>(null)),
    wallet: Object.assign(signal(ready<Record<string, number>>(null)), { refresh: async () => {} }),
    friendRequests: signal(ready([])),
    conversations: signal(ready([])),
    loot: signal(ready([])),
    events: { onPrefix: () => () => {} },
    orangeEssence: Object.assign(signal(ready<Lcu['orangeEssence']['value']['data'] & object>(null)), { refresh: async () => {} }),
    ...over,
  };
}

// Seleção de campeões, no formato da gravação `docs/dump/sessions/selecao-personalizada.jsonl`.
type Session = import('../lcu/types').TeamBuilderDirect_ChampSelectSession;
type Cell = import('../lcu/types').TeamBuilderDirect_ChampSelectPlayerSelection;
export interface ActionFixture { id: number; actorCellId: number; championId: number; completed: boolean; isInProgress: boolean; isAllyAction: boolean; pickTurn: number; duration: number; type: string }

export const action = (over: Partial<ActionFixture> = {}): ActionFixture =>
  ({ id: ++n, actorCellId: 0, championId: 0, completed: false, isInProgress: false, isAllyAction: true, pickTurn: 0, duration: 0, type: 'pick', ...over });

export const cell = (over: Partial<Cell> = {}): Cell =>
  ({
    cellId: 0, puuid: uuid(), gameName: 'Fulano', tagLine: 'TAG', team: 1, assignedPosition: '', championId: 0, championPickIntent: 0,
    selectedSkinId: 0, spell1Id: 4, spell2Id: 14, summonerId: ++n, nameVisibilityType: 'VISIBLE', ...over,
  }) as Cell;

export const session = (over: Partial<Session> & { actions?: ActionFixture[][] } = {}): Session =>
  ({
    id: uuid(), gameId: 1, queueId: 3130, localPlayerCellId: 0, isCustomGame: true,
    timer: { phase: 'BAN_PICK', adjustedTimeLeftInPhase: 30000, totalTimeInPhase: 30000, internalNowInEpochMs: 0, isInfinite: false },
    myTeam: [cell()], theirTeam: [], actions: [], bans: { myTeamBans: [], theirTeamBans: [], numBans: 0 },
    trades: [], pickOrderSwaps: [], positionSwaps: [], benchEnabled: false, benchChampions: [], allowRerolling: false, rerollsRemaining: 0,
    allowSkinSelection: true, hasSimultaneousBans: false, hasSimultaneousPicks: false, ...over,
  }) as unknown as Session;

/** Motor de temas de teste: só o necessário, com `set` substituível. */
export function fakeThemes(active: import('@preact/signals').Signal<import('../theme/resolve').ResolvedTheme>, available: Array<{ name: string; label: string }>, set: (name: string, game?: 'lol' | 'tft') => void): import('../theme/engine').ThemeEngine {
  return {
    active,
    forGame: { lol: active, tft: active },
    list: signal(available.map((a) => ({ ...a, user: false }))),
    available,
    set,
    saveUser: () => ({ ok: true }),
    deleteUser: () => {},
    exportTheme: () => null,
    manifest: () => null,
    resolveDraft: () => ({ ok: false, error: 'teste' }),
  };
}
