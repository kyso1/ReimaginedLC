/**
 * Summoner's Rift da seleção em WebGL 1: desenha as peças de `riftAssets.ts` (3 chamadas de desenho por quadro) e põe
 * os marcadores dos aliados, que são HTML por cima do canvas, no ponto do chão de cada um com a mesma matriz da câmera.
 *
 * Entrada: a câmera chega girando, o bloco sobe, o relevo levanta em onda a partir da base do jogador, a névoa recua,
 * o rio enche, as rotas se desenham, árvores e torres brotam e os aliados caem (o jogador por último). Depois a
 * câmera deriva devagar. Mergulho (ao travar): a câmera desce girando até o ponto do jogador.
 * Lado vermelho: o mundo é o mesmo; a câmera vai para trás da base vermelha e a luz e a névoa acompanham.
 */
import { clamp01, fitBox, orbit, outCubic, pinLifts, smooth, toScreen, type Area, type Fit, type Vec3 } from './camera';
import { attribs, buffer, program, texture, themeColors, type GL, type Program, type Rgb } from './gl';
import { homeOf, pinTimes, type Lane, type Point, type Side } from './rift';
import { LIGHT, loadRift, MESH_STRIDE, SPRITE_STRIDE, TEX, THICK, type RiftAssets } from './riftAssets';
import { createStage, type Frame } from './stage';

const COMMON = `
precision highp float;
uniform float uTime, uSide, uFogEdge, uRise, uLift, uGrow, uAmb;
uniform vec2 uHome; uniform vec3 uL, uBlue, uRed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
// Entrada com um pouco de passagem do ponto (0 -> 1).
float back(float c){ float g = c-1.; return 1. + 2.2*g*g*g + 1.2*g*g; }
// O relevo levanta em onda a partir da base do jogador.
float riseAt(vec2 xz){ return back(clamp((uRise - distance(xz, uHome)/1414.)/.35, 0., 1.)); }
// Névoa de guerra: cresce na direção da base inimiga, com borda de nuvem que se mexe.
float fogAt(vec3 w){ float e = uSide*(w.x-w.z)*.7071;
  float n = noise(w.xz*.006 + vec2(uTime*.03, -uTime*.02))*.6 + noise(w.xz*.017 - uTime*.04)*.4;
  return smoothstep(uFogEdge, uFogEdge+400., e + (n-.5)*240.); }
vec3 fogCol(vec3 col, vec3 w, float keep){ float f = fogAt(w)*(1.-keep); float g = dot(col, vec3(.3,.59,.11));
  return mix(col, mix(vec3(g), col, .3)*.42 + vec3(.03,.055,.1), f*.9); }
`;
const TERRAIN_VS = `${COMMON}
attribute vec3 aPos, aSk; uniform mat4 uPV; uniform vec2 uShift;
varying vec3 vW, vSk; varying float vRise;
void main(){ float r = riseAt(aPos.xz); vRise = min(r, 1.); vSk = aSk;
  vW = vec3(aPos.x, (aSk.z > .5 ? aPos.y : aPos.y*r) + uLift, aPos.z);
  gl_Position = uPV*vec4(vW, 1.); gl_Position.xy += uShift*gl_Position.w; }`;
