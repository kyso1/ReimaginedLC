import test from 'node:test';
import assert from 'node:assert/strict';
import { assetRedirect, createReplay } from './replay.mjs';

const lines = () => [
  { type: 'meta', client: '16.19', startedAt: 'x' },
  { type: 'snapshot', t: 0, uri: '/lol-gameflow/v1/gameflow-phase', status: 200, data: 'Lobby' },
  { type: 'snapshot', t: 0, uri: '/system/v1/builds', status: 200, data: { version: '16.19.1.1' } },
  { type: 'snapshot', t: 0, uri: '/lol-lobby/v2/lobby', status: 404, data: { message: 'x' } },
  { type: 'event', t: 100, uri: '/lol-gameflow/v1/gameflow-phase', eventType: 'Update', data: 'ChampSelect' },
  { type: 'event', t: 250, uri: '/lol-lobby/v2/lobby', eventType: 'Create', data: { members: [] } },
  { type: 'event', t: 400, uri: '/lol-lobby/v2/lobby', eventType: 'Delete', data: null },
];

test('GET devolve o snapshot, com o status gravado, e 404 para URI desconhecida', () => {
  const r = createReplay(lines());
  assert.deepEqual(r.get('/system/v1/builds'), { status: 200, data: { version: '16.19.1.1' } });
  assert.equal(r.get('/lol-lobby/v2/lobby').status, 404);
  assert.equal(r.get('/nao/existe').status, 404);
  assert.equal(r.get('/system/v1/builds?x=1').status, 200);
});

test('next entrega os eventos em ordem, com o intervalo entre eles, e atualiza o estado dos GETs', () => {
  const r = createReplay(lines());
  const a = r.next();
  assert.equal(a.delay, 100);
  assert.deepEqual(JSON.parse(a.message), [8, 'OnJsonApiEvent', { uri: '/lol-gameflow/v1/gameflow-phase', eventType: 'Update', data: 'ChampSelect' }]);
  assert.deepEqual(r.get('/lol-gameflow/v1/gameflow-phase'), { status: 200, data: 'ChampSelect' });
  assert.equal(r.phase(), 'ChampSelect');

  assert.equal(r.next().delay, 150);
  assert.deepEqual(r.get('/lol-lobby/v2/lobby'), { status: 200, data: { members: [] } });
  assert.equal(r.next().delay, 150);
  assert.equal(r.get('/lol-lobby/v2/lobby').status, 404);
  assert.equal(r.next(), null);
});

test('modo ocioso: fase None, sem eventos, demais snapshots intactos', () => {
  const r = createReplay(lines(), { idle: true });
  assert.deepEqual(r.get('/lol-gameflow/v1/gameflow-phase'), { status: 200, data: 'None' });
  assert.equal(r.phase(), 'None');
  assert.equal(r.next(), null);
  assert.equal(r.get('/system/v1/builds').status, 200);
});

test('gravação sem snapshot de fase ainda responde None no modo ocioso', () => {
  const r = createReplay([{ type: 'meta' }], { idle: true });
  assert.deepEqual(r.get('/lol-gameflow/v1/gameflow-phase'), { status: 200, data: 'None' });
});

test('linhas malformadas são ignoradas', () => {
  const r = createReplay([null, 3, {}, { type: 'event' }, { type: 'snapshot', uri: 7 }, ...lines()]);
  assert.equal(r.get('/system/v1/builds').status, 200);
  assert.equal(r.next().delay, 100);
});

test('assetRedirect aponta para o CommunityDragon e recusa o resto', () => {
  assert.equal(assetRedirect('/lol-game-data/assets/v1/Champion-Icons/1.png'), 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png');
  assert.equal(assetRedirect('/fe/lol-static-assets/2019-intro-background.jpg'), 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/2019-intro-background.jpg');
  assert.equal(assetRedirect('/fe/lol-uikit/images/a.png?x=1'), 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-uikit/global/default/images/a.png');
  for (const p of ['/lol-chat/v1/friends', '/fe/', '/fe/../x/a.png', '/fe/lol-uikit/../../a.png', '/lol-game-data/assets/', '/fe/x/a b.png']) assert.equal(assetRedirect(p), null);
});
