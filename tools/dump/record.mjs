import { mkdirSync, openSync, writeSync, closeSync } from 'node:fs';
import WebSocket from 'ws';
import { readCredentials, authHeader, lcuGet, fail, RIOT_CA } from './lcu.mjs';
import { attach } from './record-lib.mjs';

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
];

const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name ?? '')) fail(new Error('uso: npm run dump:record -- <nome-em-minusculas-com-hifens>'));

try {
  const creds = readCredentials();
  mkdirSync('dump-raw/sessions', { recursive: true });
  const path = `dump-raw/sessions/${name}.raw.jsonl`;
  // Escrita síncrona: cada linha chega ao disco antes da próxima, então nada se perde se o processo cair.
  // Flag 'wx': nunca sobrescreve uma gravação anterior.
  let fd;
  try {
    fd = openSync(path, 'wx');
  } catch (e) {
    if (e.code === 'EEXIST') fail(new Error(`${path} já existe; apague-o ou use outro nome`));
    throw e;
  }
  const write = (line) => writeSync(fd, JSON.stringify(line) + '\n');

  const build = JSON.parse((await lcuGet(creds, '/system/v1/builds')).body.toString('utf8'));
  write({ type: 'meta', client: build.version, startedAt: new Date().toISOString() });
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
  const finish = ({ count, reason }) => {
    closeSync(fd);
    console.log(`\n${reason}. ${count} eventos gravados em ${path}`);
    process.exit(reason.startsWith('erro') ? 1 : 0);
  };
  ws.on('open', () => {
    ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
    console.log(`gravando em ${path}. Ctrl+C para encerrar.`);
  });
  attach(ws, write, finish);
  // terminate: close() esperaria até 30 s pelo aperto de mão de fechamento.
  process.on('SIGINT', () => ws.terminate());
} catch (e) {
  fail(e);
}
