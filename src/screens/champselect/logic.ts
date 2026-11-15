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
 * Banimentos por time, na ordem em que aconteceram. `0` é banimento nulo: ação concluída sem campeão (o jogador não
 * baniu ou o tempo acabou). No Tournament Draft o campo `bans` vem vazio; nos outros modos ele é somado sem repetir.
 */
export function bansByTeam(session: Session): { mine: number[]; theirs: number[] } {
  const mine: number[] = [];
  const theirs: number[] = [];
  const add = (list: number[], id: number) => (id <= 0 ? list.push(0) : !list.includes(id) && list.push(id));
  for (const a of flatActions(session)) if (a.type === 'ban' && a.completed) add(a.isAllyAction ? mine : theirs, a.championId);
  for (const id of session.bans?.myTeamBans ?? []) if (id > 0) add(mine, id);
  for (const id of session.bans?.theirTeamBans ?? []) if (id > 0) add(theirs, id);
  return { mine, theirs };
}

/** Campeões que ninguém mais pode pegar: banidos, ou travados por outro jogador (exceto com escolhas repetidas). */
export function unavailable(session: Session): Map<number, 'banned' | 'picked'> {
  const out = new Map<number, 'banned' | 'picked'>();
  const bans = bansByTeam(session);
  for (const id of [...bans.mine, ...bans.theirs]) if (id > 0) out.set(id, 'banned');
  if (session.allowDuplicatePicks) return out;
  for (const a of flatActions(session)) if (a.type === 'pick' && a.completed && a.championId > 0 && a.actorCellId !== session.localPlayerCellId && !out.has(a.championId)) out.set(a.championId, 'picked');
  return out;
}

