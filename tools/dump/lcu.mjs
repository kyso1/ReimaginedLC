import { readFileSync } from 'node:fs';
import { request } from 'node:https';
import { join } from 'node:path';

export const LEAGUE_DIR = process.env.LEAGUE_DIR ?? 'C:\\Riot Games\\League of Legends';
export const RIOT_CA = readFileSync(new URL('./riotgames.pem', import.meta.url));

export function parseLockfile(text) {
  const parts = text.trim().split(':');
  if (parts.length !== 5 || !/^\d+$/.test(parts[2])) {
    throw new Error('lockfile inválido: esperado name:pid:port:password:protocol');
  }
  return { port: Number(parts[2]), password: parts[3], protocol: parts[4] };
}

export function readCredentials(dir = LEAGUE_DIR) {
  let text;
  try {
    text = readFileSync(join(dir, 'lockfile'), 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`Client do League não está aberto (lockfile não encontrado em ${dir}). Abra o client ou defina LEAGUE_DIR.`);
    }
    throw e;
  }
  return parseLockfile(text);
}

export function authHeader(password) {
  return 'Basic ' + Buffer.from(`riot:${password}`).toString('base64');
}

export function lcuGet(creds, path) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: creds.port,
        path,
        method: 'GET',
        headers: { Authorization: authHeader(creds.password), Accept: 'application/json' },
        ca: RIOT_CA,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

export async function lcuJson(creds, path) {
  const { status, body } = await lcuGet(creds, path);
  if (status !== 200) throw new Error(`GET ${path} -> ${status}`);
  return JSON.parse(body.toString('utf8'));
}

/** Encerra um script de linha de comando com mensagem de uma linha, sem stack trace. */
export function fail(e) {
  console.error(`erro: ${e.message}`);
  process.exit(1);
}