const TERRAIN_FS = `${COMMON}
uniform sampler2D uN, uM, uA, uLn; uniform vec4 uSpots[5]; uniform vec3 uTeam, uHi, uMine; uniform float uLane, uWater;
varying vec3 vW, vSk; varying float vRise;
void main(){
  vec2 uv = vW.xz/1000.;
  vec4 nt = texture2D(uN, uv), m = texture2D(uM, uv); vec3 alb = texture2D(uA, uv).rgb;
  float mine = dot(texture2D(uLn, uv).rgb, uMine);
  vec2 nx = (nt.rg*2.-1.)*vRise;
  vec3 n = normalize(vec3(nx.x, sqrt(max(1.-dot(nx,nx), .02)), nx.y));
  float det = noise(vW.xz*.11), slope = 1.-n.y;
  alb *= .8 + .4*det;
  // Bases: centro e anéis na cor de cada time.
  float dB = distance(vW.xz, vec2(0.,1000.)), dR = distance(vW.xz, vec2(1000.,0.)), d0 = min(dB, dR);
  float rings = smoothstep(2.5,0.,abs(d0-200.)) + smoothstep(2.5,0.,abs(d0-150.)) + smoothstep(2.5,0.,abs(d0-96.));
  alb = mix(alb, dB < dR ? uBlue : uRed, max(smoothstep(85.,20.,d0), rings*.55)*step(d0, 204.));
  alb *= 1. + (nt.a*255.-64.)*.004*vRise;                                            // topo dos muros mais claro
  alb = mix(alb, mix(vec3(.16,.18,.23), vec3(.4,.38,.38), det), smoothstep(.08,.36,slope)); // encosta vira pedra
  // Rotas: terra apagada até a "tinta" chegar; a do jogador ganha a cor de destaque.
  float p = (m.b-.1)/.9; if (uSide < 0.) p = 1.-p;
  float rev = smoothstep(uLane+.015, uLane-.015, p);
  vec3 lc = mix(vec3(.2,.19,.16), vec3(.68,.58,.4)*(.8+.4*noise(vW.xz*.3)), rev);
  lc = mix(lc, uHi*1.25, mine*rev*.5);
  alb = mix(alb, lc, m.g);
  alb = mix(alb, vec3(.07,.1,.12), m.r);
  float bk = mix(1., nt.b, vRise);
  vec3 col = alb*(vec3(.3,.36,.5)*(.4+.6*bk) + vec3(1.25,1.15,.98)*max(dot(n,uL),0.)*bk);
  // Rio: enche do meio para as pontas, corre na diagonal e cintila.
  float along = abs((vW.x+vW.z)*.5-500.)/400.;
  float wet = smoothstep(.3,.62,m.r)*smoothstep(uWater+.04, uWater-.04, along);
  float w1 = noise(vW.xz*.03 + vec2(uTime*.3)), w2 = noise(vW.xz*.075 + vec2(-uTime*.22, uTime*.16) + 9.);
  vec3 water = mix(vec3(.03,.14,.27), vec3(.1,.5,.66), w1*.6+w2*.5) + vec3(.7,.9,1.)*pow(w1*w2*1.7, 4.);
  water += vec3(.45,.7,.8)*smoothstep(.75,.4,m.r)*(.35+.65*sin(uTime*1.6+w2*14.))*.45;   // espuma na margem
  water += vec3(.6,.9,1.)*exp(-abs(along-uWater)*40.)*step(uWater, 1.05);              // frente da água
  col = mix(col, water, wet*.9);
  // Luzes: frente do desenho das rotas, pulso de energia na rota do jogador, anéis dos aliados, faixa de luz.
  col += vec3(1.,.8,.4)*m.g*exp(-abs(p-uLane)*55.)*step(uLane, 1.05)*1.6;
  col += uHi*1.2*mine*rev*(.06 + .4*pow(.5+.5*sin(p*70.-uTime*2.6), 8.));
  for (int i = 0; i < 5; i++) { vec4 s = uSpots[i]; float age = uTime-s.z; if (s.z < 0. || age < 0.) continue;
    float d = distance(vW.xz, s.xy); vec3 c = s.w > .5 ? mix(uHi, vec3(1.), .55) : uTeam;
    float ring = smoothstep(4.,0.,abs(d-24.))*.9 + smoothstep(24.,0.,d)*.3;
    float shock = smoothstep(8.,0.,abs(d-age*260.))*max(1.-age/.7, 0.)*1.6;
    float k = fract(age*.55), pulse = s.w > .5 ? smoothstep(5.,0.,abs(d-24.-k*64.))*(1.-k) : 0.;
    col += c*(ring+shock+pulse); }
  float sw = uSide*(vW.x-vW.z)*.7071;
  col += col*exp(-pow((sw+1000.-mod(uTime*170.,3600.))/80., 2.))*.5*uAmb;
  col = fogCol(col, vW, 0.);
  // Lateral do bloco: rocha em camadas, mais escura embaixo, com um fio de luz do time na base.
  if (vSk.x > .5) { float y = vW.y-uLift; float band = noise(vec2(y*.3, (vW.x+vW.z)*.012));
    vec3 rock = mix(vec3(.09,.11,.16), vec3(.25,.24,.26), band)*vSk.y*mix(.3, 1., smoothstep(-64.,-4.,y));
    rock = fogCol(rock, vW, 0.) + uTeam*.3*smoothstep(-52.,-64.,y)*(1.-fogAt(vW));
    col = mix(rock, col*.7, smoothstep(-6.,0.,y)); }
  gl_FragColor = vec4(col, 1.);
}`;
const MESH_VS = `${COMMON}
attribute vec3 aPos, aBase, aNor, aCol, aK; uniform mat4 uPV; uniform vec2 uShift;
varying vec3 vW, vN, vC; varying float vK;
void main(){
  float d = distance(aBase.xz, uHome)/1414.;
  vec3 p = aPos*back(clamp((uGrow-d-(aK.x > 1.5 ? .12 : 0.))/.16, 0., 1.)), n = aNor;
  if (aK.x > 1.5) { float a = uTime*.9 + aBase.x*.02, c = cos(a), s = sin(a);          // cristal: gira e flutua
    p.xz = mat2(c,s,-s,c)*p.xz; n.xz = mat2(c,s,-s,c)*n.xz; p.y += sin(uTime*1.7+aBase.z*.03)*3.; }
  else if (aK.x > .5) { float w = sin(uTime*1.4+aBase.x*.031+aBase.z*.047) + .5*sin(uTime*2.3+aBase.z*.02); // vento
    p.xz += vec2(.04,.025)*w*p.y; }
  vW = vec3(aBase.x, aBase.y*riseAt(aBase.xz)+uLift, aBase.z) + p; vN = n; vK = aK.x;
  vC = aCol*mix(vec3(1.), aK.y < 1.5 ? uBlue : uRed, aK.y > .5 ? aK.z : 0.);
  gl_Position = uPV*vec4(vW, 1.); gl_Position.xy += uShift*gl_Position.w; }`;
