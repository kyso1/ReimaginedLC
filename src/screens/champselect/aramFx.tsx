import { Component, createRef } from 'preact';
import type { Champion } from '../../data/gamedata';
import { reducedMotion } from './scene/stage';

// Voos do ARAM: quando a LCU confirma que um campeão mudou de lugar (carta → meu cartão, carta → banco, banco ↔ cartão,
// aliado ↔ aliado), o retrato voa de onde estava para onde foi parar. Nada voa com o clique: só com a sessão nova.

/** O que importa da sessão para os voos. */
export interface FlightSnapshot {
  /** Minha vaga. */
  me: number;
  /** Campeão de cada vaga do meu time: [cellId, championId]. */
  cells: Array<[number, number]>;
  /** Campeões no banco, na ordem das vagas. */
  bench: number[];
  /** Minhas cartas na mesa (vazio quando não estão à mostra). */
  cards: number[];
}
export interface Flight {
  championId: number;
  /** De onde sai e onde pousa: `card:<campeão>`, `bench:<campeão>` ou `cell:<vaga>` (o `data-fly` do elemento). */
  from: string;
  to: string;
}

/** Quem chegou ao banco e quem saiu dele entre duas sessões. */
export function benchDiff(prev: number[], next: number[]): { added: number[]; removed: number[] } {
  return { added: next.filter((id) => !prev.includes(id)), removed: prev.filter((id) => !next.includes(id)) };
}

/**
 * Voos entre duas sessões seguidas. Uma vaga que mudou de campeão recebe o novo de onde ele estava (banco, minhas
 * cartas ou outro aliado) e manda o antigo para o banco, se ele apareceu lá. As minhas cartas que sobraram voam para o
 * banco. Quem chega ao banco sem origem conhecida (cartas dos aliados, que a LCU não mostra) não voa: só aparece.
 */
export function flights(prev: FlightSnapshot, next: FlightSnapshot): Flight[] {
  const { added, removed } = benchDiff(prev.bench, next.bench);
  const was = new Map(prev.cells);
  const out: Flight[] = [];
  const sourced = new Set<number>();
  for (const [cellId, champ] of next.cells) {
    const old = was.get(cellId);
    if (old === undefined || old === champ) continue;
    if (champ > 0) {
      const ally = prev.cells.find(([id, c]) => c === champ && id !== cellId);
      const from = removed.includes(champ) ? `bench:${champ}` : cellId === next.me && prev.cards.includes(champ) ? `card:${champ}` : ally ? `cell:${ally[0]}` : null;
      if (from) out.push({ championId: champ, from, to: `cell:${cellId}` });
    }
    if (old > 0 && added.includes(old)) {
      out.push({ championId: old, from: `cell:${cellId}`, to: `bench:${old}` });
      sourced.add(old);
    }
  }
  for (const id of added) if (!sourced.has(id) && prev.cards.includes(id)) out.push({ championId: id, from: `card:${id}`, to: `bench:${id}` });
  return out;
}

/** Duração do voo (o CSS de `.rlc-cs-flyer` usa a mesma). */
export const FLY_MS = 550;

interface Spot {
  rect: DOMRect;
  /** Imagem própria do elemento (a arte da carta); sem ela vale o retrato do campeão. */
  img: string;
}
const spotsIn = (host: Element): Map<string, Spot & { el: HTMLElement }> => new Map([...host.querySelectorAll<HTMLElement>('[data-fly]')].map((el) => [el.dataset.fly!, { el, rect: el.getBoundingClientRect(), img: el.dataset.flyImg ?? '' }]));

interface FlightsProps {
  /** `null` fora do ARAM: nada é medido nem voa. */
  snap: FlightSnapshot | null;
  sessionId: string;
  champions: Map<number, Champion>;
}
/**
 * Camada dos retratos em voo (FLIP, só `transform`). É um componente de classe por causa do
 * `getSnapshotBeforeUpdate`: é o único ponto em que dá para medir onde as coisas estavam antes de o Preact mexer no
 * DOM (as cartas já saíram da tela quando a sessão nova chega). Tem de ser o primeiro filho da seção da seleção: os
 * irmãos ainda não foram atualizados quando ele mede. Os destinos são medidos depois, com tudo no lugar.
 */
export class Flights extends Component<FlightsProps> {
  layer = createRef<HTMLElement>();

  getSnapshotBeforeUpdate(): Map<string, Spot> | null {
    const host = this.layer.current?.parentElement;
    return this.props.snap && host ? spotsIn(host) : null;
  }

  componentDidUpdate(prev: FlightsProps, _state: unknown, before: Map<string, Spot> | null): void {
    const { snap, sessionId, champions } = this.props;
    const layer = this.layer.current;
    const host = layer?.parentElement;
    if (!before || !snap || !prev.snap || prev.sessionId !== sessionId || !host || reducedMotion()) return;
    const moves = flights(prev.snap, snap);
    if (!moves.length) return;
    const now = spotsIn(host);
    const origin = host.getBoundingClientRect();
    // A janela do client escala a página (zoom): os retângulos medidos vêm na escala da tela, o `transform` não.
    const k = origin.width / host.offsetWidth || 1;
    for (const f of moves) {
      const a = before.get(f.from);
      const b = now.get(f.to);
      if (!a?.rect.width || !b?.rect.width) continue;
      const img = a.img || champions.get(f.championId)?.icon || '';
      const el = document.createElement('i');
      el.className = 'rlc-cs-flyer';
      el.style.width = `${a.rect.width / k}px`;
      el.style.height = `${a.rect.height / k}px`;
      if (img) el.style.backgroundImage = `url(${JSON.stringify(img)})`;
      el.style.transform = `translate3d(${(a.rect.left - origin.left) / k}px,${(a.rect.top - origin.top) / k}px,0)`;
      layer!.append(el);
      void el.offsetWidth;
      el.style.transform = `translate3d(${(b.rect.left - origin.left) / k}px,${(b.rect.top - origin.top) / k}px,0) scale(${b.rect.width / a.rect.width},${b.rect.height / a.rect.height})`;
      // O destino aparece quando o retrato pousa.
      delete b.el.dataset.landing;
      void b.el.offsetWidth;
      b.el.dataset.landing = '';
      // O `transitionend` não vem se a camada sair da tela no meio do voo.
      setTimeout(() => el.remove(), FLY_MS + 100);
    }
  }

  render() {
    return <i ref={this.layer} class="rlc-cs-flights" aria-hidden="true" />;
  }
}
