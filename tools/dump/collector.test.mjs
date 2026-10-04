import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCollector } from './collector.mjs';

async function withServer(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'rlc-col-'));
  const server = createCollector(dir, () => {});
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, dir);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('grava JSON de nome permitido', () =>
  withServer(async (base, dir) => {
    const res = await post(`${base}/env`, '{"a":1}');
    assert.equal(res.status, 204);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'env.json'), 'utf8')), { a: 1 });
  }));

test('responde ao preflight com cabeçalhos CORS', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/env`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
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
