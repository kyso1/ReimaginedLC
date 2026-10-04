import { readFileSync, writeFileSync } from 'node:fs';
import { readCredentials, lcuJson, fail } from './lcu.mjs';
import { buildScreens } from './screens-lib.mjs';

try {
  const creds = readCredentials();
  const plugins = await lcuJson(creds, '/plugin-manager/v2/plugins');
  const endpoints = JSON.parse(readFileSync('docs/dump/lcu/endpoints.json', 'utf8'));
  const decisions = JSON.parse(readFileSync('tools/dump/decisions.json', 'utf8'));
  const { rows, missing, pending } = buildScreens(plugins, endpoints, decisions);

  const md = [
    '# Mapa de telas do client',
    '',
    'Uma linha por plugin de interface da Riot (`rcp-fe-*`). Gerado por `npm run dump:screens` a partir de `tools/dump/decisions.json`.',
    '',
    '- **refazer**: tela nova do ReimaginedLC.',
    '- **embutir**: a tela original da Riot é mostrada num painel.',
    '- **cortar**: não aparece no ReimaginedLC.',
    '- **infra**: não é tela; continua carregado por baixo.',
    '',
    '| Plugin | Decisão | Subprojeto | Fase do gameflow | Backends LCU | Endpoints | Nota |',
    '|---|---|---:|---|---|---:|---|',
    ...rows.map((r) => `| ${r.plugin} | ${r.decisao} | ${r.subprojeto ?? ''} | ${r.fase} | ${r.backends.join(', ')} | ${r.endpoints} | ${r.nota} |`),
  ];
  writeFileSync('docs/dump/screens.md', md.join('\n') + '\n');

  const count = (k) => rows.filter((r) => r.decisao === k).length;
  console.log(`${rows.length} plugins: ${count('refazer')} refazer, ${count('embutir')} embutir, ${count('cortar')} cortar, ${count('infra')} infra.`);
  if (missing.length) console.error(`sem decisão em decisions.json: ${missing.join(', ')}`);
  if (pending.length) console.error(`ainda em "investigar": ${pending.join(', ')}`);
  if (missing.length || pending.length) process.exit(1);
} catch (e) {
  fail(e);
}
