import type { LolGameQueuesQueue } from '../../lcu/types';

export type ModeGroupId = 'sr' | 'classic' | 'aram' | 'other';
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

// Agrupamento da própria Riot. Grupo desconhecido (eventos, modos novos) vai para "outros". kJade é o Rift Clássico (mapa 453).
const GROUP: Record<string, ModeGroupId> = { kSummonersRift: 'sr', kJade: 'classic', kARAM: 'aram' };
const ORDER: ModeGroupId[] = ['sr', 'classic', 'aram', 'other'];
// O TFT tem client próprio desde o 16.22: as filas ainda vêm "Available" na LCU, mas o client não entra mais nelas.
const usable = (q: LolGameQueuesQueue) => q.queueAvailability === 'Available' && q.isVisible !== false && q.gameMode !== 'TFT';

/**
 * Nome da fila para mostrar. As do Rift Clássico vêm com `name` vazio ("" na ranqueada), interno ("Jade") ou repetido
 * ("Classic Rift" nas duas personalizadas); a `description` é que diferencia ("Classic 5v5", "Classic (Custom Draft Pick)").
 */
export const queueLabel = (q: Pick<LolGameQueuesQueue, 'name' | 'shortName' | 'description' | 'gameMode'>) =>
  (q.gameMode === 'JADE' ? q.description || q.shortName || q.name : q.name?.trim() || q.shortName || q.description) ?? '';

/** Grupo do cartão de modo para uma fila (a Ferramenta de Treino fica no Summoner's Rift). */
export const queueGroup = (q: Pick<LolGameQueuesQueue, 'gameSelectCategory' | 'gameSelectModeGroup'>): ModeGroupId =>
  q.gameSelectCategory === 'kTraining' ? 'sr' : (GROUP[q.gameSelectModeGroup] ?? 'other');

/** Filas jogáveis por grupo, na ordem fixa dos cartões. Filas de criar sala ficam de fora (vão para a lista de salas). */
export function groupQueues(queues: LolGameQueuesQueue[]): ModeGroup[] {
  const buckets = new Map<ModeGroupId, LolGameQueuesQueue[]>();
  for (const q of queues) {
    if (!usable(q) || !queueLabel(q).trim() || q.gameSelectCategory === 'CreateCustom') continue;
    // A Ferramenta de Treino vem como modo alternativo; a spec a quer junto do mapa dela.
    const id = queueGroup(q);
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
  queues.filter((q) => usable(q) && q.gameSelectCategory === 'CreateCustom').sort((a, b) => queueLabel(a).localeCompare(queueLabel(b)));

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
