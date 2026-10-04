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
  assert.doesNotThrow(() => assertClean([ev('/x', { a: 'limpo' })], [PUUID, 'Fulano'], []));
  assert.throws(() => assertClean([ev('/x', { a: `vazou ${PUUID}` })], [PUUID], []), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: JWT })], [], []), /JWT/);
  assert.throws(() => assertClean([ev('/x', { n: 12345678 })], [12345678], []), /identidade real/);
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
// Segredos separados das identidades, como anonymize-session.mjs.
const pass3 = (lines) => {
  const out = anonymize(lines);
  assertClean(out, [...collectIdentities(lines).keys()], [...collectSecrets(lines)]);
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
  assert.throws(() => assertClean([ev('/x', { a: U1 })], [], []), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: 'abc123@na1.pvp.net' })], [], []), /identidade real/);
  assert.throws(() => assertClean([ev(`/y/${U2}`, null)], [], []), /identidade real/);
  assert.doesNotThrow(() => assertClean([ev('/x', { a: '00000000-0000-4000-8000-000000000007@na1.pvp.net', b: 'anon-3@na1.pvp.net' })], [], []));
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
  assert.throws(() => assertClean([ev('/x', { u: 'join?pw=senhaSecreta1' })], [], collectSecrets(lines)), /identidade real/);
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
  assert.throws(() => assertClean([ev('/x/y?gameName=Fulano%20Teste', {})], ['Fulano Teste'], []), /identidade real/);
  assert.throws(() => assertClean([ev('/x', { a: 'FULANO TESTE' })], ['Fulano Teste'], []), /identidade real/);
});

test('I7: nome curto só é trocado isolado, e a primeira parte da URI nunca é tocada', () => {
  const out = anonymize([
    ev('/lol-lobby/v2/lobby', { gameName: 'lol', text: 'lol-lobby lollipop', displayName: 'lol', alone: 'lol' }),
    ev('/lol-summoner/v1/x', { emailStatus: 'Verified', email: 'a@b.com' }),
  ]);
  assert.equal(out[0].uri, '/lol-lobby/v2/lobby');
  assert.equal(out[0].data.text, 'lol-lobby lollipop'.replace(/^lol-lobby/, `${out[0].data.gameName}-lobby`));
  assert.equal(out[0].data.displayName, out[0].data.gameName);
  assert.equal(out[0].data.alone, 'lol'); // palavra solta fora de chave de identidade fica (N2)
  assert.equal(out[1].data.emailStatus, 'Verified');
  assert.match(out[1].data.email, /^anon-\d+$/);
  assert.doesNotThrow(() => assertClean(out, ['lol'], []));
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
  const out = pass3(lines);
  const text = JSON.stringify(out);
  for (const real of [U1, U2, '33333333-4444-4555-8666-777777777777', 'Fulano Teste', 'Zeca', 'zz9q', '77777777', 'senhaLobby9', 'primo']) {
    assert.equal(text.includes(real), false, 'sobrou valor sintético');
  }
  assert.equal(out.at(-1).data, 'Lobby');
});

// ---- Rodada de correção 2 ----
test('N1: segredo que contém UUID é redigido por inteiro e o assertClean confere', () => {
  const lines = [ev('/x', { sessionToken: `${U1}.s3cr3tSuffixXYZ`, url: `x?t=${U1}.s3cr3tSuffixXYZ` })];
  const out = pass3(lines);
  assert.equal(out[0].data.url, 'x?t=[redacted]');
  assert.equal(JSON.stringify(out).includes('s3cr3tSuffixXYZ'), false);
  assert.throws(() => assertClean([ev('/x', { u: 'a s3cr3tSuffixXYZ b' })], ['s3cr3tSuffixXYZ'], []), /identidade real/);
});

test('N2: nome ou segredo igual a vocabulário do protocolo não reescreve fases nem URIs', () => {
  const lines = [
    ev('/lol-chat/v1/friends', [{ puuid: U1, gameName: 'Lobby' }]),
    ev('/lol-gameflow/v1/gameflow-phase', 'Lobby'),
    ev('/lol-lobby/v2/lobby', { signature: 'None', phase: 'None' }),
  ];
  const out = pass3(lines);
  assert.equal(out[1].data, 'Lobby');
  assert.equal(out[2].uri, '/lol-lobby/v2/lobby');
  assert.equal(out[2].data.phase, 'None');
  assert.match(out[0].data[0].gameName, /^anon-\d+$/);
});

