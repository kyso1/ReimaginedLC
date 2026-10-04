# Dump e inventário (subprojeto 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produzir, em `docs/dump/`, a descrição da API LCU com tipos TypeScript, o inventário de assets, o perfil do ambiente de execução, a medição de base, gravações de sessão anonimizadas, o mapa de telas e o relatório final que decide o que refazer, embutir ou cortar.

**Architecture:** Scripts Node em `tools/dump/` falam com a LCU pelo `lockfile` (HTTPS e WebSocket em `127.0.0.1`). O que só existe dentro do client (versão do Chromium, suporte a recursos, API do Pengu) é coletado por um plugin Pengu descartável que envia JSON a um coletor HTTP local. Dados brutos ficam em `dump-raw/` (fora do git); só resultados anonimizados entram em `docs/dump/`.

**Tech Stack:** Node 24 (ESM, `node:test`, `node:https` com TLS validado pelo certificado raiz da Riot), pacote `ws`, TypeScript (apenas `tsc --noEmit` para validar os tipos gerados), PowerShell 7 para a medição de processos.

**Spec:** `docs/superpowers/specs/2026-10-03-reimaginedlc-design.md` (seção "Subprojeto 0: dump e inventário")

## Global Constraints

- Repositório: `C:\Users\Admin\dev\ReimaginedLC`. Todos os comandos rodam a partir da raiz dele.
- Client instalado em `C:\Riot Games\League of Legends` (sobrescrito por `LEAGUE_DIR`). Pengu Loader 1.1.6 em `C:\Program Files\Pengu Loader` (sobrescrito por `PENGU_DIR`).
- O repositório é público e não redistribui assets da Riot: nenhum arquivo extraído do client (imagem, som, vídeo, fonte, WAD) entra no git. Só listagens e contagens.
- Dados pessoais (nomes, PUUIDs, IDs, mensagens) e segredos (tokens, JWTs, senhas de lobby, chaves de partida) nunca entram no git. Tudo que é bruto vai para `dump-raw/`, que está no `.gitignore`.
- Os scripts só fazem `GET` na LCU e escutam o WebSocket. Nenhum script deste plano altera estado do client.
- Passos marcados **[manual]** exigem o usuário com o client aberto. Nunca recarregar o client nem instalar o plugin de coleta com partida ou fila em andamento (`/lol-gameflow/v1/gameflow-phase` deve ser `"None"` ou `"Lobby"`).
- `/swagger/v2/swagger.json` e `/swagger/v3/openapi.json` retornam 404 neste client (verificado em 2026-10-03). A fonte é `/help?format=Full` mais `/help?target=<nome>&format=Console` por função.
- O plugin de coleta e os scripts de `tools/dump/` são ferramentas descartáveis, não fazem parte do produto.
- Commits com a identidade já configurada no repositório, terminando com `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Segredos em gravações.** Eventos da LCU carregam JWTs (`idToken`, `accessToken`), senha de lobby e `playerCredentials`. Uma gravação commitada não pode conter nenhum deles. Coberto em Task 6 (testes de `anonymize` e verificação final `assertClean`).
2. **Client fechado.** Rodar qualquer script sem o client aberto deve dar uma mensagem clara em uma linha, não um stack trace de `ENOENT`. Coberto em Task 1.
3. **Tipos da LCU com nomes ou formas inesperadas.** A descrição tem 3605 tipos, alguns com nome em minúscula, tipo vazio (`""`) ou referências a tipos não declarados. O gerador não pode emitir TypeScript inválido. Coberto em Task 2.
4. **Client fecha no meio da gravação.** O WebSocket cai quando o client reinicia ou fecha. O gravador deve preservar o que já gravou e encerrar com mensagem. Coberto em Task 6.
5. **Coletor local recebendo requisição arbitrária.** Qualquer página aberta no navegador pode fazer `POST` em `127.0.0.1`. O coletor só aceita nomes da lista, corpo JSON válido e até 1 MB. Coberto em Task 4.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | Scripts `npm` e dependências de desenvolvimento |
| `tools/dump/lcu.mjs` | Ler `lockfile`, autenticar, `GET` na LCU |
| `tools/dump/riotgames.pem` | Certificado raiz público da Riot, para validar o TLS da LCU |
| `tools/dump/ping.mjs` | Verificação de conexão |
| `tools/dump/gen-types.mjs` | Converter a descrição da LCU em TypeScript (puro) |
| `tools/dump/fetch-api.mjs` | Baixar descrição, endpoints, eventos; gravar tipos |
| `tools/dump/assets-lib.mjs` | Classificar caminhos de assets e resumir (puro) |
| `tools/dump/fetch-assets.mjs` | Baixar listagem do CommunityDragon, gerar inventário |
| `tools/dump/collector.mjs` | Servidor HTTP local que recebe JSON do plugin |
| `tools/dump/pengu-plugin/index.js` | Plugin Pengu descartável: sonda o ambiente |
| `tools/dump/install-plugin.mjs` | Copiar ou remover o plugin na pasta do Pengu |
| `tools/dump/baseline.ps1` | Medir memória e CPU dos processos do client |
| `tools/dump/anonymize.mjs` | Remover segredos e dados pessoais de eventos (puro) |
| `tools/dump/record-lib.mjs` | Converter mensagens do WebSocket em linhas de gravação (puro) |
| `tools/dump/record.mjs` | Gravar sessão em `dump-raw/sessions/` |
| `tools/dump/anonymize-session.mjs` | Gerar a gravação anonimizada em `docs/dump/sessions/` |
| `tools/dump/decisions.json` | Decisão por plugin de interface da Riot |
| `tools/dump/screens-lib.mjs` | Cruzar plugins, endpoints e decisões (puro) |
| `tools/dump/screens.mjs` | Gerar `docs/dump/screens.md` |
| `docs/dump/REPORT.md` | Relatório final |

---

### Task 1: Ferramental e conexão com a LCU

**Files:**
- Create: `package.json`
- Modify: `.gitignore`
- Create: `tools/dump/riotgames.pem`
- Create: `tools/dump/lcu.mjs`
- Create: `tools/dump/ping.mjs`
- Test: `tools/dump/lcu.test.mjs`

**Interfaces:**
- Produces:
  - `LEAGUE_DIR: string`
  - `RIOT_CA: Buffer` (certificado raiz da Riot; passar como `ca` em qualquer conexão TLS com a LCU)
  - `parseLockfile(text: string): { port: number, password: string, protocol: string }`
  - `readCredentials(dir?: string): { port, password, protocol }` (lança `Error` com mensagem em português se o `lockfile` não existir)
  - `authHeader(password: string): string`
  - `lcuGet(creds, path: string): Promise<{ status: number, body: Buffer }>`
  - `lcuJson(creds, path: string): Promise<any>` (lança se o status não for 200)

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "reimaginedlc",
  "private": true,
  "type": "module",
  "license": "MIT",
  "engines": { "node": ">=24.2" },
  "scripts": {
    "test": "node --test \"tools/**/*.test.mjs\"",
    "dump:ping": "node tools/dump/ping.mjs",
    "dump:api": "node tools/dump/fetch-api.mjs",
    "dump:assets": "node tools/dump/fetch-assets.mjs",
    "dump:collector": "node tools/dump/collector.mjs",
    "dump:plugin:install": "node tools/dump/install-plugin.mjs",
    "dump:plugin:remove": "node tools/dump/install-plugin.mjs --remove",
    "dump:record": "node tools/dump/record.mjs",
    "dump:anonymize": "node tools/dump/anonymize-session.mjs",
    "dump:screens": "node tools/dump/screens.mjs"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "ws": "^8.18.0"
  }
}
```

- [ ] **Step 2: Acrescentar `dump-raw/` ao `.gitignore`**

Conteúdo final do `.gitignore`:

```
.superpowers/
node_modules/
dist/
dump-raw/
```

- [ ] **Step 3: Instalar dependências**

Run: `npm install`
Expected: cria `node_modules/` e `package-lock.json`, sem erros.

- [ ] **Step 4: Baixar o certificado raiz da Riot**

A LCU usa um certificado emitido pela raiz própria da Riot. A Riot publica essa raiz; com ela o TLS é validado de verdade (verificado em 2026-10-03: `GET` com `ca` apontando para este arquivo responde 200).

Run: `curl -s -o tools/dump/riotgames.pem https://static.developer.riotgames.com/docs/lol/riotgames.pem`
Expected: arquivo de cerca de 1,5 KB cuja primeira linha é `-----BEGIN CERTIFICATE-----`.

- [ ] **Step 5: Escrever o teste que falha**

`tools/dump/lcu.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLockfile, readCredentials, authHeader } from './lcu.mjs';

test('parseLockfile extrai porta, senha e protocolo', () => {
  assert.deepEqual(parseLockfile('LeagueClient:1234:60398:abcDEF-_123:https\n'), {
    port: 60398,
    password: 'abcDEF-_123',
    protocol: 'https',
  });
});

test('parseLockfile rejeita conteúdo malformado', () => {
  assert.throws(() => parseLockfile('lixo'), /lockfile inválido/);
  assert.throws(() => parseLockfile('a:b:naoporta:d:e'), /lockfile inválido/);
});

test('readCredentials explica quando o client está fechado', () => {
  const vazio = mkdtempSync(join(tmpdir(), 'rlc-'));
  assert.throws(() => readCredentials(vazio), /Client do League não está aberto/);
});

test('authHeader monta Basic com usuário riot', () => {
  assert.equal(authHeader('pw'), 'Basic ' + Buffer.from('riot:pw').toString('base64'));
});
```

- [ ] **Step 6: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `lcu.mjs`.

- [ ] **Step 7: Implementar `tools/dump/lcu.mjs`**