const MESH_FS = `${COMMON}
varying vec3 vW, vN, vC; varying float vK;
void main(){ float diff = max(dot(normalize(vN), uL), 0.); vec3 col;
  if (vK > 1.5) col = fogCol(vC*(.8+.9*diff) + vec3(.3)*pow(diff, 6.), vW, .5);
  else col = fogCol(vC*(vec3(.3,.36,.5) + vec3(1.15,1.05,.9)*diff), vW, 0.);
  gl_FragColor = vec4(col, 1.); }`;
const SPRITE_VS = `${COMMON}
attribute vec3 aPos, aCol; attribute vec4 aP; uniform mat4 uPV; uniform vec2 uShift; uniform float uPx;
varying vec4 vC;
void main(){ vec3 p = aPos; float a = 1.;
  if (aP.z < .5) { p += vec3(sin(uTime*.31+aP.y*9.)*26., sin(uTime*.47+aP.y*5.)*10., cos(uTime*.27+aP.y*7.)*26.);
    a = .25 + .75*pow(.5+.5*sin(uTime*1.9+aP.y*40.), 2.); }
  else if (aP.z < 1.5) a = .72 + .28*sin(uTime*1.6+aP.y*6.28);
  else { float k = fract(uTime*.13+aP.y); p.y += k*80.; p.x += sin(uTime+aP.y*20.)*6.; a = sin(k*3.1416); }
  if (aP.w > .5) a *= clamp((uGrow-distance(aPos.xz, uHome)/1414.-.2)/.16, 0., 1.); else a *= uAmb;
  p.y += uLift; a *= 1.-fogAt(p)*.72;
  gl_Position = uPV*vec4(p, 1.); gl_Position.xy += uShift*gl_Position.w;
  gl_PointSize = clamp(aP.x*uPx/gl_Position.w, 1., 256.);
  vC = vec4(aP.w > .5 ? aCol*(aP.w < 1.5 ? uBlue : uRed) : aCol, a); }`;
const SPRITE_FS = `precision mediump float; varying vec4 vC;
void main(){ float f = max(1.-length(gl_PointCoord-.5)*2., 0.); gl_FragColor = vec4(vC.rgb*f*f*vC.a, 0.); }`;

const FOV = 0.46;
const ELEV = 0.84;
const CENTER: Vec3 = [500, 0, 500];
/** Duração do mergulho (s). */
export const DIVE_S = 1.3;
/** Pontos que têm de caber na tela: os cantos do bloco, a base dele e o topo das torres. */
const BOUNDS: Vec3[] = [[0, 0, 0], [1000, 0, 0], [0, 0, 1000], [1000, 0, 1000], [0, -THICK, 1000], [1000, -THICK, 0], [0, 110, 1000], [1000, 110, 0]];
/** Câmera atrás da própria base. */
const yawOf = (side: Side) => (side === 'blue' ? Math.PI * 0.75 : -Math.PI * 0.25);
const LANE_MASK: Record<Lane, Rgb> = { top: [1, 0, 0], mid: [0, 1, 0], bot: [0, 0, 1] };

