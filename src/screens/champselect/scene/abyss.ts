/**
 * Howling Abyss da seleção do ARAM, parte pura (sem canvas, sem WebGL): a ponte, as bases, as agulhas de gelo e as
 * partículas em dois buffers, e onde cada aliado fica. Mundo: x ao longo da ponte (a base do jogador em -900, a
 * inimiga em +900), y para cima, z atravessando a ponte; a câmera olha do lado z > 0.
 * É um desenho estilizado do mapa, feito aqui: nenhuma arte do jogo. As cores de gelo e pedra são a identidade do
 * mapa; a cor de cada time vem do tema por uniform (as peças guardam só de que time são: 1 o meu, 2 o inimigo), então
 * o lado vermelho usa a mesma geometria com as cores trocadas.
 */
import type { Vec3 } from './camera';
import { pinTimes, type Point } from './rift';

/** Mapa do Howling Abyss (ARAM e as variações dele, como o ARAM Caos). */
export const ABYSS_MAP_ID = 12;

/** Floats por vértice: posição 3, normal 3, cor 3, (atraso da entrada, tipo, âncora x, âncora z) 4, (time, quanto da cor do time) 2. */
export const ABYSS_MESH_STRIDE = 15;
/** Floats por partícula: posição 3, cor 3, (tamanho, fase, tipo, atraso) 4, time 1. */
export const ABYSS_SPRITE_STRIDE = 11;

/** Ponte: 12 lajes de `SLAB` de comprimento, de -BRIDGE_END a +BRIDGE_END, com `BRIDGE_HALF` de meia largura. */
export const SLABS = 12;
export const SLAB = 110;
export const BRIDGE_END = 660;
export const BRIDGE_HALF = 80;
/** Bases: plataforma de oito lados em volta de (±BASE_X, 0). */
export const BASE_X = 900;
export const BASE_R = 216;

/** Câmera parada: ângulo no chão, elevação, alvo e o que tem de caber na tela (bases, topo dos nexus, abismo). */
export const ABYSS_YAW = 2.2;
export const ABYSS_ELEV = 0.7;
export const ABYSS_TARGET: Vec3 = [0, -60, 0];
export const ABYSS_BOUNDS: Vec3[] = [[-1140, 0, -236], [-1140, 0, 236], [1140, 0, -236], [1140, 0, 236], [-960, 110, 0], [960, 110, 0], [0, -330, 0]];

/** Quando a peça em `x` começa a subir (0..0,9 do progresso da entrada): a ponte se monta da minha base até a inimiga. */
export const assembleDelay = (x: number): number => ((x + 1250) / 2500) * 0.9;

/** O ponto está em chão firme (laje da ponte ou plataforma de uma base)? */
export const onGround = ([x, z]: Point): boolean => (Math.abs(x) <= BRIDGE_END && Math.abs(z) <= BRIDGE_HALF) || Math.hypot(Math.abs(x) - BASE_X, z) <= BASE_R;

/** O meu ponto: o mais à frente, já na ponte. Os aliados ficam atrás, alternando os lados, até a base. */
const FRONT: Point = [-235, 14];
const BACK: Point[] = [[-800, -28], [-650, 30], [-520, -30], [-385, 30]];
/**
 * Onde cada aliado aparece na ponte (um ponto por vaga, na ordem do time): eu na frente, os outros atrás de mim.
 * ponytail: o ARAM tem 5 por time; passando disso os pontos de trás se repetem com um passo para o lado.
 */
export function abyssSpots(count: number, me: number): Point[] {
  let k = 0;
  return Array.from({ length: count }, (_, i): Point => {
    if (i === me) return FRONT;
    const [x, z] = BACK[k % BACK.length]!;
    const lap = Math.floor(k++ / BACK.length);
    return [x + lap * 60, z];
  });
}

/** Quando cada marcador cai (s): depois de a ponte chegar ao meio; o meu por último, como no Rift. */
export const abyssPinTimes = (count: number, me: number): number[] => pinTimes(count, me).map((t) => t + 0.2);

export interface AbyssAssets {
  mesh: Float32Array;
  sprites: Float32Array;
}

/** Cor de vértice: r, g, b e quanto da cor do time se soma (0 = nada). */
type Col = [number, number, number, number?];
const mulc = (c: Col, f: number): Col => [c[0] * f, c[1] * f, c[2] * f, (c[3] ?? 0) * f];
/** Pedra das torres (pega um pouco da cor do time) e a cor pura do time (cristais, topos). */
const STONE: Col = [0.42, 0.45, 0.52, 0.14];
const TEAM: Col = [0, 0, 0, 1];

