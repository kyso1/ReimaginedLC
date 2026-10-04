// LCU simulada: reproduz uma gravação de docs/dump/sessions por HTTP e WebSocket, para desenvolver no navegador.
// Uso: node tools/mock-lcu/server.mjs [--idle] [--speed 2] [--until ChampSelect] [--session nome]
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { assetRedirect, createReplay } from './replay.mjs';

export const PORT = 47616;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);

const session = option('session', 'ferramenta-de-treino');
if (!/^[a-z0-9-]+$/.test(session)) {
  console.error('erro: --session aceita só minúsculas, dígitos e hífen');
  process.exit(1);
}
const speed = Math.max(0.1, Number(option('speed', '1')) || 1);
const until = option('until', null);
const idle = flag('idle');

let lines;
try {
  lines = readFileSync(`docs/dump/sessions/${session}.jsonl`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
} catch (e) {
  console.error(`erro: não foi possível ler a gravação "${session}": ${e.message}`);
  process.exit(1);
}
const replay = createReplay(lines, { idle });

const server = createServer((req, res) => {
  const redirect = assetRedirect(req.url);
  if (redirect) return void res.writeHead(302, { Location: redirect }).end();
  if (req.method !== 'GET') return void res.writeHead(405).end();
  const { status, data } = replay.get(req.url);
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
});

const wss = new WebSocketServer({ server });
let playing = false;
let paused = false;

function broadcast(message) {
  for (const client of wss.clients) if (client.readyState === 1) client.send(message);
}

function step() {
  if (paused) return;
  const event = replay.next();
  if (!event) return void console.log('fim da gravação');
  setTimeout(() => {
    broadcast(event.message);
    if (until && event.enteredPhase === until) {
      paused = true;
      console.log(`pausado em ${until}. Enter para continuar.`);
      return;
    }
    step();
  }, event.delay / speed);
}

wss.on('connection', (socket) => {
  socket.on('message', () => {
    // A primeira inscrição dispara a reprodução; todos os clientes compartilham a mesma linha do tempo.
    if (playing || idle) return;
    playing = true;
    step();
  });
});

process.stdin.on('data', () => {
  if (!paused) return;
  paused = false;
  step();
});

server.listen(PORT, '127.0.0.1', () => console.log(`LCU simulada em http://127.0.0.1:${PORT} (${session}${idle ? ', ociosa' : `, velocidade ${speed}x`})`));
