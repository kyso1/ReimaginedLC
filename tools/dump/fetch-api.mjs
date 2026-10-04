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