```js
import { readFileSync } from 'node:fs';
import { request } from 'node:https';
import { join } from 'node:path';

export const LEAGUE_DIR = process.env.LEAGUE_DIR ?? 'C:\\Riot Games\\League of Legends';
export const RIOT_CA = readFileSync(new URL('./riotgames.pem', import.meta.url));

export function parseLockfile(text) {
  const parts = text.trim().split(':');
  if (parts.length !== 5 || !/^\d+$/.test(parts[2])) {
    throw new Error('lockfile inválido: esperado name:pid:port:password:protocol');
  }
  return { port: Number(parts[2]), password: parts[3], protocol: parts[4] };
}

export function readCredentials(dir = LEAGUE_DIR) {
  let text;
  try {
    text = readFileSync(join(dir, 'lockfile'), 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`Client do League não está aberto (lockfile não encontrado em ${dir}). Abra o client ou defina LEAGUE_DIR.`);
    }
    throw e;
  }
  return parseLockfile(text);
}

export function authHeader(password) {
  return 'Basic ' + Buffer.from(`riot:${password}`).toString('base64');
}

export function lcuGet(creds, path) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: creds.port,
        path,
        method: 'GET',
        headers: { Authorization: authHeader(creds.password), Accept: 'application/json' },
        ca: RIOT_CA,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

export async function lcuJson(creds, path) {
  const { status, body } = await lcuGet(creds, path);
  if (status !== 200) throw new Error(`GET ${path} -> ${status}`);
  return JSON.parse(body.toString('utf8'));
}

/** Encerra um script de linha de comando com mensagem de uma linha, sem stack trace. */
export function fail(e) {
  console.error(`erro: ${e.message}`);
  process.exit(1);
}
```

- [ ] **Step 8: Implementar `tools/dump/ping.mjs`**

```js
import { readCredentials, lcuJson, fail } from './lcu.mjs';

try {
  const creds = readCredentials();
  const phase = await lcuJson(creds, '/lol-gameflow/v1/gameflow-phase');
  const build = await lcuJson(creds, '/system/v1/builds');
  console.log(`LCU ok na porta ${creds.port}. Versão ${build.version}. Fase: ${phase}`);
} catch (e) {
  fail(e);
}
```

- [ ] **Step 9: Rodar os testes**

Run: `npm test`
Expected: PASS, 4 testes.

- [ ] **Step 10: Verificar contra o client real [manual: client aberto]**

Run: `npm run dump:ping`
Expected: `LCU ok na porta <n>. Versão <x.y.z...>. Fase: <fase>`.
Com o client fechado, o esperado é `erro: Client do League não está aberto (...)` e código de saída 1.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .gitignore tools/dump/riotgames.pem tools/dump/lcu.mjs tools/dump/lcu.test.mjs tools/dump/ping.mjs
git commit -m "Add dump tooling scaffold and LCU connection"
```

---

### Task 2: Descrição da API LCU e tipos TypeScript

**Files:**
- Create: `tools/dump/gen-types.mjs`
- Create: `tools/dump/fetch-api.mjs`
- Test: `tools/dump/gen-types.test.mjs`
- Gerados: `docs/dump/lcu/help-full.json`, `docs/dump/lcu/endpoints.json`, `docs/dump/lcu/events.json`, `docs/dump/lcu/version.json`, `docs/dump/lcu/lcu-types.d.ts`

**Interfaces:**
- Consumes: `readCredentials`, `lcuJson`, `fail` de `./lcu.mjs`
- Produces:
  - `ident(name: string): string`
  - `tsType(t: { type: string, elementType?: string } | undefined): string`
  - `genTypes(help: { types: any[], functions: any[] }): string`
  - `docs/dump/lcu/endpoints.json`: `Array<{ name, method, url, plugin: string | null, args: Array<{ name, optional, type }>, returns: string }>`. `plugin` é o texto da tag `Plugin <nome>` sem o prefixo, por exemplo `"lol-lobby"`.

Formato real de `/help?format=Full` (verificado): `{ events: [...], functions: [...], types: [...] }`. Um tipo: `{ name, fields: [{ name, optional, type: { type, elementType } }], values: [{ name, value }] }`. Enum tem `values` preenchido e `fields` vazio. Valores de `type.type` observados: `int8 int16 int32 int64 uint8 uint16 uint32 uint64 float double string bool object vector map`, vazio (`""`) e nomes de tipos (alguns começam com minúscula, como `basicSystemInfo`). Uma função: `{ name, arguments: [{ name, optional, type }], returns: { type, elementType }, tags: [..., "Plugin lol-lobby"] }`, sem URL. A URL e o método vêm de `/help?target=<nome>&format=Console`, que responde `{ "<nome>": { http_method, url, ... } }`.

- [ ] **Step 1: Escrever os testes que falham**

`tools/dump/gen-types.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ident, tsType, genTypes } from './gen-types.mjs';

test('tsType converte primitivos', () => {
  for (const n of ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double']) {
    assert.equal(tsType({ type: n }), 'number');
  }
  assert.equal(tsType({ type: 'string' }), 'string');
  assert.equal(tsType({ type: 'bool' }), 'boolean');
  assert.equal(tsType({ type: 'object' }), 'unknown');
});

test('tsType trata tipo vazio e ausente como unknown', () => {
  assert.equal(tsType({ type: '' }), 'unknown');
  assert.equal(tsType(undefined), 'unknown');
});

test('tsType converte vector e map', () => {
  assert.equal(tsType({ type: 'vector', elementType: 'LolLobbyMember' }), 'LolLobbyMember[]');
  assert.equal(tsType({ type: 'vector', elementType: 'string' }), 'string[]');
  assert.equal(tsType({ type: 'vector', elementType: '' }), 'unknown[]');
  assert.equal(tsType({ type: 'map', elementType: 'int32' }), 'Record<string, number>');
});

test('ident produz identificador TypeScript válido', () => {
  assert.equal(ident('basicSystemInfo'), 'basicSystemInfo');
  assert.equal(ident('Foo-Bar<Baz>'), 'Foo_Bar_Baz_');
  assert.equal(ident('3dThing'), '_3dThing');
});

test('genTypes emite enum como união de strings', () => {
  const out = genTypes({
    types: [{ name: 'Phase', fields: [], values: [{ name: 'None', value: 0 }, { name: 'Lobby', value: 1 }] }],
    functions: [],
  });
  assert.match(out, /export type Phase = "None" \| "Lobby";/);
});

test('genTypes emite interface com campo opcional e nome de campo entre aspas', () => {
  const out = genTypes({
    types: [{
      name: 'Lobby',
      values: [],
      fields: [
        { name: 'partyId', optional: false, type: { type: 'string', elementType: '' } },
        { name: 'weird-name', optional: true, type: { type: 'vector', elementType: 'Member' } },
      ],
    }],
    functions: [],
  });
  assert.match(out, /export interface Lobby \{\n  "partyId": string;\n  "weird-name"\?: Member\[\];\n\}/);
});

test('genTypes declara como unknown os tipos referenciados e não definidos', () => {
  const out = genTypes({
    types: [{ name: 'A', values: [], fields: [{ name: 'b', optional: false, type: { type: 'Missing', elementType: '' } }] }],
    functions: [{ name: 'GetX', arguments: [{ name: 'q', optional: false, type: { type: 'vector', elementType: 'AlsoMissing' } }], returns: { type: 'Ghost', elementType: '' }, tags: [] }],
  });
  assert.match(out, /export type Missing = unknown;/);
  assert.match(out, /export type AlsoMissing = unknown;/);
  assert.match(out, /export type Ghost = unknown;/);
});

