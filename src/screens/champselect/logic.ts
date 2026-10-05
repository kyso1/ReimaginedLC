import type { TeamBuilderDirect_ChampSelectPlayerSelection, TeamBuilderDirect_ChampSelectSession } from '../../lcu/types';

export type Session = TeamBuilderDirect_ChampSelectSession;
export type Cell = TeamBuilderDirect_ChampSelectPlayerSelection;

/** Ação da seleção como a LCU manda (o tipo gerado declara `actions: unknown[]`). */
export interface Action {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  isInProgress: boolean;
  isAllyAction: boolean;
  pickTurn: number;
  type: string;
}

export type SelectPhase = 'ban' | 'pick' | 'waiting' | 'finalization' | 'planning' | 'none';
export interface MyTurn {
  action: Action;
  kind: 'ban' | 'pick';
}

/** `actions` vem agrupado por turno (lista de listas). */
export const flatActions = (session: Session): Action[] => ((session.actions ?? []) as Action[][]).flat();

/** Ação minha em andamento e ainda não concluída. Só ela habilita Banir ou Confirmar. */
export function myTurn(session: Session): MyTurn | null {
  const action = flatActions(session).find((a) => a.actorCellId === session.localPlayerCellId && a.isInProgress && !a.completed && (a.type === 'ban' || a.type === 'pick'));
  return action ? { action, kind: action.type as 'ban' | 'pick' } : null;
}

export function selectPhase(session: Session): SelectPhase {
  switch (session.timer?.phase) {
    case 'FINALIZATION':
      return 'finalization';
    case 'PLANNING':
      return 'planning';
    case 'BAN_PICK':
      return myTurn(session)?.kind ?? 'waiting';
    default:
      return 'none';
  }
}

/**
 * Banimentos por time. No Tournament Draft o campo `bans` vem vazio; os banimentos estão nas ações `ban`
 * concluídas (`championId` -1 é banimento que expirou). As duas fontes são somadas sem repetir.
 */
export function bansByTeam(session: Session): { mine: number[]; theirs: number[] } {
  const mine = new Set<number>(session.bans?.myTeamBans ?? []);
  const theirs = new Set<number>(session.bans?.theirTeamBans ?? []);
  for (const a of flatActions(session)) {
    if (a.type !== 'ban' || !a.completed || a.championId <= 0) continue;
    (a.isAllyAction ? mine : theirs).add(a.championId);
  }
  return { mine: [...mine], theirs: [...theirs] };
}

/** Segundos restantes a partir do último valor da LCU (`adjustedTimeLeftInPhase`, em ms) e de quando ele chegou. */
export function remainingSeconds(timeLeftMs: number, anchoredAt: number, now: number): number {
  return Math.max(0, Math.ceil((timeLeftMs - (now - anchoredAt)) / 1000));
}

/** Campeão de uma vaga: confirmado (`championId`), senão a intenção (`championPickIntent`), senão nenhum. */
export function displayedChampion(cell: Cell): { championId: number; locked: boolean } | null {
  if (cell.championId > 0) return { championId: cell.championId, locked: true };
  if (cell.championPickIntent > 0) return { championId: cell.championPickIntent, locked: false };
  return null;
}
