/**
 * Howling Abyss da seleção do ARAM em WebGL 1: desenha as peças de `abyss.ts` (2 chamadas de desenho por quadro: uma
 * malha facetada com luz por vértice no shader e um lote de pontos somados; nenhuma textura) e põe os marcadores dos
 * aliados, que são HTML por cima do canvas, no ponto da ponte de cada um com a mesma matriz da câmera.
 *
 * Entrada: a câmera chega girando, a ponte se monta laje a laje da minha base até a inimiga, as agulhas de gelo sobem
 * do abismo, a névoa de guerra recua até o meio, a neve acende e os aliados caem na ponte (eu por último). Depois a
 * câmera deriva devagar. Mergulho (campeão confirmado): a câmera desce girando até o meu ponto.
 */
import { abyssAssets, abyssPinTimes, ABYSS_BOUNDS, ABYSS_ELEV, ABYSS_MESH_STRIDE, ABYSS_SPRITE_STRIDE, ABYSS_TARGET, ABYSS_YAW, type AbyssAssets } from './abyss';
import { clamp01, fitBox, orbit, outCubic, pinLifts, smooth, toScreen, type Area, type Fit, type Vec3 } from './camera';
import { attribs, buffer, program, themeColors, type GL, type Program } from './gl';
import type { Point, Side } from './rift';
import { DIVE_S } from './riftScene';
import { createStage, type Frame } from './stage';

const COMMON = `
precision highp float;
uniform float uTime, uIn, uAmb; uniform vec3 uMine, uFoe;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
// Entrada com um pouco de passagem do ponto (0 -> 1).
float back(float c){ float g = c-1.; return 1. + 2.2*g*g*g + 1.2*g*g; }
`;
// As peças sobem do fundo com atraso (aPar.x); tipo 2 = cristal que gira e flutua; tipo 1 = piso.
const MESH_VS = `${COMMON}
attribute vec3 aPos, aNor, aCol; attribute vec4 aPar; attribute vec2 aT; uniform mat4 uPV; uniform vec2 uShift;
varying vec3 vW, vN, vC; varying float vK, vA;
void main(){
  float k = clamp((uIn-aPar.x)/.3, 0., 1.); vec3 p = aPos, n = aNor;
  if (aPar.y > 1.5) { float a = uTime*.9 + aPar.z*.02, c = cos(a), s = sin(a);
    p.xz = aPar.zw + mat2(c,s,-s,c)*(p.xz-aPar.zw); n.xz = mat2(c,s,-s,c)*n.xz; p.y += sin(uTime*1.7+aPar.w*.03)*3.; }
  p.y -= (1.-back(k))*260.;
  vW = p; vN = n; vK = aPar.y; vA = k;
  vC = aCol + (aT.x > 1.5 ? uFoe : uMine)*aT.y*step(.5, aT.x);
  gl_Position = uPV*vec4(p, 1.); gl_Position.xy += uShift*gl_Position.w; }`;
