import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLockfile, readCredentials, authHeader } from './lcu.mjs';

test('parseLockfile extrai porta, senha e protocolo', () => {
  assert.deepEqual(parseLockfile('LeagueClient:1234:60398:abcDEF-_123:https\n'), {
    port: 60398,
    password: 'abcDEF-_123',
    protocol: 'https',
  });
});

test('parseLockfile rejeita conteúdo malformado', () => {
  assert.throws(() => parseLockfile('lixo'), /lockfile inválido/);
  assert.throws(() => parseLockfile('a:b:naoporta:d:e'), /lockfile inválido/);
});

test('readCredentials explica quando o client está fechado', () => {
  const vazio = mkdtempSync(join(tmpdir(), 'rlc-'));
  assert.throws(() => readCredentials(vazio), /Client do League não está aberto/);
});

test('authHeader monta Basic com usuário riot', () => {
  assert.equal(authHeader('pw'), 'Basic ' + Buffer.from('riot:pw').toString('base64'));
});
