import { useEffect, useRef, useState } from 'preact/hooks';
import { flatActions, type Cell, type Session } from './logic';

// Animações da seleção que disparam com o que a LCU confirma (nunca com o clique): cada gancho compara a sessão de
// agora com a anterior e devolve um estado passageiro. Abrir a tela com tudo já acontecido não dispara nada.

/** `true` por `ms` depois que `on` passa de falso para verdadeiro com a tela já aberta. */
export function usePulse(on: boolean, ms: number): boolean {
  const [pulsing, setPulsing] = useState(false);
  const was = useRef(on);
  useEffect(() => {
    const start = on && !was.current;
    was.current = on;
    if (!start) {
      // Voltou a falso no meio (o timer foi cancelado): encerra aqui.
      if (!on) setPulsing(false);
      return;
    }
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), ms);
    return () => clearTimeout(timer);
  }, [on]);
  return pulsing;
}

/**
 * `true` por `ms` depois que `value` muda para um campeão (> 0) com a tela já aberta: no ARAM o meu campeão troca
 * várias vezes (carta escolhida, banco, rolagem, troca com aliado) e cada confirmação da LCU dispara o mergulho.
 * Valor negativo é "ainda não sei" (sessão chegando): sair dele não conta como mudança.
 */
export function useChangePulse(value: number, ms: number): boolean {
  const [pulsing, setPulsing] = useState(false);
  const was = useRef(value);
  useEffect(() => {
    const before = was.current;
    was.current = value;
    if (value === before) return;
    // Mudou para "sem campeão" no meio de um pulso (o timer foi cancelado): encerra aqui.
    if (value <= 0 || before < 0) return setPulsing(false);
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), ms);
    return () => clearTimeout(timer);
  }, [value]);
  return pulsing;
}

/** Tempo em que o palco fica com o campeão que outro jogador acabou de travar. */
export const LOCK_SHOW_MS = 2400;

export interface LockEvent {
  cell: Cell;
  foe: boolean;
  /** Posição no time (para "Inimigo N"). */
  index: number;
}

/**
 * Outro jogador acabou de travar: a vaga passou de sem campeão para com campeão (`championId`, que a LCU só preenche
 * ao travar). Trocas e rolagens (campeão por outro) não contam. Dura `LOCK_SHOW_MS`; um novo travamento toma o lugar.
 */
export function useLockEvent(session: Session | null): LockEvent | null {
  const seen = useRef<{ id: string; champs: Map<number, number> } | null>(null);
  const [event, setEvent] = useState<LockEvent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const cells = session ? [...session.myTeam.map((c, index) => ({ cell: c, foe: false, index })), ...session.theirTeam.map((c, index) => ({ cell: c, foe: true, index }))] : [];
  const key = cells.map((c) => `${c.cell.cellId}:${c.cell.championId}`).join(',');
  useEffect(() => {
    if (!session) return;
    const before = seen.current?.id === session.id ? seen.current.champs : null;
    seen.current = { id: session.id, champs: new Map(cells.map((c) => [c.cell.cellId, c.cell.championId])) };
    if (!before) return;
    const fresh = cells.filter((c) => c.cell.cellId !== session.localPlayerCellId && c.cell.championId > 0 && before.has(c.cell.cellId) && !(before.get(c.cell.cellId)! > 0));
    if (!fresh.length) return;
    setEvent(fresh[fresh.length - 1]!);
    // O timer não é limpo quando a sessão muda de novo (só ao sair): senão o evento ficava no palco para sempre.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setEvent(null), LOCK_SHOW_MS);
  }, [key, session?.id]);
  return event;
}

/** Tempo da roleta da Ousadia: gira, para e dá o clarão (o CSS usa os mesmos tempos). */
export const BRAVE_MS = 2600;

/**
 * Alguém (eu ou outro jogador) acabou de travar a Ousadia: a vaga passou a ter o campeão `brave` (-3) com a tela já
 * aberta. Devolve a vaga por `BRAVE_MS`; uma nova Ousadia toma o lugar.
 */
export function useBraveryEvent(session: Session | null, brave: number): Cell | null {
  const seen = useRef<{ id: string; on: Set<number> } | null>(null);
  const [event, setEvent] = useState<Cell | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const cells = session ? [...session.myTeam, ...session.theirTeam].filter((c) => c.championId === brave) : [];
  const key = cells.map((c) => c.cellId).join(',');
  useEffect(() => {
    if (!session) return;
    const before = seen.current?.id === session.id ? seen.current.on : null;
    seen.current = { id: session.id, on: new Set(cells.map((c) => c.cellId)) };
    const fresh = before ? cells.filter((c) => !before.has(c.cellId)) : [];
    if (!fresh.length) return;
    setEvent(fresh[fresh.length - 1]!);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setEvent(null), BRAVE_MS);
  }, [key, session?.id]);
  return event;
}

export interface Revealed {
  ally: boolean;
  /** Vaga na faixa de banimentos do time (ordem das ações). */
  slot: number;
  championId: number;
  /** Quem baniu (na Arena o banimento volta para o retrato do jogador). */
  cellId: number;
}

/** Duração da revelação dos banimentos: virar, riscar e voar para a faixa (o CSS usa os mesmos tempos). */
export const REVEAL_MS = 2900;

/**
 * Revelação dos banimentos: dispara uma vez quando a rodada de banimentos termina (havia banimento em andamento e não
 * há mais), com os que foram concluídos nela. Banimento nulo não entra. Some depois de `REVEAL_MS`.
 */
export function useBanReveal(session: Session | null): Revealed[] | null {
  const seen = useRef<{ id: string; done: Set<number>; banning: boolean } | null>(null);
  const [reveal, setReveal] = useState<Revealed[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const bans = session ? flatActions(session).filter((a) => a.type === 'ban') : [];
  const banning = bans.some((a) => a.isInProgress && !a.completed) && session?.timer?.phase === 'BAN_PICK';
  const key = bans.map((a) => `${a.id}:${a.completed ? a.championId : '-'}`).join(',') + banning;
  useEffect(() => {
    if (!session) return;
    const before = seen.current?.id === session.id ? seen.current : null;
    if (banning) {
      // Rodada em andamento: fica com o que já estava concluído antes dela, para revelar só os banimentos da rodada
      // (aberta no meio da rodada, a tela revela a rodada inteira no fim).
      seen.current = { id: session.id, done: before?.done ?? new Set(), banning: true };
      return;
    }
    seen.current = { id: session.id, done: new Set(bans.filter((a) => a.completed).map((a) => a.id)), banning: false };
    if (!before?.banning) return;
    const slotOf = (id: number, ally: boolean) => bans.filter((a) => a.isAllyAction === ally).findIndex((a) => a.id === id);
    const fresh = bans.filter((a) => a.completed && a.championId > 0 && !before.done.has(a.id)).map((a) => ({ ally: a.isAllyAction, slot: slotOf(a.id, a.isAllyAction), championId: a.championId, cellId: a.actorCellId }));
    if (!fresh.length) return;
    setReveal(fresh);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReveal(null), REVEAL_MS);
  }, [key, session?.id]);
  return reveal;
}
