import { getJson } from './data';

// Histórico de TFT: `/lol-match-history/v1/products/tft/{puuid}/matches` traz as 20 últimas (begin/count são ignorados),
// cada uma com os 8 participantes completos em `games[].json`.

export interface TftUnit {
  character_id: string;
  itemNames?: string[];
  /** Custo − 1 (0 a 4); sets antigos usavam 0, 1, 2, 4, 6. */
  rarity?: number;
  /** Estrelas. */
  tier?: number;
}
export interface TftTrait {
  name: string;
  num_units: number;
  /** 0 inativo, 1 bronze, 2 prata, 3 ouro, 4+ prismático. */
  style: number;
  tier_current?: number;
  tier_total?: number;
}
export interface TftPlayer {
  puuid?: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  placement: number;
  level?: number;
  /** Só no Double Up: a dupla. */
  partner_group_id?: number;
  /** Histórico manda o contentId; o fim de jogo manda a arte direto. */
  companion?: { content_ID?: string; icon?: string; name?: string };
  traits?: TftTrait[];
  units?: TftUnit[];
  /** Só no fim de jogo: aumentos com a arte que ele traz. */
  augs?: TftArt[];
  // Só no histórico: como a partida terminou para o jogador.
  gold_left?: number;
  last_round?: number;
  /** Segundos desde o início. */
  time_eliminated?: number;
  /** PlayerScore2: pontuação interna que a Riot dá à partida. */
  missions?: Record<string, number>;
  total_damage_to_players?: number;
  players_eliminated?: number;
}
export interface TftMatch {
  gameId: number;
  gameCreation: number;
  game_datetime?: string | number;
  game_length?: number;
  queue_id?: number;
  queueId?: number;
  participants: TftPlayer[];
}

export const tftUrl = (puuid: string) => `/lol-match-history/v1/products/tft/${encodeURIComponent(puuid)}/matches?begin=0&count=20`;

/** Partidas da resposta da LCU, com o início da partida em `gameCreation` (para agrupar por dia como no LoL). */
export const tftMatches = (r: { games?: Array<{ json?: Partial<TftMatch> }> } | null): TftMatch[] =>
  (r?.games ?? [])
    .map((g) => g.json)
    .filter((j): j is TftMatch => !!j && Array.isArray(j.participants))
    .map((j) => ({ ...j, gameId: j.gameId ?? 0, gameCreation: j.gameCreation || Number(j.game_datetime) || 0 }));

export const queueOf = (m: TftMatch) => m.queue_id ?? m.queueId ?? 0;
export const meIn = (m: TftMatch, puuid: string) => m.participants.find((p) => p.puuid === puuid);
export const pairs = (m: TftMatch) => m.participants.some((p) => (p.partner_group_id ?? 0) > 0);
/** Colocação que o jogo mostra: no Double Up é a da dupla (1 a 4). */
export const placeOf = (m: TftMatch, p: TftPlayer) => (pairs(m) ? Math.ceil(p.placement / 2) : p.placement);
/** Faixa da colocação: 1º, metade de cima (top 4 / top 2 em dupla) ou de baixo. */
export const band = (m: TftMatch, p: TftPlayer) => (placeOf(m, p) === 1 ? 'first' : placeOf(m, p) <= (pairs(m) ? 2 : 4) ? 'top' : 'bottom');

// ponytail: rarity 6 (sets antigos) vira 5; o 4 antigo (custo 4) sai como 5 até ler o custo do team planner.
export const costOf = (u: TftUnit) => Math.min(5, (u.rarity ?? 0) + 1);
/** Composição na ordem do jogo de mostrar: custo e depois estrelas, maior primeiro. */
export const sortedUnits = (p: TftPlayer) => [...(p.units ?? [])].sort((a, b) => costOf(b) - costOf(a) || (b.tier ?? 1) - (a.tier ?? 1));
/** Traços ativos, do estilo mais alto (prismático) ao mais baixo. */
export const activeTraits = (p: TftPlayer) => (p.traits ?? []).filter((t) => t.style > 0).sort((a, b) => b.style - a.style || b.num_units - a.num_units);