/** Monta as malhas e as partículas. Determinístico (gerador próprio de números): a cena é sempre a mesma. */
export function buildAbyss(): AbyssAssets {
  const MV: number[] = [];
  const SV: number[] = [];
  let PAR: [number, number, number, number] = [0, 0, 0, 0];
  let team = 0;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const par = (x: number, kind = 0, ax = 0, az = 0) => void (PAR = [assembleDelay(x), kind, ax, az]);
  const tri = (A: number[], B: number[], C: number[], cA: Col, cB: Col, cC: Col, o: number[]) => {
    let nx = (B[1]! - A[1]!) * (C[2]! - A[2]!) - (B[2]! - A[2]!) * (C[1]! - A[1]!);
    let ny = (B[2]! - A[2]!) * (C[0]! - A[0]!) - (B[0]! - A[0]!) * (C[2]! - A[2]!);
    let nz = (B[0]! - A[0]!) * (C[1]! - A[1]!) - (B[1]! - A[1]!) * (C[0]! - A[0]!);
    const l = Math.hypot(nx, ny, nz);
    if (!l) return;
    nx /= l;
    ny /= l;
    nz /= l;
    // Normal sempre para fora.
    if (nx * o[0]! + ny * o[1]! + nz * o[2]! < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    for (const [P, c] of [[A, cA], [B, cB], [C, cC]] as const) MV.push(P[0]!, P[1]!, P[2]!, nx, ny, nz, c[0], c[1], c[2], PAR[0], PAR[1], PAR[2], PAR[3], c[3] ? team : 0, c[3] ?? 0);
  };
  /** Tronco de cone facetado em volta de `b` (r1 = 0 vira cone). `rot` gira as facetas; `cap` fecha em cima. */
  const cone = (b: number[], n: number, r0: number, y0: number, r1: number, y1: number, c0: Col, c1: Col, cap = false, rot = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.2832 + rot;
      const a1 = ((i + 1) / n) * 6.2832 + rot;
      const am = (a0 + a1) / 2;
      const o = [Math.cos(am), 0.3, Math.sin(am)];
      const P = (a: number, r: number, y: number) => [b[0]! + Math.cos(a) * r, b[1]! + y, b[2]! + Math.sin(a) * r];
      const p0 = P(a0, r0, y0);
      const p1 = P(a1, r0, y0);
      const p2 = P(a1, r1, y1);
      const p3 = P(a0, r1, y1);
      tri(p0, p1, p2, c0, c0, c1, o);
      tri(p0, p2, p3, c0, c1, c1, o);
      if (cap) tri([b[0]!, b[1]! + y1, b[2]!], p3, p2, c1, c1, c1, [0, 1, 0]);
    }
  };
  /** Caixa alinhada aos eixos: tampa e quatro lados. */
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top: Col, side: Col) => {
    const q = (a: number[], b: number[], c: number[], d: number[], col: Col, o: number[]) => {
      tri(a, b, c, col, col, col, o);
      tri(a, c, d, col, col, col, o);
    };
    q([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], top, [0, 1, 0]);
    q([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], side, [0, 0, -1]);
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], side, [0, 0, 1]);
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], mulc(side, 0.8), [-1, 0, 0]);
    q([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], mulc(side, 0.8), [1, 0, 0]);
  };
  /** Partícula. Tipos: 0 neve ao vento, 1 brilho que pulsa (nasce com a peça), 2 fagulha que sobe, 3 bruma. */
  const spr = (x: number, y: number, z: number, c: Col, size: number, kind: number, delay = 0, t = 0) => SV.push(x, y, z, c[0], c[1], c[2], size, rnd(), kind, delay, t);

  // Lajes da ponte, parapeito quebrado, vigas e pilares que somem no abismo.
  for (let i = 0; i < SLABS; i++) {
    const x = -BRIDGE_END + i * SLAB;
    const v = 0.9 + rnd() * 0.2;
    par(x, 1);
    box(x, x + SLAB - 2, -22, 0, -BRIDGE_HALF, BRIDGE_HALF, mulc([0.4, 0.46, 0.6], v), mulc([0.2, 0.24, 0.34], v));
    par(x, 0);
    for (const s of [-1, 1]) {
      if (rnd() < 0.78) {
        const h = 9 + rnd() * 7;
        box(x + 5, x + 100, 0, h, s > 0 ? 72 : -80, s > 0 ? 80 : -72, [0.5, 0.56, 0.68], [0.28, 0.33, 0.45]);
      }
    }
    if (i % 2 === 0) {
      box(x + 34, x + 76, -44, -22, -68, 68, [0.2, 0.24, 0.34], [0.15, 0.18, 0.27]);
      for (const s of [-1, 1]) cone([x + 55, 0, s * 54], 6, 24, -44, 11, -560, [0.2, 0.24, 0.34], [0.07, 0.09, 0.15]);
    }
  }
  // Bases: plataforma de oito lados sobre uma rocha invertida, torres, inibidor e nexus.
  const tower = (x: number, z: number) => {
    const b = [x, 0, z];
    par(x, 0);
    cone(b, 6, 18, 0, 15, 8, mulc(STONE, 0.55), mulc(STONE, 0.7), true);
    cone(b, 6, 11, 8, 7.5, 58, mulc(STONE, 0.75), STONE);
    cone(b, 6, 12, 58, 12, 65, TEAM, mulc(TEAM, 0.8), true);
    par(x, 2, x, z);
    cone(b, 4, 0, 72, 9, 88, mulc(TEAM, 0.8), TEAM);
    cone(b, 4, 9, 88, 0, 104, TEAM, mulc(TEAM, 1.3));
    spr(x, 88, z, [0.7, 0.7, 0.7], 70, 1, PAR[0], team);
  };
  for (const s of [-1, 1]) {
    team = s < 0 ? 1 : 2;
    const bx = s * BASE_X;
    par(bx, 1);
    cone([bx, 0, 0], 8, BASE_R, -70, 236, 0, [0.16, 0.2, 0.3], [0.38, 0.44, 0.58], true, 0.3927);
    par(bx, 0);
    cone([bx, 0, 0], 8, BASE_R, -70, 70, -560, [0.2, 0.24, 0.34], [0.06, 0.08, 0.14], false, 0.3927);
    tower(s * 150, s * -56);
    tower(s * 470, s * -56);
    tower(s * 820, s * 96);
    tower(s * 820, s * -96);
    par(bx, 0);
    cone([s * 740, 0, s * 52], 6, 20, 0, 16, 10, [0.3, 0.34, 0.45], [0.4, 0.45, 0.58], true);
    par(bx, 2, s * 740, s * 52);
    cone([s * 740, 0, s * 52], 4, 0, 18, 12, 36, mulc(TEAM, 0.8), TEAM);
    cone([s * 740, 0, s * 52], 4, 12, 36, 0, 56, TEAM, mulc(TEAM, 1.3));
    par(bx, 0);
    cone([s * 960, 0, 0], 8, 38, 0, 34, 9, [0.22, 0.25, 0.32], [0.36, 0.4, 0.5], true);
    cone([s * 960, 0, 0], 8, 22, 9, 17, 18, mulc(TEAM, 0.5), mulc(TEAM, 0.75), true);
    par(bx, 2, s * 960, 0);
    cone([s * 960, 0, 0], 4, 0, 30, 20, 62, mulc(TEAM, 0.8), TEAM);
    cone([s * 960, 0, 0], 4, 20, 62, 0, 100, TEAM, mulc(TEAM, 1.35));
    spr(s * 960, 64, 0, [0.7, 0.7, 0.7], 190, 1, PAR[0], team);
    spr(s * 740, 36, s * 52, [0.6, 0.6, 0.6], 60, 1, PAR[0], team);
  }
  team = 0;
  // Paredões do abismo: agulhas de gelo dos dois lados e atrás das bases.
  const spire = (x: number, z: number, r: number, top: number) => {
    par(x, 0);
    const v = 0.8 + rnd() * 0.4;
    const n = 5 + ((rnd() * 2) | 0);
    const rot = rnd() * 6;
    const mid = top - (top + 560) * (0.3 + rnd() * 0.2);
    cone([x, 0, z], n, r, -560, r * 0.66, mid, [0.05, 0.07, 0.12], mulc([0.17, 0.23, 0.35], v), false, rot);
    cone([x, 0, z], n, r * 0.66, mid, r * 0.24, top, mulc([0.17, 0.23, 0.35], v), mulc([0.4, 0.5, 0.66], v), true, rot);
  };
  // O lado de cá da câmera (z > 0) fica abaixo da ponte para não tapá-la; o de lá sobe e fecha o fundo.
  for (let i = 0; i < 210; i++) {
    const s = i % 2 ? 1 : -1;
    const d = Math.pow(rnd(), 1.4);
    const x = -1350 + rnd() * 2700;
    const z = s * (250 + d * 420);
    spire(x, z, 50 + rnd() * 70, s > 0 ? -330 + rnd() * 170 + d * 110 : -120 + rnd() * 120 + d * 170);
  }
  for (let i = 0; i < 30; i++) {
    const s = i % 2 ? 1 : -1;
    spire(s * (1200 + rnd() * 220), -240 + rnd() * 480, 50 + rnd() * 50, s > 0 ? 20 + rnd() * 220 : -200 + rnd() * 160);
  }
  // Neve ao vento, relíquias de vida e bruma no fundo do abismo.
  for (let i = 0; i < 260; i++) spr(-1300 + rnd() * 2600, 0, -420 + rnd() * 900, [0.9, 0.96, 1], 8 + rnd() * 9, 0);
  for (const [x, z] of [[-560, 60], [-300, -60], [300, 60], [560, -60]] as const) {
    spr(x, 14, z, [0.3, 0.9, 0.55], 54, 1, assembleDelay(x));
    for (let k = 0; k < 4; k++) spr(x + (rnd() - 0.5) * 24, 4, z + (rnd() - 0.5) * 24, [0.4, 1, 0.6], 11, 2);
  }
  for (let i = 0; i < 46; i++) spr(-1200 + rnd() * 2400, -230 - rnd() * 220, -200 + rnd() * 400, [0.2, 0.33, 0.52], 250, 3);

  return { mesh: new Float32Array(MV), sprites: new Float32Array(SV) };
}

let cached: AbyssAssets | null = null;
/** As peças montadas uma vez por sessão do client: reabrir a seleção só recria os buffers de GPU. */
export const abyssAssets = (): AbyssAssets => (cached ??= buildAbyss());