/** Distância e deslocamento da câmera parada para o mapa caber na área livre. */
export const fitRift = (side: Side, w: number, h: number, area: Area): Fit => fitBox((d) => orbit(yawOf(side), ELEV, d, w / h, FOV, CENTER), BOUNDS, w, h, area);

export interface RiftPin {
  el: HTMLElement;
  /** Ponto do mapa (0..1000). */
  spot: Point;
  me: boolean;
}
export interface RiftState {
  side: Side;
  /** Rota do jogador, acesa; `null` não acende nenhuma. */
  lane: Lane | null;
  pins: RiftPin[];
  diving: boolean;
}
export interface RiftOptions {
  /** Toca a entrada; sem ela o mapa já aparece pronto (reaberto na mesma seleção, mergulho). */
  intro: boolean;
  /** Área livre da tela (px do canvas) onde o mapa tem de caber. */
  area(w: number, h: number): Area;
  /** Não deu para montar a cena depois de criada (peças, shaders): quem chama troca pelo desenho plano. */
  onFail(): void;
}
export interface RiftHandle {
  update(state: RiftState): void;
  dispose(): void;
}

/**
 * Monta o mapa no canvas. `host` é o elemento que recebe `data-ready` no primeiro quadro (o CSS mostra o canvas a
 * partir daí) e de onde saem as cores do tema. Devolve `null` sem WebGL.
 */
