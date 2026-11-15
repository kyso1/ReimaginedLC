/**
 * Matemática da câmera das cenas da seleção (sem WebGL, sem DOM): matrizes 4x4 em coluna, como o WebGL espera.
 * As cenas (Rift e, depois, Abismo Uivante e Arena) usam a mesma câmera em órbita e a mesma projeção para pôr os
 * marcadores em HTML em cima do ponto certo do chão.
 */
export type Mat4 = Float32Array | number[];
export type Vec3 = [number, number, number];

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const outCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);
export const smooth = (x: number): number => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};

/** Projeção em perspectiva (campo de visão vertical em radianos). */
export function persp(fov: number, aspect: number, near: number, far: number): number[] {
  const t = 1 / Math.tan(fov / 2);
  return [t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
}

/** Câmera em `e` olhando para `c`, com o eixo y para cima. */
export function look(e: Vec3, c: Vec3): number[] {
  let fx = c[0] - e[0];
  let fy = c[1] - e[1];
  let fz = c[2] - e[2];
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let sx = -fz;
  let sz = fx;
  const sl = Math.hypot(sx, sz);
  sx /= sl;
  sz /= sl;
  const ux = -sz * fy;
  const uy = sz * fx - sx * fz;
  const uz = sx * fy;
  return [sx, ux, -fx, 0, 0, uy, -fy, 0, sz, uz, -fz, 0, -(sx * e[0] + sz * e[2]), -(ux * e[0] + uy * e[1] + uz * e[2]), fx * e[0] + fy * e[1] + fz * e[2], 1];
}

export function mul(a: Mat4, b: Mat4): Float32Array {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r]! * b[c * 4]! + a[4 + r]! * b[c * 4 + 1]! + a[8 + r]! * b[c * 4 + 2]! + a[12 + r]! * b[c * 4 + 3]!;
  return o;
}

/** Matriz (projeção × vista) da câmera em órbita em volta de `target`: ângulo no chão, elevação e distância. */
export function orbit(yaw: number, elev: number, dist: number, aspect: number, fov: number, target: Vec3, far = dist * 4): Float32Array {
  const eye: Vec3 = [target[0] + dist * Math.cos(elev) * Math.cos(yaw), target[1] + dist * Math.sin(elev), target[2] + dist * Math.cos(elev) * Math.sin(yaw)];
  return mul(persp(fov, aspect, 60, far), look(eye, target));
}

/** Ponto do mundo em coordenadas da tela normalizadas (-1..1, y para cima). */
export function ndc(m: Mat4, x: number, y: number, z: number): [number, number] {
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  return [(m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w, (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w];
}

/** Ponto do mundo em pixels da tela (origem em cima à esquerda). `shift` é o deslocamento em NDC aplicado à cena. */
export function toScreen(m: Mat4, shift: readonly [number, number], w: number, h: number, x: number, y: number, z: number): [number, number] {
  const q = ndc(m, x, y, z);
  return [((q[0] + shift[0] + 1) / 2) * w, ((1 - (q[1] + shift[1])) / 2) * h];
}

export interface Fit {
  dist: number;
  shift: [number, number];
}
/** Área livre da tela em pixels: x0, y0, x1, y1. */
export type Area = readonly [number, number, number, number];
/**
 * Distância da câmera em que todos os `points` cabem na área livre da tela e o deslocamento (em NDC) que centra a
 * cena nessa área. `cam(dist)` devolve a matriz da câmera naquela distância.
 */
export function fitBox(cam: (dist: number) => Mat4, points: Vec3[], w: number, h: number, area: Area, lo = 700, hi = 9000): Fit {
  const [x0, y0, x1, y1] = area;
  const bounds = (d: number) => {
    const m = cam(d);
    let a = 9;
    let b = -9;
    let c = 9;
    let e = -9;
    for (const p of points) {
      const q = ndc(m, p[0], p[1], p[2]);
      a = Math.min(a, q[0]);
      b = Math.max(b, q[0]);
      c = Math.min(c, q[1]);
      e = Math.max(e, q[1]);
    }
    return [a, b, c, e] as const;
  };
  for (let i = 0; i < 24; i++) {
    const d = (lo + hi) / 2;
    const b = bounds(d);
    if (((b[1] - b[0]) * w) / 2 > x1 - x0 || ((b[3] - b[2]) * h) / 2 > y1 - y0) lo = d;
    else hi = d;
  }
  const b = bounds(hi);
  return { dist: hi, shift: [(x0 + x1) / w - 1 - (b[0] + b[1]) / 2, 1 - (y0 + y1) / h - (b[2] + b[3]) / 2] };
}

export interface Box {
  /** Ponto do chão na tela: o marcador fica em cima dele, centrado. */
  x: number;
  y: number;
  w: number;
  h: number;
}
/**
 * Quanto cada marcador sobe (px) para não cobrir outro: de baixo para cima na tela, quem bate num já colocado sobe
 * até ficar acima dele (a haste do marcador estica). Os de baixo, mais perto da câmera, ficam no lugar.
 */
export function pinLifts(boxes: Box[], gap = 4): number[] {
  const lift = boxes.map(() => 0);
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[b]!.y - boxes[a]!.y || a - b);
  const placed: number[] = [];
  for (const i of order) {
    const me = boxes[i]!;
    for (let n = 0; n < boxes.length; n++) {
      const hit = placed.find((j) => {
        const o = boxes[j]!;
        const bottom = me.y - lift[i]!;
        const oBottom = o.y - lift[j]!;
        return Math.abs(me.x - o.x) < (me.w + o.w) / 2 && bottom > oBottom - o.h - gap && bottom - me.h < oBottom + gap;
      });
      if (hit === undefined) break;
      lift[i] = me.y - (boxes[hit]!.y - lift[hit]! - boxes[hit]!.h - gap);
    }
    placed.push(i);
  }
  return lift;
}
