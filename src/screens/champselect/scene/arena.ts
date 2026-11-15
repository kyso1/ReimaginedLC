/**
 * Arena (Anéis da Fúria) da seleção, parte pura (sem canvas, sem WebGL): a ilha flutuante com o piso de areia, o muro,
 * a arquibancada com a torcida, os braseiros e as bandeiras em dois buffers, e onde cada time fica. Mundo: o centro da
 * arena é a origem, y para cima. O meu time fica no tablado do centro; os outros, em pedestais num anel em volta.
 * Vale para qualquer número de times (8 duplas, 6 trios...): nada aqui supõe oito.
 * É um desenho estilizado, feito aqui: nenhuma arte do jogo. A cor de cada time vem do tema por uniform (as bandeiras
 * guardam só o índice do time).
 */
import type { Vec3 } from './camera';
import type { Point } from './rift';

/** Mapa da Arena (modo CHERRY). */
export const ARENA_MAP_ID = 30;

/** Floats por vértice: posição 3, normal 3, cor 3, (atraso da entrada, tipo, âncora x, âncora z) 4. */
export const ARENA_MESH_STRIDE = 13;
/** Floats por partícula: posição 3, cor 3, (tamanho, fase, tipo, atraso) 4. */
export const ARENA_SPRITE_STRIDE = 10;

/** Raio do piso de areia, do anel dos pedestais e da borda de fora da arquibancada. */
export const FLOOR_R = 432;
export const RING_R = 318;
export const OUTER_R = 705;
/** Tablado do centro (o meu time) e o maior pedestal dos outros. */
export const DAIS_R = 110;
export const PEDESTAL_R = 56;
/** Times com anel de luz no chão (tamanho do vetor de uniforms do shader). */
export const MAX_TEAMS = 12;

/** Câmera parada: ângulo no chão, elevação, alvo e o que tem de caber na tela (rocha, arquibancada, bandeiras). */
export const ARENA_YAW = 1.9;
export const ARENA_ELEV = 0.8;
export const ARENA_TARGET: Vec3 = [0, 40, 0];
const TAU = 6.2832;
export const ARENA_BOUNDS: Vec3[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * TAU;
  const x = Math.cos(a) * OUTER_R;
  const z = Math.sin(a) * OUTER_R;
  return [[x, -40, z], [x, 180, z], [x, 336, z]] as Vec3[];
}).flat();

/** Quantos pedestais há no anel: todos os times menos o meu (sem o meu na lista, todos). */
const ringCount = (teams: number, mine: number): number => teams - (mine >= 0 && mine < teams ? 1 : 0);
/** Raio do pedestal: encolhe quando o anel tem times demais para não se tocarem. */
export const pedestalRadius = (ring: number): number => Math.min(PEDESTAL_R, ((Math.PI * RING_R) / Math.max(1, ring)) * 0.8);

/**
 * Onde cada time fica (um ponto por time, na ordem da lista): o meu no centro, os outros espalhados por igual no anel.
 * Sem o meu time na lista (`mine` fora dela), todos vão para o anel.
 */
export function arenaSpots(teams: number, mine: number): Point[] {
  const ring = ringCount(teams, mine);
  let k = 0;
  return Array.from({ length: teams }, (_, i): Point => {
    if (i === mine) return [0, 0];
    const a = (k++ / ring) * TAU + 0.5;
    return [Math.cos(a) * RING_R, Math.sin(a) * RING_R];
  });
}

/**
 * Quando cada time cai no lugar (s): os do anel em sequência (em 0,9 s no total) e o meu por último, a tempo de a
 * queda terminar antes de a grade abrir (`MAP_INTRO_MS`).
 */
export function arenaPinTimes(teams: number, mine: number): number[] {
  const ring = ringCount(teams, mine);
  const step = ring > 1 ? Math.min(0.2, 0.9 / (ring - 1)) : 0;
  let k = 0;
  return Array.from({ length: teams }, (_, i) => (i === mine ? 2 + step * Math.max(0, ring - 1) + 0.3 : 2 + step * k++));
}

