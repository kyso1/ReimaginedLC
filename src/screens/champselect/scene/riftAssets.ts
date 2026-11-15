/**
 * Summoner's Rift da seleção: tudo o que é caro e não muda (mapa de altura, máscaras, cor do chão, malhas, luz).
 * As listas de pontos de `rift.ts` viram, com o canvas 2D, um mapa de altura + máscaras; o relevo é uma malha levantada
 * por ele; árvores, moitas, torres e nexus são malhas facetadas num buffer só; a luz (sombra projetada + oclusão) é
 * calculada na CPU e guardada em textura. É feito uma vez por sessão, em pedaços no tempo ocioso (a tela da seleção
 * não trava ao abrir), e a luz uma vez por lado.
 *
 * As cores do terreno (grama, pedra, água, buffs) são constantes daqui e não tokens do tema: são a identidade do mapa
 * e entram em texturas montadas uma vez. O que é do tema (cor dos times, destaque) vai por uniform, em `riftScene.ts`:
 * por isso torres e brilhos guardam só de que time são, e não a cor.
 */
import { BRUSH, CAMPS, JUNGLE, LANES, NEXUS, PITS, QUADS, RIVER, SIZE, TOWERS, TRAILS, type Point, type Side } from './rift';

/** Lado das texturas de máscara e de luz. */
export const TEX = 512;
/** Divisões da malha do terreno por lado e espessura do bloco. */
const N = 220;
export const THICK = 64;
/** Floats por vértice dos objetos: posição local 3, âncora 3, normal 3, cor 3, (tipo, time, quanto da cor do time) 3. */
export const MESH_STRIDE = 15;
/** Floats por partícula: posição 3, cor 3, (tamanho, fase, tipo, time) 4. */
export const SPRITE_STRIDE = 10;

export interface RiftAssets {
  /** Altura do terreno num ponto do mapa. */
  hAt(x: number, z: number): number;
  /** R rio, G rotas, B progresso ao longo da rota (a partir da base azul). */
  masks: Uint8Array;
  /** Uma rota por canal (R topo, G meio, B baixo), para acender a do jogador. */
  lanes: Uint8Array;
  /** Cor do chão. */
  albedo: HTMLCanvasElement;
  /** Malha do terreno: posição 3, (é saia, tom da face, é a borda de baixo) 3. */
  terrain: Float32Array;
  index: Uint16Array;
  mesh: Float32Array;
  sprites: Float32Array;
  /** R,G normal; B luz (sombra projetada × oclusão); A altura. A luz vem de trás da base do lado. */
  light: Uint8Array;
}
type Base = Omit<RiftAssets, 'light'> & { H: Float32Array; HB: Float32Array; shadows: Array<[number, number, number, number]> };

const S = TEX;
type Ctx = CanvasRenderingContext2D;
function cv(n: number): Ctx {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  if (!x) throw new Error('canvas 2d');
  x.scale(n / SIZE, n / SIZE);
  x.lineJoin = x.lineCap = 'round';
  return x;
}
function path(c: Ctx, pts: Point[], close = false): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
}
function disc(c: Ctx, x: number, y: number, r: number): void {
  c.beginPath();
  c.arc(x, y, r, 0, 7);
}
/** Canal vermelho do canvas, com desfoque opcional, como Float32Array. */
function chan(src: Ctx, blur: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  if (blur) x.filter = `blur(${blur}px)`;
  x.drawImage(src.canvas, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data;
  const o = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) o[i] = d[i * 4]!;
  return o;
}
const gray = (v: number) => `rgb(${v},${v},${v})`;
/** Desenha a mesma forma nos quatro quadrantes. */
const quads = (fn: (q: (pts: Point[]) => Point[], i: number) => void) => QUADS.forEach((q, i) => fn((pts) => pts.map(q), i));
const mask = (): Ctx => {
  const c = cv(S);
  c.fillStyle = '#000';
  c.fillRect(0, 0, SIZE, SIZE);
  c.strokeStyle = '#fff';
  return c;
};
const lanes = Object.values(LANES);