test('genTypes ignora tipo com nome repetido', () => {
  const t = { name: 'Dup', values: [], fields: [] };
  const out = genTypes({ types: [t, t], functions: [] });
  assert.equal(out.match(/export interface Dup /g).length, 1);
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `gen-types.mjs`.

- [ ] **Step 3: Implementar `tools/dump/gen-types.mjs`**

```js
const NUM = new Set(['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double']);
const BUILTIN = new Set([...NUM, 'string', 'bool', 'object', 'vector', 'map', '']);

export const ident = (name) => name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');

export function tsType(t) {
  if (!t || !t.type) return 'unknown';
  // ponytail: int64/uint64 viram number; perdem precisão acima de 2^53.
  // Se algum ID da LCU passar disso, trocar por string no ponto de uso.
  if (NUM.has(t.type)) return 'number';
  if (t.type === 'string') return 'string';
  if (t.type === 'bool') return 'boolean';
  if (t.type === 'object') return 'unknown';
  if (t.type === 'vector') return `${tsType({ type: t.elementType })}[]`;
  if (t.type === 'map') return `Record<string, ${tsType({ type: t.elementType })}>`;
  return ident(t.type);
}

export function genTypes(help) {
  const out = ['// Gerado por tools/dump/fetch-api.mjs a partir de /help?format=Full. Não editar.', ''];
  const defined = new Set();
  const referenced = new Set();
  const ref = (t) => {
    if (!t) return;
    for (const n of [t.type, t.elementType]) if (n && !BUILTIN.has(n)) referenced.add(ident(n));
  };

  for (const t of help.types) {
    const name = ident(t.name);
    if (defined.has(name)) continue;
    defined.add(name);
    if (t.values?.length) {
      out.push(`export type ${name} = ${t.values.map((v) => JSON.stringify(v.name)).join(' | ')};`);
      continue;
    }
    out.push(`export interface ${name} {`);
    for (const f of t.fields ?? []) {
      ref(f.type);
      out.push(`  ${JSON.stringify(f.name)}${f.optional ? '?' : ''}: ${tsType(f.type)};`);
    }
    out.push('}');
  }

  for (const f of help.functions) {
    ref(f.returns);
    for (const a of f.arguments ?? []) ref(a.type);
  }
  for (const n of [...referenced].sort()) if (!defined.has(n)) out.push(`export type ${n} = unknown;`);

  return out.join('\n') + '\n';
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS, 12 testes no total.

- [ ] **Step 5: Implementar `tools/dump/fetch-api.mjs`**

```js
import { mkdirSync, writeFileSync } from 'node:fs';
import { readCredentials, lcuJson, fail } from './lcu.mjs';
import { genTypes, tsType } from './gen-types.mjs';

const OUT = 'docs/dump/lcu';
const save = (name, data) =>
  writeFileSync(`${OUT}/${name}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');

try {
  const creds = readCredentials();
  mkdirSync(OUT, { recursive: true });

  const help = await lcuJson(creds, '/help?format=Full');
  const build = await lcuJson(creds, '/system/v1/builds');

  const httpFns = help.functions.filter((f) => /^(Get|Post|Put|Patch|Delete|Head)[A-Z]/.test(f.name));
  const endpoints = [];
  for (let i = 0; i < httpFns.length; i += 16) {
    const batch = await Promise.all(
      httpFns.slice(i, i + 16).map(async (f) => {
        const detail = (await lcuJson(creds, `/help?target=${encodeURIComponent(f.name)}&format=Console`))[f.name];
        if (!detail?.url) return null;
        return {
          name: f.name,
          method: detail.http_method,
          url: detail.url,
          plugin: (f.tags.find((t) => t.startsWith('Plugin ')) ?? '').slice('Plugin '.length) || null,
          args: (f.arguments ?? []).map((a) => ({ name: a.name, optional: a.optional, type: tsType(a.type) })),
          returns: tsType(f.returns),
        };
      }),
    );
    endpoints.push(...batch.filter(Boolean));
  }
  endpoints.sort((a, b) => a.url.localeCompare(b.url) || a.method.localeCompare(b.method));

  save('help-full.json', JSON.stringify(help) + '\n');
  save('endpoints.json', endpoints);
  save('events.json', help.events.map((e) => e.name).sort());
  save('version.json', { client: build.version, capturedAt: new Date().toISOString() });
  save('lcu-types.d.ts', genTypes(help));

  console.log(`${endpoints.length} endpoints, ${help.types.length} tipos, ${help.events.length} eventos. Client ${build.version}.`);
} catch (e) {
  fail(e);
}
```

- [ ] **Step 6: Gerar contra o client real [manual: client aberto]**

Run: `npm run dump:api`
Expected: uma linha como `1450 endpoints, 3605 tipos, 930 eventos. Client <versão>.` (os números variam por patch; endpoints acima de 1000).

- [ ] **Step 7: Validar o TypeScript gerado**

Run: `npx tsc --noEmit --strict docs/dump/lcu/lcu-types.d.ts`
Expected: sem saída, código 0. Se houver erro, o caso que o causou vira um teste novo em `gen-types.test.mjs` antes da correção.

- [ ] **Step 8: Conferir um endpoint conhecido**

Run: `node -e "const e=JSON.parse(require('fs').readFileSync('docs/dump/lcu/endpoints.json','utf8'));console.log(e.find(x=>x.url==='/lol-gameflow/v1/gameflow-phase'&&x.method==='GET'))"`
Expected: objeto com `name: 'GetLolGameflowV1GameflowPhase'`, `plugin: 'lol-gameflow'`, `returns: 'LolGameflowGameflowPhase'`.

- [ ] **Step 9: Commit**

```bash
git add tools/dump/gen-types.mjs tools/dump/gen-types.test.mjs tools/dump/fetch-api.mjs docs/dump/lcu
git commit -m "Add LCU API description dump and generated types"
```

---

### Task 3: Inventário de assets

**Files:**
- Create: `tools/dump/assets-lib.mjs`
- Create: `tools/dump/fetch-assets.mjs`
- Test: `tools/dump/assets-lib.test.mjs`
- Gerados: `docs/dump/assets/inventory.json`, `docs/dump/assets/inventory.md`
- Bruto (fora do git): `dump-raw/cdragon-files.txt`

**Interfaces:**
- Consumes: `readCredentials`, `lcuGet`, `lcuJson`, `fail` de `./lcu.mjs`
- Produces:
  - `parseAssetPath(line: string): { plugin, locale, rest, ext } | null`
  - `category(ext: string): 'imagem' | 'video' | 'audio' | 'fonte' | 'codigo' | 'dados' | 'outro'`
  - `clientUrl(p: { plugin, rest }): string | null`
  - `summarize(lines: Iterable<string>): Record<plugin, Record<categoria, { count: number, localized: number, samples: string[] }>>`
  - `DECISION: Record<categoria, string>`

Fonte: `https://raw.communitydragon.org/latest/cdragon/files.exported.txt` (cerca de 55 MB, 720 mil linhas). Cada linha é um caminho como `plugins/rcp-fe-lol-champ-select/global/default/images/x.png` ou `plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png`. O quarto segmento é o locale (`default` ou `pt_br`, `ar_ae`...). Linhas que começam com `game/` são assets do jogo, não do client, e ficam fora.

Correspondência com as rotas do client:
- `plugins/rcp-fe-<x>/global/default/<resto>` é servido em `/fe/<x>/<resto>`
- `plugins/rcp-be-lol-game-data/global/default/<resto>` é servido em `/lol-game-data/assets/<resto>`

- [ ] **Step 1: Escrever os testes que falham**

`tools/dump/assets-lib.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAssetPath, category, clientUrl, summarize } from './assets-lib.mjs';

test('parseAssetPath separa plugin, locale, resto e extensão', () => {
  assert.deepEqual(parseAssetPath('plugins/rcp-fe-lol-champ-select/global/default/images/a.b.PNG'), {
    plugin: 'rcp-fe-lol-champ-select',
    locale: 'default',
    rest: 'images/a.b.PNG',
    ext: 'png',
  });
});

test('parseAssetPath ignora o que não é plugin do client', () => {
  assert.equal(parseAssetPath('game/assets/x.png'), null);
  assert.equal(parseAssetPath('chrome_100_percent.pak'), null);
  assert.equal(parseAssetPath('plugins/rcp-fe-x/global'), null);
  assert.equal(parseAssetPath(''), null);
});

test('category agrupa por extensão', () => {
  assert.equal(category('png'), 'imagem');
  assert.equal(category('svg'), 'imagem');
  assert.equal(category('webm'), 'video');
  assert.equal(category('ogg'), 'audio');
  assert.equal(category('ttf'), 'fonte');
  assert.equal(category('js'), 'codigo');
  assert.equal(category('json'), 'dados');
  assert.equal(category('xyz'), 'outro');
});

test('clientUrl mapeia para as rotas do client', () => {
  assert.equal(clientUrl({ plugin: 'rcp-fe-lol-champ-select', rest: 'images/a.png' }), '/fe/lol-champ-select/images/a.png');
  assert.equal(clientUrl({ plugin: 'rcp-be-lol-game-data', rest: 'v1/champion-icons/1.png' }), '/lol-game-data/assets/v1/champion-icons/1.png');
  assert.equal(clientUrl({ plugin: 'rcp-be-sanitizer', rest: 'x.json' }), null);
});

test('summarize conta por plugin e categoria, separa localizados e guarda até 3 exemplos', () => {
  const s = summarize([
    'plugins/rcp-fe-lol-loot/global/default/a.png',
    'plugins/rcp-fe-lol-loot/global/default/b.png',
    'plugins/rcp-fe-lol-loot/global/default/c.png',
    'plugins/rcp-fe-lol-loot/global/default/d.png',
    'plugins/rcp-fe-lol-loot/global/pt_br/trans.json',
    'plugins/rcp-fe-lol-loot/global/default/s.ogg',
    'game/assets/ignored.png',
  ]);
  assert.equal(s['rcp-fe-lol-loot'].imagem.count, 4);
  assert.equal(s['rcp-fe-lol-loot'].imagem.localized, 0);
  assert.deepEqual(s['rcp-fe-lol-loot'].imagem.samples, ['/fe/lol-loot/a.png', '/fe/lol-loot/b.png', '/fe/lol-loot/c.png']);
  assert.equal(s['rcp-fe-lol-loot'].dados.count, 0);
  assert.equal(s['rcp-fe-lol-loot'].dados.localized, 1);
  assert.equal(s['rcp-fe-lol-loot'].audio.count, 1);
  assert.equal(Object.keys(s).length, 1);
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `assets-lib.mjs`.

- [ ] **Step 3: Implementar `tools/dump/assets-lib.mjs`**

```js
const CATEGORIES = {
  imagem: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'],
  video: ['webm', 'mp4'],
  audio: ['ogg', 'mp3', 'wav'],
  fonte: ['ttf', 'otf', 'woff', 'woff2'],
  codigo: ['js', 'css', 'html', 'hbs', 'map'],
  dados: ['json', 'txt', 'yaml', 'yml'],
};
const BY_EXT = Object.fromEntries(Object.entries(CATEGORIES).flatMap(([cat, exts]) => exts.map((e) => [e, cat])));

export const DECISION = {
  imagem: 'reutilizar por referência',
  video: 'reutilizar por referência',
  audio: 'reutilizar por referência',
  fonte: 'reutilizar por referência',
  codigo: 'ignorar',
  dados: 'ignorar (a LCU já entrega dados e textos localizados)',
  outro: 'ignorar',
};

export const category = (ext) => BY_EXT[ext] ?? 'outro';

export function parseAssetPath(line) {
  const parts = line.trim().split('/');
  if (parts[0] !== 'plugins' || parts.length < 5) return null;
  const rest = parts.slice(4).join('/');
  const dot = rest.lastIndexOf('.');
  return { plugin: parts[1], locale: parts[3], rest, ext: dot === -1 ? '' : rest.slice(dot + 1).toLowerCase() };
}

export function clientUrl({ plugin, rest }) {
  if (plugin === 'rcp-be-lol-game-data') return `/lol-game-data/assets/${rest}`;
  if (plugin.startsWith('rcp-fe-')) return `/fe/${plugin.slice('rcp-fe-'.length)}/${rest}`;
  return null;
}

export function summarize(lines) {
  const out = {};
  for (const line of lines) {
    const p = parseAssetPath(line);
    if (!p) continue;
    const bucket = ((out[p.plugin] ??= {})[category(p.ext)] ??= { count: 0, localized: 0, samples: [] });
    if (p.locale !== 'default') {
      bucket.localized++;
      continue;
    }
    bucket.count++;
    const url = clientUrl(p);
    if (url && bucket.samples.length < 3) bucket.samples.push(url);
  }
  return out;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS, 17 testes no total.

- [ ] **Step 5: Implementar `tools/dump/fetch-assets.mjs`**

```js
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
  // Mede a diferença pedindo ao client uma amostra de URLs.
  const creds = readCredentials();
  const build = await lcuJson(creds, '/system/v1/builds');
  const sample = Object.values(summary).flatMap((cats) => Object.values(cats).flatMap((c) => c.samples.slice(0, 1))).slice(0, 40);
  let hits = 0;
  for (const url of sample) if ((await lcuGet(creds, encodeURI(url))).status === 200) hits++;

  const meta = { client: build.version, listing: LISTING_URL, capturedAt: new Date().toISOString(), sampleChecked: sample.length, sampleFound: hits };
  writeFileSync(`${OUT}/inventory.json`, JSON.stringify({ meta, wadMB, summary }, null, 2) + '\n');

  const md = [
    '# Inventário de assets do client',
    '',
    `Client ${meta.client}. Listagem: CommunityDragon \`latest\`. Amostra conferida no client: ${hits} de ${sample.length} URLs responderam 200.`,
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
```

- [ ] **Step 6: Gerar o inventário [manual: client aberto]**

Run: `npm run dump:assets`
Expected: `<n> plugins inventariados. Amostra no client: <a>/<b>.` com `n` acima de 40 e `a/b` acima de 80%. Abaixo disso, a regra de `clientUrl` está errada para algum plugin: abrir `docs/dump/assets/inventory.json`, testar os exemplos que falham e corrigir a regra com um teste novo antes de seguir.

- [ ] **Step 7: Confirmar que nada bruto entrou no git**

Run: `git status --short`
Expected: aparecem `docs/dump/assets/` e os arquivos de `tools/dump/`. Não aparece `dump-raw/`.

- [ ] **Step 8: Commit**

```bash
git add tools/dump/assets-lib.mjs tools/dump/assets-lib.test.mjs tools/dump/fetch-assets.mjs docs/dump/assets
git commit -m "Add client asset inventory"
```

---

### Task 4: Perfil do ambiente de execução

**Files:**
- Create: `tools/dump/collector.mjs`
- Create: `tools/dump/pengu-plugin/index.js`
- Create: `tools/dump/install-plugin.mjs`
- Test: `tools/dump/collector.test.mjs`
- Gerados: `docs/dump/env/env.json`, `docs/dump/env/hotkey.json`

**Interfaces:**
- Produces:
  - `PORT = 47615`
  - `createCollector(outDir: string, log?: (msg: string) => void): http.Server`. Aceita `POST /env` e `POST /hotkey` com JSON de até 1 MB e grava `<outDir>/<nome>.json`. Responde 204 em sucesso, 404 para nome fora da lista ou método diferente, 400 para JSON inválido, 413 acima do limite.

Contexto Pengu: um plugin é uma pasta em `C:\Program Files\Pengu Loader\plugins\` com `index.js` em formato ES module. O Pengu chama a função exportada `load()` quando a janela do client termina de carregar. `Ctrl+Shift+R` recarrega o client.

- [ ] **Step 1: Escrever os testes que falham**

`tools/dump/collector.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCollector } from './collector.mjs';

async function withServer(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'rlc-col-'));
  const server = createCollector(dir, () => {});
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, dir);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('grava JSON de nome permitido', () =>
  withServer(async (base, dir) => {
    const res = await post(`${base}/env`, '{"a":1}');
    assert.equal(res.status, 204);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'env.json'), 'utf8')), { a: 1 });
  }));

