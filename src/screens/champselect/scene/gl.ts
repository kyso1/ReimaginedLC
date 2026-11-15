/**
 * Ajudas mínimas de WebGL 1 para as cenas da seleção (sem biblioteca: o Chromium 108 do client roda WebGL 1 puro).
 */
export type GL = WebGLRenderingContext;
export interface Program {
  program: WebGLProgram;
  /** Uniforms ativos pelo nome (vetores sem o `[0]`). */
  u: Record<string, WebGLUniformLocation | null>;
}

/**
 * Contexto WebGL do canvas, ou `null` quando não há (sem GPU, WebGL desligado, contextos demais): quem chama volta
 * para o desenho plano. Fora do desenvolvimento recusa WebGL por software: a cena inteira na CPU travaria o client.
 */
export function createContext(canvas: HTMLCanvasElement): GL | null {
  try {
    return canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, failIfMajorPerformanceCaveat: !import.meta.env.DEV });
  } catch {
    return null;
  }
}

export function program(gl: GL, vs: string, fs: string): Program {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(p) ?? 'program');
  const u: Program['u'] = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number; i < n; i++) {
    const name = gl.getActiveUniform(p, i)!.name.replace('[0]', '');
    u[name] = gl.getUniformLocation(p, name);
  }
  return { program: p, u };
}

export function buffer(gl: GL, target: number, data: Float32Array | Uint16Array): WebGLBuffer {
  const b = gl.createBuffer()!;
  gl.bindBuffer(target, b);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return b;
}

/** Textura RGBA na unidade `unit`: bytes (quadrada, de lado `size`) ou um canvas; `mip` gera mipmaps. */
export function texture(gl: GL, unit: number, src: Uint8Array | HTMLCanvasElement, size = 0, mip = false): WebGLTexture {
  const t = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  if (src instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}

/** Liga os atributos de um buffer intercalado de floats: [nome, tamanho]... */
export function attribs(gl: GL, p: Program, buf: WebGLBuffer, layout: ReadonlyArray<readonly [string, number]>): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const stride = layout.reduce((n, a) => n + a[1], 0) * 4;
  let off = 0;
  for (const [name, size] of layout) {
    const loc = gl.getAttribLocation(p.program, name);
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off);
    }
    off += size * 4;
  }
}

export type Rgb = [number, number, number];
/** Cor CSS (`#rgb`, `#rrggbb`, `rgb()`/`rgba()`) em 0..1; qualquer outra coisa devolve `fallback`. */
export function parseColor(css: string, fallback: Rgb): Rgb {
  const s = css.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(s)?.[1];
  if (hex && hex.length <= 4) return [0, 1, 2].map((i) => parseInt(hex[i]! + hex[i]!, 16) / 255) as Rgb;
  if (hex && (hex.length === 6 || hex.length === 8)) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return fallback;
}

/** Lê tokens do tema (`--rlc-*`) no elemento, uma vez, para passar como uniform; sem o token vale a cor reserva. */
export function themeColors<K extends string>(el: Element, tokens: Record<K, readonly [string, Rgb]>): Record<K, Rgb> {
  const css = getComputedStyle(el);
  const out = {} as Record<K, Rgb>;
  for (const k in tokens) out[k] = parseColor(css.getPropertyValue(tokens[k][0]), tokens[k][1]);
  return out;
}
