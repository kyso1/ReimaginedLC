// Plugin Pengu descartável do ReimaginedLC. Sonda o ambiente e envia ao coletor local.
// Não faz parte do produto. Remover com `npm run dump:plugin:remove` após o uso.
const COLLECTOR = 'http://127.0.0.1:47615';

async function send(name, data) {
  try {
    const res = await fetch(`${COLLECTOR}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return true;
  } catch (e) {
    // Sem coletor: o JSON fica no console (F12) para copiar à mão.
    console.log(`[rlc-dump] ${name} (coletor falhou: ${e.message})`, JSON.stringify(data));
    return false;
  }
}

function describeGlobal(name) {
  const v = window[name];
  const type = typeof v;
  const keys = v && (type === 'object' || type === 'function') ? Object.getOwnPropertyNames(v).slice(0, 50) : [];
  return { type, keys };
}

function probe() {
  const video = document.createElement('video');
  const can = (mime) => video.canPlayType(mime) || 'no';
  const css = (...args) => CSS.supports(...args);
  const canvas = document.createElement('canvas');

  return {
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    chromium: (navigator.userAgent.match(/Chrome\/([\d.]+)/) ?? [])[1] ?? null,
    window: { width: innerWidth, height: innerHeight, devicePixelRatio },
    memory: performance.memory
      ? { usedJSHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576), totalJSHeapMB: Math.round(performance.memory.totalJSHeapSize / 1048576) }
      : null,
    features: {
      viewTransitions: typeof document.startViewTransition === 'function',
      backdropFilter: css('backdrop-filter', 'blur(2px)'),
      hasSelector: css('selector(:has(*))'),
      containerQueries: css('container-type', 'inline-size'),
      cssNesting: css('selector(&)'),
      colorMix: css('color', 'color-mix(in srgb, red, blue)'),
      popover: 'popover' in HTMLElement.prototype,
      webAnimations: typeof Element.prototype.animate === 'function',
      offscreenCanvas: typeof OffscreenCanvas === 'function',
      webgl2: !!canvas.getContext('webgl2'),
      webpEncode: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
    },
    codecs: {
      h264: can('video/mp4; codecs="avc1.42E01E"'),
      hevc: can('video/mp4; codecs="hvc1.1.6.L93.B0"'),
      av1: can('video/mp4; codecs="av01.0.05M.08"'),
      vp8: can('video/webm; codecs="vp8"'),
      vp9: can('video/webm; codecs="vp9"'),
      aac: can('audio/mp4; codecs="mp4a.40.2"'),
      opus: can('audio/webm; codecs="opus"'),
      vorbis: can('audio/ogg; codecs="vorbis"'),
    },
    pengu: Object.fromEntries(
      ['Pengu', 'DataStore', 'PluginFS', 'CommandBar', 'Toast', 'Effect', 'openDevTools', 'openPluginsFolder', 'openAssetsFolder', 'reloadClient', 'restartClient', 'getScriptPath', '__llver'].map((n) => [n, describeGlobal(n)]),
    ),
    penguVersion: window.Pengu?.version ?? window.__llver ?? null,
    lcuSocketLink: !!document.querySelector('link[rel="riot:plugins:websocket"]'),
  };
}

// URLs /fe/ respondem 404 pela porta HTTP da LCU; aqui se confere se o navegador embutido as serve.
async function probeAssetUrls() {
  const urls = [
    '/fe/lol-champ-select/class-icon-assassin.png',
    '/fe/lol-static-assets/2019-intro-background.jpg',
    '/fe/lol-uikit/barkspengu.png',
    '/fe/lol-parties/arena-lobby-modal-left-background.png',
    '/lol-game-data/assets/v1/champion-icons/1.png',
  ];
  const out = {};
  for (const url of urls) {
    try {
      out[url] = (await fetch(url)).status;
    } catch (e) {
      out[url] = `erro: ${e.message}`;
    }
  }
  return out;
}

export async function load() {
  const ok = await send('env', { ...probe(), assetUrls: await probeAssetUrls() });
  window.Toast?.success?.(ok ? 'rlc-dump: ambiente enviado ao coletor' : 'rlc-dump: coletor fora do ar, veja o console');

  // Confirma que um listener de teclado comum recebe Ctrl+Shift+F12 dentro do client.
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        send('hotkey', { received: true, key: e.key, code: e.code, capturedAt: new Date().toISOString() });
        window.Toast?.success?.('rlc-dump: Ctrl+Shift+F12 recebido');
      }
    },
    true,
  );
}
