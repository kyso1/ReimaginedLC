import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { toLine, attach } from './record-lib.mjs';

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
