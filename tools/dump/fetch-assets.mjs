import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { LEAGUE_DIR, readCredentials, lcuGet, lcuJson, fail } from './lcu.mjs';
import { summarize, DECISION } from './assets-lib.mjs';

const LISTING_URL = 'https://raw.communitydragon.org/latest/cdragon/files.exported.txt';
const RAW = 'dump-raw/cdragon-files.txt';
const OUT = 'docs/dump/assets';

try {
  mkdirSync('dump-raw', { recursive: true });
  mkdirSync(OUT, { recursive: true });

  if (!existsSync(RAW) || process.argv.includes('--refresh')) {
    const res = await fetch(LISTING_URL);
    if (!res.ok) throw new Error(`download da listagem falhou: ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(RAW));
  }
  const summary = summarize(readFileSync(RAW, 'utf8').split('\n'));

  // Tamanho dos WADs instalados, por plugin. Só metadados; os arquivos não são copiados.
  const pluginsDir = join(LEAGUE_DIR, 'Plugins');
  const wadMB = {};
  for (const name of readdirSync(pluginsDir)) {
    const dir = join(pluginsDir, name);
    if (!statSync(dir).isDirectory()) continue;
    const bytes = readdirSync(dir).filter((f) => f.endsWith('.wad')).reduce((n, f) => n + statSync(join(dir, f)).size, 0);
    wadMB[name] = Math.round(bytes / 1048576);
  }

  // A listagem é do patch "latest" do CommunityDragon, que pode diferir do instalado.
  // Mede a diferença pedindo ao client uma amostra de URLs /lol-game-data (servidas via REST).
  // URLs /fe/* não são conferidas aqui, pois são servidas apenas no navegador embutido.
  const creds = readCredentials();
  const build = await lcuJson(creds, '/system/v1/builds');

  // Coleta URLs /lol-game-data da summary
  let sample = [];
  if (summary['rcp-be-lol-game-data']) {
    for (const cat of Object.values(summary['rcp-be-lol-game-data'])) {
      sample.push(...cat.samples);
    }
  }

  // Se não temos 40 URLs, escaneia o arquivo de listagem para adicionar mais
  if (sample.length < 40) {
    const lines = readFileSync(RAW, 'utf8').split('\n');
    const gameDataLines = lines.filter((l) => l.includes('plugins/rcp-be-lol-game-data/global/default/'));
    const step = Math.max(1, Math.floor(gameDataLines.length / (40 - sample.length)));
    for (let i = 0; i < gameDataLines.length && sample.length < 40; i += step) {
      const line = gameDataLines[i];
      const parsed = { plugin: 'rcp-be-lol-game-data', rest: line.split('/').slice(4).join('/') };
      const url = `/lol-game-data/assets/${parsed.rest}`;
      if (!sample.includes(url)) sample.push(url);
    }
  }
  sample = sample.slice(0, 40);

  let hits = 0;
  for (const url of sample) if ((await lcuGet(creds, encodeURI(url))).status === 200) hits++;

  const meta = { client: build.version, listing: LISTING_URL, capturedAt: new Date().toISOString(), sampleChecked: sample.length, sampleFound: hits, feUrlsVerified: false };
  writeFileSync(`${OUT}/inventory.json`, JSON.stringify({ meta, wadMB, summary }, null, 2) + '\n');

  const md = [
    '# Inventário de assets do client',
    '',
    `Client ${meta.client}. Listagem: CommunityDragon \`latest\`. Amostra conferida no client: ${hits} de ${sample.length} URLs de /lol-game-data responderam 200. URLs /fe/ são servidas apenas dentro do navegador embutido do client e não foram conferidas aqui.`,
    '',
    'Contagens são de arquivos em `global/default`. A coluna "localizados" conta as cópias por idioma.',
    'Nenhum arquivo é copiado para o repositório: "reutilizar por referência" significa carregar a URL do próprio client em tempo de execução.',
    '',
    '| Plugin | WAD (MB) | Categoria | Arquivos | Localizados | Decisão | Exemplo |',
    '|---|---:|---|---:|---:|---|---|',
  ];
  for (const plugin of Object.keys(summary).sort()) {
    for (const [cat, c] of Object.entries(summary[plugin]).sort()) {
      md.push(`| ${plugin} | ${wadMB[plugin] ?? ''} | ${cat} | ${c.count} | ${c.localized} | ${DECISION[cat]} | ${c.samples[0] ? '`' + c.samples[0] + '`' : ''} |`);
    }
  }
  writeFileSync(`${OUT}/inventory.md`, md.join('\n') + '\n');

  console.log(`${Object.keys(summary).length} plugins inventariados. Amostra no client: ${hits}/${sample.length}.`);
} catch (e) {
  fail(e);
}
