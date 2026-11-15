/**
 * Arena da seleção em WebGL 1: desenha as peças de `arena.ts` (2 chamadas de desenho por quadro: uma malha facetada
 * com luz por vértice no shader e um lote de pontos somados; nenhuma textura) e põe os marcadores dos jogadores, que
 * são HTML por cima do canvas, no pedestal do time de cada um com a mesma matriz da câmera.
 *
 * Entrada: a câmera chega girando de cima, as peças sobem do centro para fora, os times caem nos pedestais em volta
 * e o meu por último, no centro. Depois a câmera segue numa órbita lenta. Mergulho (travei): desce girando ao centro.
 */
import { arenaAssets, arenaPinTimes, arenaSpots, ARENA_BOUNDS, ARENA_ELEV, ARENA_MESH_STRIDE, ARENA_SPRITE_STRIDE, ARENA_TARGET, ARENA_YAW, MAX_TEAMS, pedestalRadius, type ArenaAssets } from './arena';
import { clamp01, fitBox, orbit, outCubic, smooth, toScreen, type Area, type Fit, type Vec3 } from './camera';
import { attribs, buffer, program, themeColors, type GL, type Program, type Rgb } from './gl';
import { DIVE_S } from './riftScene';
import { createStage, type Frame } from './stage';

const COMMON = `
precision highp float;
uniform float uTime, uIn, uAmb; uniform vec3 uCols[${MAX_TEAMS}];
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
// Entrada com um pouco de passagem do ponto (0 -> 1).
float back(float c){ float g = c-1.; return 1. + 2.2*g*g*g + 1.2*g*g; }
`;
// As peças sobem do fundo com atraso (aPar.x); tipo 3 = pano da bandeira, que balança e pega a cor do time.
const MESH_VS = `${COMMON}
attribute vec3 aPos, aNor, aCol; attribute vec4 aPar; uniform mat4 uPV; uniform vec2 uShift;
varying vec3 vW, vN, vC; varying float vK, vA;
void main(){
  float k = clamp((uIn-aPar.x)/.3, 0., 1.); vec3 p = aPos; vC = aCol;
  if (aPar.y > 2.5 && aPar.y < 3.5) { p.xz += normalize(aPar.zw)*sin(uTime*2.4+aPar.z*.05+p.y*.07)*5.; vC = uCols[int(aCol.x+.5)]*aCol.y; }
  p.y -= (1.-back(k))*260.;
  vW = p; vN = aNor; vK = aPar.y; vA = k;
  gl_Position = uPV*vec4(p, 1.); gl_Position.xy += uShift*gl_Position.w; }`;
