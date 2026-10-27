/**
 * Summoner's Rift em unidades do jogo (0..15000): base azul em (0,0), embaixo à esquerda; vermelha em cima à direita.
 * Base do mapa 3D da seleção de campeões: tudo é desenhado nessas coordenadas, então cada marcador cai onde o objeto
 * está no jogo. Valores das posições de torres, nexus e acampamentos do próprio jogo.
 */

export type Point = [number, number];
export type Side = 'blue' | 'red';
export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export const SIZE = 15000;
/** Mapa do Summoner's Rift (normal, ranqueada, Jogo Rápido, treino): os outros usam a arte do client. */
export const RIFT_MAP_ID = 11;

/** Espelho pelo centro: leva um objeto azul ao equivalente vermelho (o mapa é simétrico assim). */
export const flip = ([x, y]: Point): Point => [SIZE - x, SIZE - y];

export const TOWERS_BLUE: Array<{ p: Point; big?: boolean }> = [
  { p: [981, 10441] }, { p: [1512, 6699] }, { p: [1169, 4287], big: true },
  { p: [5846, 6396] }, { p: [5048, 4812] }, { p: [3651, 3696], big: true },
  { p: [10504, 1029] }, { p: [6919, 1483] }, { p: [4281, 1253], big: true },
  { p: [1748, 2270], big: true }, { p: [2177, 1807], big: true },
];
export const NEXUS_BLUE: Point = [1551, 1659];
/** Sentinela Azul, Brutamontes Vermelho, Sapo, Lobos, Aves, Krugs (lado azul). Os dois primeiros são os buffs. */
export const CAMPS_BLUE: Point[] = [[3872, 7900], [7862, 4111], [2112, 8372], [3783, 6495], [6823, 5508], [8394, 2641]];
/** Fossos do Barão e do Dragão. */
export const PITS: Point[] = [[5007, 10471], [9866, 4414]];

/**
 * Ponto de cada função: à frente da primeira torre da própria rota (na direção do inimigo); o caçador no Sentinela Azul
 * do lado. Cada lado tem os seus: espelhar o azul pelo centro troca as rotas (o topo do azul viraria a de baixo do
 * vermelho), por isso o vermelho não é `flip` do azul nas rotas.
 */
export const SPOTS: Record<Side, Record<Role, Point>> = {
  blue: { TOP: [1000, 11400], JUNGLE: [3872, 7900], MIDDLE: [6500, 7050], BOTTOM: [11900, 900], UTILITY: [11000, 1350] },
  red: { TOP: [3400, 14100], JUNGLE: [10931, 6990], MIDDLE: [8300, 7900], BOTTOM: [14100, 3100], UTILITY: [13650, 4000] },
};

const ROLE_OF: Record<string, Role> = { TOP: 'TOP', JUNGLE: 'JUNGLE', MIDDLE: 'MIDDLE', MID: 'MIDDLE', BOTTOM: 'BOTTOM', BOT: 'BOTTOM', ADC: 'BOTTOM', UTILITY: 'UTILITY', SUPPORT: 'UTILITY' };
export const roleOf = (position: string | undefined): Role | null => ROLE_OF[(position ?? '').toUpperCase()] ?? null;

/** Base do lado. */
export const baseOf = (side: Side): Point => (side === 'blue' ? [0, 0] : [SIZE, SIZE]);

/**
 * Onde o jogador aparece: no ponto da função; sem função (escolha às cegas, personalizada), em volta da própria base,
 * um por posição na fila do time.
 */
export function spotFor(side: Side, position: string | undefined, index: number, count: number): Point {
  const role = roleOf(position);
  if (role) return SPOTS[side][role];
  const a = ((15 + (60 * index) / Math.max(1, count - 1)) * Math.PI) / 180;
  const p: Point = [Math.round(5600 * Math.cos(a)), Math.round(5600 * Math.sin(a))];
  return side === 'blue' ? p : flip(p);
}