export type TftFilter = 'all' | 'ranked' | 'normal' | 'doubleup' | 'hyperroll';
export const TFT_GROUPS: Record<Exclude<TftFilter, 'all'>, number[]> = { ranked: [1100], normal: [1090, 2200], doubleup: [1160, 1150], hyperroll: [1130] };
export const inTftFilter = (queueId: number, f: TftFilter) => f === 'all' || TFT_GROUPS[f].includes(queueId);

/** Últimas partidas do jogador: colocação média, % top 4 e % de 1º, traços e unidades mais usados. */
export function tftStats(matches: TftMatch[], puuid: string) {
  const mine = matches.map((m) => meIn(m, puuid)).filter((p): p is TftPlayer => !!p);
  const count = <K>(keys: K[]) => {
    const by = new Map<K, number>();
    for (const k of keys) by.set(k, (by.get(k) ?? 0) + 1);
    return [...by.entries()].sort((a, b) => b[1] - a[1]);
  };
  // ponytail: no Double Up vale a colocação individual (1 a 8); top 4 individual = dupla no top 2.
  return {
    games: mine.length,
    avg: mine.length ? mine.reduce((s, p) => s + p.placement, 0) / mine.length : 0,
    top4: mine.filter((p) => p.placement <= 4).length,
    wins: matches.filter((m) => {
      const p = meIn(m, puuid);
      return p && placeOf(m, p) === 1;
    }).length,
    traits: count(mine.flatMap((p) => activeTraits(p).map((t) => t.name))).slice(0, 5),
    units: count(mine.flatMap((p) => [...new Set((p.units ?? []).map((u) => u.character_id))])).slice(0, 6),
  };
}

export interface TftArt {
  name: string;
  icon: string;
  /** Só traços: estágios pelo mínimo de unidades (estilo 1 bronze, 2 prata, 3 ouro, 4 prismático). */
  tiers?: Array<{ min: number; style: number }>;
}
// Nomes de estilo do tfttraits.json; "único" (traço de 1 unidade) sai em ouro, como no jogo.
const STYLE: Record<string, number> = { kBronze: 1, kSilver: 2, kGold: 3, kUnique: 3, kChromatic: 4 };
export interface TftAssets {
  units: Map<string, TftArt>;
  items: Map<string, TftArt>;
  traits: Map<string, TftArt>;
}
// ponytail: cache por sessão sem expirar, como as runas; os JSON só mudam com patch.
let assets: Promise<TftAssets> | null = null;
/** Nome e ícone de unidades, itens e traços do TFT (`tftchampions/tftitems/tfttraits.json`), pelo id técnico. */
export const tftAssets = () =>
  (assets ??= Promise.all([
    getJson<Array<{ name?: string; character_record?: { character_id?: string; display_name?: string; squareIconPath?: string } }>>('/lol-game-data/assets/v1/tftchampions.json'),
    getJson<Array<{ nameId?: string; name?: string; squareIconPath?: string }>>('/lol-game-data/assets/v1/tftitems.json'),
    getJson<Array<{ trait_id?: string; display_name?: string; icon_path?: string; conditional_trait_sets?: Array<{ min_units?: number; style_name?: string }> }>>(
      '/lol-game-data/assets/v1/tfttraits.json',
    ),
  ]).then(([units, items, traits]) => {
    const out: TftAssets = { units: new Map(), items: new Map(), traits: new Map() };
    for (const u of Array.isArray(units) ? units : []) {
      const r = u.character_record;
      if (r?.character_id) out.units.set(r.character_id, { name: r.display_name || prettyId(r.character_id), icon: r.squareIconPath ?? '' });
    }
    for (const i of Array.isArray(items) ? items : []) if (i.nameId) out.items.set(i.nameId, { name: i.name || prettyId(i.nameId), icon: i.squareIconPath ?? '' });
    for (const t of Array.isArray(traits) ? traits : [])
      if (t.trait_id)
        out.traits.set(t.trait_id, {
          name: t.display_name || prettyId(t.trait_id),
          icon: t.icon_path ?? '',
          tiers: (t.conditional_trait_sets ?? []).map((c) => ({ min: c.min_units ?? 1, style: STYLE[c.style_name ?? ''] ?? 1 })),
        });
    return out;
  }));

