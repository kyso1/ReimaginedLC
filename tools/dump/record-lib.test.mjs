import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { toLine, attach, toRequestLine, toResponseLine, redactLine } from './record-lib.mjs';

// Mensagem do DevTools (Network.requestWillBeSent) como o client a manda; `frames` é a pilha de quem chamou.
const sent = ({ url, method = 'GET', type = 'Fetch', postData, frames = ['https://127.0.0.1:50000/fe/lol-loot/index.js'], id = '1' }) => ({
  method: 'Network.requestWillBeSent',
  params: { requestId: id, type, request: { url, method, postData }, initiator: { type: 'script', stack: { callFrames: frames.map((u) => ({ url: u })) } } },
});

const msg = (uri, data = {}, eventType = 'Update') => JSON.stringify([8, 'OnJsonApiEvent', { uri, eventType, data }]);

test('toLine converte evento da LCU em linha de gravação', () => {
  assert.deepEqual(toLine(msg('/lol-lobby/v2/lobby', { a: 1 }, 'Create'), 250), {
    type: 'event',
    t: 250,
    uri: '/lol-lobby/v2/lobby',
    eventType: 'Create',
    data: { a: 1 },
  });
});

test('toLine ignora mensagem vazia, JSON inválido, outro opcode e URI ruidosa', () => {
  assert.equal(toLine('', 0), null);
  assert.equal(toLine('{nao-json', 0), null);
  assert.equal(toLine(JSON.stringify([5, 'OnJsonApiEvent']), 0), null);
  assert.equal(toLine(JSON.stringify([8, 'OnJsonApiEvent']), 0), null);
  assert.equal(toLine(msg('/riot-messaging-service/v1/message/x'), 0), null);
  assert.equal(toLine(msg('/data-store/v1/install-settings/x'), 0), null);
  assert.equal(toLine(msg('/lol-patch/v1/products/league_of_legends/state'), 0), null);
  assert.equal(toLine(msg('/lol-cosmetics/v1/inventories/tft/companions'), 0), null);
  assert.equal(toLine(msg('/lol-challenges/v1/challenges/local-player'), 0), null);
  assert.equal(toLine(msg('/lol-missions/v1/missions'), 0), null);
  assert.equal(toLine(msg('/lol-objectives/v1/objectives/lol'), 0), null);
  // A LCU às vezes manda a URI sem a barra inicial.
  assert.equal(toLine(msg('lol-challenges/v1/challenges/local-player'), 0), null);
});

test('attach grava eventos com tempo relativo e encerra quando o socket fecha', () => {
  const ws = new EventEmitter();
  const written = [];
  let ended = null;
  let clock = 1000;
  attach(ws, (line) => written.push(line), (info) => (ended = info), () => clock);

  clock = 1200;
  ws.emit('message', Buffer.from(msg('/lol-gameflow/v1/gameflow-phase', 'Lobby')));
  ws.emit('message', Buffer.from(''));
  clock = 1500;
  ws.emit('message', Buffer.from(msg('/lol-gameflow/v1/gameflow-phase', 'ChampSelect')));
  ws.emit('close');

  assert.deepEqual(written.map((l) => [l.t, l.data]), [[200, 'Lobby'], [500, 'ChampSelect']]);
  assert.deepEqual(ended, { count: 2, reason: 'conexão com o client encerrada' });
});

test('attach encerra uma única vez mesmo com erro seguido de fechamento', () => {
  const ws = new EventEmitter();
  let ends = 0;
  attach(ws, () => {}, () => ends++, () => 0);
  ws.emit('error', new Error('ECONNRESET'));
  ws.emit('close');
  assert.equal(ends, 1);
});

test('toRequestLine grava chamada da API feita pelo client original, com corpo em JSON', () => {
  const msg = sent({ url: 'https://127.0.0.1:50000/lol-loot/v1/recipes/CHEST_generic_OPEN/craft?repeat=1', method: 'POST', postData: '["CHEST_generic","MATERIAL_key"]' });
  assert.deepEqual(toRequestLine(msg, 300, { host: '127.0.0.1:50000' }), {
    type: 'request',
    t: 300,
    id: '1',
    sender: 'client',
    method: 'POST',
    uri: '/lol-loot/v1/recipes/CHEST_generic_OPEN/craft?repeat=1',
    data: ['CHEST_generic', 'MATERIAL_key'],
  });
});