// Ruído de valor simples (a mesma ideia do shader), para dar irregularidade ao relevo.
const hsh = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function vnoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  let f = x - i;
  let g = y - j;
  f = f * f * (3 - 2 * f);
  g = g * g * (3 - 2 * g);
  const a = hsh(i, j);
  const b = hsh(i + 1, j);
  const c = hsh(i, j + 1);
  const d = hsh(i + 1, j + 1);
  return a + (b - a) * f + (c - a) * g + (a - b - c + d) * f * g;
}

/** Altura desenhada: cinza 64 = chão; cada unidade de cinza = 0,5 de altura. Devolve os cinzas e uma cópia desfocada (oclusão). */
function heights(): { H: Float32Array; HB: Float32Array } {
  const hc = cv(S);
  hc.fillStyle = gray(64);
  hc.fillRect(0, 0, SIZE, SIZE);
  quads((q) => {
    path(hc, q(JUNGLE), true);
    hc.fillStyle = hc.strokeStyle = gray(152);
    hc.lineWidth = 30;
    hc.fill();
    hc.stroke();
  });
  quads((q) => {
    hc.strokeStyle = hc.fillStyle = gray(64);
    hc.lineWidth = 34;
    TRAILS.forEach((t) => {
      path(hc, q(t));
      hc.stroke();
    });
    CAMPS.forEach((cmp) => {
      const [p] = q([[cmp[0], cmp[1]]]);
      disc(hc, p![0], p![1], cmp[2]);
      hc.fill();
    });
  });
  hc.strokeStyle = gray(64);
  hc.lineWidth = 46;
  lanes.forEach((l) => {
    path(hc, l);
    hc.stroke();
  });
  hc.strokeStyle = gray(40);
  hc.lineWidth = 68;
  hc.stroke(new Path2D(RIVER));
  hc.fillStyle = gray(34);
  PITS.forEach(([x, y]) => {
    disc(hc, x, y, 44);
    hc.fill();
  });
  hc.fillStyle = gray(74);
  disc(hc, 0, SIZE, 205);
  hc.fill();
  disc(hc, SIZE, 0, 205);
  hc.fill();
  hc.strokeStyle = gray(118);
  hc.lineWidth = 40;
  hc.lineJoin = 'miter';
  hc.strokeRect(20, 20, 960, 960);

  return { H: chan(hc, 2), HB: chan(hc, 8) };
}
/** Cinzas viram altura, com ruído para o relevo não ficar liso (num passo à parte: é o trecho mais demorado). */
function roughen(H: Float32Array, HB: Float32Array): void {
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const k = j * S + i;
      let h = (H[k]! - 64) * 0.5;
      HB[k] = (HB[k]! - 64) * 0.5;
      if (h > 6) h += (vnoise(i * 0.09, j * 0.09) - 0.5) * 14 * Math.min(1, (h - 6) / 20); // topo dos muros irregular
      H[k] = h + (vnoise(i * 0.025, j * 0.025) - 0.5) * 3;
    }
}

function masks(): { masks: Uint8Array; lanes: Uint8Array } {
  const river = mask();
  river.lineWidth = 64;
  river.stroke(new Path2D(RIVER));
  const all = mask();
  all.lineWidth = 34;
  lanes.forEach((l) => {
    path(all, l);
    all.stroke();
  });
  const prog = mask();
  prog.lineWidth = 64;
  lanes.forEach((l) => {
    for (let i = l.length - 1; i > 0; i--) {
      prog.strokeStyle = gray(Math.round(26 + (229 * i) / (l.length - 1)));
      path(prog, [l[i - 1]!, l[i]!]);
      prog.stroke();
    }
  });
  const each = lanes.map((l) => {
    const c = mask();
    c.lineWidth = 34;
    path(c, l);
    c.stroke();
    return chan(c, 1.2);
  });
  const mR = chan(river, 2);
  const mG = chan(all, 1.2);
  const mB = chan(prog, 0);
  const m = new Uint8Array(S * S * 4);
  const ln = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    m[i * 4] = mR[i]!;
    m[i * 4 + 1] = mG[i]!;
    m[i * 4 + 2] = mB[i]!;
    m[i * 4 + 3] = 255;
    ln[i * 4] = each[0]![i]!;
    ln[i * 4 + 1] = each[1]![i]!;
    ln[i * 4 + 2] = each[2]![i]!;
    ln[i * 4 + 3] = 255;
  }
  return { masks: m, lanes: ln };
}