test('responde ao preflight com cabeçalhos CORS', () =>
  withServer(async (base) => {
    const res = await fetch(`${base}/env`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  }));

test('recusa nome fora da lista, inclusive tentativa de sair da pasta', () =>
  withServer(async (base, dir) => {
    assert.equal((await post(`${base}/outro`, '{}')).status, 404);
    assert.equal((await post(`${base}/..%2Fenv`, '{}')).status, 404);
    assert.equal((await fetch(`${base}/env`)).status, 404);
    assert.equal(existsSync(join(dir, 'outro.json')), false);
  }));

test('recusa JSON inválido', () =>
  withServer(async (base, dir) => {
    assert.equal((await post(`${base}/env`, 'nao-json')).status, 400);
    assert.equal(existsSync(join(dir, 'env.json')), false);
  }));

test('recusa corpo acima de 1 MB sem gravar', () =>
  withServer(async (base, dir) => {
    const big = JSON.stringify({ x: 'a'.repeat(1_100_000) });
    // A conexão pode ser derrubada antes da resposta; os dois desfechos são recusa.
    const status = await post(`${base}/env`, big).then((r) => r.status, () => 'derrubada');
    assert.ok(status === 413 || status === 'derrubada');
    assert.equal(existsSync(join(dir, 'env.json')), false);
  }));
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `collector.mjs`.

- [ ] **Step 3: Implementar `tools/dump/collector.mjs`**

```js
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const PORT = 47615;
const ALLOWED = new Set(['env', 'hotkey']);
const MAX_BYTES = 1_000_000;

export function createCollector(outDir, log = console.log) {
  return createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') return void res.writeHead(204).end();

    const name = req.url.slice(1);
    if (req.method !== 'POST' || !ALLOWED.has(name)) return void res.writeHead(404).end();

    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on('data', (c) => {
      if (rejected) return;
      size += c.length;
      if (size > MAX_BYTES) {
        rejected = true;
        res.writeHead(413).end();
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (rejected) return;
      let data;
      try {
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return void res.writeHead(400).end();
      }
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
      log(`recebido: ${name}`);
      res.writeHead(204).end();
    });
  });
}

if (import.meta.main) {
  createCollector('docs/dump/env').listen(PORT, '127.0.0.1', () =>
    console.log(`coletor em http://127.0.0.1:${PORT} gravando em docs/dump/env (Ctrl+C para sair)`),
  );
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS, 22 testes no total.

- [ ] **Step 5: Escrever o plugin de coleta `tools/dump/pengu-plugin/index.js`**

```js
// Plugin Pengu descartável do ReimaginedLC. Sonda o ambiente e envia ao coletor local.
// Não faz parte do produto. Remover com `npm run dump:plugin:remove` após o uso.
const COLLECTOR = 'http://127.0.0.1:47615';

async function send(name, data) {
  try {
    const res = await fetch(`${COLLECTOR}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return true;
  } catch (e) {
    // Sem coletor: o JSON fica no console (F12) para copiar à mão.
    console.log(`[rlc-dump] ${name} (coletor falhou: ${e.message})`, JSON.stringify(data));
    return false;
  }
}

function describeGlobal(name) {
  const v = window[name];
  const type = typeof v;
  const keys = v && (type === 'object' || type === 'function') ? Object.getOwnPropertyNames(v).slice(0, 50) : [];
  return { type, keys };
}

function probe() {
  const video = document.createElement('video');
  const can = (mime) => video.canPlayType(mime) || 'no';
  const css = (...args) => CSS.supports(...args);
  const canvas = document.createElement('canvas');

  return {
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    chromium: (navigator.userAgent.match(/Chrome\/([\d.]+)/) ?? [])[1] ?? null,
    window: { width: innerWidth, height: innerHeight, devicePixelRatio },
    memory: performance.memory
      ? { usedJSHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576), totalJSHeapMB: Math.round(performance.memory.totalJSHeapSize / 1048576) }
      : null,
    features: {
      viewTransitions: typeof document.startViewTransition === 'function',
      backdropFilter: css('backdrop-filter', 'blur(2px)'),
      hasSelector: css('selector(:has(*))'),
      containerQueries: css('container-type', 'inline-size'),
      cssNesting: css('selector(&)'),
      colorMix: css('color', 'color-mix(in srgb, red, blue)'),
      popover: 'popover' in HTMLElement.prototype,
      webAnimations: typeof Element.prototype.animate === 'function',
      offscreenCanvas: typeof OffscreenCanvas === 'function',
      webgl2: !!canvas.getContext('webgl2'),
      webpEncode: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
    },
    codecs: {
      h264: can('video/mp4; codecs="avc1.42E01E"'),
      hevc: can('video/mp4; codecs="hvc1.1.6.L93.B0"'),
      av1: can('video/mp4; codecs="av01.0.05M.08"'),
      vp8: can('video/webm; codecs="vp8"'),
      vp9: can('video/webm; codecs="vp9"'),
      aac: can('audio/mp4; codecs="mp4a.40.2"'),
      opus: can('audio/webm; codecs="opus"'),
      vorbis: can('audio/ogg; codecs="vorbis"'),
    },
    pengu: Object.fromEntries(
      ['Pengu', 'DataStore', 'PluginFS', 'CommandBar', 'Toast', 'Effect', 'openDevTools', 'openPluginsFolder', 'openAssetsFolder', 'reloadClient', 'restartClient', 'getScriptPath', '__llver'].map((n) => [n, describeGlobal(n)]),
    ),
    penguVersion: window.Pengu?.version ?? window.__llver ?? null,
    lcuSocketLink: !!document.querySelector('link[rel="riot:plugins:websocket"]'),
  };
}