/** Selva do lado azul: as duas metades (entre o topo e o meio; entre o meio e a de baixo). */
export const JUNGLE_BLUE: Point[][] = [
  [[1900, 4500], [1900, 11900], [6300, 7700], [3900, 5100], [3300, 4500]],
  [[4500, 1900], [11900, 1900], [7700, 6300], [5100, 3900], [4500, 3300]],
];
/** Corredores entre os acampamentos, cavados no relevo da selva. */
export const PATHS_BLUE: Point[][] = [
  [[2900, 4700], [3783, 6495], [3872, 7900], [4900, 9600]],
  [[3872, 7900], [2112, 8372], [1300, 8600]],
  [[3783, 6495], [5100, 5100]],
  [[4700, 2900], [7862, 4111], [9300, 5400]],
  [[7862, 4111], [8394, 2641], [8700, 1400]],
  [[7862, 4111], [6823, 5508], [6250, 6050]],
];
/** Rotas (linha central), do lado azul para o vermelho. */
export const LANES: Point[][] = [
  [[1170, 3600], [1000, 12600], [1150, 13500], [1700, 13900], [2400, 13980], [11260, 13680]],
  [[3450, 1240], [12600, 1020], [13500, 1150], [13900, 1700], [13980, 2400], [13600, 11320]],
  [[3200, 3200], [11600, 11670]],
];
/** Rio: do centro até cada ponta (curva com o controle passando pelos fossos). */
export const RIVER_CENTER: Point = [7500, 7500];
export const RIVER: Array<{ ctrl: Point; end: Point }> = [
  { ctrl: [5007, 10471], end: [2300, 12700] },
  { ctrl: [9993, 4529], end: [12700, 2300] },
];

/** Distância até a linha do rio (a diagonal x + y = 15000): a selva cresce a partir dele. */
export const riverDist = ([x, y]: Point): number => Math.abs(x + y - SIZE) / Math.SQRT2;

// Sorteio fixo (as árvores ficam sempre no mesmo lugar).
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function inside([x, y]: Point, poly: Point[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function segDist([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
export const lineDist = (p: Point, line: Point[]): number => Math.min(...line.slice(1).map((b, i) => segDist(p, line[i]!, b)));

export interface Tree {
  p: Point;
  r: number;
  shade: 0 | 1 | 2;
}
/** Árvores do lado azul: dentro da selva, fora dos corredores e das clareiras dos acampamentos, sem se sobrepor. */
export const TREES_BLUE: Tree[] = (() => {
  const r = rng(7);
  const out: Tree[] = [];
  JUNGLE_BLUE.forEach((q, qi) => {
    const cap = qi === 0 ? 130 : 260;
    for (let n = 0; n < 6000 && out.length < cap; n++) {
      const p: Point = [1900 + r() * 10000, 1900 + r() * 10000];
      if (!inside(p, q)) continue;
      if (PATHS_BLUE.some((l) => lineDist(p, l) < 560)) continue;
      if (CAMPS_BLUE.some((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 900)) continue;
      if (out.some((o) => Math.hypot(p[0] - o.p[0], p[1] - o.p[1]) < 300)) continue;
      out.push({ p, r: 200 + r() * 130, shade: Math.floor(r() * 3) as 0 | 1 | 2 });
    }
  });
  return out;
})();

/**
 * Nome do lado em todos os idiomas do client (pelo locale da Riot, `pt_BR`, `zh_TW`...). Os textos do tema só têm
 * português e inglês; este rótulo aparece em toda seleção de campeões, então vem em cada língua.
 */
const SIDE_NAMES: Record<string, [string, string]> = {
  pt: ['Lado azul', 'Lado vermelho'],
  en: ['Blue side', 'Red side'],
  es: ['Lado azul', 'Lado rojo'],
  fr: ['Côté bleu', 'Côté rouge'],
  de: ['Blaue Seite', 'Rote Seite'],
  it: ['Lato blu', 'Lato rosso'],
  pl: ['Strona niebieska', 'Strona czerwona'],
  ru: ['Синяя сторона', 'Красная сторона'],
  tr: ['Mavi taraf', 'Kırmızı taraf'],
  cs: ['Modrá strana', 'Červená strana'],
  hu: ['Kék oldal', 'Piros oldal'],
  ro: ['Partea albastră', 'Partea roșie'],
  el: ['Μπλε πλευρά', 'Κόκκινη πλευρά'],
  ja: ['ブルーサイド', 'レッドサイド'],
  ko: ['블루 진영', '레드 진영'],
  zh: ['蓝色方', '红色方'],
  'zh-tw': ['藍色方', '紅色方'],
  th: ['ฝั่งสีน้ำเงิน', 'ฝั่งสีแดง'],
  vi: ['Phe Xanh', 'Phe Đỏ'],
  ar: ['الجانب الأزرق', 'الجانب الأحمر'],
  id: ['Sisi Biru', 'Sisi Merah'],
};
export function sideName(side: Side, clientLocale: string): string {
  const l = clientLocale.toLowerCase().replace('_', '-');
  // Chinês tradicional (Taiwan, Hong Kong, Macau) tem a própria grafia.
  const key = /^zh-(tw|hk|mo)/.test(l) ? 'zh-tw' : l.split('-')[0]!;
  const names = SIDE_NAMES[key] ?? SIDE_NAMES.en!;
  return names[side === 'blue' ? 0 : 1];
}
