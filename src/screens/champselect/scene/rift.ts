/**
 * Summoner's Rift da seleção de campeões, parte pura (sem canvas, sem WebGL): a geometria em poucas listas de pontos
 * e onde cada aliado fica. Coordenadas 0..1000 vistas de cima: x para a direita, y (o z do mundo 3D) para baixo;
 * base azul embaixo à esquerda (0, 1000), vermelha em cima à direita (1000, 0); o rio é a diagonal x = y.
 * É um desenho estilizado do mapa, feito aqui: nenhuma arte do jogo.
 */
import { roleOf, type Role } from '../../../ui/RoleIcon';

export type Point = [number, number];
export type Side = 'blue' | 'red';
export type Lane = 'top' | 'mid' | 'bot';

/** Mapa do Summoner's Rift (normal, ranqueada, Jogo Rápido, treino): os outros usam a arte do client. */
export const RIFT_MAP_ID = 11;
export const SIZE = 1000;

/** Giro de 180° pelo centro: leva um objeto do azul ao equivalente do vermelho (torres, nexus). */
export const flip = ([x, y]: Point): Point => [SIZE - x, SIZE - y];
/** Espelho pelo rio: troca de lado sem trocar de rota (o topo continua topo). */
export const mirror = ([x, y]: Point): Point => [y, x];

/** O mapa tem simetria: um quadrante de selva descrito uma vez vira os quatro. */
export const QUADS: Array<(p: Point) => Point> = [(p) => p, ([x, y]) => [SIZE - y, SIZE - x], flip, mirror];
export const JUNGLE: Point[] = [[150, 240], [150, 770], [430, 512]];
export const TRAILS: Point[][] = [[[100, 420], [190, 455], [232, 482], [300, 560], [342, 668]], [[292, 298], [245, 400], [232, 482], [212, 600], [212, 640], [185, 762]], [[300, 590], [402, 452]]];
/** Acampamentos: x, y, raio da clareira. O primeiro é o buff. */
export const CAMPS: Array<[number, number, number]> = [[232, 482, 36], [300, 590, 26], [212, 640, 26]];
export const BRUSH: Point[] = [[58, 360], [58, 540], [119, 300]];
export const RIVER = 'M 120 120 C 260 230 380 380 500 500 S 760 770 880 880';
/** Covas do Barão (em cima) e do Dragão (embaixo). */
export const PITS: Point[] = [[365, 268], [635, 732]];
/** Torres do azul: 3 por rota (topo, baixo, meio; a externa primeiro) + 2 do nexus. As do vermelho são o giro de 180°. */
export const TOWERS: Point[] = [[88, 330], [88, 560], [88, 730], [670, 912], [440, 912], [270, 912], [400, 600], [320, 680], [250, 750], [140, 830], [170, 860]];
export const NEXUS: Point = [110, 890];

/** Rota amostrada em pontos, da base azul até a vermelha. Topo e baixo seguem as bordas e dobram no canto. */
export function lanePoints(which: Lane): Point[] {
  const out: Point[] = [];
  const line = (x0: number, y0: number, x1: number, y1: number, n: number) => {
    for (let i = 0; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  if (which === 'mid') {
    line(170, 830, 830, 170, 60);
    return out;
  }
  line(88, 820, 88, 180, 40);
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    const u = 1 - t;
    out.push([u * u * 88 + 2 * u * t * 88 + t * t * 180, u * u * 180 + 2 * u * t * 88 + t * t * 88]);
  }
  line(180, 88, 820, 88, 40);
  return which === 'bot' ? out.map(QUADS[1]!) : out;
}
export const LANES: Record<Lane, Point[]> = { top: lanePoints('top'), mid: lanePoints('mid'), bot: lanePoints('bot') };

/** Base do lado (canto do mapa). */
export const homeOf = (side: Side): Point => (side === 'blue' ? [0, SIZE] : [SIZE, 0]);

type Spot = Exclude<Role, 'FILL' | 'UNSELECTED'>;
/** Ponto de cada função no lado azul: na própria rota, perto da torre externa; o caçador no buff da selva. */
export const SPOTS: Record<Spot, Point> = { TOP: [88, 280], JUNGLE: [238, 486], MIDDLE: [440, 560], BOTTOM: [560, 912], UTILITY: [886, 886] };

/** Sem função, os pontos são ocupados nesta ordem (o primeiro da fila no meio). */
const FREE_ORDER: Spot[] = ['MIDDLE', 'TOP', 'BOTTOM', 'JUNGLE', 'UTILITY'];
/**
 * Onde cada jogador do time aparece (um ponto por posição recebida, na mesma ordem). Com função, no ponto dela; o
 * vermelho é o azul espelhado pelo rio (girar 180° trocaria as rotas: o topo azul cairia na rota de baixo). Sem função
 * (escolha às cegas, personalizada), o time se espalha pelos pontos que sobraram: juntos na base os marcadores se
 * cobririam. Quem passar de cinco fica em arco na frente da própria base.
 */
export function spotsFor(side: Side, positions: Array<string | null | undefined>): Point[] {
  const roles = positions.map((p) => {
    const r = roleOf(p);
    return r !== 'FILL' && r !== 'UNSELECTED' ? r : null;
  });
  const free = FREE_ORDER.filter((r) => !roles.includes(r));
  let extra = 0;
  return roles.map((role) => {
    const spot = role ?? free.shift();
    let p: Point;
    if (spot) p = SPOTS[spot];
    else {
      const a = ((15 + 20 * extra++) * Math.PI) / 180;
      p = [Math.round(300 * Math.cos(a)), Math.round(SIZE - 300 * Math.sin(a))];
    }
    return side === 'blue' ? p : mirror(p);
  });
}

/** Rota que acende para o jogador: a da função dele; caçador, preencher ou sem função não acendem nenhuma. */
export function laneOf(position: string | null | undefined): Lane | null {
  const role = roleOf(position);
  return role === 'TOP' ? 'top' : role === 'MIDDLE' ? 'mid' : role === 'BOTTOM' || role === 'UTILITY' ? 'bot' : null;
}

/** Distância de um ponto a uma linha de pontos. */
export function lineDist([px, py]: Point, line: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1]!;
    const [bx, by] = line[i]!;
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
}

/**
 * Quando cada marcador cai na entrada (segundos): os aliados em sequência, o do jogador (`me`) por último, com uma
 * pausa antes.
 */
export function pinTimes(count: number, me: number): number[] {
  let k = 0;
  return Array.from({ length: count }, (_, i) => (i === me ? 2.5 + 0.14 * Math.max(0, count - 1) + 0.24 : 2.5 + 0.14 * k++));
}
/** Fim da entrada: o último marcador no lugar. */
export const INTRO_S = 3.85;

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