const MESH_FS = `${COMMON}
uniform vec3 uL; uniform vec4 uSpots[${MAX_TEAMS}];
varying vec3 vW, vN, vC; varying float vK, vA;
void main(){
  vec3 n = normalize(vN), alb = vC, col; float diff = max(dot(n, uL), 0.), det = noise(vW.xz*.08), r = length(vW.xz), ang = atan(vW.z, vW.x);
  if (vK > 2.5 && vK < 3.5) col = vC*(.6+.55*diff);                                                        // bandeiras
  else {
    alb *= .82 + .36*det;
    if (vK > .5 && vK < 1.5) {                                                                            // areia: anéis e raios dourados
      float rings = smoothstep(3., 0., abs(r-140.)) + smoothstep(3., 0., abs(r-235.)) + smoothstep(3., 0., abs(r-372.)) + smoothstep(5., 0., abs(r-418.));
      float rays = smoothstep(2.6, 0., abs(fract(ang/6.2832*16. + .5) - .5)*r*.3927)*step(140., r)*step(r, 418.);
      alb *= 1. - .22*smoothstep(.4, .62, noise(vW.xz*.02));
      alb = mix(alb, vec3(.9,.72,.42), clamp(rings + rays*.6, 0., 1.)*.6);
    } else if (vK > 3.5) alb *= .78 + .22*step(.5, fract(r/13.));                                          // fileiras da arquibancada
    else if (abs(r-432.) < 4. && vW.y < 44.) alb = mix(alb, vec3(.03,.02,.06), smoothstep(.075, .055, abs(fract(ang/6.2832*8.) - .5))); // portões no muro
    col = alb*(vec3(.3,.26,.46) + vec3(1.12,.98,.84)*diff);
    if (vK < 1.5 && n.y > .9 && r < 440.) {
      float da = sin(ang - uTime*.3); col += col*exp(-da*da*42.)*.75*smoothstep(70., 210., r)*uAmb;          // holofotes varrendo o piso
      for (int i = 0; i < ${MAX_TEAMS}; i++) { vec4 s = uSpots[i]; float age = uTime-s.z; if (s.z < 0. || age < 0.) continue; // anéis embaixo dos times, na cor de cada um
        float d = distance(vW.xz, s.xy), R = s.w;
        float ring = smoothstep(4., 0., abs(d-R))*.9 + smoothstep(R, 0., d)*.26;
        float shock = smoothstep(8., 0., abs(d-age*260.))*max(1.-age/.7, 0.)*1.4;
        float k = fract(age*.55), pulse = R > 60. ? smoothstep(5., 0., abs(d-R-k*60.))*(1.-k) : 0.;
        col += uCols[i]*(ring+shock+pulse); }
    }
  }
  col = mix(col, vec3(.05,.03,.1), smoothstep(-60., -420., vW.y)*.9);                                      // a rocha escurece para baixo...
  float a = vA*(1. - smoothstep(-380., -530., vW.y));                                                      // ...e some no vazio
  gl_FragColor = vec4(col*a, a);
}`;
const SPRITE_VS = `${COMMON}
attribute vec3 aPos, aCol; attribute vec4 aP; uniform mat4 uPV; uniform vec2 uShift; uniform float uPx;
varying vec4 vC;
void main(){ vec3 p = aPos; float a = 1., born = clamp((uIn-aP.w-.25)/.2, 0., 1.);
  if (aP.z < .5) { p += vec3(sin(uTime*.2+aP.y*9.)*40., sin(uTime*.33+aP.y*5.)*20., cos(uTime*.17+aP.y*7.)*40.); a = (.2 + .6*pow(.5+.5*sin(uTime*1.3+aP.y*40.), 2.))*uAmb; }
  else if (aP.z < 1.5) a = (.7 + .3*sin(uTime*2.+aP.y*6.28))*born;
  else if (aP.z < 2.5) { float k = fract(uTime*.5+aP.y); p.y += k*60.; p.x += sin(uTime*2.+aP.y*20.)*4.; a = sin(k*3.1416)*born; }
  else { p.y += abs(sin(uTime*(2.+aP.y*2.)+aP.y*40.))*5.; a = (.3 + .7*pow(.5+.5*sin(uTime*(1.5+aP.y*3.)+aP.y*50.), 3.))*born; }
  gl_Position = uPV*vec4(p, 1.); gl_Position.xy += uShift*gl_Position.w;
  gl_PointSize = clamp(aP.x*uPx/gl_Position.w, 1., 256.); vC = vec4(aCol, a); }`;
const SPRITE_FS = `precision mediump float; varying vec4 vC;
void main(){ float f = max(1.-length(gl_PointCoord-.5)*2., 0.); gl_FragColor = vec4(vC.rgb*f*f*vC.a, 0.); }`;

const FOV = 0.46;
const LIGHT = (() => {
  const l = Math.hypot(0.4, 0.85, 0.35);
  return [-0.4 / l, 0.85 / l, 0.35 / l];
})();

/** Cores reserva dos times (as do CSS, `--cs-t0`..`--cs-t7`), na ordem dos subtimes do client. */
export const TEAM_COLORS: Rgb[] = [
  [0.89, 0.74, 0.42],
  [0.71, 0.76, 0.85],
  [0.31, 0.82, 0.88],
  [0.88, 0.6, 0.35],
  [0.77, 0.55, 1],
  [1, 0.48, 0.54],
  [0.44, 0.66, 1],
  [0.35, 0.84, 0.63],
];

/** Distância e deslocamento da câmera parada para a arena inteira caber na área livre. */
export const fitArena = (w: number, h: number, area: Area): Fit => fitBox((d) => orbit(ARENA_YAW, ARENA_ELEV, d, w / h, FOV, ARENA_TARGET), ARENA_BOUNDS, w, h, area, 300, 12000);

