import test from 'node:test';
import assert from 'node:assert/strict';
import { anonymize, assertClean, collectIdentities, collectSecrets } from './anonymize.mjs';

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
  const [out] = anonymize([ev('/x', { text: `prefixo ${JWT} sufixo`, list: [JWT] })]);
  assert.equal(out.data.text, 'prefixo [jwt] sufixo');
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
  assert.equal(map.get(PUUID), '00000000-0000-4000-8000-000000000001');
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

// ---- Rodada de correção 1: o anonimizador deve falhar fechado ----
const U1 = '11111111-2222-4333-8444-555555555555';
const U2 = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const FAKE = /^00000000-0000-4000-8000-[0-9a-f]{12}$/;
const pass = (lines) => {
  const out = anonymize(lines);
  assertClean(out, [...collectIdentities(lines).keys(), ...collectSecrets(lines)]);
  return out;
};

test('C1: note de amigo vira [mensagem]', () => {
  const [out] = anonymize([ev('/lol-chat/v1/friends', [{ puuid: PUUID, gameName: 'AmigoA', note: 'irmao da Mariazinha Souza, tel 43 99999-0000' }])]);
  assert.equal(out.data[0].note, '[mensagem]');
});

test('C2: UUID só na URI (data nula) é substituído', () => {
  const [out] = anonymize([{ type: 'event', t: 1, uri: `/lol-chat/v1/friend-requests/${U1}`, eventType: 'Delete', data: null }]);
  assert.equal(out.uri.includes(U1), false);
  assert.match(out.uri, /^\/lol-chat\/v1\/friend-requests\/00000000-0000-4000-8000-[0-9a-f]{12}$/);
});

test('C2: UUID só como chave de objeto e dentro de JSON em string, sob qualquer chave', () => {
  const out = anonymize([ev('/x', { byThing: { [U1]: { a: 1 } }, lol: { custom: JSON.stringify({ members: [U2] }) } })]);
  const text = JSON.stringify(out);
  assert.equal(text.includes(U1), false);
  assert.equal(text.includes(U2), false);
  assert.match(Object.keys(out[0].data.byThing)[0], FAKE);
});

test('C2: UUID em maiúsculas recebe o mesmo substituto da forma minúscula', () => {
  const out = anonymize([ev('/x', { puuid: U1 }), ev(`/y/${U1.toUpperCase()}`, null)]);
  assert.equal(out[1].uri, `/y/${out[0].data.puuid}`);
});

test('C2: assertClean acusa UUID real e pvp.net com identidade real mesmo sem lista de segredos', () => {
  assert.throws(() => assertClean([ev('/x', { a: U1 })], []), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: 'abc123@na1.pvp.net' })], []), /identidade real/);
  assert.throws(() => assertClean([ev(`/y/${U2}`, null)], []), /identidade real/);
  assert.doesNotThrow(() => assertClean([ev('/x', { a: '00000000-0000-4000-8000-000000000007@na1.pvp.net', b: 'anon-3@na1.pvp.net' })], []));
});

test('I3: tag line sob qualquer chave e Riot ID em string', () => {
  const [out] = anonymize([ev('/x', { riotIdGameName: 'Fulano Teste', riotIdTagLine: 'zz9q', riotId: 'Fulano Teste#zz9q' })]);
  assert.equal(out.data.riotIdTagLine, 'TAG');
  assert.match(out.data.riotId, /^anon-\d+#TAG$/);
  assert.equal(JSON.stringify(out).includes('zz9q'), false);
});

test('I4: valor de segredo é redigido onde mais aparecer e verificado por assertClean', () => {
  const lines = [ev('/x', { gameConfig: { password: 'senhaSecreta1' }, invitationUrl: 'join?pw=senhaSecreta1' })];
  const [out] = anonymize(lines);
  assert.equal(out.data.invitationUrl, 'join?pw=[redacted]');
  assert.deepEqual([...collectSecrets(lines)], ['senhaSecreta1']);
  assert.throws(() => assertClean([ev('/x', { u: 'join?pw=senhaSecreta1' })], collectSecrets(lines)), /identidade real/);
});

test('I5: chaves de credencial comuns são redigidas', () => {
  const [out] = anonymize([ev('/x', { auth: 'Basic abc', apiKey: 'k', signature: 's', ticket: 't', bearer: 'b', author: 'ok' })]);
  for (const k of ['auth', 'apiKey', 'signature', 'ticket', 'bearer']) assert.equal(out.data[k], '[redacted]');
  assert.equal(out.data.author, 'ok');
});

test('I6: variante codificada na URL e em outra caixa é substituída e verificada', () => {
  const lines = [ev('/lol-summoner/v1/summoners', { gameName: 'Fulano Teste' }), ev('/lol-x/v1/s?gameName=Fulano%20Teste&n=fulano teste', {})];
  const out = anonymize(lines);
  assert.equal(out[1].uri.toLowerCase().includes('fulano'), false);
  assert.throws(() => assertClean([ev('/x/y?gameName=Fulano%20Teste', {})], ['Fulano Teste']), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: 'FULANO TESTE' })], ['Fulano Teste']), /identidade real/);
});