/** Cor do chão (rotas, água e a cor das bases entram no shader). */
function albedo(): HTMLCanvasElement {
  const ac = cv(1024);
  const g = ac.createRadialGradient(500, 500, 60, 500, 500, 720);
  g.addColorStop(0, '#2c4a30');
  g.addColorStop(1, '#172b1d');
  ac.fillStyle = g;
  ac.fillRect(0, 0, SIZE, SIZE);
  quads((q) => {
    path(ac, q(JUNGLE), true);
    ac.fillStyle = ac.strokeStyle = '#1f4a2b';
    ac.lineWidth = 30;
    ac.fill();
    ac.stroke();
  });
  ac.strokeStyle = '#1d4229';
  ac.lineWidth = 40;
  ac.strokeRect(20, 20, 960, 960);
  quads((q, i) => {
    ac.strokeStyle = '#4b422d';
    ac.lineWidth = 26;
    TRAILS.forEach((t) => {
      path(ac, q(t));
      ac.stroke();
    });
    CAMPS.forEach((cmp, k) => {
      const [p] = q([[cmp[0], cmp[1]]]);
      disc(ac, p![0], p![1], cmp[2] - 2);
      ac.fillStyle = '#3d3a29';
      ac.fill();
      disc(ac, p![0], p![1], cmp[2] * 0.55);
      ac.lineWidth = 3;
      // Anel do buff na cor dele no jogo (vermelho e azul), não na do time.
      ac.strokeStyle = k ? 'rgba(190,220,150,.45)' : i % 2 ? 'rgba(255,120,100,.8)' : 'rgba(110,170,255,.8)';
      ac.stroke();
    });
  });
  PITS.forEach(([x, y], i) => {
    disc(ac, x, y, 44);
    ac.fillStyle = '#17131f';
    ac.fill();
    disc(ac, x, y, 26);
    ac.lineWidth = 4;
    ac.strokeStyle = i ? 'rgba(255,150,60,.7)' : 'rgba(180,110,255,.7)';
    ac.stroke();
  });
  // Bases: pedra. O centro e os anéis na cor do time são pintados no shader (cor do tema).
  for (const [x, y] of [[0, SIZE], [SIZE, 0]] as Point[]) {
    const b = ac.createRadialGradient(x, y, 20, x, y, 205);
    b.addColorStop(0, '#4a5673');
    b.addColorStop(1, '#2b3347');
    disc(ac, x, y, 203);
    ac.fillStyle = b;
    ac.fill();
  }
  // Pedestais das torres.
  ac.fillStyle = '#3c4254';
  TOWERS.forEach(([x, y]) =>
    [[x, y], [SIZE - x, SIZE - y]].forEach(([a, b]) => {
      disc(ac, a!, b!, 21);
      ac.fill();
    }),
  );
  // Salpicos para o chão não ficar liso.
  for (let i = 0; i < 7000; i++) {
    ac.fillStyle = i % 2 ? 'rgba(255,255,220,.035)' : 'rgba(0,0,0,.07)';
    disc(ac, hsh(i, 1) * SIZE, hsh(i, 2) * SIZE, 2 + hsh(i, 3) * 6);
    ac.fill();
  }
  return ac.canvas;
}