export interface ArenaAssets {
  mesh: Float32Array;
  sprites: Float32Array;
}

type Col = [number, number, number];
const mulc = (c: Col, f: number): Col => [c[0] * f, c[1] * f, c[2] * f];
const STONE: Col = [0.36, 0.31, 0.5];
const SAND: Col = [0.5, 0.4, 0.36];

/**
 * Monta as malhas e as partículas para `teams` times. Determinístico (gerador próprio de números).
 * ponytail: `tri` e `cone` repetem os do Howling Abyss (lá são fechados dentro de `buildAbyss`); se vier uma quarta
 * cena, vale tirar os dois para um módulo comum.
 */
export function buildArena(teams: number, mine: number): ArenaAssets {
  const MV: number[] = [];
  const SV: number[] = [];
  let PAR: [number, number, number, number] = [0, 0, 0, 0];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  /** As peças sobem do centro para fora: o atraso cresce com o raio. Tipos: 1 areia, 3 bandeira, 4 arquibancada. */
  const par = (r: number, kind = 0, ax = 0, az = 0) => void (PAR = [(r / 760) * 0.9, kind, ax, az]);
  const tri = (A: number[], B: number[], C: number[], cA: Col, cB: Col, cC: Col, o: number[]) => {
    let nx = (B[1]! - A[1]!) * (C[2]! - A[2]!) - (B[2]! - A[2]!) * (C[1]! - A[1]!);
    let ny = (B[2]! - A[2]!) * (C[0]! - A[0]!) - (B[0]! - A[0]!) * (C[2]! - A[2]!);
    let nz = (B[0]! - A[0]!) * (C[1]! - A[1]!) - (B[1]! - A[1]!) * (C[0]! - A[0]!);
    const l = Math.hypot(nx, ny, nz);
    if (!l) return;
    nx /= l;
    ny /= l;
    nz /= l;
    // Normal sempre para o lado de `o`.
    if (nx * o[0]! + ny * o[1]! + nz * o[2]! < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    for (const [P, c] of [[A, cA], [B, cB], [C, cC]] as const) MV.push(P[0]!, P[1]!, P[2]!, nx, ny, nz, c[0], c[1], c[2], PAR[0], PAR[1], PAR[2], PAR[3]);
  };
  /** Tronco de cone facetado em volta de `b`. `cap` fecha em cima; `inv`: faces viradas para dentro (muro, degraus). */
  const cone = (b: number[], n: number, r0: number, y0: number, r1: number, y1: number, c0: Col, c1: Col, cap = false, rot = 0, inv = false) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU + rot;
      const a1 = ((i + 1) / n) * TAU + rot;
      const am = (a0 + a1) / 2;
      const o = inv ? [-Math.cos(am), 0.3, -Math.sin(am)] : [Math.cos(am), 0.3, Math.sin(am)];
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
  /** Partícula. Tipos: 0 poeira dourada, 1 brilho que pulsa, 2 fagulha do braseiro, 3 torcida (pisca e pula). */
  const spr = (x: number, y: number, z: number, c: Col, size: number, kind: number, delay = 0) => SV.push(x, y, z, c[0], c[1], c[2], size, rnd(), kind, delay);
  const O = [0, 0, 0];

  par(80);
  cone(O, 22, OUTER_R, -40, 230, -540, [0.2, 0.16, 0.3], [0.05, 0.04, 0.1]); // rocha por baixo
  par(0, 1);
  cone(O, 44, FLOOR_R, -40, FLOOR_R, 0, mulc(SAND, 0.5), SAND, true); // piso de areia
  par(40);
  cone(O, 8, DAIS_R + 12, 0, DAIS_R, 9, [0.4, 0.32, 0.2], [0.74, 0.6, 0.36], true, 0.39); // tablado do centro
  // Pedestais do anel: pedra neutra; a cor de cada time vem do anel de luz no chão.
  const ring = ringCount(teams, mine);
  const pr = pedestalRadius(ring);
  for (const [x, z] of arenaSpots(ring, -1)) {
    par(RING_R);
    cone([x, 0, z], 6, pr, 0, pr * 0.86, 8, mulc(STONE, 0.55), [0.42, 0.38, 0.54], true);
  }
  // Muro e arquibancada: degraus em anel (a face de dentro é a que a câmera vê).
  par(FLOOR_R);
  cone(O, 40, FLOOR_R, 0, FLOOR_R, 58, mulc(STONE, 0.5), STONE, false, 0, true);
  cone(O, 40, FLOOR_R, 58, 462, 58, mulc(STONE, 1.25), mulc(STONE, 1.25));
  ([[462, 58, 95], [540, 95, 135], [620, 135, 180]] as const).forEach(([r, y0, y1], j) => {
    par(r);
    cone(O, 40, r, y0, r, y1, mulc(STONE, 0.45), mulc(STONE, 0.75), false, 0, true);
    par(r, 4);
    cone(O, 40, r, y1, r + (j < 2 ? 78 : 82), y1, mulc(STONE, 0.7), mulc(STONE, 0.9));
    for (let i = 0; i < 190; i++) {
      const a = rnd() * TAU;
      const rr = r + 12 + rnd() * 58;
      const c = ([[1, 0.8, 0.5], [0.8, 0.6, 1], [1, 1, 1], [1, 0.5, 0.6]] as Col[])[i % 4]!;
      spr(Math.cos(a) * rr, y1 + 7, Math.sin(a) * rr, mulc(c, 0.9), 12 + rnd() * 7, 3, (r / 760) * 0.9); // torcida
    }
  });
  par(700);
  cone(O, 40, 702, -40, 702, 180, [0.12, 0.1, 0.2], mulc(STONE, 0.7));
  // Braseiros no muro.
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * TAU;
    const x = Math.cos(a) * 447;
    const z = Math.sin(a) * 447;
    par(447);
    cone([x, 58, z], 6, 5, 0, 12, 13, [0.2, 0.16, 0.26], [0.42, 0.34, 0.3], true);
    spr(x, 80, z, [1, 0.5, 0.18], 95, 1, PAR[0]);
    for (let k = 0; k < 5; k++) spr(x + (rnd() - 0.5) * 12, 70, z + (rnd() - 0.5) * 12, [1, 0.6, 0.2], 12, 2, PAR[0]);
  }
  // Bandeiras dos times no alto da arquibancada: a cor guarda (índice do time, sombra) e o shader busca a cor do tema.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const cx = Math.cos(a);
    const sz = Math.sin(a);
    const x = cx * 696;
    const z = sz * 696;
    const team = Math.min(MAX_TEAMS - 1, i % Math.max(1, teams));
    par(700);
    cone([x, 180, z], 4, 4, 0, 3, 156, [0.3, 0.26, 0.4], [0.55, 0.5, 0.66]);
    par(700, 3, x, z);
    tri([x, 330, z], [x, 268, z], [x - sz * 78, 296, z + cx * 78], [team, 1, 0], [team, 0.8, 0], [team, 0.6, 0], [-cx, 0.2, -sz]);
  }
  for (let i = 0; i < 80; i++) spr((rnd() - 0.5) * 820, 40 + rnd() * 280, (rnd() - 0.5) * 820, [1, 0.85, 0.55], 8 + rnd() * 6, 0);
  spr(0, 24, 0, [0.5, 0.38, 0.16], 240, 1, 0);

  return { mesh: new Float32Array(MV), sprites: new Float32Array(SV) };
}

const cached = new Map<string, ArenaAssets>();
/** As peças montadas uma vez por formato de partida (número de times) e sessão do client. */
export function arenaAssets(teams: number, mine: number): ArenaAssets {
  const key = `${teams}:${ringCount(teams, mine)}`;
  let a = cached.get(key);
  if (!a) cached.set(key, (a = buildArena(teams, mine)));
  return a;
}