export interface ArenaPin {
  el: HTMLElement;
  /** Posição do time na lista de times (a mesma de `arenaSpots`). */
  team: number;
  /** Lugar do jogador no pedestal (0..`of`-1): os marcadores de um time ficam lado a lado na tela. */
  slot: number;
  of: number;
  me: boolean;
}
export interface ArenaState {
  /** Quantos times há e qual é o meu (posição na lista; -1 se não estou em nenhum). */
  teams: number;
  mine: number;
  /** Cor de cada time: índice em `--cs-t0`..`--cs-t7`. */
  colors: number[];
  pins: ArenaPin[];
  diving: boolean;
}
export interface ArenaOptions {
  /** Toca a entrada; sem ela a cena já aparece pronta (reaberta na mesma seleção, mergulho). */
  intro: boolean;
  /** Área livre da tela (px do canvas) onde a cena tem de caber. */
  area(w: number, h: number): Area;
  /** Não deu para montar a cena depois de criada (shaders): quem chama troca pela arte do mapa. */
  onFail(): void;
}
export interface ArenaHandle {
  update(state: ArenaState): void;
  dispose(): void;
}

/**
 * Monta a cena no canvas. `host` é o elemento que recebe `data-ready` no primeiro quadro (o CSS mostra o canvas a
 * partir daí) e de onde saem as cores dos times. Devolve `null` sem WebGL.
 */