type V3 = [number, number, number];
const mulc = (c: V3, f: number): V3 => [c[0] * f, c[1] * f, c[2] * f];
const GRAY: V3 = [1, 1, 1];

/** Árvores, moitas, torres, nexus e as partículas. O sorteio é fixo: fica tudo sempre no mesmo lugar. */
function objects(hAt: RiftAssets['hAt']): Pick<Base, 'mesh' | 'sprites' | 'shadows'> {
  const MV: number[] = [];
  const SV: number[] = [];
  const shadows: Base['shadows'] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // `k`: tipo (0 pedra, 1 planta que balança, 2 cristal), time (0 nenhum, 1 azul, 2 vermelho), quanto da cor do time.
  const tri = (b: V3, k: V3, A: V3, B: V3, C: V3, cA: V3, cB: V3, cC: V3, o: V3) => {
    let nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
    let ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
    let nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const l = Math.hypot(nx, ny, nz);
    if (!l) return;
    // Normal sempre para fora.
    const s = (nx * o[0] + ny * o[1] + nz * o[2] < 0 ? -1 : 1) / l;
    nx *= s;
    ny *= s;
    nz *= s;
    for (const [P, c] of [[A, cA], [B, cB], [C, cC]] as const) MV.push(P[0], P[1], P[2], b[0], b[1], b[2], nx, ny, nz, c[0], c[1], c[2], k[0], k[1], k[2]);
  };
  // Tronco de cone facetado (r1 = 0 vira cone; r0 = 0 vira cone invertido).
  const cone = (b: V3, k: V3, n: number, r0: number, y0: number, r1: number, y1: number, c0: V3, c1: V3, cap = false) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.2832;
      const a1 = ((i + 1) / n) * 6.2832;
      const am = (a0 + a1) / 2;
      const o: V3 = [Math.cos(am), 0.3, Math.sin(am)];
      const p0: V3 = [Math.cos(a0) * r0, y0, Math.sin(a0) * r0];
      const p1: V3 = [Math.cos(a1) * r0, y0, Math.sin(a1) * r0];
      const p2: V3 = [Math.cos(a1) * r1, y1, Math.sin(a1) * r1];
      const p3: V3 = [Math.cos(a0) * r1, y1, Math.sin(a0) * r1];
      tri(b, k, p0, p1, p2, c0, c0, c1, o);
      tri(b, k, p0, p2, p3, c0, c1, c1, o);
      if (cap) tri(b, k, [0, y1, 0], p3, p2, c1, c1, c1, [0, 1, 0]);
    }
  };
  const PLANT: V3 = [1, 0, 0];

  // Árvores no topo dos muros e da borda.
  const trees: Point[] = [];
  for (let i = 0; i < 9000 && trees.length < 900; i++) {
    const x = 8 + rnd() * 984;
    const z = 8 + rnd() * 984;
    const h = hAt(x, z);
    if (h < 20 || hAt(x + 13, z) < 17 || hAt(x - 13, z) < 17 || hAt(x, z + 13) < 17 || hAt(x, z - 13) < 17) continue;
    if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 27)) continue;
    trees.push([x, z]);
    const rim = x < 44 || x > 956 || z < 44 || z > 956;
    const s = rim ? 0.45 + rnd() * 0.15 : 0.55 + rnd() * 0.35;
    const b: V3 = [x, h - 1, z];
    const v = 0.8 + rnd() * 0.45;
    const dark = mulc([0.05, 0.19, 0.12], v);
    const lite = mulc([0.2 + rnd() * 0.1, 0.46, 0.22], v);
    cone(b, PLANT, 5, 3 * s, 0, 2.4 * s, 10 * s, [0.2, 0.14, 0.1], [0.24, 0.17, 0.11]);
    if (rnd() < 0.72) {
      cone(b, PLANT, 6, 15 * s, 8 * s, 0, 30 * s, dark, lite);
      cone(b, PLANT, 6, 12 * s, 21 * s, 0, 43 * s, dark, lite);
      cone(b, PLANT, 6, 8 * s, 34 * s, 0, 56 * s, dark, lite);
    } else {
      cone(b, PLANT, 6, 8 * s, 9 * s, 15 * s, 24 * s, dark, mulc(lite, 0.8));
      cone(b, PLANT, 6, 15 * s, 24 * s, 0, 44 * s, mulc(lite, 0.8), mulc(lite, 1.15));
    }
    shadows.push([x, z, 34 * s, 22 * s]);
  }
  // Moitas (mato das rotas), três por ponto.
  quads((q) =>
    q(BRUSH).forEach(([x, z]) =>
      [[0, 0], [15, 9], [-8, 16]].forEach(([dx, dz]) => {
        const b: V3 = [x + dx!, hAt(x + dx!, z + dz!), z + dz!];
        const s = 0.85 + rnd() * 0.4;
        cone(b, PLANT, 6, 9 * s, 0, 13 * s, 8 * s, [0.1, 0.3, 0.14], [0.2, 0.5, 0.22]);
        cone(b, PLANT, 6, 13 * s, 8 * s, 0, 19 * s, [0.2, 0.5, 0.22], [0.36, 0.66, 0.3]);
      }),
    ),
  );
  // Torres e nexus: a pedra leva um quarto da cor do time; faixa e cristal, a cor inteira.
  const glows: Array<[number, number, number, number, number]> = [];
  const tower = (x: number, z: number, team: number) => {
    const b: V3 = [x, hAt(x, z), z];
    const stone: V3 = [0, team, 0.25];
    const st = mulc(GRAY, 0.56);
    cone(b, stone, 6, 18, 0, 15, 8, mulc(st, 0.55), mulc(st, 0.7), true);
    cone(b, stone, 6, 11, 8, 7.5, 58, mulc(st, 0.75), st);
    cone(b, [0, team, 1], 6, 12, 58, 12, 65, GRAY, mulc(GRAY, 0.8), true);
    cone(b, [2, team, 1], 4, 0, 72, 9, 88, mulc(GRAY, 0.8), GRAY);
    cone(b, [2, team, 1], 4, 9, 88, 0, 104, GRAY, mulc(GRAY, 1.3));
    shadows.push([x, z, 70, 20]);
    glows.push([x, b[1] + 88, z, team, 70]);
  };
  const nexus = (x: number, z: number, team: number) => {
    const b: V3 = [x, hAt(x, z), z];
    const st: V3 = [0.36, 0.4, 0.5];
    cone(b, [0, 0, 0], 8, 38, 0, 34, 9, mulc(st, 0.6), st, true);
    cone(b, [0, team, 1], 8, 22, 9, 17, 18, mulc(GRAY, 0.5), mulc(GRAY, 0.75), true);
    cone(b, [2, team, 1], 4, 0, 30, 20, 62, mulc(GRAY, 0.8), GRAY);
    cone(b, [2, team, 1], 4, 20, 62, 0, 100, GRAY, mulc(GRAY, 1.35));
    shadows.push([x, z, 80, 40]);
    glows.push([x, b[1] + 64, z, team, 190]);
  };
  TOWERS.forEach(([x, z]) => {
    tower(x, z, 1);
    tower(SIZE - x, SIZE - z, 2);
  });
  nexus(NEXUS[0], NEXUS[1], 1);
  nexus(SIZE - NEXUS[0], SIZE - NEXUS[1], 2);

  // Partículas e brilhos (pontos somados à cena). Tipo: 0 vaga-lume, 1 brilho que pulsa, 2 sobe. Com time (1 azul,
  // 2 vermelho) a cor é multiplicada pela do time e o brilho nasce junto com as torres.
  const spr = (x: number, y: number, z: number, c: V3, size: number, kind: number, team = 0) => SV.push(x, y, z, c[0], c[1], c[2], size, rnd(), kind, team);
  for (let i = 0; i < 130; i++) {
    const x = 30 + rnd() * 940;
    const z = 30 + rnd() * 940;
    spr(x, hAt(x, z) + 18 + rnd() * 50, z, rnd() < 0.5 ? [1, 0.9, 0.45] : [0.55, 1, 0.65], 13 + rnd() * 9, 0);
  }
  quads((q, i) => {
    const c: V3 = i % 2 ? [1, 0.3, 0.22] : [0.25, 0.55, 1];
    const [bf, c1, c2] = q(CAMPS.map(([x, y]) => [x, y] as Point));
    spr(bf![0], 14, bf![1], mulc(c, 0.75), 130, 1);
    for (let k = 0; k < 7; k++) spr(bf![0] + (rnd() - 0.5) * 40, 4, bf![1] + (rnd() - 0.5) * 40, c, 13, 2);
    [c1!, c2!].forEach((p) => spr(p[0], 10, p[1], [0.3, 0.42, 0.2], 70, 1));
  });
  PITS.forEach(([x, z], i) => {
    const c: V3 = i ? [1, 0.5, 0.15] : [0.65, 0.3, 1];
    spr(x, 6, z, mulc(c, 0.8), 190, 1);
    for (let k = 0; k < 12; k++) spr(x + (rnd() - 0.5) * 60, -8, z + (rnd() - 0.5) * 60, c, 14, 2);
  });
  for (let i = 0; i < 46; i++) {
    const t = 0.16 + rnd() * 0.68;
    const d = 120 + 760 * t;
    spr(d + (rnd() - 0.5) * 50, -8, d + (rnd() - 0.5) * 50 + Math.sin(t * 6.28) * -12, [0.5, 0.85, 1], 9, 2);
  }
  glows.forEach(([x, y, z, team, size]) => spr(x, y, z, mulc(GRAY, 0.7), size, 1, team));
  return { mesh: new Float32Array(MV), sprites: new Float32Array(SV), shadows };
}