test('toRequestLine ignora outro host, recurso estático e URI ruidosa', () => {
  const opts = { host: '127.0.0.1:50000' };
  assert.equal(toRequestLine(sent({ url: 'https://outro.exemplo/lol-loot/v1/player-loot' }), 0, opts), null);
  assert.equal(toRequestLine(sent({ url: 'https://127.0.0.1:50000/fe/lol-loot/index.js', type: 'Script' }), 0, opts), null);
  assert.equal(toRequestLine(sent({ url: 'https://127.0.0.1:50000/lol-missions/v1/missions' }), 0, opts), null);
  // Sons e imagens do próprio client chegam como fetch; o tracing dele também.
  assert.equal(toRequestLine(sent({ url: 'https://127.0.0.1:50000/fe/lol-uikit/sfx-uikit-button-click.ogg' }), 0, opts), null);
  assert.equal(toRequestLine(sent({ url: 'https://127.0.0.1:50000/tracing/v1/trace', method: 'POST' }), 0, opts), null);
  assert.equal(toRequestLine({ method: 'Network.responseReceived', params: {} }, 0, opts), null);
  assert.equal(toRequestLine(sent({ url: 'https://127.0.0.1:50000/lol-loot/v1/player-loot', type: 'XHR' }), 0, opts).uri, '/lol-loot/v1/player-loot');
});

test('toRequestLine marca a layer como sender mesmo atrás do wrapper de fetch do client ou numa pilha assíncrona', () => {
  const opts = { host: '127.0.0.1:50000' };
  const url = 'https://127.0.0.1:50000/lol-lobby/v2/party/abc/join';
  const wrapper = 'https://127.0.0.1:50000/fe/common-libs/rcp-fe-common-libs.js';
  const layer = 'https://plugins/ReimaginedLC/index.js';
  assert.equal(toRequestLine(sent({ url, frames: [wrapper, layer] }), 0, opts).sender, 'layer');

  const async = sent({ url, frames: [wrapper] });
  async.params.initiator.stack.parent = { callFrames: [{ url: wrapper }], parent: { callFrames: [{ url: layer }] } };
  assert.equal(toRequestLine(async, 0, opts).sender, 'layer');

  assert.equal(toRequestLine(sent({ url, frames: [wrapper] }), 0, opts).sender, 'client');
});

test('toResponseLine grava status e corpo, em JSON quando dá', () => {
  assert.deepEqual(toResponseLine('1', 200, '{"lootName":"CHEST_generic"}', 450), { type: 'response', t: 450, id: '1', status: 200, data: { lootName: 'CHEST_generic' } });
  assert.equal(toResponseLine('1', 500, 'falhou', 0).data, 'falhou');
  assert.equal(toResponseLine('1', 204, '', 0).data, undefined);
});

test('toRequestLine grava a criação de iframe e, só com --frames, o tráfego dentro dele', () => {
  const opts = { host: '127.0.0.1:50000', mainFrame: 'principal' };
  const inFrame = (m, frameId) => ((m.params.frameId = frameId), m);
  const doc = (frameId) => inFrame(sent({ url: 'https://loja.exemplo/rp?lang=pt', type: 'Document' }), frameId);

  assert.deepEqual(toRequestLine(doc('loja'), 700, opts), { type: 'target', t: 700, kind: 'iframe', url: 'https://loja.exemplo/rp?lang=pt' });
  assert.equal(toRequestLine(doc('principal'), 0, opts), null);

  const call = () => inFrame(sent({ url: 'https://loja.exemplo/api/compra', method: 'POST' }), 'loja');
  assert.equal(toRequestLine(call(), 0, opts), null);
  assert.equal(toRequestLine(call(), 0, { ...opts, frames: true }).uri, 'https://loja.exemplo/api/compra');
});

test('redactLine tira a senha do client das URLs e os campos secretos dos corpos', () => {
  assert.deepEqual(
    redactLine({ type: 'target', t: 0, kind: 'iframe', url: 'https://riot:s3nh4@127.0.0.1:50000/loja?token=abc&lang=pt' }),
    { type: 'target', t: 0, kind: 'iframe', url: 'https://[redacted]@127.0.0.1:50000/loja?token=[redacted]&lang=pt' },
  );
  assert.deepEqual(
    redactLine({ type: 'response', t: 0, id: '1', status: 200, data: { accessToken: 'eyJabc', jogador: { nome: 'Fulano', password: 'x' }, lista: [{ ticket: 't' }] } }),
    { type: 'response', t: 0, id: '1', status: 200, data: { accessToken: '[redacted]', jogador: { nome: 'Fulano', password: '[redacted]' }, lista: [{ ticket: '[redacted]' }] } },
  );
  assert.equal(redactLine({ type: 'event', t: 0, uri: '/lol-chat/v1/me', eventType: 'Update', data: 'Zeca' }).data, 'Zeca');
  // requiredTokens é o custo de um item do loot, não um segredo.
  assert.equal(redactLine({ type: 'response', t: 0, id: '1', status: 200, data: { requiredTokens: 'MATERIAL_key' } }).data.requiredTokens, 'MATERIAL_key');
});
