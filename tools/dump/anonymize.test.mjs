import test from 'node:test';
import assert from 'node:assert/strict';
import { anonymize, assertClean, collectIdentities } from './anonymize.mjs';

const JWT = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlLWJ5dGVz';
const PUUID = '0f1e2d3c-aaaa-bbbb-cccc-1234567890ab';
const ev = (uri, data) => ({ type: 'event', t: 1, uri, eventType: 'Update', data });

test('mantém a linha meta e dados sem identidade', () => {
  const lines = [{ type: 'meta', client: '15.19', startedAt: 'x' }, ev('/lol-gameflow/v1/gameflow-phase', 'Lobby')];
  assert.deepEqual(anonymize(lines), lines);
});

test('descarta linhas de URIs que carregam credenciais', () => {
  const out = anonymize([
    ev('/lol-login/v1/session', { idToken: JWT }),
    ev('/entitlements/v1/token', { accessToken: JWT }),
    ev('/lol-rso-auth/v1/authorization', {}),
    ev('/lol-league-session/v1/league-session-token', JWT),
    ev('/lol-gameflow/v1/gameflow-phase', 'None'),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].uri, '/lol-gameflow/v1/gameflow-phase');
});

test('redige valores sob chaves sensíveis, inclusive objetos', () => {
  const [out] = anonymize([
    ev('/lol-gameflow/v1/session', {
      gameData: { password: 'lobby123', playerCredentials: { encryptionKey: 'k', serverIp: '1.2.3.4' } },
      someToken: 'abc',
      Authorization: 'Basic xyz',
    }),
  ]);
  assert.equal(out.data.gameData.password, '[redacted]');
  assert.equal(out.data.gameData.playerCredentials, '[redacted]');
  assert.equal(out.data.someToken, '[redacted]');
  assert.equal(out.data.Authorization, '[redacted]');
});

test('remove JWT embutido em qualquer string', () => {
  const [out] = anonymize([ev('/x', { note: `prefixo ${JWT} sufixo`, list: [JWT] })]);
  assert.equal(out.data.note, 'prefixo [jwt] sufixo');
  assert.deepEqual(out.data.list, ['[jwt]']);
});

test('substitui identidades de forma estável em valores, strings e URIs', () => {
  const out = anonymize([
    ev('/lol-summoner/v1/current-summoner', { puuid: PUUID, gameName: 'Fulano', tagLine: 'NA1', summonerId: 12345678 }),
    ev(`/lol-chat/v1/friends/${PUUID}@na1.pvp.net`, { id: `${PUUID}@na1.pvp.net`, name: 'Fulano', note: 'duo do Fulano' }),
    ev('/lol-summoner/v1/summoners/12345678', { summonerId: 12345678 }),
  ]);
  const text = JSON.stringify(out);
  assert.equal(text.includes(PUUID), false);
  assert.equal(text.includes('Fulano'), false);
  assert.equal(text.includes('12345678'), false);
  assert.equal(out[0].data.tagLine, 'TAG');
  // Estável: o mesmo real vira o mesmo substituto em todos os lugares.
  assert.equal(out[1].data.id, `${out[0].data.puuid}@na1.pvp.net`);
  assert.equal(out[1].uri, `/lol-chat/v1/friends/${out[0].data.puuid}@na1.pvp.net`);
  assert.equal(out[1].data.name, out[0].data.gameName);
  assert.equal(out[2].data.summonerId, out[0].data.summonerId);
  assert.equal(out[2].uri, `/lol-summoner/v1/summoners/${out[0].data.summonerId}`);
});

test('não trata números pequenos nem strings curtas como identidade', () => {
  const [out] = anonymize([ev('/x', { summonerId: 0, gameName: '', championId: 103, displayName: 'ab' })]);
  assert.deepEqual(out.data, { summonerId: 0, gameName: '', championId: 103, displayName: 'ab' });
});

