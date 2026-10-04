// URIs de alto volume que a LCU simulada não precisa reproduzir.
const NOISE = /^\/(riot-messaging-service|data-store|lol-patch|patcher|telemetry|lol-telemetry|performance|lol-hovercard|lol-cosmetics)\b/;

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
