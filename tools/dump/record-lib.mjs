import { SECRET_KEY } from './anonymize.mjs';

// URIs de alto volume que a LCU simulada não precisa reproduzir.
const NOISE = /^\/?(riot-messaging-service|data-store|lol-patch|patcher|telemetry|lol-telemetry|performance|lol-hovercard|lol-cosmetics|lol-challenges|lol-missions|lol-objectives)\b/;

export function toLine(raw, t) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed[0] !== 8 || !parsed[2]?.uri) return null;
  const { uri, eventType, data } = parsed[2];
  if (NOISE.test(uri)) return null;
  return { type: 'event', t, uri, eventType, data };
}

export function attach(ws, write, onEnd, now = Date.now) {
  const start = now();
  let count = 0;
  let ended = false;
  const end = (reason) => {
    if (ended) return;
    ended = true;
    onEnd({ count, reason });
  };
  ws.on('message', (buf) => {
    const line = toLine(buf.toString('utf8'), now() - start);
    if (!line) return;
    write(line);
    count++;
  });
  ws.on('close', () => end('conexão com o client encerrada'));
  ws.on('error', (e) => end(`erro no socket: ${e.message}`));
}

// A layer é carregada pelo Pengu a partir de uma pasta ReimaginedLC; o primeiro frame é sempre o wrapper de fetch do client.
const LAYER_SCRIPT = /\/ReimaginedLC\//;

function senderOf(stack) {
  for (let s = stack; s; s = s.parent) if (s.callFrames?.some((f) => LAYER_SCRIPT.test(f.url))) return 'layer';
  return 'client';
}

// Converte uma mensagem do DevTools (Network.requestWillBeSent) em linha `request` da sessão.
// Só chamadas fetch/XHR para a LCU (`opts.host` = 127.0.0.1:<porta>) entram; o resto é ruído.
// Documento carregado fora do frame principal (`opts.mainFrame`) é um iframe: vira linha `target`.
// Com `opts.frames`, as chamadas de dentro dos iframes também entram, com a URL inteira.
export function toRequestLine(msg, t, opts) {
  if (msg.method !== 'Network.requestWillBeSent') return null;
  const { requestId, request, type, initiator, frameId } = msg.params;
  const inIframe = frameId !== undefined && frameId !== opts.mainFrame;
  if (type === 'Document') return inIframe ? { type: 'target', t, kind: 'iframe', url: request.url } : null;
  if (type !== 'Fetch' && type !== 'XHR') return null;
  const url = new URL(request.url);
  let uri;
  if (url.host === opts.host && !NOISE.test(url.pathname)) uri = url.pathname + url.search;
  else if (inIframe && opts.frames) uri = request.url;
  else return null;
  return { type: 'request', t, id: requestId, sender: senderOf(initiator?.stack), method: request.method, uri, data: parseBody(request.postData) };
}

export function toResponseLine(id, status, body, t) {
  return { type: 'response', t, id, status, data: parseBody(body) };
}

// Corpo em JSON quando dá; senão o texto como veio. Vazio vira undefined.
function parseBody(body) {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

// Tira segredos de uma linha antes de gravar: credencial em URL (riot:<senha>@), parâmetros de query
// e campos de corpo com nome de segredo. Identidades ficam para o anonimizador.
export function redactLine(line) {
  return redact(line, false);
}

function redact(v, secret) {
  if (typeof v === 'string') {
    if (secret) return '[redacted]';
    return v
      .replace(/\/\/[^/@\s]+@/g, '//[redacted]@')
      .replace(/([?&])([^=&#]+)=([^&#]*)/g, (m, sep, k) => (SECRET_KEY.test(k) ? `${sep}${k}=[redacted]` : m));
  }
  if (Array.isArray(v)) return v.map((x) => redact(x, secret));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redact(x, secret || SECRET_KEY.test(k))]));
  return v;
}
