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
  /** `intent`: planejamento, quando se declara o campeão pretendido na ação de escolha (sem confirmar). */
  kind: 'ban' | 'pick' | 'intent';
}

/** `actions` vem agrupado por turno (lista de listas). */
export const flatActions = (session: Session): Action[] => ((session.actions ?? []) as Action[][]).flat();

/**
 * Ação minha em andamento e ainda não concluída. Só ela habilita Banir ou Confirmar.
 * No planejamento a LCU já marca o banimento como em andamento, mas o que vale é declarar a intenção na escolha.
 */
export function myTurn(session: Session): MyTurn | null {
  if (session.timer?.phase === 'PLANNING') {
    const pick = flatActions(session).find((a) => a.actorCellId === session.localPlayerCellId && !a.completed && a.type === 'pick');
    return pick ? { action: pick, kind: 'intent' } : null;
  }
  const action = flatActions(session).find((a) => a.actorCellId === session.localPlayerCellId && a.isInProgress && !a.completed && (a.type === 'ban' || a.type === 'pick'));
  return action ? { action, kind: action.type as 'ban' | 'pick' } : null;
}

export function selectPhase(session: Session): SelectPhase {
  switch (session.timer?.phase) {
    case 'FINALIZATION':
      return 'finalization';
    case 'PLANNING':
      return 'planning';
    case 'BAN_PICK': {
      const kind = myTurn(session)?.kind;
      return kind === 'ban' || kind === 'pick' ? kind : 'waiting';
    }
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

/** Ação em andamento por vaga: quem está banindo ou escolhendo agora. */
export function actingCells(session: Session): Map<number, 'ban' | 'pick'> {
  const acting = new Map<number, 'ban' | 'pick'>();
  if (session.timer?.phase === 'PLANNING') return acting;
  for (const a of flatActions(session)) if (a.isInProgress && !a.completed && (a.type === 'ban' || a.type === 'pick')) acting.set(a.actorCellId, a.type);
  return acting;
}

/**
 * Campeão do adversário de rota (0 enquanto não se sabe). A LCU só manda a posição do inimigo em alguns modos;
 * na ranqueada ela vem vazia, então vale o único inimigo já confirmado cuja rota principal recomendada é a minha.
 * ponytail: palpite pela rota recomendada; com dois candidatos (ou nenhum) o jogador escolhe em "Contra".
 */
export function laneOpponent(enemies: Cell[], position: string, lanes: Record<string, { recommendedPositions?: string[] }>): number {
  const pos = position.toUpperCase();
  if (!pos) return 0;
  const placed = enemies.find((c) => (c.assignedPosition ?? '').toUpperCase() === pos);
  if (placed) return placed.championId > 0 ? placed.championId : 0;
  const guess = enemies.filter((c) => c.championId > 0 && !c.assignedPosition && lanes[String(c.championId)]?.recommendedPositions?.[0] === pos);
  return guess.length === 1 ? guess[0]!.championId : 0;
}