test('N2: nome curto sob chave de identidade, `name` com puuid e valor inteiro de query são trocados', () => {
  const out = pass3([
    ev('/lol-chat/v1/friends', [{ puuid: U1, gameName: 'Zeca', name: 'Zeca' }]),
    ev('/lol-x/v1/s?gameName=Zeca&alias=Zeca', {}),
    ev('/lol-x/Zeca/v1', {}),
  ]);
  assert.equal(JSON.stringify(out[0]).includes('Zeca'), false);
  assert.equal(out[1].uri.includes('Zeca'), false);
  assert.equal(out[2].uri, '/lol-x/Zeca/v1'); // caminho de URI nunca é tocado para valores curtos
});

test('N3: nome curto hex não corrompe os UUIDs substitutos', () => {
  const out = pass3([ev('/x', { puuid: U1, gameName: '4000' }), ev(`/y/${U1}`, { t: 'a 4000 b' })]);
  assert.match(out[0].data.puuid, FAKE);
  assert.equal(out[1].uri, `/y/${out[0].data.puuid}`);
  assert.equal(out[1].data.t, `a ${out[0].data.gameName} b`);
});

test('N4: valor sob chave de identidade com UUID também coleta o resto', () => {
  const out = pass3([ev('/x', { displayName: `Fulano Teste ${U1}`, t: 'oi Fulano Teste' })]);
  assert.equal(out[0].data.t.includes('Fulano'), false);
  assert.equal(collectIdentities([ev('/x', { pid: `${U1}@na1.pvp.net` })]).size, 1);
});

test('N5: regras por chave valem dentro de JSON embutido em string', () => {
  const lines = [ev('/x', { lol: { gameData: '{"password":"senhaEmJson9","note":"segredo do amigo","tagLine":"zz9q"}', copy: 'senhaEmJson9' } })];
  const out = pass3(lines);
  assert.deepEqual(JSON.parse(out[0].data.lol.gameData), { password: '[redacted]', note: '[mensagem]', tagLine: 'TAG' });
  assert.equal(out[0].data.lol.copy, '[redacted]');
});

test('N6: segredo numérico de 4+ dígitos é coletado e redigido em strings', () => {
  const lines = [ev('/x', { password: 123456, s: 'pw 123456' })];
  assert.deepEqual([...collectSecrets(lines)], ['123456']);
  assert.equal(pass3(lines)[0].data.s, 'pw [redacted]');
});

test('N7: nome com + , %23 e espaço antes do # e parâmetro tagLine na URI', () => {
  const out = pass3([
    ev('/x', { gameName: 'Fulano Teste' }),
    ev('/lol-x/v1/s?gameName=Fulano+Teste&tagLine=zz9q', {}),
    ev('/lol-x/alias/Fulano%20Teste%23zz9q', {}),
    ev('/y', { r: 'Fulano Teste #zz9q' }),
  ]);
  const text = JSON.stringify(out);
  assert.equal(text.includes('zz9q'), false);
  assert.equal(text.includes('Fulano'), false);
  assert.match(out[1].uri, /tagLine=TAG$/);
});

test('realista (rodada 2): fases iguais a nome, hex curto e JSON embutido passam sem sobras', () => {
  const lines = [
    ev('/lol-chat/v1/friends', [{ puuid: U2, gameName: 'Lobby', name: 'Lobby', note: 'x' }, { puuid: U1, gameName: '4000', name: '4000' }]),
    ev('/lol-gameflow/v1/gameflow-phase', 'Lobby'),
    ev('/lol-gameflow/v1/gameflow-phase', 'None'),
    ev('/lol-lobby/v2/lobby', { embedded: '{"password":"senhaZ99x","note":"n","tagLine":"zz9q"}', p: 'senhaZ99x' }),
    ev('/lol-gameflow/v1/session', { playerCredentials: { gameId: 4123456789, serverPort: 5119, region: 'friends' } }),
    ev('/lol-match-history/v1/games/4123456789', { port: 'p 5119' }),
    ev('/lol-chat/v1/friends', { g: 'Friends list' }),
  ];
  const out = pass3(lines);
  const fakeGame = collectIdentities(lines).get(4123456789);
  assert.deepEqual(out.slice(4).map((l) => l.uri), ['/lol-gameflow/v1/session', `/lol-match-history/v1/games/${fakeGame}`, '/lol-chat/v1/friends']);
  assert.equal(out[4].data.playerCredentials, '[redacted]');
  assert.deepEqual(out.slice(1, 3).map((l) => l.data), ['Lobby', 'None']);
  assert.equal(out[3].uri, '/lol-lobby/v2/lobby');
  assert.match(out[0].data[1].puuid, FAKE);
  assert.equal(JSON.stringify(out).includes('senhaZ99x'), false);
});

