import { t } from '../../i18n';
import { activeTraits, meIn, type TftArt, type TftEogPlayer, type TftMatch, type TftPlayer, type TftTrait } from '../profile/tft';

// Contas do fim de jogo de TFT: lobby (tabuleiros, unidades disputadas), traços e comparação com o histórico.

type Piece = NonNullable<TftEogPlayer['boardPieces']>[number];

/** Cópias de uma unidade por estrelas: 1★ = 1, 2★ = 3, 3★ = 9. */
export const copies = (stars: number | undefined) => 3 ** (Math.max(1, stars ?? 1) - 1);
/** Valor do tabuleiro em ouro: custo × cópias de cada unidade. */
export const boardValue = (pieces: Piece[] | undefined) => (pieces ?? []).reduce((s, b) => s + (b.price ?? 0) * copies(b.level), 0);
export const itemCount = (pieces: Piece[] | undefined) => (pieces ?? []).reduce((s, b) => s + (b.items?.length ?? 0), 0);

/** O maior de uma medida no lobby (empate: o mais bem colocado). */
export const topBy = (players: TftEogPlayer[], f: (p: TftEogPlayer) => number) =>
  players.reduce<TftEogPlayer | undefined>((a, b) => (!a || f(b) > f(a) || (f(b) === f(a) && b.rank < a.rank) ? b : a), undefined);

/** Suas unidades que outros também tinham: quantos jogadores e quantas cópias somadas. */
export function contested(me: TftEogPlayer, others: TftEogPlayer[]) {
  const ids = [...new Set((me.boardPieces ?? []).map((b) => b.championId))];
  return ids
    .map((id) => {
      const holders = others.filter((o) => o.puuid !== me.puuid && o.boardPieces?.some((b) => b.championId === id));
      const n = holders.reduce((s, o) => s + o.boardPieces!.filter((b) => b.championId === id).reduce((c, b) => c + copies(b.level), 0), 0);
      return { id, players: holders.length, copies: n };
    })
    .filter((x) => x.players > 0)
    .sort((a, b) => b.copies - a.copies);
}

/** Quanto falta para o próximo estágio do traço; `next` nulo quando já está no máximo (ou sem catálogo). */
export function traitProgress(tr: TftTrait, tiers: TftArt['tiers']) {
  const mins = (tiers ?? []).map((x) => x.min).sort((a, b) => a - b);
  const next = mins.find((m) => m > tr.num_units) ?? null;
  return { have: tr.num_units, next, missing: next === null ? 0 : next - tr.num_units, max: mins[mins.length - 1] ?? tr.num_units };
}

// ponytail: "rodada N" crua; o estágio-rodada do jogo (2-1, 3-5...) depende de quantas rodadas o set põe no estágio 1,
// e last_round não diz isso com segurança. Converter quando a LCU mandar o estágio.
export const roundLabel = (n: number | undefined) => (n ? t('pgTftRound').replace('{n}', String(n)) : '');

/** Jogadores na ordem em que caíram (o 8º primeiro, o campeão por último). */
export const eliminationOrder = (players: TftPlayer[]) => [...players].sort((a, b) => b.placement - a.placement);

/** Só mostra uma coluna quando alguém da partida tem valor (a LCU às vezes manda tudo zerado). */
export const hasAny = (players: TftPlayer[], f: (p: TftPlayer) => number | undefined) => players.some((p) => (f(p) ?? 0) > 0);

/** Sequência de top 4 a partir da mais recente (colocações da mais nova para a mais antiga). */
export function top4Streak(places: number[]) {
  const i = places.findIndex((p) => p > 4);
  return i < 0 ? places.length : i;
}

/**
 * A "comp": os dois traços ativos com mais unidades, em ordem fixa; null se tiver menos de dois. Traço de uma unidade
 * só (tier_total 1, ex.: Caustic) não define comp, mesmo aparecendo em ouro.
 */
export function compKey(p: TftPlayer | undefined): string[] | null {
  const top = activeTraits(p ?? { placement: 0 })
    .filter((x) => (x.tier_total ?? 2) > 1)
    .sort((a, b) => b.num_units - a.num_units)
    .slice(0, 2)
    .map((x) => x.name);
  return top.length === 2 ? top.sort() : null;
}

/** Quantas vezes você jogou a mesma comp (mesmos dois principais) e com esses traços ativos, e a média em cada caso. */
export function compHistory(matches: TftMatch[], puuid: string, key: string[]) {
  const mine = matches.map((m) => meIn(m, puuid)).filter((p): p is TftPlayer => !!p);
  const avg = (ps: TftPlayer[]) => ({ games: ps.length, avg: ps.length ? ps.reduce((s, p) => s + p.placement, 0) / ps.length : 0 });
  return {
    same: avg(mine.filter((p) => compKey(p)?.join() === key.join())),
    traits: avg(mine.filter((p) => key.every((k) => activeTraits(p).some((x) => x.name === k)))),
  };
}

/** Mais usados nas partidas (uma vez por partida), do mais frequente ao menos. */
export function topUsed(matches: TftMatch[], puuid: string, pick: (p: TftPlayer) => string[], n = 6): Array<[string, number]> {
  const by = new Map<string, number>();
  for (const m of matches) {
    const p = meIn(m, puuid);
    for (const k of new Set(p ? pick(p).filter(Boolean) : [])) by.set(k, (by.get(k) ?? 0) + 1);
  }
  return [...by].sort((a, b) => b[1] - a[1]).slice(0, n);
}

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const DIVS = ['IV', 'III', 'II', 'I'];
/**
 * PdL até a próxima divisão (100 por divisão) e quantas partidas iguais a esta faltam; null nos elos sem divisão.
 */
export function toNextDivision(tier: string | undefined, division: string | undefined, lp: number, delta: number) {
  const ti = TIERS.indexOf(tier ?? '');
  const di = DIVS.indexOf(division ?? '');
  if (ti < 0 || di < 0) return null;
  const need = Math.max(0, 100 - lp);
  const next = di < 3 ? { tier: tier!, division: DIVS[di + 1]! } : ti < TIERS.length - 1 ? { tier: TIERS[ti + 1]!, division: 'IV' } : { tier: 'MASTER', division: '' };
  return { need, games: delta > 0 ? Math.ceil(need / delta) : null, ...next };
}
