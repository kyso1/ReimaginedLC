import { readCredentials, lcuJson, fail } from './lcu.mjs';

try {
  const creds = readCredentials();
  const phase = await lcuJson(creds, '/lol-gameflow/v1/gameflow-phase');
  const build = await lcuJson(creds, '/system/v1/builds');
  console.log(`LCU ok na porta ${creds.port}. Versão ${build.version}. Fase: ${phase}`);
} catch (e) {
  fail(e);
}
