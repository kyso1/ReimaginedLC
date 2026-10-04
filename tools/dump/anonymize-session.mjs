import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { anonymize, assertClean, collectIdentities } from './anonymize.mjs';
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
  assertClean(clean, collectIdentities(raw).keys());

  mkdirSync('docs/dump/sessions', { recursive: true });
  const out = `docs/dump/sessions/${name}.jsonl`;
  writeFileSync(out, clean.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const phases = clean.filter((l) => l.uri === '/lol-gameflow/v1/gameflow-phase' && l.type === 'event').map((l) => l.data);
  console.log(`${clean.length} linhas (de ${raw.length}) em ${out}`);
  console.log(`fases vistas: ${[...new Set(phases)].join(' > ')}`);
} catch (e) {
  fail(e);
}