/** Nome legível de um id técnico quando o catálogo não tem ("TFT15_Ahri" → "Ahri", "DA_Gromp18_AP" → "Gromp"). */
export const prettyId = (id: string) =>
  id
    .replace(/^[A-Za-z]+\d*_/, '')
    .replace(/^(\d+_|Item_|Augment_)+/, '')
    .replace(/\d+(_\w+)?$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim() || id;

/** Arte de um id; sem catálogo, o nome legível e nenhum ícone. */
export const art = (map: Map<string, TftArt>, id: string): TftArt => map.get(id) ?? { name: prettyId(id), icon: '' };

/** Jogador do fim de jogo (`/lol-end-of-game/v1/tft-eog-stats`), só o que a tela usa. */
export interface TftEogPlayer {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
  summonerName?: string;
  rank: number;
  partnerGroupId?: number;
  companion?: { icon?: string; speciesName?: string };
  augments?: Array<{ name?: string; icon?: string }>;
  boardPieces?: Array<{ championId: string; name?: string; icon?: string; level?: number; price?: number; items?: Array<{ nameId?: string; name?: string; icon?: string }>; traits?: Array<{ id: string; name?: string }> }>;
}

/** Estágio de um traço com `n` unidades; sem catálogo, todo traço conta como ativo (bronze). */
export const styleOf = (tiers: TftArt['tiers'], n: number) => (tiers ? tiers.reduce((s, x) => (n >= x.min ? Math.max(s, x.style) : s), 0) : 1);

/**
 * Fim de jogo no formato do histórico, para usar a mesma classificação do perfil. Traço conta uma vez por unidade
 * diferente (duas Dianas valem uma), e o estágio sai dos mínimos do tfttraits.json.
 */
export function fromEog(p: TftEogPlayer, traits: Map<string, TftArt>): TftPlayer {
  const pieces = p.boardPieces ?? [];
  const count = new Map<string, number>();
  const seen = new Set<string>();
  for (const b of pieces) {
    if (seen.has(b.championId)) continue;
    seen.add(b.championId);
    for (const tr of b.traits ?? []) count.set(tr.id, (count.get(tr.id) ?? 0) + 1);
  }
  return {
    puuid: p.puuid,
    riotIdGameName: p.riotIdGameName || p.summonerName,
    riotIdTagline: p.riotIdTagLine,
    placement: p.rank,
    partner_group_id: p.partnerGroupId,
    companion: p.companion?.icon ? { icon: p.companion.icon, name: p.companion.speciesName } : undefined,
    units: pieces.map((b) => ({ character_id: b.championId, itemNames: (b.items ?? []).map((i) => i.nameId ?? ''), rarity: (b.price ?? 1) - 1, tier: b.level })),
    traits: [...count].map(([name, n]) => ({ name, num_units: n, style: styleOf(traits.get(name)?.tiers, n) })),
    augs: (p.augments ?? []).filter((x) => x.icon).map((x) => ({ name: x.name ?? '', icon: x.icon! })),
  };
}

/** Arte de unidades e itens que o próprio fim de jogo já traz (vale antes do catálogo chegar). */
export function eogArt(players: TftEogPlayer[]): Pick<TftAssets, 'units' | 'items'> {
  const units = new Map<string, TftArt>();
  const items = new Map<string, TftArt>();
  for (const b of players.flatMap((p) => p.boardPieces ?? [])) {
    units.set(b.championId, { name: b.name || prettyId(b.championId), icon: b.icon ?? '' });
    for (const i of b.items ?? []) if (i.nameId) items.set(i.nameId, { name: i.name || prettyId(i.nameId), icon: i.icon ?? '' });
  }
  return { units, items };
}