export function mountArena(canvas: HTMLCanvasElement, host: HTMLElement, initial: ArenaState, opts: ArenaOptions): ArenaHandle | null {
  let st = initial;
  let gl: GL | null = null;
  let res: { mesh: Program; sprite: Program; mv: WebGLBuffer; sv: WebGLBuffer; key: string } | null = null;
  let assets: ArenaAssets | null = null;
  let fit: Fit | null = null;
  let fitKey = '';
  let steps: number[] | null = null;
  let t0 = -1;
  let diveT = -1;
  let diveAsked = false;
  let disposed = false;
  const shownEls = new WeakSet<HTMLElement>();
  /** Quando o anel de cada time acende (relógio da cena); 0 = já estava lá. */
  const lit: number[] = [];
  const palette = Object.values(themeColors(host, Object.fromEntries(TEAM_COLORS.map((c, i) => [i, [`--cs-t${i}`, c] as const])) as Record<string, readonly [string, Rgb]>));

  const build = () => {
    const key = `${st.teams}:${st.mine}`;
    if (!gl || res?.key === key) return;
    assets = arenaAssets(st.teams, st.mine);
    res = { mesh: res?.mesh ?? program(gl, MESH_VS, MESH_FS), sprite: res?.sprite ?? program(gl, SPRITE_VS, SPRITE_FS), mv: buffer(gl, gl.ARRAY_BUFFER, assets.mesh), sv: buffer(gl, gl.ARRAY_BUFFER, assets.sprites), key };
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE);
  };

  /** Passo entre os marcadores de um mesmo time, em px: a largura do maior deles (medida só quando o estado muda). */
  const measure = () => {
    const out: number[] = [];
    for (const p of st.pins) out[p.team] = Math.max(out[p.team] ?? 0, ((p.el.firstElementChild as HTMLElement | null)?.offsetWidth || 36) + 4);
    return out;
  };

  const draw = ({ t: now, w, h, still }: Frame) => {
    if (!gl) return;
    try {
      build();
    } catch {
      return fail();
    }
    if (!res || !assets) return;
    const key = `${w}x${h}`;
    if (!fit || fitKey !== key) {
      fitKey = key;
      fit = fitArena(w, h, opts.area(w, h));
    }
    steps ??= measure();
    if (t0 < 0) t0 = opts.intro ? now : now - 99;
    // Mergulho: a entrada já tem de estar completa (a cena pode ter acabado de abrir).
    if (diveAsked && diveT < 0) {
      diveT = now;
      t0 = Math.min(t0, now - 8);
    }
    // Parado (movimento reduzido): o quadro final, sem entrada, órbita nem mergulho.
    const t = still ? 100 : now;
    const e = still ? 99 : now - t0; // segundos desde o começo da entrada
    // Câmera: chega girando de cima e de longe; depois segue numa órbita lenta em volta da arena.
    const k = outCubic(e / 3.2);
    let yaw = ARENA_YAW + (still ? 0 : t * 0.03) + (1 - k) * 1.3;
    let elev = ARENA_ELEV + (1 - k) * 0.5;
    let d = fit.dist * (1 + (1 - k) * 0.9);
    let target: Vec3 = ARENA_TARGET;
    let shift = fit.shift;
    const far = d * 4;
    // Mergulho: a câmera desce girando até o centro, onde está o meu time.
    const dv = diveT < 0 || still ? 0 : smooth((now - diveT) / DIVE_S);
    if (dv > 0) {
      target = [0, ARENA_TARGET[1] * (1 - dv) + 12 * dv, 0];
      yaw += dv * 0.7;
      elev += (0.46 - elev) * dv;
      d *= Math.pow(620 / d, dv);
      shift = [shift[0] * (1 - dv), shift[1] * (1 - dv)];
    }
    const pv = orbit(yaw, elev, d, w / h, FOV, target, far);

    // Marcadores: cada time cai na hora marcada; os jogadores do time ficam lado a lado em cima do pedestal.
    const points = arenaSpots(st.teams, st.mine);
    const times = arenaPinTimes(st.teams, st.mine);
    for (const pin of st.pins) {
      const at = times[pin.team] ?? 0;
      const [x, z] = points[pin.team] ?? [0, 0];
      if (e >= at) {
        if (!shownEls.has(pin.el)) {
          shownEls.add(pin.el);
          pin.el.dataset.on = e - at < 1 ? 'drop' : 'now';
        }
        lit[pin.team] ??= still || e - at >= 1 ? 0 : t0 + at + 0.3;
      }
      const [px, py] = toScreen(pv, shift, w, h, x, 9, z);
      const dx = (pin.slot - (pin.of - 1) / 2) * (steps[pin.team] ?? 40);
      pin.el.style.transform = `translate3d(${Math.round(px + dx)}px,${Math.round(py)}px,0)`;
      pin.el.style.zIndex = String(pin.me ? 9999 : Math.max(0, Math.round(py)));
    }
    // ponytail: o shader tem `MAX_TEAMS` anéis; com mais times que isso os últimos ficam sem anel de luz.
    const spots: number[] = [];
    const cols: number[] = [];
    const ring = pedestalRadius(st.teams - (st.mine >= 0 ? 1 : 0)) * 0.62;
    for (let i = 0; i < MAX_TEAMS; i++) {
      const [x, z] = points[i] ?? [0, 0];
      spots.push(x, z, i < st.teams ? (lit[i] ?? -1) : -1, i === st.mine ? 70 : ring);
      cols.push(...(palette[(st.colors[i] ?? i) % palette.length] ?? TEAM_COLORS[0]!));
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const common = (p: Program) => {
      gl!.useProgram(p.program);
      const u = p.u;
      gl!.uniformMatrix4fv(u.uPV!, false, pv);
      gl!.uniform2f(u.uShift!, shift[0], shift[1]);
      gl!.uniform1f(u.uTime!, t);
      gl!.uniform1f(u.uIn!, clamp01((e - 0.2) / 2.3) * 1.25); // a arena se monta
      gl!.uniform1f(u.uAmb!, smooth((e - 1.6) / 1.2)); // holofotes e poeira acendem
      gl!.uniform3fv(u.uCols!, cols);
      return u;
    };
    let u = common(res.mesh);
    gl.uniform3fv(u.uL!, LIGHT);
    gl.uniform4fv(u.uSpots!, spots);
    attribs(gl, res.mesh, res.mv, [['aPos', 3], ['aNor', 3], ['aCol', 3], ['aPar', 4]]);
    gl.drawArrays(gl.TRIANGLES, 0, assets.mesh.length / ARENA_MESH_STRIDE);
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);

    u = common(res.sprite);
    gl.uniform1f(u.uPx!, canvas.height / 2 / Math.tan(FOV / 2));
    attribs(gl, res.sprite, res.sv, [['aPos', 3], ['aCol', 3], ['aP', 4]]);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, assets.sprites.length / ARENA_SPRITE_STRIDE);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    // Atributos que só um programa usa não podem ficar ligados para o próximo.
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
    host.dataset.ready = '';
  };

  const stage = createStage(canvas, {
    init(context) {
      gl = context;
      res = null;
    },
    draw,
  });
  if (!stage) return null;

  const fail = () => {
    if (disposed) return;
    handle.dispose();
    opts.onFail();
  };
  const handle: ArenaHandle = {
    update(next) {
      diveAsked = next.diving;
      if (!next.diving) diveT = -1;
      st = next;
      steps = null;
      stage.invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stage.dispose();
    },
  };
  handle.update(initial);
  return handle;
}