/** Campeões que os aliados querem jogar: intenção do planejamento ou o destaque da escolha em andamento. */
export function allyWants(session: Session): Set<number> {
  const out = new Set<number>();
  for (const c of session.myTeam) if (c.cellId !== session.localPlayerCellId && c.championPickIntent > 0) out.add(c.championPickIntent);
  for (const a of flatActions(session)) if (a.type === 'pick' && a.isAllyAction && !a.completed && a.championId > 0 && a.actorCellId !== session.localPlayerCellId) out.add(a.championId);
  return out;
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

/** Ousadia da Arena: campeão aleatório (com bônus) que se escolhe e trava como um campeão, pelo id -3 (o do client). */
export const BRAVERY = -3;

/** Filas da Arena em trios (3x6): as mesmas que o client trata assim; as outras são duplas. */
const ARENA_TRIO_QUEUES = [1740, 1750, 1751, 1753, 1756, 1759, 1762, 1765];
export const arenaTeamSize = (queueId: number | null | undefined) => (ARENA_TRIO_QUEUES.includes(queueId ?? 0) ? 3 : 2);

export interface Subteam {
  /** Ordem do subtime (0 = Poro, 1 = Lacaio...), pelas vagas: as `size` primeiras são o primeiro. */
  index: number;
  cells: Cell[];
  mine: boolean;
}

/**
 * Subtimes da Arena pelas vagas, como o client: a LCU não separa os times da Arena em "meu" e "deles" do jeito do
 * Rift, então junta as duas listas, agrupa pelo `cellId` e marca o subtime de quem joga.
 */
export function arenaSubteams(session: Session, size: number): Subteam[] {
  const byCell = new Map<number, Cell>();
  for (const c of [...session.myTeam, ...session.theirTeam]) if (!byCell.has(c.cellId)) byCell.set(c.cellId, c);
  const groups = new Map<number, Cell[]>();
  for (const c of [...byCell.values()].sort((a, b) => a.cellId - b.cellId)) {
    const g = Math.floor(c.cellId / size);
    groups.set(g, [...(groups.get(g) ?? []), c]);
  }
  const mine = Math.floor(session.localPlayerCellId / size);
  return [...groups].map(([index, cells]) => ({ index, cells, mine: index === mine }));
}

/** Banimentos da Arena pelo subtime de quem baniu (a LCU não marca `isAllyAction` por subtime). */
export function arenaBans(session: Session, size: number): { mine: number[]; theirs: number[] } {
  const mine: number[] = [];
  const theirs: number[] = [];
  const team = Math.floor(session.localPlayerCellId / size);
  for (const a of flatActions(session)) if (a.type === 'ban' && a.completed) (Math.floor(a.actorCellId / size) === team ? mine : theirs).push(a.championId > 0 ? a.championId : 0);
  return { mine, theirs };
}

export interface ArenaRound {
  /** Subtimes que escolhem nesta rodada (índices, em ordem). */
  teams: number[];
  state: 'done' | 'now' | 'next';
}

/**
 * Ordem de escolha da Arena, pelas ações da sessão: cada grupo de ações com escolhas é uma rodada, com os subtimes de
 * quem escolhe nela. Grupos seguidos dos mesmos subtimes (um por jogador) contam como uma rodada só.
 */
export function arenaPickOrder(session: Session, size: number): ArenaRound[] {
  const out: ArenaRound[] = [];
  for (const group of (session.actions ?? []) as Action[][]) {
    const picks = group.filter((a) => a.type === 'pick');
    if (!picks.length) continue;
    const teams = [...new Set(picks.map((a) => Math.floor(a.actorCellId / size)))].sort((a, b) => a - b);
    const state = picks.every((a) => a.completed) ? 'done' : picks.some((a) => a.isInProgress) ? 'now' : 'next';
    const last = out[out.length - 1];
    if (last && last.teams.join() === teams.join()) last.state = last.state === state ? state : 'now';
    else out.push({ teams, state });
  }
  return out;
}

export interface ArenaBan {
  /** Campeão (0 quando não se sabe ou não houve). */
  id: number;
  /** `intent`: meu time ainda escolhendo quem banir. `hidden`: outro time já baniu, mas só se vê na revelação. */
  state: 'intent' | 'hidden' | 'done' | 'none';
}

/**
 * Banimento de cada jogador da Arena, por vaga (cada um bane um, todos ao mesmo tempo). Os do meu subtime aparecem
 * na hora; os dos outros ficam escondidos enquanto a rodada de banimentos (ou a revelação dela, `revealing`) dura.
 */
export function arenaBanCells(session: Session, size: number, revealing = false): Map<number, ArenaBan> {
  const out = new Map<number, ArenaBan>();
  const team = Math.floor(session.localPlayerCellId / size);
  const hide = revealing || banPhase(session);
  for (const a of flatActions(session)) {
    if (a.type !== 'ban') continue;
    const mine = Math.floor(a.actorCellId / size) === team;
    if (!a.completed) {
      if (mine && a.isInProgress && a.championId > 0) out.set(a.actorCellId, { id: a.championId, state: 'intent' });
    } else if (!mine && hide) out.set(a.actorCellId, { id: 0, state: 'hidden' });
    else out.set(a.actorCellId, a.championId > 0 ? { id: a.championId, state: 'done' } : { id: 0, state: 'none' });
  }
  return out;
}

/**
 * Fase de banimento: algum banimento em andamento durante BAN_PICK. No planejamento a LCU já marca os banimentos como
 * em andamento, mas ninguém bane ainda. É o que deixa a tela em tom vermelho.
 */
export function banPhase(session: Session): boolean {
  return session.timer?.phase === 'BAN_PICK' && flatActions(session).some((a) => a.type === 'ban' && a.isInProgress && !a.completed);
}

export interface BanSlot {
  /** Id da ação de banimento (-1 quando o banimento só veio em `bans`, sem ação). */
  key: number;
  /** Campeão banido; 0 enquanto não há (ou não se sabe). */
  id: number;
  /** `hidden`: o inimigo já baniu, mas a LCU só mostra quem foi no fim da fase. `none`: não baniu ninguém. */
  state: 'empty' | 'hidden' | 'none' | 'done';
}

/**
 * Faixa de banimentos: uma vaga por ação de banimento de cada time, na ordem das ações (a vaga não muda de lugar
 * quando o banimento sai). Banimentos que só vêm em `bans` (sem ação) entram nas vagas livres ou no fim.
 * ponytail: "inimigo baniu mas ainda não se vê" é palpite (ação concluída com campeão 0 e banimentos em andamento); o
 * banimento nulo gravado vem com -1. Se a LCU mandar outra coisa, a vaga aparece como "sem banimento" até o fim da fase.
 */
export function banSlots(session: Session): { mine: BanSlot[]; theirs: BanSlot[] } {
  const actions = flatActions(session).filter((a) => a.type === 'ban');
  const banning = actions.some((a) => a.isInProgress && !a.completed);
  const side = (ally: boolean, extra: number[]): BanSlot[] => {
    const out = actions
      .filter((a) => a.isAllyAction === ally)
      .map((a): BanSlot => (!a.completed ? { key: a.id, id: 0, state: 'empty' } : a.championId > 0 ? { key: a.id, id: a.championId, state: 'done' } : { key: a.id, id: 0, state: !ally && banning && a.championId === 0 ? 'hidden' : 'none' }));
    for (const id of extra) {
      if (id <= 0 || out.some((s) => s.id === id)) continue;
      const free = out.find((s) => s.state !== 'done');
      if (free) Object.assign(free, { id, state: 'done' });
      else out.push({ key: -1, id, state: 'done' });
    }
    return out;
  };
  return { mine: side(true, session.bans?.myTeamBans ?? []), theirs: side(false, session.bans?.theirTeamBans ?? []) };
}

/** Banimento de cada aliado na fase de banimento: o campeão em destaque (intenção) ou já banido (`done`). */
export function banIntents(session: Session): Map<number, { championId: number; done: boolean }> {
  const out = new Map<number, { championId: number; done: boolean }>();
  if (!banPhase(session)) return out;
  for (const a of flatActions(session)) if (a.type === 'ban' && a.isAllyAction && a.championId > 0 && (a.completed || a.isInProgress)) out.set(a.actorCellId, { championId: a.championId, done: a.completed });
  return out;
}

/**
 * Quem está escolhendo agora, fora eu: o primeiro aliado em ação (com o campeão em destaque, se houver) ou, sem
 * aliado, o inimigo (a LCU não mostra o destaque do outro time). `null` se ninguém escolhe ou a vaga não é conhecida.
 */
export function watching(session: Session): { cell: Cell; foe: boolean; championId: number } | null {
  if (session.timer?.phase !== 'BAN_PICK') return null;
  const acting = flatActions(session).filter((a) => a.type === 'pick' && a.isInProgress && !a.completed && a.actorCellId !== session.localPlayerCellId);
  for (const a of acting) {
    const cell = session.myTeam.find((c) => c.cellId === a.actorCellId);
    if (cell) return { cell, foe: false, championId: a.championId > 0 ? a.championId : Math.max(0, cell.championPickIntent) };
  }
  for (const a of acting) {
    const cell = session.theirTeam.find((c) => c.cellId === a.actorCellId);
    if (cell) return { cell, foe: true, championId: 0 };
  }
  return null;
}