test('segredo que é só um UUID (ex.: dentro de um DTO jwt) vira substituto estável, não [redacted]', () => {
  const out = pass3([ev('/x', { mucJwtDto: { channelClaim: U1 }, pid: `${U1}@na1.pvp.net`, id: `${U1}@na1.pvp.net` })]);
  assert.equal(out[0].data.mucJwtDto, '[redacted]');
  assert.match(out[0].data.pid, /^00000000-0000-4000-8000-[0-9a-f]{12}@na1\.pvp\.net$/);
});

// ---- Rodada de correção 3 ----
test('P1: name é identidade quando o objeto tem pid, gameName, summonerId ou puuid', () => {
  const out = pass3([
    ev('/lol-chat/v1/friends', [{ puuid: U1, gameName: 'Zeca', name: 'Zeca', pid: `${U1}@na1.pvp.net` }]),
    ev('/lol-chat/v1/conversations', [{ id: `${U1}@na1.pvp.net`, pid: `${U1}@na1.pvp.net`, name: 'Zeca', gameName: 'Zeca', type: 'chat' }]),
    ev('/lol-chat/v1/conversations', [{ pid: `${U1}@na1.pvp.net`, name: 'Zeca', type: 'chat' }]),
  ]);
  assert.equal(JSON.stringify(out).includes('Zeca'), false);
});

test('P2: segredos de palavra e valores herdados não corrompem URIs nem dados', () => {
  const lines = [
    ev('/lol-gameflow/v1/session', { playerCredentials: { gameId: 4123456789, serverPort: 5119, region: 'friends' } }),
    ev('/lol-match-history/v1/games/4123456789', { port: 'p 5119' }),
    ev('/lol-chat/v1/friends', { g: 'Friends list' }),
    ev('/lol-lobby/v2/lobby', { mucJwtDto: { domain: 'champ-select' }, phase: 'champ-select' }),
  ];
  const out = pass3(lines);
  // gameId é identidade (F1): a URI do histórico leva o mesmo número falso; as demais ficam iguais.
  const fakeGame = collectIdentities(lines).get(4123456789);
  assert.equal(typeof fakeGame, 'number');
  assert.deepEqual(out.map((l) => l.uri), lines.map((l) => l.uri.replace('4123456789', String(fakeGame))));
  assert.equal(out[0].data.playerCredentials, '[redacted]');
  assert.equal(out[1].data.port, 'p 5119');
  assert.equal(out[2].data.g, 'Friends list');
  assert.equal(out[3].data.phase, 'champ-select');
});

test('P2: segredo em forma de token continua redigido em qualquer lugar, inclusive no caminho da URI', () => {
  const lines = [ev('/lol-x/v1/join/senhaLobby99', { gameConfig: { password: 'senhaLobby99' }, u: 'a senhaLobby99 b' })];
  const out = pass3(lines);
  assert.equal(out[0].uri, '/lol-x/v1/join/[redacted]');
  assert.equal(out[0].data.u, 'a [redacted] b');
});

test('P3: valores reais iguais a marcadores não fazem a barreira recusar um arquivo correto', () => {
  for (const name of ['anon', 'TAG', 'redacted', 'Mensagem']) {
    const out = pass3([ev('/x', { puuid: U1, gameName: name, t: `oi ${name} e anon-1` })]);
    assert.equal(out.length, 1);
  }
  assert.doesNotThrow(() => pass3([ev('/x', { signature: 'anon-1', t: 'anon-1' })]));
});

test('P4: JSON embutido sem nada a limpar fica byte a byte igual', () => {
  const raw = '{"seq":12345678901234567890,"f":1.10,"e":1e5, "2":1,"1":2}';
  const [out] = pass3([ev('/x', { s: raw })]);
  assert.equal(out.data.s, raw);
});

