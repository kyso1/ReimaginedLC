import type { LolGameQueuesQueue } from '../../lcu/types';

export type ModeGroupId = 'sr' | 'aram' | 'tft' | 'other';
export interface ModeGroup {
  id: ModeGroupId;
  queues: LolGameQueuesQueue[];
}
export interface CustomForm {
  name: string;
  password: string;
  teamSize: number;
  spectators: 'AllAllowed' | 'LobbyAllowed' | 'NotAllowed';
}
/** Corpo de `POST /lol-lobby/v2/lobby` para criar sala. Só os campos que o client envia. */
export interface CustomLobbyBody {
  queueId: number;
  isCustom: true;
  customGameLobby: {
    lobbyName: string;
    lobbyPassword: string;
    configuration: { gameMode: string; mapId: number; mutators: { id: number }; spectatorPolicy: CustomForm['spectators']; teamSize: number };
  };
}

// Agrupamento da própria Riot. Grupo desconhecido (eventos, modos novos) vai para "outros".
const GROUP: Record<string, ModeGroupId> = { kSummonersRift: 'sr', kARAM: 'aram', kTeamfightTactics: 'tft' };
const ORDER: ModeGroupId[] = ['sr', 'aram', 'tft', 'other'];
const usable = (q: LolGameQueuesQueue) => q.queueAvailability === 'Available' && q.isVisible !== false;

/** Filas jogáveis por grupo, na ordem fixa dos cartões. Filas de criar sala ficam de fora (vão para a lista de salas). */
export function groupQueues(queues: LolGameQueuesQueue[]): ModeGroup[] {
  const buckets = new Map<ModeGroupId, LolGameQueuesQueue[]>();
  for (const q of queues) {
    if (!usable(q) || !q.name?.trim() || q.gameSelectCategory === 'CreateCustom') continue;
    // A Ferramenta de Treino vem como modo alternativo; a spec a quer junto do mapa dela.
    const id = q.gameSelectCategory === 'kTraining' ? 'sr' : (GROUP[q.gameSelectModeGroup] ?? 'other');
    buckets.set(id, [...(buckets.get(id) ?? []), q]);
  }
  return ORDER.filter((id) => buckets.has(id)).map((id) => ({
    id,
    queues: buckets
      .get(id)!
      .map((q, i) => ({ q, i }))
      .sort((a, b) => (b.q.gameSelectPriority ?? 0) - (a.q.gameSelectPriority ?? 0) || a.i - b.i)
      .map(({ q }) => q),
  }));
}

/** Modos de sala personalizada: cada fila `CreateCustom` já define mapa, modo e tipo de escolha. */
export const customModes = (queues: LolGameQueuesQueue[]) =>
  queues.filter((q) => usable(q) && q.gameSelectCategory === 'CreateCustom').sort((a, b) => a.name.localeCompare(b.name));

export function customLobbyBody(mode: LolGameQueuesQueue, form: CustomForm): CustomLobbyBody {
  return {
    queueId: mode.id,
    isCustom: true,
    customGameLobby: {
      lobbyName: form.name.trim(),
      lobbyPassword: form.password,
      configuration: {
        gameMode: mode.gameMode,
        mapId: mode.mapId,
        mutators: { id: mode.gameTypeConfig.id },
        spectatorPolicy: form.spectators,
        teamSize: Math.min(5, Math.max(1, Math.round(form.teamSize))),
      },
    },
  };
}
