import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCollector } from './collector.mjs';

async function withServer(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'rlc-col-'));
  const logs = [];
  const server = createCollector(dir, (l) => logs.push(l));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, dir, logs);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

const CLIENT = 'https://127.0.0.1:50000';
const post = (url, body, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });

test('grava JSON de nome permitido', () =>
  withServer(async (base, dir) => {
    const res = await post(`${base}/env`, '{"a":1}', { Origin: CLIENT });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), CLIENT);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'env.json'), 'utf8')), { a: 1 });
  }));

test('responde ao preflight com cabeçalhos CORS', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/env`, { method: 'OPTIONS', headers: { Origin: CLIENT } });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), CLIENT);
  }));

test('recusa nome fora da lista, inclusive tentativa de sair da pasta', () =>
  withServer(async (base, dir) => {
    assert.equal((await post(`${base}/outro`, '{}')).status, 404);
    assert.equal((await post(`${base}/..%2Fenv`, '{}')).status, 404);
    assert.equal((await fetch(`${base}/env`)).status, 404);
    assert.equal(existsSync(join(dir, 'outro.json')), false);
  }));

test('recusa JSON inválido', () =>
  withServer(async (base, dir) => {
    assert.equal((await post(`${base}/env`, 'nao-json')).status, 400);
    assert.equal(existsSync(join(dir, 'env.json')), false);
  }));

test('recusa corpo acima de 1 MB sem gravar', () =>
  withServer(async (base, dir) => {
    const big = JSON.stringify({ x: 'a'.repeat(1_100_000) });
    // A conexão pode ser derrubada antes da resposta; os dois desfechos são recusa.
    const status = await post(`${base}/env`, big).then((r) => r.status, () => 'derrubada');
    assert.ok(status === 413 || status === 'derrubada');
    assert.equal(existsSync(join(dir, 'env.json')), false);
  }));

test('recusa origem que não é a página do client, sem gravar', () =>
  withServer(async (base, dir, logs) => {
    assert.equal((await post(`${base}/env`, '{"a":1}', { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await fetch(`${base}/env`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal(existsSync(join(dir, 'env.json')), false);
    assert.ok(logs.some((l) => l.includes('https://evil.example')));
  }));

test('sem Origin (curl) é aceito, sem cabeçalho de origem permitida', () =>
  withServer(async (base) => {
    const res = await post(`${base}/env`, '{"a":1}');
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  }));

test('recusa corpo que não é application/json, sem gravar', () =>
  withServer(async (base, dir) => {
    assert.equal((await post(`${base}/env`, '{"a":1}', { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal(existsSync(join(dir, 'env.json')), false);
  }));