test('P5: segredo numérico repetido como número fica; nome curto em valor de query com tag', () => {
  const [a] = pass3([ev('/x', { password: 123456, other: 123456 })]);
  assert.equal(a.data.password, '[redacted]');
  assert.equal(a.data.other, 123456);
  const out = pass3([ev('/x', { gameName: 'Zeca' }), ev('/lol-x/v1/s?riotId=Zeca%23zz9q', {}), ev('/lol-x/v1/s?riotId=Zeca#zz9q', {})]);
  assert.match(out[1].uri, /^\/lol-x\/v1\/s\?riotId=anon-\d+%23TAG$/);
  assert.match(out[2].uri, /^\/lol-x\/v1\/s\?riotId=anon-\d+#TAG$/);
});

test('P6: pontuação ao redor do UUID não impede coletar o nome', () => {
  const out = pass3([ev('/x', { displayName: `Fulano Teste <${U1}>`, t: 'oi Fulano Teste' })]);
  assert.equal(out[0].data.t.includes('Fulano'), false);
});

// ---- Rodada de correção 4 ----
test('Q1: nome real que contém a palavra TAG é substituído em todo lugar', () => {
  for (const [gameName, t] of [['TAG Fulano', 'oi TAG Fulano'], ['Fulano TAG', 'Fulano TAG venceu']]) {
    const [out] = pass3([ev('/x', { puuid: U1, gameName, t })]);
    assert.match(out.data.gameName, /^anon-\d+$/);
    assert.equal(out.data.t, t.replace(gameName, out.data.gameName));
  }
});

test('Q2: JSON embutido com chave duplicada não mantém o texto bruto com identidade', () => {
  const lines = [ev('/x', { puuid: U1, gameName: 'Fulaninho', s: '{"a":"Fulaninho","a":"y"}' })];
  const out = pass3(lines);
  assert.equal(JSON.stringify(out).includes('Fulaninho'), false);
  assert.throws(() => assertClean([ev('/x', { s: '{"a":"Fulaninho","a":"y"}' })], ['Fulaninho'], []), /identidade real/);
});

test('Q3: assertClean exige a lista de segredos', () => {
  assert.throws(() => assertClean([ev('/x', { a: 'limpo' })], []), TypeError);
});

test('Q4: valor herdado curto com dígito não é segredo; dígito não conta como símbolo', () => {
  const lines = [
    ev('/lol-gameflow/v1/session', { playerCredentials: { x: 'EUW1' } }),
    ev('/x', { p: 'EUW1 server' }),
    ev('/lol-x/v1/s?pl=EUW1', {}),
  ];
  const out = pass3(lines);
  assert.equal(out[1].data.p, 'EUW1 server');
  assert.equal(out[2].uri, '/lol-x/v1/s?pl=EUW1');
  const inherited = (x) => collectSecrets([ev('/x', { playerCredentials: { x } })]).has(x);
  assert.equal(inherited('abc1234'), false);
  assert.equal(inherited('Senha123'), true);
  assert.equal(inherited('192.64.170.12'), true);
});

// ---- Revisão final ----
test('F1: gameId vira número falso estável, inclusive na URI, e campos de nome restantes são trocados', () => {
  const lines = [
    ev('/lol-gameflow/v1/session', { gameData: { gameId: 4123456789, queue: { id: 420 } }, playerCredentials: { gameId: 4123456789 } }),
    ev('/lol-end-of-game/v1/eog-stats-block', { gameId: 4123456789, matchId: 4123456790, teams: [{ players: [{ puuid: U1, playerAlias: 'Fulano Alias' }] }] }),
    ev('/lol-match-history/v1/games/4123456789', {}),
    ev('/lol-chat/v1/friends', [{ puuid: U2, commonFriendName: 'Zeca Amigo', nickname: 'Zecao' }]),
    ev('/lol-ranked/v1/x', { playerOrTeamName: 'Fulano Time' }),
    // Campos de nome com sublinhado e `nick`, achados no esquema (lcu-types.d.ts).
    ev('/lol-chat/v1/blocked-players', [{ game_name: 'Fulano Bloq', summoner_name: 'Fulano Invocador', nick: 'Fulaninho Nick' }]),
  ];
  const out = pass3(lines);
  const fake = out[1].data.gameId;
  assert.notEqual(fake, 4123456789);
  assert.equal(out[0].data.gameData.gameId, fake);
  assert.equal(out[2].uri, `/lol-match-history/v1/games/${fake}`);
  assert.notEqual(out[1].data.matchId, 4123456790);
  const text = JSON.stringify(out);
  for (const real of ['4123456789', '4123456790', 'Fulano Alias', 'Zeca Amigo', 'Zecao', 'Fulano Time', 'Fulano Bloq', 'Fulano Invocador', 'Fulaninho Nick']) assert.equal(text.includes(real), false, 'sobrou valor sintético');
  assert.equal(out[0].data.gameData.queue.id, 420);
});

test('F4: nome curto igual a valor dentro de JSON embutido canônico não faz a barreira recusar', () => {
  const lines = [ev('/x', { puuid: U1, gameName: 'Zeca', regalia: '{"bannerType":"Zeca"}' })];
  const out = pass3(lines);
  assert.match(out[0].data.gameName, /^anon-\d+$/);
});
