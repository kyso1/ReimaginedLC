import test from 'node:test';
import assert from 'node:assert/strict';
import { ident, tsType, genTypes } from './gen-types.mjs';

test('tsType converte primitivos', () => {
  for (const n of ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double']) {
    assert.equal(tsType({ type: n }), 'number');
  }
  assert.equal(tsType({ type: 'string' }), 'string');
  assert.equal(tsType({ type: 'bool' }), 'boolean');
  assert.equal(tsType({ type: 'object' }), 'unknown');
});

test('tsType trata tipo vazio e ausente como unknown', () => {
  assert.equal(tsType({ type: '' }), 'unknown');
  assert.equal(tsType(undefined), 'unknown');
});

test('tsType converte vector e map', () => {
  assert.equal(tsType({ type: 'vector', elementType: 'LolLobbyMember' }), 'LolLobbyMember[]');
  assert.equal(tsType({ type: 'vector', elementType: 'string' }), 'string[]');
  assert.equal(tsType({ type: 'vector', elementType: '' }), 'unknown[]');
  assert.equal(tsType({ type: 'map', elementType: 'int32' }), 'Record<string, number>');
});

test('ident produz identificador TypeScript válido', () => {
  assert.equal(ident('basicSystemInfo'), 'basicSystemInfo');
  assert.equal(ident('Foo-Bar<Baz>'), 'Foo_Bar_Baz_');
  assert.equal(ident('3dThing'), '_3dThing');
});

test('genTypes emite enum como união de strings', () => {
  const out = genTypes({
    types: [{ name: 'Phase', fields: [], values: [{ name: 'None', value: 0 }, { name: 'Lobby', value: 1 }] }],
    functions: [],
  });
  assert.match(out, /export type Phase = "None" \| "Lobby";/);
});

test('genTypes emite interface com campo opcional e nome de campo entre aspas', () => {
  const out = genTypes({
    types: [{
      name: 'Lobby',
      values: [],
      fields: [
        { name: 'partyId', optional: false, type: { type: 'string', elementType: '' } },
        { name: 'weird-name', optional: true, type: { type: 'vector', elementType: 'Member' } },
      ],
    }],
    functions: [],
  });
  assert.match(out, /export interface Lobby \{\n  "partyId": string;\n  "weird-name"\?: Member\[\];\n\}/);
});

test('genTypes declara como unknown os tipos referenciados e não definidos', () => {
  const out = genTypes({
    types: [{ name: 'A', values: [], fields: [{ name: 'b', optional: false, type: { type: 'Missing', elementType: '' } }] }],
    functions: [{ name: 'GetX', arguments: [{ name: 'q', optional: false, type: { type: 'vector', elementType: 'AlsoMissing' } }], returns: { type: 'Ghost', elementType: '' }, tags: [] }],
  });
  assert.match(out, /export type Missing = unknown;/);
  assert.match(out, /export type AlsoMissing = unknown;/);
  assert.match(out, /export type Ghost = unknown;/);
});

test('genTypes ignora tipo com nome repetido', () => {
  const t = { name: 'Dup', values: [], fields: [] };
  const out = genTypes({ types: [t, t], functions: [] });
  assert.equal(out.match(/export interface Dup /g).length, 1);
});

test('genTypes ignora campos duplicados dentro de um tipo', () => {
  const out = genTypes({
    types: [{
      name: 'Thing',
      values: [],
      fields: [
        { name: 'isEpic', optional: false, type: { type: 'bool', elementType: '' } },
        { name: 'isEpic', optional: false, type: { type: 'bool', elementType: '' } },
      ],
    }],
    functions: [],
  });
  assert.equal(out.match(/"isEpic"/g).length, 1);
});