export async function load() {
  const ok = await send('env', probe());
  window.Toast?.success?.(ok ? 'rlc-dump: ambiente enviado ao coletor' : 'rlc-dump: coletor fora do ar, veja o console');

  // Confirma que um listener de teclado comum recebe Ctrl+Shift+F12 dentro do client.
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        send('hotkey', { received: true, key: e.key, code: e.code, capturedAt: new Date().toISOString() });
        window.Toast?.success?.('rlc-dump: Ctrl+Shift+F12 recebido');
      }
    },
    true,
  );
}
```

- [ ] **Step 6: Implementar `tools/dump/install-plugin.mjs`**

```js
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fail } from './lcu.mjs';

const PENGU_DIR = process.env.PENGU_DIR ?? 'C:\\Program Files\\Pengu Loader';
const TARGET = join(PENGU_DIR, 'plugins', 'zz-rlc-dump');

try {
  if (!existsSync(join(PENGU_DIR, 'plugins'))) throw new Error(`pasta de plugins do Pengu não encontrada em ${PENGU_DIR}. Defina PENGU_DIR.`);
  if (process.argv.includes('--remove')) {
    rmSync(TARGET, { recursive: true, force: true });
    console.log(`removido: ${TARGET}`);
  } else {
    cpSync('tools/dump/pengu-plugin', TARGET, { recursive: true });
    console.log(`instalado: ${TARGET}`);
  }
} catch (e) {
  if (e.code === 'EPERM' || e.code === 'EACCES') {
    fail(new Error(`sem permissão para escrever em ${TARGET}. Rode o terminal como administrador.`));
  }
  fail(e);
}
```

- [ ] **Step 7: Coletar o ambiente [manual: client aberto, fase `None` ou `Lobby`]**

1. Run: `npm run dump:ping` e confirmar que a fase é `None` ou `Lobby`.
2. Em um terminal separado: `npm run dump:collector` (fica rodando).
3. Run: `npm run dump:plugin:install`
4. No client: `Ctrl+Shift+R` para recarregar.
5. Aguardar o toast "rlc-dump: ambiente enviado ao coletor". O terminal do coletor mostra `recebido: env`.
6. No client: pressionar `Ctrl+Shift+F12`. O terminal do coletor mostra `recebido: hotkey`.
7. Run: `npm run dump:plugin:remove` e recarregar o client com `Ctrl+Shift+R`.
8. Encerrar o coletor com `Ctrl+C`.

Se o toast disser que o coletor está fora do ar: abrir o DevTools (F12), copiar o JSON da linha `[rlc-dump] env` para `docs/dump/env/env.json` e registrar no relatório (Task 7) que `fetch` para `http://127.0.0.1` é bloqueado dentro do client.
Se `Ctrl+Shift+F12` não gerar `hotkey.json`: criar `docs/dump/env/hotkey.json` com `{ "received": false }`. A Task 7 trata disso.

- [ ] **Step 8: Conferir o resultado**

Run: `node -e "const e=JSON.parse(require('fs').readFileSync('docs/dump/env/env.json','utf8'));console.log(e.chromium,e.features,e.codecs,e.penguVersion)"`
Expected: versão do Chromium preenchida (não `null`), objeto `features` com booleanos, objeto `codecs` com `probably`, `maybe` ou `no`.

- [ ] **Step 9: Commit**

```bash
git add tools/dump/collector.mjs tools/dump/collector.test.mjs tools/dump/pengu-plugin tools/dump/install-plugin.mjs docs/dump/env
git commit -m "Add runtime environment probe"
```

---

### Task 5: Medição de base

**Files:**
- Create: `tools/dump/baseline.ps1`
- Gerados: `docs/dump/baseline/sem-plugins.json`, `docs/dump/baseline/plugins-atuais.json`

**Interfaces:**
- Produces: `docs/dump/baseline/<label>.json` com `{ label, takenAt, seconds, logicalCores, processes, workingSetMB: { avg, max }, privateMB: { avg, max }, cpuPercentOfOneCore }`. `cpuPercentOfOneCore` é o tempo de CPU somado dos processos dividido pelo tempo decorrido, em porcentagem de um núcleo.

Não há teste automatizado: o script lê processos reais do sistema. A verificação é rodar e conferir os números.

- [ ] **Step 1: Escrever `tools/dump/baseline.ps1`**

```powershell
param(
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9-]+$')][string]$Label,
  [ValidateRange(10, 600)][int]$Seconds = 60,
  [ValidateRange(1, 30)][int]$Interval = 5
)
$ErrorActionPreference = 'Stop'
$names = 'LeagueClient', 'LeagueClientUx', 'LeagueClientUxRender'

function Get-Snapshot {
  $p = @(Get-Process -Name $names -ErrorAction SilentlyContinue)
  if ($p.Count -eq 0) { throw 'Client do League não está aberto.' }
  [pscustomobject]@{
    t            = Get-Date
    processes    = $p.Count
    workingSetMB = ($p | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    privateMB    = ($p | Measure-Object PrivateMemorySize64 -Sum).Sum / 1MB
    cpuSeconds   = ($p | Measure-Object CPU -Sum).Sum
  }
}

$samples = @(Get-Snapshot)
$count = [math]::Ceiling($Seconds / $Interval)
for ($i = 0; $i -lt $count; $i++) {
  Start-Sleep -Seconds $Interval
  $samples += Get-Snapshot
}

$elapsed = ($samples[-1].t - $samples[0].t).TotalSeconds
$ws = $samples | Measure-Object workingSetMB -Average -Maximum
$pv = $samples | Measure-Object privateMB -Average -Maximum

$result = [ordered]@{
  label               = $Label
  takenAt             = (Get-Date).ToString('o')
  seconds             = [math]::Round($elapsed, 1)
  logicalCores        = [Environment]::ProcessorCount
  processes           = $samples[-1].processes
  workingSetMB        = [ordered]@{ avg = [math]::Round($ws.Average, 1); max = [math]::Round($ws.Maximum, 1) }
  privateMB           = [ordered]@{ avg = [math]::Round($pv.Average, 1); max = [math]::Round($pv.Maximum, 1) }
  cpuPercentOfOneCore = [math]::Round(100 * ($samples[-1].cpuSeconds - $samples[0].cpuSeconds) / $elapsed, 2)
}

New-Item -ItemType Directory -Force 'docs/dump/baseline' | Out-Null
$path = "docs/dump/baseline/$Label.json"
$result | ConvertTo-Json -Depth 4 | Set-Content -Path $path -Encoding utf8
Write-Host "gravado: $path"
$result | ConvertTo-Json -Depth 4
```

- [ ] **Step 2: Verificar a validação de parâmetros**

Run: `pwsh -File tools/dump/baseline.ps1 -Label "../x"`
Expected: erro de validação do parâmetro `Label`, nenhum arquivo criado.

- [ ] **Step 3: Medir com os plugins atuais [manual: client aberto, ocioso na tela inicial, janela em foco]**

Run: `pwsh -File tools/dump/baseline.ps1 -Label plugins-atuais`
Expected: após cerca de 60 s, `gravado: docs/dump/baseline/plugins-atuais.json` e o JSON com `processes` de 3 ou mais e `workingSetMB.avg` na casa das centenas.

- [ ] **Step 4: Medir sem plugins [manual]**

1. Fechar o client.
2. Abrir o Pengu Loader e desativar a opção de ativação (o client passa a abrir sem plugins).
3. Abrir o client, esperar a tela inicial terminar de carregar, deixar ocioso 30 s.
4. Run: `pwsh -File tools/dump/baseline.ps1 -Label sem-plugins`
5. Reativar o Pengu Loader e reabrir o client.

Expected: `gravado: docs/dump/baseline/sem-plugins.json`.

- [ ] **Step 5: Commit**

```bash
git add tools/dump/baseline.ps1 docs/dump/baseline
git commit -m "Add client memory and CPU baseline"
```

---

### Task 6: Gravação de sessão e anonimização

**Files:**
- Create: `tools/dump/anonymize.mjs`
- Create: `tools/dump/record-lib.mjs`
- Create: `tools/dump/record.mjs`
- Create: `tools/dump/anonymize-session.mjs`
- Test: `tools/dump/anonymize.test.mjs`
- Test: `tools/dump/record-lib.test.mjs`
- Gerado: `docs/dump/sessions/ferramenta-de-treino.jsonl`
- Bruto (fora do git): `dump-raw/sessions/ferramenta-de-treino.raw.jsonl`

**Interfaces:**
- Consumes: `readCredentials`, `authHeader`, `lcuGet`, `fail`, `RIOT_CA` de `./lcu.mjs`
- Produces:
  - Formato da gravação (JSON Lines). Primeira linha: `{ "type": "meta", "client": string, "startedAt": string }`. Depois: `{ "type": "snapshot", "t": 0, "uri": string, "status": number, "data": any }` e `{ "type": "event", "t": number, "uri": string, "eventType": "Create" | "Update" | "Delete", "data": any }`, com `t` em milissegundos desde o início.
  - `toLine(raw: string, t: number): object | null`
  - `attach(ws: EventEmitter, write: (line: object) => void, onEnd: (info: { count: number, reason: string }) => void, now?: () => number): void`
  - `anonymize(lines: object[]): object[]`
  - `assertClean(lines: object[], secrets: Iterable<string | number>): void` (lança se sobrar segredo)
  - `collectIdentities(lines: object[]): Map<string | number, string | number>`

