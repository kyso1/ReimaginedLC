import { effect } from '@preact/signals';
import { shown } from '../../../shell/layer';
import { isLite, liteAuto } from '../../../shell/perf';
import { prefs } from '../../../shell/prefs';
import { createContext, type GL } from './gl';

/** Um quadro: `t` em segundos num relógio que só anda enquanto a cena roda (pausar não pula a animação). */
export interface Frame {
  t: number;
  /** Tamanho do canvas em pixels de CSS. */
  w: number;
  h: number;
  /** Movimento reduzido: a cena desenha o quadro final, parado. */
  still: boolean;
}
/** Uma cena WebGL (Rift; depois Abismo Uivante e Arena). O palco cuida do laço, do tamanho e do contexto. */
export interface Scene {
  /** Cria os recursos de GPU. Chamado de novo quando o contexto volta depois de perdido. */
  init(gl: GL): void;
  /** O canvas mudou de tamanho (pixels de CSS). */
  resize?(w: number, h: number): void;
  draw(frame: Frame): void;
}
export interface Stage {
  /** Pede um quadro novo (no modo parado nada é redesenhado sem isto). */
  invalidate(): void;
  dispose(): void;
}
export interface StageOptions {
  /** Teto da densidade de pixels: acima disso o custo por quadro sobe sem ganho visível. */
  dprCap?: number;
  /** Teto de quadros por segundo (0 = o do monitor). */
  fps?: number;
}

/**
 * Movimento reduzido: preferência do sistema, a do aplicativo (`motion` reduzido ou desligado) ou o modo leve.
 * Com ele a cena não anima: fica um quadro pronto.
 */
export const reducedMotion = (): boolean =>
  prefs.value.motion !== 'full' || isLite(prefs.value.lite, liteAuto.value) || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Liga uma cena a um canvas. Devolve `null` sem WebGL (ou se a cena não conseguir montar): quem chama usa o desenho
 * plano. O laço só roda com a nossa camada na tela (`shown`) e a janela visível; com movimento reduzido desenha um
 * quadro por pedido (`invalidate`). Perda de contexto pausa; na volta a cena é remontada.
 */
export function createStage(canvas: HTMLCanvasElement, scene: Scene, { dprCap = 1.5, fps = 0 }: StageOptions = {}): Stage | null {
  const gl = createContext(canvas);
  if (!gl) return null;
  try {
    scene.init(gl);
  } catch {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  let raf = 0;
  let last = -1;
  let t = 0;
  let w = 0;
  let h = 0;
  let lost = false;
  let active = false;
  let still = false;
  let dirty = true;
  let sized = false;

  const tick = (now: number) => {
    raf = 0;
    if (fps && last >= 0 && now - last < 1000 / fps - 1) return void (raf = requestAnimationFrame(tick));
    if (last >= 0) t += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!sized) {
      sized = true;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const dpr = Math.min(globalThis.devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      scene.resize?.(w, h);
    }
    dirty = false;
    if (w > 0 && h > 0) scene.draw({ t, w, h, still });
    sync();
  };
  /** Liga ou desliga o laço conforme o estado. */
  const sync = () => {
    const run = active && !lost && (!still || dirty);
    if (run && !raf) raf = requestAnimationFrame(tick);
    else if (!run) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = -1;
    }
  };
  const invalidate = () => {
    dirty = true;
    sync();
  };
  const stop = effect(() => {
    active = shown.value && !document.hidden;
    still = reducedMotion();
    dirty = true;
    sync();
  });
  const onVisible = () => {
    active = shown.peek() && !document.hidden;
    sync();
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    sync();
  };
  const onRestored = () => {
    try {
      scene.init(gl);
    } catch {
      return;
    }
    lost = false;
    onResize();
  };
  const onResize = () => {
    sized = false;
    invalidate();
  };
  document.addEventListener('visibilitychange', onVisible);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  const media = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const onMedia = () => {
    still = reducedMotion();
    invalidate();
  };
  media?.addEventListener('change', onMedia);
  // O jsdom dos testes não tem ResizeObserver; lá o tamanho é lido uma vez, no primeiro quadro.
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
  observer?.observe(canvas);

  return {
    invalidate,
    dispose() {
      stop();
      active = false;
      sync();
      observer?.disconnect();
      media?.removeEventListener('change', onMedia);
      document.removeEventListener('visibilitychange', onVisible);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      // Devolve o contexto na hora: o Chromium limita quantos ficam vivos e só os recolhe com o coletor de lixo.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