export function mountRift(canvas: HTMLCanvasElement, host: HTMLElement, initial: RiftState, opts: RiftOptions): RiftHandle | null {
  let st = initial;
  let gl: GL | null = null;
  let assets: RiftAssets | null = null;
  let res: { terrain: Program; mesh: Program; sprite: Program; tv: WebGLBuffer; ti: WebGLBuffer; mv: WebGLBuffer; sv: WebGLBuffer; light: WebGLTexture; side: Side } | null = null;
  /** Lado das peças carregadas (a luz é por lado). */
  let loaded: Side | null = null;
  let fit: Fit | null = null;
  let fitKey = '';
  let lifts = new WeakMap<HTMLElement, number>();
  let laid = '';
  // Relógio da entrada: começa no primeiro quadro com as peças prontas.
  let t0 = -1;
  let diveT = -1;
  let diveAsked = false;
  let disposed = false;
  const landed = new WeakMap<HTMLElement, number>();
  const mouse: [number, number, number, number] = [0, 0, 0, 0]; // alvo x, y e valor suavizado x, y
  // Cores dos times e do destaque: tokens do tema lidos uma vez, aqui.
  const colors = themeColors(host, {
    blue: ['--rlc-color-playing', [0.36, 0.63, 1]],
    red: ['--rlc-color-dangerText', [0.95, 0.42, 0.48]],
    hi: ['--rlc-color-highlight', [1, 0.84, 0.5]],
  });

  const build = () => {
    if (!gl || !assets || res) return;
    const a = assets;
    res = {
      terrain: program(gl, TERRAIN_VS, TERRAIN_FS),
      mesh: program(gl, MESH_VS, MESH_FS),
      sprite: program(gl, SPRITE_VS, SPRITE_FS),
      tv: buffer(gl, gl.ARRAY_BUFFER, a.terrain),
      ti: buffer(gl, gl.ELEMENT_ARRAY_BUFFER, a.index),
      mv: buffer(gl, gl.ARRAY_BUFFER, a.mesh),
      sv: buffer(gl, gl.ARRAY_BUFFER, a.sprites),
      light: texture(gl, 0, a.light, TEX),
      side: loaded!,
    };
    texture(gl, 1, a.masks, TEX);
    texture(gl, 2, a.albedo, 0, true);
    texture(gl, 3, a.lanes, TEX);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE);
  };

  /** Marcadores que se cobririam sobem: calculado com a câmera parada, para não tremer com a deriva. */
  const layout = (w: number, h: number) => {
    if (!assets || !fit) return;
    const key = `${w}x${h}|${st.side}|${st.pins.map((p) => p.spot.join()).join('|')}`;
    if (key === laid) return;
    laid = key;
    const pv = orbit(yawOf(st.side), ELEV, fit.dist, w / h, FOV, CENTER);
    const boxes = st.pins.map((p) => {
      const [x, y] = toScreen(pv, fit!.shift, w, h, p.spot[0], assets!.hAt(p.spot[0], p.spot[1]), p.spot[1]);
      const inner = p.el.firstElementChild as HTMLElement | null;
      return { x, y, w: inner?.offsetWidth || 110, h: inner?.offsetHeight || 96 };
    });
    lifts = new WeakMap();
    pinLifts(boxes).forEach((lift, i) => {
      const el = st.pins[i]!.el;
      lifts.set(el, lift);
      el.style.setProperty('--lift', `${Math.round(lift)}px`);
    });
  };

  const draw = ({ t: now, w, h, still }: Frame) => {
    if (!gl || !assets) return;
    try {
      build();
    } catch {
      return fail();
    }
    if (!res) return;
    const a = assets;
    const key = `${w}x${h}|${st.side}`;
    if (!fit || fitKey !== key) {
      fitKey = key;
      fit = fitRift(st.side, w, h, opts.area(w, h));
    }
    if (res.side !== loaded) {
      // Trocou de lado: das texturas, só a luz muda.
      res.side = loaded!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, res.light);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEX, TEX, 0, gl.RGBA, gl.UNSIGNED_BYTE, a.light);
    }
    layout(w, h);
    if (t0 < 0) t0 = opts.intro ? now : now - 99;
    // Mergulho: a entrada já tem de estar completa (o mapa pode ter acabado de abrir).
    if (diveAsked && diveT < 0) {
      diveT = now;
      t0 = Math.min(t0, now - 8);
    }
    const sign = st.side === 'blue' ? 1 : -1;
    // Parado (movimento reduzido): o quadro final, sem entrada, deriva nem mergulho.
    const t = still ? 100 : now;
    const e = still ? 99 : now - t0; // segundos desde o começo da entrada
    // Câmera: chega girando de cima e de longe; depois deriva devagar e acompanha um pouco o mouse.
    const k = outCubic(e / 3);
    mouse[2] += (mouse[0] - mouse[2]) * 0.05;
    mouse[3] += (mouse[1] - mouse[3]) * 0.05;
    const drift = still ? 0 : 1;
    let yaw = yawOf(st.side) + (1 - k) * 1.15 + drift * (Math.sin(t * 0.21) * 0.04 + mouse[2] * 0.07);
    let elev = ELEV + (1 - k) * 0.5 + drift * (Math.sin(t * 0.17) * 0.012 - mouse[3] * 0.035);
    let d = fit.dist * (1 + (1 - k) * 0.7);
    let target = CENTER;
    let shift = fit.shift;
    // Mergulho (ao travar): a câmera desce girando até o ponto do jogador, que vai para o centro da tela.
    const dv = diveT < 0 || still ? 0 : smooth((now - diveT) / DIVE_S);
    const far = d * 4;
    if (dv > 0) {
      const [mx, mz] = st.pins.find((p) => p.me)?.spot ?? homeOf(st.side);
      target = [500 + (mx - 500) * dv, a.hAt(mx, mz) * dv, 500 + (mz - 500) * dv];
      yaw += dv * 0.45;
      elev += (0.52 - elev) * dv;
      d *= Math.pow(340 / d, dv);
      shift = [shift[0] * (1 - dv), shift[1] * (1 - dv)];
    }
    const pv = orbit(yaw, elev, d, w / h, FOV, target, far);

    // Marcadores: aparecem na hora marcada e seguem o ponto do chão.
    const times = pinTimes(st.pins.length, st.pins.findIndex((p) => p.me));
    const spots: number[] = [];
    st.pins.forEach((pin, i) => {
      const el = pin.el;
      if (e >= times[i]! && !landed.has(el)) {
        el.dataset.on = e - times[i]! < 1 ? 'drop' : 'now';
        landed.set(el, e - times[i]! < 1 ? t0 + times[i]! + 0.3 : 0);
      }
      const [x, z] = pin.spot;
      const [px, py] = toScreen(pv, shift, w, h, x, a.hAt(x, z), z);
      el.style.transform = `translate3d(${Math.round(px)}px,${Math.round(py)}px,0)`;
      el.style.zIndex = String(pin.me ? 9999 : Math.max(0, Math.round(py)));
      if (i < 5) spots.push(x, z, landed.get(el) ?? -1, pin.me ? 1 : 0);
    });
    while (spots.length < 20) spots.push(0, 0, -1, 0);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const home = homeOf(st.side);
    const common = (p: Program) => {
      gl!.useProgram(p.program);
      const u = p.u;
      gl!.uniformMatrix4fv(u.uPV!, false, pv);
      gl!.uniform2f(u.uShift!, shift[0], shift[1]);
      gl!.uniform1f(u.uTime!, t);
      gl!.uniform1f(u.uSide!, sign);
      gl!.uniform2f(u.uHome!, home[0], home[1]);
      gl!.uniform3f(u.uL!, LIGHT[0] * sign, LIGHT[1], LIGHT[2] * sign);
      gl!.uniform3fv(u.uBlue!, colors.blue);
      gl!.uniform3fv(u.uRed!, colors.red);
      gl!.uniform1f(u.uLift!, -(1 - outCubic(e / 1.5)) * 220); // o bloco sobe
      gl!.uniform1f(u.uRise!, clamp01((e - 0.2) / 1.5) * 1.4); // o relevo levanta
      gl!.uniform1f(u.uFogEdge!, -950 + 1010 * smooth((e - 0.3) / 1.7)); // a névoa recua até o rio
      gl!.uniform1f(u.uGrow!, clamp01((e - 1) / 1.7) * 1.5); // árvores e torres brotam
      gl!.uniform1f(u.uAmb!, smooth((e - 1.8) / 1.2)); // partículas acendem
      return u;
    };
    let u = common(res.terrain);
    gl.uniform1i(u.uN!, 0);
    gl.uniform1i(u.uM!, 1);
    gl.uniform1i(u.uA!, 2);
    gl.uniform1i(u.uLn!, 3);
    gl.uniform1f(u.uWater!, clamp01((e - 1) / 1.2) * 1.1);
    gl.uniform1f(u.uLane!, clamp01((e - 1.1) / 1.5) * 1.1);
    gl.uniform3fv(u.uTeam!, st.side === 'blue' ? colors.blue : colors.red);
    gl.uniform3fv(u.uHi!, colors.hi);
    gl.uniform3fv(u.uMine!, st.lane ? LANE_MASK[st.lane] : [0, 0, 0]);
    gl.uniform4fv(u.uSpots!, spots);
    attribs(gl, res.terrain, res.tv, [['aPos', 3], ['aSk', 3]]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.ti);
    gl.drawElements(gl.TRIANGLES, a.index.length, gl.UNSIGNED_SHORT, 0);

    common(res.mesh);
    attribs(gl, res.mesh, res.mv, [['aPos', 3], ['aBase', 3], ['aNor', 3], ['aCol', 3], ['aK', 3]]);
    gl.drawArrays(gl.TRIANGLES, 0, a.mesh.length / MESH_STRIDE);

    u = common(res.sprite);
    gl.uniform1f(u.uPx!, canvas.height / 2 / Math.tan(FOV / 2));
    attribs(gl, res.sprite, res.sv, [['aPos', 3], ['aCol', 3], ['aP', 4]]);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, a.sprites.length / SPRITE_STRIDE);
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
  const load = (side: Side) =>
    void loadRift(side).then(
      (a) => {
        if (disposed || side !== st.side) return;
        assets = a;
        loaded = side;
        laid = '';
        stage.invalidate();
      },
      () => fail(),
    );
  const onMove = (ev: PointerEvent) => {
    mouse[0] = (ev.clientX / (innerWidth || 1)) * 2 - 1;
    mouse[1] = (ev.clientY / (innerHeight || 1)) * 2 - 1;
  };
  addEventListener('pointermove', onMove, { passive: true });

  const handle: RiftHandle = {
    update(next) {
      const side = next.side !== st.side;
      diveAsked = next.diving;
      if (!next.diving) diveT = -1;
      st = next;
      if (side) load(next.side);
      stage.invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      removeEventListener('pointermove', onMove);
      stage.dispose();
    },
  };
  handle.update(initial);
  load(initial.side);
  return handle;
}