Regras de anonimização:
- Linha inteira descartada quando a URI casa com `/token|rso-auth|entitlements|lol-login|league-session/i`.
- Valor trocado por `"[redacted]"` quando a chave casa com `/token|jwt|password|secret|authorization|cookie|credential|encryptionkey/i`, qualquer que seja o tipo do valor.
- Em qualquer string, sequência com formato de JWT vira `"[jwt]"`.
- Identidades: valores sob chaves que casam com `/puuid|summonerid|accountid|gamename|summonername|displayname|internalname|email|username|^pid$|^jid$/i`. Cada valor real distinto recebe um substituto estável (`anon-1`, `anon-2`... para strings de 3 ou mais caracteres; `9000001`, `9000002`... para números de 6 ou mais dígitos). O mesmo valor real vira sempre o mesmo substituto, e é substituído em toda string onde aparecer, inclusive URIs.
- `tagLine` vira `"TAG"`, `body` vira `"[mensagem]"`, `statusMessage` vira `""`.

- [ ] **Step 1: Escrever os testes de anonimização que falham**

`tools/dump/anonymize.test.mjs`:

```js
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
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `anonymize.mjs`.

- [ ] **Step 3: Implementar `tools/dump/anonymize.mjs`**

```js
const DROP_URI = /token|rso-auth|entitlements|lol-login|league-session/i;
const SECRET_KEY = /token|jwt|password|secret|authorization|cookie|credential|encryptionkey/i;
const IDENTITY_KEY = /puuid|summonerid|accountid|gamename|summonername|displayname|internalname|email|username|^pid$|^jid$/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;

const isIdentityValue = (v) =>
  (typeof v === 'string' && v.length >= 3) || (typeof v === 'number' && Number.isInteger(v) && v >= 100000);

function walk(value, key, visit) {
  visit(value, key);
  if (Array.isArray(value)) for (const item of value) walk(item, key, visit);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k, visit);
}

export function collectIdentities(lines) {
  const map = new Map();
  let strings = 0;
  let numbers = 0;
  for (const line of lines) {
    walk(line.data, null, (v, key) => {
      if (key === null || !IDENTITY_KEY.test(key) || !isIdentityValue(v) || map.has(v)) return;
      map.set(v, typeof v === 'string' ? `anon-${++strings}` : 9000000 + ++numbers);
    });
  }
  return map;
}

export function anonymize(lines) {
  const map = collectIdentities(lines);
  // Mais longos primeiro, para "FulanoSmurf" não virar "anon-1Smurf".
  const replacements = [...map].map(([real, fake]) => [String(real), String(fake)]).sort((a, b) => b[0].length - a[0].length);

  // ponytail: O(strings x identidades). Uma sessão tem milhares de strings e dezenas de identidades.
  // Se uma gravação ficar lenta para anonimizar, trocar por uma única regex com alternância.
  const cleanString = (s) => {
    let out = s.replace(JWT, '[jwt]');
    for (const [real, fake] of replacements) out = out.replaceAll(real, fake);
    return out;
  };

  const clean = (value, key) => {
    if (key !== null && SECRET_KEY.test(key)) return '[redacted]';
    if (key === 'tagLine') return 'TAG';
    if (key === 'body') return '[mensagem]';
    if (key === 'statusMessage') return '';
    if (typeof value === 'string') return cleanString(value);
    if (typeof value === 'number') return map.has(value) ? map.get(value) : value;
    if (Array.isArray(value)) return value.map((item) => clean(item, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v, k)]));
    return value;
  };

  return lines
    .filter((line) => !(line.uri && DROP_URI.test(line.uri)))
    .map((line) => (line.uri ? { ...line, uri: cleanString(line.uri), data: clean(line.data, null) } : line));
}