/** Malha do terreno + saia (a espessura do bloco). */
function terrain(hAt: RiftAssets['hAt']): Pick<Base, 'terrain' | 'index'> {
  const tv: number[] = [];
  const ti: number[] = [];
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * SIZE;
      const z = (j / N) * SIZE;
      tv.push(x, hAt(x, z), z, 0, 1, 0);
    }
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      const b = a + 1;
      const c = a + N + 1;
      ti.push(a, c, b, b, c, c + 1);
    }
  const edges: Array<[(t: number) => Point, number]> = [[(t) => [t, 0], 0.62], [(t) => [t, SIZE], 0.62], [(t) => [0, t], 1], [(t) => [SIZE, t], 1]];
  for (const [f, shade] of edges) {
    const base = tv.length / 6;
    for (let i = 0; i <= N; i++) {
      const [x, z] = f((i / N) * SIZE);
      tv.push(x, hAt(x, z), z, 1, shade, 0, x, -THICK, z, 1, shade, 1);
    }
    for (let i = 0; i < N; i++) {
      const a = base + i * 2;
      ti.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  return { terrain: new Float32Array(tv), index: new Uint16Array(ti) };
}

/** Luz do lado azul (normalizada); o vermelho inverte x e z: vem sempre de trás da base de quem olha. */
export const LIGHT: V3 = (() => {
  const l = Math.hypot(0.247, 0.75, 0.742);
  return [-0.247 / l, 0.75 / l, -0.742 / l];
})();

function bake({ H, HB, shadows }: Base, side: Side): Uint8Array {
  const sd = side === 'blue' ? 1 : -1;
  const out = new Uint8Array(S * S * 4);
  const lx = LIGHT[0] * sd;
  const lz = LIGHT[2] * sd;
  const hl = Math.hypot(lx, lz);
  const dx = lx / hl;
  const dz = lz / hl;
  const up = (LIGHT[1] / hl) * (SIZE / S);
  // Sombras de árvores e torres: traços na direção contrária à luz.
  const sc = mask();
  sc.strokeStyle = 'rgba(255,255,255,.75)';
  shadows.forEach(([x, z, len, w]) => {
    sc.lineWidth = w;
    path(sc, [[x, z], [x - dx * len, z - dz * len]]);
    sc.stroke();
  });
  const blob = chan(sc, 1.6);
  const u = SIZE / S;
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const k = j * S + i;
      const h0 = H[k]!;
      let sh = 1;
      for (let s = 1; s < 36; s++) {
        const x = (i + dx * s + 0.5) | 0;
        const z = (j + dz * s + 0.5) | 0;
        const ray = h0 + s * up;
        if (x < 0 || z < 0 || x >= S || z >= S || ray > 62) break;
        const o = H[z * S + x]! - ray;
        if (o > 0) {
          sh = Math.min(sh, 1 - o / 7);
          if (sh <= 0) {
            sh = 0;
            break;
          }
        }
      }
      const ao = 1 - Math.min(1, Math.max(0, (HB[k]! - h0) / 24)) * 0.45;
      const i0 = Math.max(i - 1, 0);
      const i1 = Math.min(i + 1, S - 1);
      const j0 = Math.max(j - 1, 0);
      const j1 = Math.min(j + 1, S - 1);
      let nx = -(H[j * S + i1]! - H[j * S + i0]!) / ((i1 - i0) * u);
      let nz = -(H[j1 * S + i]! - H[j0 * S + i]!) / ((j1 - j0) * u);
      const nl = Math.hypot(nx, 1, nz);
      nx /= nl;
      nz /= nl;
      out[k * 4] = (nx * 0.5 + 0.5) * 255;
      out[k * 4 + 1] = (nz * 0.5 + 0.5) * 255;
      out[k * 4 + 2] = (0.3 + 0.7 * sh) * ao * (1 - (blob[k]! / 255) * 0.6) * 255;
      out[k * 4 + 3] = Math.max(0, Math.min(255, h0 * 2 + 64));
    }
  return out;
}

