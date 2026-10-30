import { mkdirSync, openSync, writeSync, closeSync } from 'node:fs';
import { createInterface } from 'node:readline';
import WebSocket from 'ws';
import { readCredentials, authHeader, lcuGet, fail, RIOT_CA } from './lcu.mjs';
import { attach, toRequestLine, toResponseLine, redactLine } from './record-lib.mjs';

const SNAPSHOT = [
  '/system/v1/builds',
  '/riotclient/region-locale',
  '/lol-gameflow/v1/gameflow-phase',
  '/lol-gameflow/v1/session',
  '/lol-summoner/v1/current-summoner',
  '/lol-chat/v1/me',
  '/lol-chat/v1/friends',
  '/lol-lobby/v2/lobby',
  '/lol-game-queues/v1/queues',
  '/lol-ranked/v1/current-ranked-stats',
  '/lol-champ-select/v1/session',
  '/lol-perks/v1/pages',
  '/lol-perks/v1/currentpage',
  '/lol-champ-select/v1/skin-carousel-skins',
  '/lol-champ-select/v1/pickable-champion-ids',
  '/lol-champ-select/v1/bannable-champion-ids',
  '/lol-honor-v2/v1/ballot',
  '/lol-end-of-game/v1/eog-stats-block',
];

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const frames = args.includes('--frames');
const keepSecrets = args.includes('--keep-secrets');
if (!/^[a-z0-9-]+$/.test(name ?? '')) fail(new Error('uso: npm run dump:record -- <nome-em-minusculas-com-hifens> [--frames] [--keep-secrets]'));

try {
  const creds = readCredentials();
  mkdirSync('dump-raw/sessions', { recursive: true });
  const path = `dump-raw/sessions/${name}${keepSecrets ? '.secrets' : ''}.raw.jsonl`;
  if (keepSecrets) {
    console.warn('\n!!! --keep-secrets: esta sessão VAI conter segredos: a senha do client, tokens, credenciais.');
    console.warn('!!! Não compartilhe nem faça commit dela. O dump:anonymize vai recusá-la.\n');
  }
  // Escrita síncrona: cada linha chega ao disco antes da próxima, então nada se perde se o processo cair.
  // Flag 'wx': nunca sobrescreve uma gravação anterior.
  let fd;
  try {
    fd = openSync(path, 'wx');
  } catch (e) {
    if (e.code === 'EEXIST') fail(new Error(`${path} já existe; apague-o ou use outro nome`));
    throw e;
  }
  const write = (line) => writeSync(fd, JSON.stringify(keepSecrets ? line : redactLine(line)) + '\n');

  const build = JSON.parse((await lcuGet(creds, '/system/v1/builds')).body.toString('utf8'));
  write({ type: 'meta', client: build.version, startedAt: new Date().toISOString(), ...(keepSecrets && { secrets: true }) });
  for (const uri of SNAPSHOT) {
    const { status, body } = await lcuGet(creds, uri);
    let data = null;
    try {
      data = JSON.parse(body.toString('utf8'));
    } catch {}
    write({ type: 'snapshot', t: 0, uri, status, data });
  }

  const ws = new WebSocket(`wss://127.0.0.1:${creds.port}/`, {
    headers: { Authorization: authHeader(creds.password) },
    ca: RIOT_CA,
  });
  let extra = 0;
  const finish = ({ count, reason }) => {
    closeSync(fd);
    console.log(`\n${reason}. ${count} eventos e ${extra} linhas de requests/marcadores gravados em ${path}`);
    process.exit(reason.startsWith('erro') ? 1 : 0);
  };
  ws.on('open', () => {
    ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
    console.log(`gravando em ${path}. Digite um rótulo + Enter para marcar uma ação; Ctrl+C para encerrar.`);
  });
  // Mesmo relógio para eventos, requests e marcadores: tudo numa linha do tempo só.
  const start = Date.now();
  const now = () => Date.now() - start;
  attach(ws, write, finish, now);
  const writeExtra = (line) => {
    write(line);
    extra++;
  };

  await recordDevtools(creds.port, now, writeExtra);

  const rl = createInterface({ input: process.stdin });
  rl.on('line', (label) => label.trim() && writeExtra({ type: 'marker', t: now(), label: label.trim() }));
  // terminate: close() esperaria até 30 s pelo aperto de mão de fechamento.
  // Com o readline ativo, o Ctrl+C chega nele e não no processo.
  rl.on('SIGINT', () => ws.terminate());
  process.on('SIGINT', () => ws.terminate());
} catch (e) {
  fail(e);
}

// Grava as chamadas que a página do client faz, via DevTools (CEF em 127.0.0.1:9222; DEVTOOLS_PORT muda).
// Sem DevTools a gravação segue só com os eventos da LCU.
async function recordDevtools(lcuPort, now, write) {
  const port = process.env.DEVTOOLS_PORT ?? '9222';
  let page;
  try {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) })).json();
    page = pages.find((p) => p.type === 'page' && p.url.includes(`:${lcuPort}/`)) ?? pages.find((p) => p.type === 'page');
  } catch {}
  if (!page) {
    console.warn(`aviso: DevTools indisponível em 127.0.0.1:${port}; gravando só os eventos da LCU.`);
    return;
  }
  const cdp = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let nextId = 0;
  const pending = new Map();
  const call = (method, params) =>
    new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      cdp.send(JSON.stringify({ id, method, params }));
    });
  const opts = { host: `127.0.0.1:${lcuPort}`, frames };
  // Status de cada request gravado, até o corpo da resposta chegar.
  const tracked = new Map();
  cdp.on('message', async (buf) => {
    const msg = JSON.parse(buf.toString('utf8'));
    if (msg.id) {
      pending.get(msg.id)?.(msg);
      pending.delete(msg.id);
      return;
    }
    const p = msg.params;
    if (msg.method === 'Network.requestWillBeSent') {
      const line = toRequestLine(msg, now(), opts);
      if (!line) return;
      if (line.type === 'request') tracked.set(line.id, 0);
      write(line);
    } else if (msg.method === 'Network.responseReceived' && tracked.has(p.requestId)) {
      tracked.set(p.requestId, p.response.status);
    } else if (msg.method === 'Network.loadingFinished' && tracked.has(p.requestId)) {
      const status = tracked.get(p.requestId);
      tracked.delete(p.requestId);
      const t = now();
      const { result } = await call('Network.getResponseBody', { requestId: p.requestId });
      const body = result?.base64Encoded ? Buffer.from(result.body, 'base64').toString('utf8') : result?.body;
      write(toResponseLine(p.requestId, status, body, t));
    } else if (msg.method === 'Network.loadingFailed' && tracked.has(p.requestId)) {
      tracked.delete(p.requestId);
      write(toResponseLine(p.requestId, 0, p.errorText, now()));
    }
  });
  cdp.on('close', () => console.warn('aviso: DevTools desconectou; seguindo só com os eventos da LCU.'));
  cdp.on('error', () => {});
  const opened = await new Promise((resolve) => {
    cdp.once('open', () => resolve(true));
    cdp.once('error', () => resolve(false));
  });
  if (!opened) return;
  opts.mainFrame = (await call('Page.getFrameTree')).result?.frameTree.frame.id;
  await call('Network.enable');
  console.log('DevTools conectado.');
}