export function assertClean(lines, secrets) {
  const text = JSON.stringify(lines);
  if (new RegExp(JWT.source).test(text)) throw new Error('JWT encontrado na saída anonimizada');
  for (const s of secrets) {
    if (text.includes(String(s))) throw new Error('identidade real encontrada na saída anonimizada');
  }
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS, 32 testes no total.

- [ ] **Step 5: Escrever os testes do gravador que falham**

`tools/dump/record-lib.test.mjs`:

```js
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
```

- [ ] **Step 6: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `record-lib.mjs`.

- [ ] **Step 7: Implementar `tools/dump/record-lib.mjs`**

```js
// URIs de alto volume que a LCU simulada não precisa reproduzir.
const NOISE = /^\/(riot-messaging-service|data-store|lol-patch|patcher|telemetry|lol-telemetry|performance|lol-hovercard)\b/;

export function toLine(raw, t) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed[0] !== 8 || !parsed[2]?.uri) return null;
  const { uri, eventType, data } = parsed[2];
  if (NOISE.test(uri)) return null;
  return { type: 'event', t, uri, eventType, data };
}

export function attach(ws, write, onEnd, now = Date.now) {
  const start = now();
  let count = 0;
  let ended = false;
  const end = (reason) => {
    if (ended) return;
    ended = true;
    onEnd({ count, reason });
  };
  ws.on('message', (buf) => {
    const line = toLine(buf.toString('utf8'), now() - start);
    if (!line) return;
    write(line);
    count++;
  });
  ws.on('close', () => end('conexão com o client encerrada'));
  ws.on('error', (e) => end(`erro no socket: ${e.message}`));
}
```

- [ ] **Step 8: Rodar os testes**

Run: `npm test`
Expected: PASS, 36 testes no total.

- [ ] **Step 9: Implementar `tools/dump/record.mjs`**

```js
import { mkdirSync, openSync, writeSync, closeSync } from 'node:fs';
import WebSocket from 'ws';
import { readCredentials, authHeader, lcuGet, fail, RIOT_CA } from './lcu.mjs';
import { attach } from './record-lib.mjs';

const SNAPSHOT = [
  '/system/v1/builds',
  '/riotclient/region-locale',
  '/lol-gameflow/v1/gameflow-phase',
  '/lol-gameflow/v1/session',
  '/lol-summoner/v1/current-summoner',
  '/lol-chat/v1/me',
  '/lol-chat/v1/friends',
  '/lol-lobby/v2/lobby',
  '/lol-game-queues/v1/queues',
  '/lol-ranked/v1/current-ranked-stats',
  '/lol-champ-select/v1/session',
  '/lol-perks/v1/pages',
];

const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name ?? '')) fail(new Error('uso: npm run dump:record -- <nome-em-minusculas-com-hifens>'));

try {
  const creds = readCredentials();
  mkdirSync('dump-raw/sessions', { recursive: true });
  const path = `dump-raw/sessions/${name}.raw.jsonl`;
  // Escrita síncrona: cada linha chega ao disco antes da próxima, então nada se perde se o processo cair.
  const fd = openSync(path, 'w');
  const write = (line) => writeSync(fd, JSON.stringify(line) + '\n');

  const build = JSON.parse((await lcuGet(creds, '/system/v1/builds')).body.toString('utf8'));
  write({ type: 'meta', client: build.version, startedAt: new Date().toISOString() });
  for (const uri of SNAPSHOT) {
    const { status, body } = await lcuGet(creds, uri);
    let data = null;
    try {
      data = JSON.parse(body.toString('utf8'));
    } catch {}
    write({ type: 'snapshot', t: 0, uri, status, data });
  }

  const ws = new WebSocket(`wss://127.0.0.1:${creds.port}/`, {
    headers: { Authorization: authHeader(creds.password) },
    ca: RIOT_CA,
  });
  const finish = ({ count, reason }) => {
    closeSync(fd);
    console.log(`\n${reason}. ${count} eventos gravados em ${path}`);
    process.exit(0);
  };
  ws.on('open', () => {
    ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
    console.log(`gravando em ${path}. Ctrl+C para encerrar.`);
  });
  attach(ws, write, finish);
  process.on('SIGINT', () => ws.close());
} catch (e) {
  fail(e);
}
```

- [ ] **Step 10: Implementar `tools/dump/anonymize-session.mjs`**

```js
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
```

- [ ] **Step 11: Gravar uma sessão completa [manual: client aberto, fase `None`]**

1. Run: `npm run dump:record -- ferramenta-de-treino`
2. No client: Jogar, Treinamento, Ferramenta de Treino, Confirmar. Iniciar a partida.
3. Na seleção de campeões: escolher um campeão, trocar a página de runas uma vez, confirmar.
4. Esperar a partida carregar. Dentro da partida, sair com Esc, Sair da partida.
5. De volta ao client, esperar a tela de fim de jogo e clicar para voltar ao início.
6. No terminal: `Ctrl+C`.

Expected: `conexão com o client encerrada. <n> eventos gravados em dump-raw/sessions/ferramenta-de-treino.raw.jsonl`, com `n` acima de 200.

- [ ] **Step 12: Anonimizar**

Run: `npm run dump:anonymize -- ferramenta-de-treino`
Expected: duas linhas, a segunda listando as fases, incluindo `Lobby`, `ChampSelect`, `InProgress` e `EndOfGame` (ou `PreEndOfGame`). Se sair `erro: identidade real encontrada...` ou `erro: JWT encontrado...`, nada foi gravado: localizar o campo no arquivo bruto, acrescentar um teste em `anonymize.test.mjs` que reproduza o vazamento, corrigir a regra e repetir.

- [ ] **Step 13: Conferência manual do arquivo que vai para o git**

Run: `node -e "const t=require('fs').readFileSync('docs/dump/sessions/ferramenta-de-treino.jsonl','utf8');console.log('MB',(t.length/1048576).toFixed(1));for(const p of [/eyJ[A-Za-z0-9_-]{8,}\./,/Bearer /i,/@[a-z0-9.-]+\.(com|net|br)\b/i])console.log(String(p),p.test(t))"`
Expected: tamanho abaixo de 20 MB e três linhas terminando em `false`. A terceira regex acusa e-mails; `@na1.pvp.net` de IDs de chat casa com ela, e nesse caso a parte antes do `@` deve ser `anon-N`. Abrir o arquivo e buscar pelo próprio nome de invocador e por nomes de amigos: zero ocorrências.

Se passar de 20 MB: acrescentar o prefixo de URI mais volumoso à regex `NOISE` de `record-lib.mjs` (com teste), regravar e repetir. Para descobrir o prefixo: `node -e "const c={};for(const l of require('fs').readFileSync('docs/dump/sessions/ferramenta-de-treino.jsonl','utf8').split('\n').filter(Boolean)){const u=(JSON.parse(l).uri||'').split('/').slice(0,2).join('/');c[u]=(c[u]||0)+l.length}console.log(Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8))"`

- [ ] **Step 14: Commit**

```bash
git status --short
git add tools/dump/anonymize.mjs tools/dump/anonymize.test.mjs tools/dump/record-lib.mjs tools/dump/record-lib.test.mjs tools/dump/record.mjs tools/dump/anonymize-session.mjs docs/dump/sessions
git commit -m "Add session recorder and anonymized practice tool recording"
```

Antes do commit, a saída de `git status --short` não pode listar nada dentro de `dump-raw/`.

---

### Task 7: Mapa de telas e relatório final

**Files:**
- Create: `tools/dump/decisions.json`
- Create: `tools/dump/screens-lib.mjs`
- Create: `tools/dump/screens.mjs`
- Test: `tools/dump/screens-lib.test.mjs`
- Gerado: `docs/dump/screens.md`
- Create: `docs/dump/REPORT.md`

**Interfaces:**
- Consumes: `docs/dump/lcu/endpoints.json` (Task 2), `docs/dump/env/env.json` e `hotkey.json` (Task 4), `docs/dump/baseline/*.json` (Task 5), `docs/dump/assets/inventory.json` (Task 3), `docs/dump/sessions/ferramenta-de-treino.jsonl` (Task 6); `readCredentials`, `lcuJson`, `fail` de `./lcu.mjs`
- Produces:
  - `buildScreens(plugins: Array<{ fullName: string, dependencies?: Array<string | { fullName: string }> }>, endpoints: Array<{ plugin: string | null }>, decisions: Record<string, { decisao, fase, subprojeto, nota }>): { rows: Array<{ plugin, decisao, fase, subprojeto, nota, backends: string[], endpoints: number }>, missing: string[], pending: string[] }`

Valores válidos de `decisao`: `refazer`, `embutir` (mostrar a tela original da Riot num painel), `cortar`, `infra` (não é tela; continua carregado) e `investigar` (finalidade desconhecida; precisa ser resolvido nesta tarefa).

- [ ] **Step 1: Escrever `tools/dump/decisions.json`**

```json
{
  "rcp-fe-audio": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Motor de som do client." },
  "rcp-fe-common-libs": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Bibliotecas compartilhadas da interface da Riot." },
  "rcp-fe-ember-libs": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Ember da interface da Riot." },
  "rcp-fe-plugin-runner": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Carregador de plugins do client." },
  "rcp-fe-lol-l10n": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Textos localizados da Riot." },
  "rcp-fe-lol-typekit": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Fontes. Candidatas a reutilização por referência." },
  "rcp-fe-lol-uikit": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Componentes visuais da Riot. Fonte de ícones e sons." },
  "rcp-fe-lol-shared-components": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Componentes compartilhados da Riot." },
  "rcp-fe-lol-static-assets": { "decisao": "infra", "fase": "todas", "subprojeto": null, "nota": "Principal fonte de imagens, vídeos e sons reutilizáveis." },
  "rcp-fe-lol-navigation": { "decisao": "refazer", "fase": "todas", "subprojeto": 1, "nota": "Barra de navegação e tela inicial. Vira o shell de trilho lateral." },
  "rcp-fe-lol-parties": { "decisao": "refazer", "fase": "Lobby, Matchmaking, ReadyCheck", "subprojeto": 2, "nota": "Seleção de modo, lobby, fila e aceite de partida." },
  "rcp-fe-lol-champ-select": { "decisao": "refazer", "fase": "ChampSelect", "subprojeto": 2, "nota": "Seleção de campeões, banimentos, feitiços, runas rápidas." },
  "rcp-fe-lol-skins-picker": { "decisao": "refazer", "fase": "ChampSelect", "subprojeto": 2, "nota": "Seletor de skin dentro da seleção de campeões." },
  "rcp-fe-lol-postgame": { "decisao": "refazer", "fase": "PreEndOfGame, EndOfGame", "subprojeto": 2, "nota": "Tela de fim de jogo, honra, placar." },
  "rcp-fe-lol-profiles": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Perfil do jogador." },
  "rcp-fe-lol-match-history": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Histórico de partidas." },
  "rcp-fe-lol-leagues": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Ranqueadas e ligas." },
  "rcp-fe-lol-collections": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Coleção: campeões, skins, runas, feitiços, itens." },
  "rcp-fe-lol-champion-details": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Detalhe de campeão na coleção." },
  "rcp-fe-lol-champion-statistics": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Estatísticas por campeão no perfil." },
  "rcp-fe-lol-loot": { "decisao": "refazer", "fase": "None", "subprojeto": 3, "nota": "Espólios e criação." },
  "rcp-fe-lol-social": { "decisao": "refazer", "fase": "todas", "subprojeto": 4, "nota": "Lista de amigos, chat, convites. Vira a gaveta de amigos." },
  "rcp-fe-lol-premade-voice": { "decisao": "embutir", "fase": "Lobby, ChampSelect", "subprojeto": 4, "nota": "Chat de voz do grupo. Reavaliar no subprojeto 4." },
  "rcp-fe-lol-settings": { "decisao": "embutir", "fase": "todas", "subprojeto": 5, "nota": "Configurações do jogo e do client. As configurações do ReimaginedLC são uma tela nova à parte." },
  "rcp-fe-lol-store": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Loja. Páginas web da Riot; fora de escopo refazer." },
  "rcp-fe-lol-yourshop": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Sua Loja. Evento sazonal de compra." },
  "rcp-fe-lol-paw": { "decisao": "embutir", "fase": "todas", "subprojeto": null, "nota": "Janela de compra. Envolve pagamento; sempre a original." },
  "rcp-fe-lol-event-hub": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Central de eventos e passes." },
  "rcp-fe-lol-objectives": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Missões e objetivos." },
  "rcp-fe-lol-clash": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Clash. Fluxo próprio e raro." },
  "rcp-fe-lol-new-player-experience": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Tutorial de conta nova." },
  "rcp-fe-lol-tft": { "decisao": "refazer", "fase": "None", "subprojeto": 6, "nota": "Central do TFT." },
  "rcp-fe-tft": { "decisao": "refazer", "fase": "None", "subprojeto": 6, "nota": "Telas do TFT." },
  "rcp-fe-lol-tft-team-planner": { "decisao": "embutir", "fase": "None", "subprojeto": 6, "nota": "Planejador de equipe do TFT. Reavaliar no subprojeto 6." },
  "rcp-fe-lol-tft-troves": { "decisao": "embutir", "fase": "None", "subprojeto": null, "nota": "Tesouros do TFT. Envolve compra." },
  "rcp-fe-lol-tft-promethium": { "decisao": "investigar", "fase": "None", "subprojeto": 6, "nota": "Codinome interno; finalidade a confirmar." },
  "rcp-fe-lol-esports-spectate": { "decisao": "cortar", "fase": "None", "subprojeto": null, "nota": "Assistir a partidas de esports." },
  "rcp-fe-lol-highlights": { "decisao": "cortar", "fase": "None", "subprojeto": null, "nota": "Destaques gravados." },
  "rcp-fe-lol-jade": { "decisao": "investigar", "fase": "None", "subprojeto": null, "nota": "Codinome interno; finalidade a confirmar." },
  "rcp-fe-lol-pft": { "decisao": "investigar", "fase": "None", "subprojeto": null, "nota": "Sigla interna; finalidade a confirmar." },
  "rcp-fe-lol-kickout": { "decisao": "investigar", "fase": "todas", "subprojeto": null, "nota": "Provável tela de sessão encerrada; confirmar." },
  "rcp-fe-lol-lock-and-load": { "decisao": "investigar", "fase": "None", "subprojeto": null, "nota": "Finalidade a confirmar." }
}
```

- [ ] **Step 2: Escrever os testes que falham**

`tools/dump/screens-lib.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScreens } from './screens-lib.mjs';

const d = (decisao) => ({ decisao, fase: 'None', subprojeto: 2, nota: 'n' });

test('cruza plugin de interface com endpoints dos backends de que depende', () => {
  const { rows } = buildScreens(
    [
      { fullName: 'rcp-fe-lol-parties', dependencies: [{ fullName: 'rcp-be-lol-lobby' }, 'rcp-be-lol-matchmaking', { fullName: 'rcp-fe-lol-uikit' }] },
      { fullName: 'rcp-be-lol-lobby' },
    ],
    [{ plugin: 'lol-lobby' }, { plugin: 'lol-lobby' }, { plugin: 'lol-matchmaking' }, { plugin: 'lol-chat' }, { plugin: null }],
    { 'rcp-fe-lol-parties': d('refazer') },
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].plugin, 'rcp-fe-lol-parties');
  assert.deepEqual(rows[0].backends, ['lol-lobby', 'lol-matchmaking']);
  assert.equal(rows[0].endpoints, 3);
  assert.equal(rows[0].decisao, 'refazer');
});

test('acusa plugin de interface sem decisão', () => {
  const { rows, missing } = buildScreens([{ fullName: 'rcp-fe-lol-novo' }], [], {});
  assert.deepEqual(missing, ['rcp-fe-lol-novo']);
  assert.equal(rows.length, 0);
});

test('lista os que ainda estão em investigar', () => {
  const { pending } = buildScreens(
    [{ fullName: 'rcp-fe-lol-jade' }, { fullName: 'rcp-fe-lol-loot' }],
    [],
    { 'rcp-fe-lol-jade': d('investigar'), 'rcp-fe-lol-loot': d('refazer') },
  );
  assert.deepEqual(pending, ['rcp-fe-lol-jade']);
});

test('ordena por subprojeto e depois por nome, sem subprojeto por último', () => {
  const { rows } = buildScreens(
    [{ fullName: 'rcp-fe-b' }, { fullName: 'rcp-fe-a' }, { fullName: 'rcp-fe-c' }],
    [],
    { 'rcp-fe-b': { ...d('refazer'), subprojeto: 1 }, 'rcp-fe-a': { ...d('infra'), subprojeto: null }, 'rcp-fe-c': { ...d('refazer'), subprojeto: 1 } },
  );
  assert.deepEqual(rows.map((r) => r.plugin), ['rcp-fe-b', 'rcp-fe-c', 'rcp-fe-a']);
});
```

- [ ] **Step 3: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module` apontando para `screens-lib.mjs`.

- [ ] **Step 4: Implementar `tools/dump/screens-lib.mjs`**

```js
const depName = (d) => (typeof d === 'string' ? d : d?.fullName ?? '');

export function buildScreens(plugins, endpoints, decisions) {
  const perBackend = {};
  for (const e of endpoints) if (e.plugin) perBackend[e.plugin] = (perBackend[e.plugin] ?? 0) + 1;

  const rows = [];
  const missing = [];
  for (const p of plugins) {
    if (!p.fullName.startsWith('rcp-fe-')) continue;
    const decision = decisions[p.fullName];
    if (!decision) {
      missing.push(p.fullName);
      continue;
    }
    const backends = (p.dependencies ?? [])
      .map(depName)
      .filter((n) => n.startsWith('rcp-be-'))
      .map((n) => n.slice('rcp-be-'.length))
      .sort();
    rows.push({
      plugin: p.fullName,
      ...decision,
      backends,
      endpoints: backends.reduce((n, b) => n + (perBackend[b] ?? 0), 0),
    });
  }
  rows.sort((a, b) => (a.subprojeto ?? 99) - (b.subprojeto ?? 99) || a.plugin.localeCompare(b.plugin));
  return { rows, missing, pending: rows.filter((r) => r.decisao === 'investigar').map((r) => r.plugin) };
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS, 40 testes no total.

- [ ] **Step 6: Implementar `tools/dump/screens.mjs`**

```js
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
```

- [ ] **Step 7: Primeira geração [manual: client aberto]**

Run: `npm run dump:screens`
Expected: a linha de contagem, seguida de `ainda em "investigar": ...` com os cinco plugins marcados assim, e possivelmente `sem decisão em decisions.json: ...` se o client tiver plugins `rcp-fe-*` que não estão no arquivo. Código de saída 1. É o esperado nesta etapa.

- [ ] **Step 8: Resolver cada plugin pendente ou sem decisão**

Para cada nome listado, reunir evidência de três fontes:

1. A descrição do plugin: `node -e "console.log(require('fs').readFileSync(process.argv[1],'utf8'))" "C:\Riot Games\League of Legends\Plugins\<nome>\description.json"`
2. Os arquivos que ele contém: `node -e "const n=process.argv[1];const l=require('fs').readFileSync('dump-raw/cdragon-files.txt','utf8').split('\n').filter(x=>x.startsWith('plugins/'+n+'/global/default/'));console.log(l.length);console.log(l.slice(0,60).join('\n'))" <nome>`
3. Os textos de interface: no mesmo `dump-raw/cdragon-files.txt`, o caminho `plugins/<nome>/global/pt_br/trans.json` corresponde a `https://raw.communitydragon.org/latest/plugins/<nome>/global/pt_br/trans.json`. Baixar e ler as chaves revela a que tela pertencem.

Com a finalidade identificada, editar a entrada em `tools/dump/decisions.json`: trocar `decisao` por `refazer`, `embutir`, `cortar` ou `infra`, ajustar `fase` e `subprojeto` e reescrever `nota` com a finalidade em uma frase. Critério: tela do caminho principal de jogo ou de uso diário é `refazer`; fluxo com compra, evento sazonal ou uso raro é `embutir`; o que o usuário declarou dispensável (vitrine da tela inicial, esports, destaques) é `cortar`. Na dúvida entre `refazer` e `embutir`, `embutir`: é reversível e não bloqueia nada.

- [ ] **Step 9: Geração final**

Run: `npm run dump:screens`
Expected: só a linha de contagem, código de saída 0, e `docs/dump/screens.md` sem nenhuma linha `investigar`.

- [ ] **Step 10: Escrever `docs/dump/REPORT.md`**

O relatório é escrito à mão a partir dos arquivos gerados. Estrutura obrigatória, com cada seção preenchida com os valores reais lidos da fonte indicada:

```markdown
# Relatório do dump

Client <versão de docs/dump/lcu/version.json>, Pengu Loader <penguVersion de env.json>, capturado em <data>.

## Resumo

<Três a cinco frases: quantas telas refazer, embutir e cortar; se o ambiente sustenta o desenho; o maior risco encontrado.>

## Suposições do desenho

| Suposição da spec | Resultado | Fonte | Consequência |
|---|---|---|---|
| View Transitions API disponível | <sim ou não> | `env.json` `features.viewTransitions` | <manter, ou usar classes CSS> |
| `backdrop-filter` disponível (tema Vidro) | <sim ou não> | `env.json` `features.backdropFilter` | <manter, ou Vidro com fundo semitransparente sem blur> |
| Vídeo de fundo: H.264 | <probably, maybe ou no> | `env.json` `codecs.h264` | <formatos aceitos em temas> |
| Vídeo de fundo: VP9 (WebM, permite transparência) | <...> | `env.json` `codecs.vp9` | <...> |
| Vídeo de fundo: AV1 | <...> | `env.json` `codecs.av1` | <...> |
| Atalho `Ctrl+Shift+F12` chega a um listener comum | <sim ou não> | `env/hotkey.json` | <manter, ou escolher outra combinação> |
| `fetch` para `http://127.0.0.1` funciona dentro do client | <sim ou não> | toast do plugin de coleta na Task 4 | <afeta o modo dev com recarga> |
| `DataStore` do Pengu disponível | <tipo e chaves> | `env.json` `pengu.DataStore` | <onde guardar configuração> |
| `PluginFS` do Pengu disponível | <tipo e chaves> | `env.json` `pengu.PluginFS` | <como ler temas do disco> |
| `/swagger` disponível | não (404) | Task 2 | tipos gerados de `/help?format=Full` |

Versão do Chromium embutido: <env.json chromium>.

## API LCU

<Números de endpoints, tipos e eventos. Os dez backends com mais endpoints, contados em endpoints.json. Qualquer tipo que o gerador precisou declarar como unknown e que seja usado pelas telas do subprojeto 2.>

## Telas

<Contagem por decisão e a tabela resumida por subprojeto, a partir de screens.md. Lista explícita do que foi cortado e por quê.>

## Assets

<Por categoria: total de arquivos reutilizáveis por referência e os três plugins que concentram mais. Taxa de acerto da amostra (meta.sampleFound de meta.sampleChecked em inventory.json). Fontes da Riot disponíveis em rcp-fe-lol-typekit.>

## Medição de base

| Cenário | Processos | Memória de trabalho média (MB) | Memória privada média (MB) | CPU (% de um núcleo) |
|---|---:|---:|---:|---:|
| Sem plugins | <...> | <...> | <...> | <...> |
| Plugins atuais | <...> | <...> | <...> | <...> |

<Uma frase sobre o orçamento que isso deixa: a interface da Riot continua carregada, então o custo do ReimaginedLC se soma à linha "sem plugins".>

## Gravações

<Arquivo, número de linhas, sequência de fases vista, tamanho. O que a gravação não cobre (fila com outros jogadores, banimentos, ready check) e que precisará de gravação adicional no subprojeto 2.>

## Riscos e ajustes na spec

<Lista numerada. Cada item: o que foi encontrado, a seção da spec afetada e a mudança proposta. Se nada mudou, escrever "Nenhum ajuste necessário" e por quê.>
```

Nenhum `<...>` pode sobrar no arquivo final.

- [ ] **Step 11: Conferir que o relatório está completo**

Run: `node -e "const t=require('fs').readFileSync('docs/dump/REPORT.md','utf8');const m=t.match(/<[^>\n]*>/g);console.log(m?m:'sem marcadores')"`
Expected: `sem marcadores`.

- [ ] **Step 12: Aplicar os ajustes na spec**

Se a seção "Riscos e ajustes na spec" do relatório listar mudanças, aplicá-las em `docs/superpowers/specs/2026-10-03-reimaginedlc-design.md` nas seções afetadas e acrescentar ao fim da spec uma seção `## Alterações após o dump` com uma linha por mudança. Se não houver mudanças, não tocar na spec.

- [ ] **Step 13: Rodar a suíte inteira uma última vez**

Run: `npm test`
Expected: PASS, 40 testes ou mais (mais, se algum passo anterior acrescentou testes de regressão).

- [ ] **Step 14: Commit**

```bash
git status --short
git add tools/dump/decisions.json tools/dump/screens-lib.mjs tools/dump/screens-lib.test.mjs tools/dump/screens.mjs docs/dump/screens.md docs/dump/REPORT.md docs/superpowers/specs
git commit -m "Add screen map and dump report"
```

Antes do commit, a saída de `git status --short` não pode listar nada dentro de `dump-raw/`.

---

## Cobertura da spec

| Entrega do subprojeto 0 | Task |
|---|---|
| 1. Descrição da API LCU e tipos TypeScript | 2 |
| 2. Mapa de telas com decisão por tela | 7 |
| 3. Inventário de assets por plugin e tipo | 3 |
| 4. Ambiente de execução (Chromium, Pengu, recursos, codecs) | 4 |
| 5. Medição de base | 5 |
| 6. Gravações de sessão anonimizadas | 6 |
| 7. Relatório final | 7 |
| Critério de conclusão: decisão para cada tela e suposições confirmadas ou corrigidas | 7 (Steps 9 a 12) |