const MESH_FS = `${COMMON}
uniform vec3 uL, uHi; uniform vec4 uSpots[5]; uniform float uFog;
varying vec3 vW, vN, vC; varying float vK, vA;
void main(){
  vec3 n = normalize(vN), alb = vC, col; float diff = max(dot(n, uL), 0.), det = noise(vW.xz*.09);
  // Névoa de guerra: cobre a metade inimiga, com borda de nuvem que se mexe.
  float fog = smoothstep(uFog, uFog+320., vW.x + (noise(vW.xz*.006 + vec2(uTime*.03, -uTime*.02))-.5)*260.);
  if (vK > 1.5) { col = vC*(.8+.9*diff) + vec3(.3)*pow(diff, 6.); fog *= .45; }
  else {
    alb *= .8 + .4*det;
    float edge = 0.;
    if (vK > .5) {                                                                      // piso: lajes e anéis das bases
      vec2 g = abs(fract(vec2(vW.x/55., vW.z/40. + floor(vW.x/55.)*.5)) - .5);
      alb *= 1. - smoothstep(.44, .5, max(g.x, g.y))*.4;
      float bd = min(distance(vW.xz, vec2(-900., 0.)), distance(vW.xz, vec2(900., 0.)));
      alb += (vW.x < 0. ? uMine : uFoe)*(smoothstep(4., 0., abs(bd-205.)) + smoothstep(4., 0., abs(bd-125.)))*.55*step(bd, 232.);
      edge = smoothstep(36., 80., abs(vW.z))*.45*step(abs(vW.x), 670.) - .26;
    }
    float snow = smoothstep(.5, .85, n.y)*smoothstep(.4, .68, noise(vW.xz*.03 + 7.) + (vK > .5 ? edge : .14)); // neve no que olha para cima
    alb = mix(alb, vec3(.86,.93,1.), snow*.85);
    col = alb*(vec3(.26,.34,.52) + vec3(1.2,1.1,1.)*diff);
    if (vK > .5) for (int i = 0; i < 5; i++) { vec4 s = uSpots[i]; float age = uTime-s.z; if (s.z < 0. || age < 0.) continue;   // anéis embaixo dos aliados
      float d = distance(vW.xz, s.xy); vec3 c = s.w > .5 ? mix(uHi, vec3(1.), .55) : uMine;
      float ring = smoothstep(4., 0., abs(d-24.))*.9 + smoothstep(24., 0., d)*.3;
      float shock = smoothstep(8., 0., abs(d-age*260.))*max(1.-age/.7, 0.)*1.6;
      float k = fract(age*.55), pulse = s.w > .5 ? smoothstep(5., 0., abs(d-24.-k*64.))*(1.-k) : 0.;
      col += c*(ring+shock+pulse); }
  }
  float g = dot(col, vec3(.3,.59,.11));
  col = mix(col, mix(vec3(g), col, .3)*.42 + vec3(.03,.05,.09), fog*.9);
  col = mix(col, vec3(.03,.07,.14), smoothstep(-30., -430., vW.y)*.9);                    // o abismo escurece para baixo...
  float a = vA*(1. - smoothstep(-400., -560., vW.y));                                     // ...e some no fundo da tela
  gl_FragColor = vec4(col*a, a);
}`;
const SPRITE_VS = `${COMMON}
attribute vec3 aPos, aCol; attribute vec4 aP; attribute float aT; uniform mat4 uPV; uniform vec2 uShift; uniform float uPx;
varying vec4 vC;
void main(){ vec3 p = aPos; float a = 1.;
  if (aP.z < .5) { float f = fract(aP.y + uTime*(.06+aP.y*.05)); p.y = 420. - f*760.; p.x += f*520. - 260. + sin(uTime*.8+aP.y*40.)*18.; p.z -= f*160.; a = sin(f*3.1416)*.85*uAmb; }
  else if (aP.z < 1.5) a = (.72 + .28*sin(uTime*1.6+aP.y*6.28))*clamp((uIn-aP.w-.25)/.2, 0., 1.);
  else if (aP.z < 2.5) { float k = fract(uTime*.13+aP.y); p.y += k*70.; p.x += sin(uTime+aP.y*20.)*5.; a = sin(k*3.1416)*uAmb; }
  else { p.x += sin(uTime*.11+aP.y*6.)*140.; p.z += cos(uTime*.09+aP.y*9.)*60.; a = (.16 + .06*sin(uTime*.5+aP.y*20.))*uAmb; }
  gl_Position = uPV*vec4(p, 1.); gl_Position.xy += uShift*gl_Position.w;
  gl_PointSize = clamp(aP.x*uPx/gl_Position.w, 1., 256.);
  vC = vec4(aT > .5 ? aCol*(aT > 1.5 ? uFoe : uMine) : aCol, a); }`;
const SPRITE_FS = `precision mediump float; varying vec4 vC;
void main(){ float f = max(1.-length(gl_PointCoord-.5)*2., 0.); gl_FragColor = vec4(vC.rgb*f*f*vC.a, 0.); }`;

const FOV = 0.46;
const LIGHT = (() => {
  const l = Math.hypot(0.5, 0.8, 0.42);
  return [-0.5 / l, 0.8 / l, 0.42 / l];
})();

/** Distância e deslocamento da câmera parada para a ponte e as duas bases caberem na área livre. */
export const fitAbyss = (w: number, h: number, area: Area): Fit => fitBox((d) => orbit(ABYSS_YAW, ABYSS_ELEV, d, w / h, FOV, ABYSS_TARGET), ABYSS_BOUNDS, w, h, area, 300, 12000);