test('I7: nome curto só é trocado isolado, e a primeira parte da URI nunca é tocada', () => {
  const out = anonymize([
    ev('/lol-lobby/v2/lobby', { gameName: 'lol', text: 'lol-lobby lollipop', alone: 'lol' }),
    ev('/lol-summoner/v1/x', { emailStatus: 'Verified', email: 'a@b.com' }),
  ]);
  assert.equal(out[0].uri, '/lol-lobby/v2/lobby');
  assert.equal(out[0].data.text, 'lol-lobby lollipop'.replace(/^lol-lobby/, `${out[0].data.gameName}-lobby`));
  assert.equal(out[0].data.alone, out[0].data.gameName);
  assert.equal(out[1].data.emailStatus, 'Verified');
  assert.match(out[1].data.email, /^anon-\d+$/);
  assert.doesNotThrow(() => assertClean(out, ['lol']));
});

test('M1: linha sem uri (não meta) também tem data limpa', () => {
  const [out] = anonymize([{ type: 'snapshot', t: 0, data: { password: 'x', note: 'y' } }]);
  assert.deepEqual(out.data, { password: '[redacted]', note: '[mensagem]' });
});

test('gravação sintética realista passa por anonymize e assertClean, sem sobras', () => {
  const lines = [
    { type: 'meta', client: '15.19', startedAt: '2026-01-01T00:00:00.000Z' },
    { type: 'snapshot', t: 0, uri: '/lol-summoner/v1/current-summoner', status: 200, data: { puuid: U1, gameName: 'Fulano Teste', tagLine: 'zz9q', summonerId: 77777777, accountId: 77777777 } },
    { type: 'snapshot', t: 0, uri: '/lol-chat/v1/friends', status: 200, data: [
      { pid: `${U2}@na1.pvp.net`, puuid: U2, gameName: 'Zeca', gameTag: 'abc', name: 'Zeca', note: 'primo do Zeca', id: `${U2}@na1.pvp.net`, lol: { custom: JSON.stringify({ members: [U2, '33333333-4444-4555-8666-777777777777'] }) } },
    ] },
    { type: 'snapshot', t: 0, uri: '/lol-lobby/v2/lobby', status: 200, data: { gameConfig: { password: 'senhaLobby9' }, invite: 'x?pw=senhaLobby9', byPlayer: { [U2]: { n: 1 } } } },
    ev(`/lol-chat/v1/friend-requests/${'33333333-4444-4555-8666-777777777777'}`, null),
    ev('/lol-chat/v1/conversations/x/messages', { body: 'oi Zeca', fromId: `${U1}@na1.pvp.net` }),
    ev('/lol-gameflow/v1/gameflow-phase', 'Lobby'),
  ];
  const out = pass(lines);
  const text = JSON.stringify(out);
  for (const real of [U1, U2, '33333333-4444-4555-8666-777777777777', 'Fulano Teste', 'Zeca', 'zz9q', '77777777', 'senhaLobby9', 'primo']) {
    assert.equal(text.includes(real), false, 'sobrou valor sintético');
  }
  assert.equal(out.at(-1).data, 'Lobby');
});