/** Espera um intervalo ocioso (com teto, para a montagem não ficar parada atrás de animações). */
const idle = () => new Promise<void>((done) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => done(), { timeout: 80 }) : setTimeout(done, 0)));

async function build(): Promise<Base> {
  await idle();
  const { H, HB } = heights();
  await idle();
  roughen(H, HB);
  // Altura do terreno num ponto do mapa (bilinear).
  const hAt = (x: number, z: number) => {
    const fx = Math.min(S - 1.001, Math.max(0, (x * S) / SIZE - 0.5));
    const fz = Math.min(S - 1.001, Math.max(0, (z * S) / SIZE - 0.5));
    const i = fx | 0;
    const j = fz | 0;
    const a = fx - i;
    const b = fz - j;
    const k = j * S + i;
    return (H[k]! * (1 - a) + H[k + 1]! * a) * (1 - b) + (H[k + S]! * (1 - a) + H[k + S + 1]! * a) * b;
  };
  await idle();
  const m = masks();
  await idle();
  const alb = albedo();
  await idle();
  const obj = objects(hAt);
  await idle();
  return { H, HB, hAt, ...m, albedo: alb, ...obj, ...terrain(hAt) };
}

let base: Promise<Base> | null = null;
const lights = new Map<Side, Uint8Array>();
/**
 * Peças do mapa para o lado: montadas na primeira vez e guardadas pela sessão (a luz, uma por lado). Abrir o mapa de
 * novo, ou o mergulho ao travar, não refaz nada.
 */
export async function loadRift(side: Side): Promise<RiftAssets> {
  base ??= build();
  let b: Base;
  try {
    b = await base;
  } catch (e) {
    base = null;
    throw e;
  }
  let light = lights.get(side);
  if (!light) {
    await idle();
    light = lights.get(side) ?? bake(b, side);
    lights.set(side, light);
  }
  return { ...b, light };
}