export interface AbyssPin {
  el: HTMLElement;
  /** Ponto da ponte (x ao longo dela, z atravessado). */
  spot: Point;
  me: boolean;
}
export interface AbyssState {
  /** Só troca as cores: a minha base é sempre a de cá. */
  side: Side;
  pins: AbyssPin[];
  diving: boolean;
}
export interface AbyssOptions {
  /** Toca a entrada; sem ela a cena já aparece pronta (reaberta na mesma seleção, mergulho). */
  intro: boolean;
  /** Área livre da tela (px do canvas) onde a cena tem de caber. */
  area(w: number, h: number): Area;
  /** Não deu para montar a cena depois de criada (shaders): quem chama troca pela arte do mapa. */
  onFail(): void;
}
export interface AbyssHandle {
  update(state: AbyssState): void;
  dispose(): void;
}

/**
 * Monta a cena no canvas. `host` é o elemento que recebe `data-ready` no primeiro quadro (o CSS mostra o canvas a
 * partir daí) e de onde saem as cores do tema. Devolve `null` sem WebGL.
 */
export function mountAbyss(canvas: HTMLCanvasElement, host: HTMLElement, initial: AbyssState, opts: AbyssOptions): AbyssHandle | null {
  let st = initial;
  let gl: GL | null = null;
  let res: { mesh: Program; sprite: Program; mv: WebGLBuffer; sv: WebGLBuffer } | null = null;
  let assets: AbyssAssets | null = null;
  let fit: Fit | null = null;
  let fitKey = '';
  let laid = '';
  let t0 = -1;
  let diveT = -1;
  let diveAsked = false;
  let disposed = false;
  const landed = new WeakMap<HTMLElement, number>();
  const colors = themeColors(host, {
    blue: ['--rlc-color-playing', [0.36, 0.63, 1]],
    red: ['--rlc-color-dangerText', [0.95, 0.42, 0.48]],
    hi: ['--rlc-color-highlight', [1, 0.84, 0.5]],
  });

  const build = () => {
    if (!gl || res) return;
    assets ??= abyssAssets();
    res = { mesh: program(gl, MESH_VS, MESH_FS), sprite: program(gl, SPRITE_VS, SPRITE_FS), mv: buffer(gl, gl.ARRAY_BUFFER, assets.mesh), sv: buffer(gl, gl.ARRAY_BUFFER, assets.sprites) };
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE);
  };

  /** Marcadores que se cobririam sobem: calculado com a câmera parada, para não tremer com a deriva. */
  const layout = (w: number, h: number) => {
    const key = `${w}x${h}|${st.pins.map((p) => p.spot.join()).join('|')}`;
    if (!fit || key === laid) return;
    laid = key;
    const pv = orbit(ABYSS_YAW, ABYSS_ELEV, fit.dist, w / h, FOV, ABYSS_TARGET);
    const boxes = st.pins.map((p) => {
      const [x, y] = toScreen(pv, fit!.shift, w, h, p.spot[0], 0, p.spot[1]);
      const inner = p.el.firstElementChild as HTMLElement | null;
      return { x, y, w: inner?.offsetWidth || 110, h: inner?.offsetHeight || 96 };
    });
    pinLifts(boxes).forEach((lift, i) => st.pins[i]!.el.style.setProperty('--lift', `${Math.round(lift)}px`));
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
      fit = fitAbyss(w, h, opts.area(w, h));
    }
    layout(w, h);
    if (t0 < 0) t0 = opts.intro ? now : now - 99;
    // Mergulho: a entrada já tem de estar completa (a cena pode ter acabado de abrir).
    if (diveAsked && diveT < 0) {
      diveT = now;
      t0 = Math.min(t0, now - 8);
    }
    // Parado (movimento reduzido): o quadro final, sem entrada, deriva nem mergulho.
    const t = still ? 100 : now;
    const e = still ? 99 : now - t0; // segundos desde o começo da entrada
    // Câmera: chega girando de cima e de longe; depois deriva devagar.
    const k = outCubic(e / 3);
    const drift = still ? 0 : 1;
    let yaw = ABYSS_YAW + (1 - k) * 0.9 + drift * Math.sin(t * 0.21) * 0.035;
    let elev = ABYSS_ELEV + (1 - k) * 0.45 + drift * Math.sin(t * 0.17) * 0.012;
    let d = fit.dist * (1 + (1 - k) * 0.8);
    let target: Vec3 = ABYSS_TARGET;
    let shift = fit.shift;
    const far = d * 4;
    // Mergulho: a câmera desce girando até o meu lugar na ponte, que vai para o centro da tela.
    const dv = diveT < 0 || still ? 0 : smooth((now - diveT) / DIVE_S);
    if (dv > 0) {
      const [mx, mz] = st.pins.find((p) => p.me)?.spot ?? [-235, 14];
      target = [mx * dv, ABYSS_TARGET[1] * (1 - dv), mz * dv];
      yaw += dv * 0.5;
      elev += (0.42 - elev) * dv;
      d *= Math.pow(300 / d, dv);
      shift = [shift[0] * (1 - dv), shift[1] * (1 - dv)];
    }
    const pv = orbit(yaw, elev, d, w / h, FOV, target, far);

    // Marcadores: caem na hora marcada e seguem o ponto do chão.
    const times = abyssPinTimes(st.pins.length, st.pins.findIndex((p) => p.me));
    const spots: number[] = [];
    st.pins.forEach((pin, i) => {
      const el = pin.el;
      if (e >= times[i]! && !landed.has(el)) {
        el.dataset.on = e - times[i]! < 1 ? 'drop' : 'now';
        landed.set(el, e - times[i]! < 1 ? t0 + times[i]! + 0.3 : 0);
      }
      const [px, py] = toScreen(pv, shift, w, h, pin.spot[0], 0, pin.spot[1]);
      el.style.transform = `translate3d(${Math.round(px)}px,${Math.round(py)}px,0)`;
      el.style.zIndex = String(pin.me ? 9999 : Math.max(0, Math.round(py)));
      if (i < 5) spots.push(pin.spot[0], pin.spot[1], landed.get(el) ?? -1, pin.me ? 1 : 0);
    });
    while (spots.length < 20) spots.push(0, 0, -1, 0);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const mine = st.side === 'blue' ? colors.blue : colors.red;
    const foe = st.side === 'blue' ? colors.red : colors.blue;
    const common = (p: Program) => {
      gl!.useProgram(p.program);
      const u = p.u;
      gl!.uniformMatrix4fv(u.uPV!, false, pv);
      gl!.uniform2f(u.uShift!, shift[0], shift[1]);
      gl!.uniform1f(u.uTime!, t);
      gl!.uniform1f(u.uIn!, clamp01((e - 0.2) / 2.3) * 1.25); // a ponte se monta
      gl!.uniform1f(u.uAmb!, smooth((e - 1.6) / 1.2)); // neve e bruma acendem
      gl!.uniform3fv(u.uMine!, mine);
      gl!.uniform3fv(u.uFoe!, foe);
      return u;
    };
    let u = common(res.mesh);
    gl.uniform3fv(u.uL!, LIGHT);
    gl.uniform3fv(u.uHi!, colors.hi);
    gl.uniform1f(u.uFog!, -1500 + 1560 * smooth((e - 0.3) / 2.2)); // a névoa recua até o meio da ponte
    gl.uniform4fv(u.uSpots!, spots);
    attribs(gl, res.mesh, res.mv, [['aPos', 3], ['aNor', 3], ['aCol', 3], ['aPar', 4], ['aT', 2]]);
    gl.drawArrays(gl.TRIANGLES, 0, assets.mesh.length / ABYSS_MESH_STRIDE);
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);

    u = common(res.sprite);
    gl.uniform1f(u.uPx!, canvas.height / 2 / Math.tan(FOV / 2));
    attribs(gl, res.sprite, res.sv, [['aPos', 3], ['aCol', 3], ['aP', 4], ['aT', 1]]);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, assets.sprites.length / ABYSS_SPRITE_STRIDE);
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
  const handle: AbyssHandle = {
    update(next) {
      diveAsked = next.diving;
      if (!next.diving) diveT = -1;
      st = next;
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
