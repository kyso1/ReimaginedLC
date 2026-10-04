import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScreens } from './screens-lib.mjs';

const d = (decisao) => ({ decisao, fase: 'None', subprojeto: 2, nota: 'n' });

test('cruza plugin de interface com endpoints dos backends de que depende', () => {
  const { rows } = buildScreens(
    [
      { fullName: 'rcp-fe-lol-parties', dependencies: [{ fullName: 'rcp-be-lol-lobby' }, 'rcp-be-lol-matchmaking', { fullName: 'rcp-fe-lol-uikit' }] },
      { fullName: 'rcp-be-lol-lobby' },
    ],
    [{ plugin: 'lol-lobby' }, { plugin: 'lol-lobby' }, { plugin: 'lol-matchmaking' }, { plugin: 'lol-chat' }, { plugin: null }],
    { 'rcp-fe-lol-parties': d('refazer') },
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].plugin, 'rcp-fe-lol-parties');
  assert.deepEqual(rows[0].backends, ['lol-lobby', 'lol-matchmaking']);
  assert.equal(rows[0].endpoints, 3);
  assert.equal(rows[0].decisao, 'refazer');
});

test('acusa plugin de interface sem decisão', () => {
  const { rows, missing } = buildScreens([{ fullName: 'rcp-fe-lol-novo' }], [], {});
  assert.deepEqual(missing, ['rcp-fe-lol-novo']);
  assert.equal(rows.length, 0);
});

test('lista os que ainda estão em investigar', () => {
  const { pending } = buildScreens(
    [{ fullName: 'rcp-fe-lol-jade' }, { fullName: 'rcp-fe-lol-loot' }],
    [],
    { 'rcp-fe-lol-jade': d('investigar'), 'rcp-fe-lol-loot': d('refazer') },
  );
  assert.deepEqual(pending, ['rcp-fe-lol-jade']);
});

test('ordena por subprojeto e depois por nome, sem subprojeto por último', () => {
  const { rows } = buildScreens(
    [{ fullName: 'rcp-fe-b' }, { fullName: 'rcp-fe-a' }, { fullName: 'rcp-fe-c' }],
    [],
    { 'rcp-fe-b': { ...d('refazer'), subprojeto: 1 }, 'rcp-fe-a': { ...d('infra'), subprojeto: null }, 'rcp-fe-c': { ...d('refazer'), subprojeto: 1 } },
  );
  assert.deepEqual(rows.map((r) => r.plugin), ['rcp-fe-b', 'rcp-fe-c', 'rcp-fe-a']);
});

test('une backend homônimo e backends manuais da decisão quando não há dependência rcp-be declarada', () => {
  const { rows } = buildScreens(
    [{ fullName: 'rcp-fe-lol-champ-select', dependencies: [{ fullName: 'rcp-fe-lol-uikit' }] }, { fullName: 'rcp-fe-lol-parties' }],
    [{ plugin: 'lol-champ-select' }, { plugin: 'lol-lobby' }, { plugin: 'lol-lobby' }],
    { 'rcp-fe-lol-champ-select': d('refazer'), 'rcp-fe-lol-parties': { ...d('refazer'), backends: ['lol-lobby'] } },
  );
  const by = Object.fromEntries(rows.map((r) => [r.plugin, r]));
  assert.deepEqual(by['rcp-fe-lol-champ-select'].backends, ['lol-champ-select']);
  assert.equal(by['rcp-fe-lol-champ-select'].endpoints, 1);
  assert.deepEqual(by['rcp-fe-lol-parties'].backends, ['lol-lobby']);
  assert.equal(by['rcp-fe-lol-parties'].endpoints, 2);
});

test('nome de plugin igual a chave herdada de Object não casa backend', () => {
  const { rows } = buildScreens([{ fullName: 'rcp-fe-constructor' }], [{ plugin: 'lol-lobby' }], { 'rcp-fe-constructor': d('refazer') });
  assert.deepEqual(rows[0].backends, []);
  assert.equal(rows[0].endpoints, 0);
});

test('acusa decisao inválida', () => {
  const { invalid } = buildScreens(
    [{ fullName: 'rcp-fe-a' }, { fullName: 'rcp-fe-b' }],
    [],
    { 'rcp-fe-a': d('refazar'), 'rcp-fe-b': d('refazer') },
  );
  assert.deepEqual(invalid, ['rcp-fe-a']);
});
