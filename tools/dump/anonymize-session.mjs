import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { anonymize, assertClean, assertNotDenied, collectIdentities, collectSecrets } from './anonymize.mjs';
import { fail } from './lcu.mjs';

const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name ?? '')) fail(new Error('uso: npm run dump:anonymize -- <nome>'));

try {
  const raw = readFileSync(`dump-raw/sessions/${name}.raw.jsonl`, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const clean = anonymize(raw);
  // Barreira final: se qualquer identidade real ou JWT sobrou, nada é gravado.
  assertClean(clean, collectIdentities(raw).keys(), collectSecrets(raw));
  // Segunda barreira: valores que o dono lista à mão (nunca versionados). Só a contagem é impressa.
  const denyFile = 'dump-raw/deny.txt';
  if (existsSync(denyFile)) {
    const denied = readFileSync(denyFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
    assertNotDenied(clean, denied);
    console.log(`lista de bloqueio: ${denied.length} entradas conferidas`);
  } else console.log(`lista de bloqueio: ${denyFile} ausente, nada conferido`);

  mkdirSync('docs/dump/sessions', { recursive: true });
  const out = `docs/dump/sessions/${name}.jsonl`;
  writeFileSync(out, clean.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const phases = clean.filter((l) => l.uri === '/lol-gameflow/v1/gameflow-phase' && l.type === 'event').map((l) => l.data);
  console.log(`${clean.length} linhas (de ${raw.length}) em ${out}`);
  console.log(`fases vistas: ${[...new Set(phases)].join(' > ')}`);
} catch (e) {
  fail(e);
}
