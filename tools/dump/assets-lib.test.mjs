import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAssetPath, category, clientUrl, summarize } from './assets-lib.mjs';

test('parseAssetPath separa plugin, locale, resto e extensão', () => {
  assert.deepEqual(parseAssetPath('plugins/rcp-fe-lol-champ-select/global/default/images/a.b.PNG'), {
    plugin: 'rcp-fe-lol-champ-select',
    locale: 'default',
    rest: 'images/a.b.PNG',
    ext: 'png',
  });
});

test('parseAssetPath ignora o que não é plugin do client', () => {
  assert.equal(parseAssetPath('game/assets/x.png'), null);
  assert.equal(parseAssetPath('chrome_100_percent.pak'), null);
  assert.equal(parseAssetPath('plugins/rcp-fe-x/global'), null);
  assert.equal(parseAssetPath(''), null);
});

test('category agrupa por extensão', () => {
  assert.equal(category('png'), 'imagem');
  assert.equal(category('svg'), 'imagem');
  assert.equal(category('webm'), 'video');
  assert.equal(category('ogg'), 'audio');
  assert.equal(category('ttf'), 'fonte');
  assert.equal(category('js'), 'codigo');
  assert.equal(category('json'), 'dados');
  assert.equal(category('xyz'), 'outro');
});

test('clientUrl mapeia para as rotas do client', () => {
  assert.equal(clientUrl({ plugin: 'rcp-fe-lol-champ-select', rest: 'images/a.png' }), null);
  assert.equal(clientUrl({ plugin: 'rcp-be-lol-game-data', rest: 'v1/champion-icons/1.png' }), '/lol-game-data/assets/v1/champion-icons/1.png');
  assert.equal(clientUrl({ plugin: 'rcp-be-sanitizer', rest: 'x.json' }), null);
});

test('summarize conta por plugin e categoria, separa localizados e guarda até 3 exemplos', () => {
  const s = summarize([
    'plugins/rcp-fe-lol-loot/global/default/a.png',
    'plugins/rcp-fe-lol-loot/global/default/b.png',
    'plugins/rcp-fe-lol-loot/global/default/c.png',
    'plugins/rcp-fe-lol-loot/global/default/d.png',
    'plugins/rcp-fe-lol-loot/global/pt_br/trans.json',
    'plugins/rcp-fe-lol-loot/global/default/s.ogg',
    'game/assets/ignored.png',
  ]);
  assert.equal(s['rcp-fe-lol-loot'].imagem.count, 4);
  assert.equal(s['rcp-fe-lol-loot'].imagem.localized, 0);
  assert.deepEqual(s['rcp-fe-lol-loot'].imagem.samples, []);
  assert.equal(s['rcp-fe-lol-loot'].dados.count, 0);
  assert.equal(s['rcp-fe-lol-loot'].dados.localized, 1);
  assert.equal(s['rcp-fe-lol-loot'].audio.count, 1);
  assert.equal(Object.keys(s).length, 1);
});
