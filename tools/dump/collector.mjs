import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const PORT = 47615;
const ALLOWED = new Set(['env', 'hotkey']);
const MAX_BYTES = 1_000_000;
const CLIENT_ORIGIN = /^https:\/\/127\.0\.0\.1(:\d+)?$/;

export function createCollector(outDir, log = console.log) {
  return createServer((req, res) => {
    // Só a página do client (https://127.0.0.1:<porta>) ou quem não manda Origin (curl): outra página aberta no
    // navegador do dono não pode gravar arquivos que serão versionados.
    const origin = req.headers.origin;
    if (origin !== undefined && !CLIENT_ORIGIN.test(origin)) {
      log(`origem recusada: ${JSON.stringify(origin)}`);
      return void res.writeHead(403).end();
    }
    if (origin !== undefined) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') return void res.writeHead(204).end();

    const name = req.url.slice(1);
    if (req.method !== 'POST' || !ALLOWED.has(name)) return void res.writeHead(404).end();
    if (!/^application\/json/i.test(req.headers['content-type'] ?? '')) return void res.writeHead(415).end();

    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on('data', (c) => {
      if (rejected) return;
      size += c.length;
      if (size > MAX_BYTES) {
        rejected = true;
        res.writeHead(413).end();
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (rejected) return;
      let data;
      try {
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return void res.writeHead(400).end();
      }
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
      log(`recebido: ${name}`);
      res.writeHead(204).end();
    });
  });
}

if (import.meta.main) {
  createCollector('docs/dump/env').listen(PORT, '127.0.0.1', () =>
    console.log(`coletor em http://127.0.0.1:${PORT} gravando em docs/dump/env (Ctrl+C para sair)`),
  );
}