test('limpa mensagens e status', () => {
  const [out] = anonymize([ev('/lol-chat/v1/conversations/x/messages', { body: 'oi, tudo bem?', statusMessage: 'jogando' })]);
  assert.equal(out.data.body, '[mensagem]');
  assert.equal(out.data.statusMessage, '');
});

test('nome mais longo é substituído antes do mais curto que ele contém', () => {
  const out = anonymize([ev('/x', { a: { gameName: 'Fulano' }, b: { gameName: 'FulanoSmurf' }, text: 'FulanoSmurf e Fulano' })]);
  assert.equal(out[0].data.text, `${out[0].data.b.gameName} e ${out[0].data.a.gameName}`);
});

test('collectIdentities devolve o mapa real para substituto', () => {
  const map = collectIdentities([ev('/x', { puuid: PUUID, accountId: 987654321 })]);
  assert.equal(map.get(PUUID), 'anon-1');
  assert.equal(map.get(987654321), 9000001);
});

test('assertClean aceita saída limpa e acusa segredo que sobrou', () => {
  assert.doesNotThrow(() => assertClean([ev('/x', { a: 'limpo' })], [PUUID, 'Fulano']));
  assert.throws(() => assertClean([ev('/x', { a: `vazou ${PUUID}` })], [PUUID]), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: JWT })], []), /JWT/);
  assert.throws(() => assertClean([ev('/x', { n: 12345678 })], [12345678]), /identidade real/);
});

test('chaves de objeto que são identidades também são substituídas', () => {
  const [a, b] = anonymize([
    ev('/x', { puuid: PUUID, summonerId: 87654321 }),
    ev('/y', { byPuuid: { [PUUID]: { rank: 'GOLD' } }, bySummoner: { 87654321: { level: 30 } }, secretToken: { [PUUID]: 1 } }),
  ]);
  assert.deepEqual(b.data.byPuuid, { [a.data.puuid]: { rank: 'GOLD' } });
  assert.deepEqual(b.data.bySummoner, { [String(a.data.summonerId)]: { level: 30 } });
  assert.equal(b.data.secretToken, '[redacted]');
  assert.equal(JSON.stringify([a, b]).includes(PUUID), false);
});

test('redige chave de espectador, dados do Discord, nome de lobby e de grupo de amigos', () => {
  const [out] = anonymize([
    ev('/x', {
      gameData: { spectatorKey: 'abcd1234' },
      discordId: '111222333444555',
      discordInfo: { username: 'someone', id: '111222333444555' },
      customLobbyName: 'sala secreta',
      groupName: 'colegas',
      displayGroupName: 'colegas',
    }),
  ]);
  assert.equal(out.data.gameData.spectatorKey, '[redacted]');
  assert.equal(out.data.discordId, '[redacted]');
  assert.equal(out.data.discordInfo, '[redacted]');
  assert.equal(out.data.customLobbyName, '[redacted]');
  assert.equal(out.data.groupName, '[redacted]');
  assert.equal(out.data.displayGroupName, '[redacted]');
});

test('gameTag vira TAG e ids de grupo e de chat de lobby são substituídos de forma estável', () => {
  const [out] = anonymize([
    ev('/x', { gameTag: 'NA1', partyId: 'party-aaaa', multiUserChatId: 'chat-bbbb', channelClaim: 'party-aaaa', ref: 'party-aaaa' }),
  ]);
  assert.equal(out.data.gameTag, 'TAG');
  assert.equal(out.data.partyId, out.data.channelClaim);
  assert.equal(out.data.ref, out.data.partyId);
  assert.match(out.data.partyId, /^anon-\d+$/);
  assert.match(out.data.multiUserChatId, /^anon-\d+$/);
});

test('pty (JSON de grupo embutido em string no chat) é redigido', () => {
  const [out] = anonymize([ev('/x', { pty: JSON.stringify({ partyId: 'p-1', summonerPuuids: [PUUID], summoners: [55555555] }), ptyType: 'x' })]);
  assert.equal(out.data.pty, '[redacted]');
  assert.equal(JSON.stringify(out).includes(PUUID), false);
});
