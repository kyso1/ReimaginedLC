import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { buildManifest, writeSigned } from '../scripts/manifest';
import { boot, cdnBase, checkLatest, download, LATEST_API, persistentCache, pickApp, proxyContext, verify, type Cached, type Deps } from './index';
import { isNewer, UPDATE_EVENT } from './shared';

// Par de chaves só do teste: a chave real nunca entra aqui.
const pair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { pem: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string, jwk: publicKey.export({ format: 'jwk' }) as JsonWebKey };
};
const keys = pair();
let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rlc-loader-'));
  mkdirSync(join(dir, 'chunks'));
  writeFileSync(join(dir, 'index.js'), 'export const a = 1;');
  writeFileSync(join(dir, 'chunks', 'x.js'), 'export const b = 2;');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Serve `dir` em `base`; o resto da rede falha. */
const serve = (base: string, extra: Record<string, unknown> = {}) =>
  vi.fn(async (url: string) => {
    if (url in extra) return new Response(JSON.stringify(extra[url]), { status: 200 });
    if (!url.startsWith(base)) throw new Error('offline');
    try {
      return new Response(readFileSync(join(dir, url.slice(base.length))), { status: 200 });
    } catch {
      return new Response('', { status: 404 });
    }
  });
const memCache = (c: Cached | null = null) => {
  const box = { c };
  return { get: async () => box.c, set: async (v: Cached) => void (box.c = v), box };
};

test('isNewer compara versões semânticas, com ou sem "v"', () => {
  expect(isNewer('0.1.0', 'v0.2.0')).toBe(true);
  expect(isNewer('0.2.0', 'v0.2.0')).toBe(false);
  expect(isNewer('0.10.0', 'v0.9.1')).toBe(false);
  expect(isNewer('1.0.0', '1.0.1')).toBe(true);
  expect(isNewer('0.1.0', 'lixo')).toBe(false);
  expect(isNewer('0.1.0', 'v0.2.0-beta.1')).toBe(false);
});

test('script de manifest: lista todos os arquivos com sha256, ignora manifest e assina', async () => {
  writeSigned(dir, '0.2.0', keys.pem);
  const m = buildManifest(dir, '0.2.0');
  expect(Object.keys(m.files)).toEqual(['chunks/x.js', 'index.js']);
  expect(m.files['index.js']).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))).toEqual(m);
});

test('assinatura válida passa; código, manifest ou chave errados falham', async () => {
  writeSigned(dir, '0.2.0', keys.pem);
  const c = await download('0.2.0', serve(cdnBase('0.2.0')), keys.jwk);
  await expect(verify(c, keys.jwk)).resolves.toMatchObject({ version: '0.2.0' });
  await expect(verify({ ...c, version: '0.3.0' }, keys.jwk)).rejects.toThrow(/versão/);
  await expect(verify(c, pair().jwk)).rejects.toThrow(/assinatura/);
  await expect(verify({ ...c, code: new TextEncoder().encode('alert(1)').buffer as ArrayBuffer }, keys.jwk)).rejects.toThrow(/sha256/);
  const forged = new TextEncoder().encode(new TextDecoder().decode(c.manifest).replace('0.2.0', '9.9.9')).buffer as ArrayBuffer;
  await expect(verify({ ...c, version: '9.9.9', manifest: forged }, keys.jwk)).rejects.toThrow(/assinatura/);
  writeFileSync(join(dir, 'index.js'), 'export const a = 666;');
  await expect(download('0.2.0', serve(cdnBase('0.2.0')), keys.jwk)).rejects.toThrow(/sha256/);
});

test('postInit: API que chega antes ou depois do bundle pedir é entregue; outros nomes vão direto ao Pengu', () => {
  const riot = new Map<string, (api: unknown) => unknown>();
  const other = vi.fn();
  const rcp = { postInit: vi.fn((name: string, cb: (api: unknown) => unknown) => (name === 'outro' ? other(cb) : void riot.set(name, cb))) };
  const fake = proxyContext({ rcp });
  expect([...riot.keys()]).toEqual(['rcp-fe-lol-paw', 'rcp-fe-lol-shared-components', 'rcp-fe-lol-navigation']);
  riot.get('rcp-fe-lol-paw')!('paw');
  const early = vi.fn();
  fake.rcp.postInit!('rcp-fe-lol-paw', early);
  expect(early).toHaveBeenCalledWith('paw');
  const late = vi.fn();
  fake.rcp.postInit!('rcp-fe-lol-shared-components', late);
  expect(late).not.toHaveBeenCalled();
  riot.get('rcp-fe-lol-shared-components')!('shared');
  expect(late).toHaveBeenCalledWith('shared');
  fake.rcp.postInit!('outro', vi.fn());
  expect(other).toHaveBeenCalledTimes(1);
});

const LOCAL = { 'https://plugins/ReimaginedLC/app/manifest.json': { version: '0.1.0', files: {} } };
const deps = (fetcher: Deps['fetcher'], cache = memCache()) => ({
  fetcher,
  importer: vi.fn(async (url: string) => ({ url, init: vi.fn(), load: vi.fn() })),
  cache,
  base: 'https://plugins/ReimaginedLC/',
  key: keys.jwk,
});
const neverRemote = (importer: ReturnType<typeof vi.fn>) => expect(importer.mock.calls.every(([u]) => !String(u).startsWith('https://cdn.'))).toBe(true);

test('versão guardada e re-verificada entra por blob:, sem rede; adulterada ou ausente cai para a cópia local', async () => {
  writeSigned(dir, '0.2.0', keys.pem);
  const c = await download('0.2.0', serve(cdnBase('0.2.0')), keys.jwk);
  const offline = serve('https://nada/', LOCAL);
  const ok = deps(offline, memCache(c));
  const picked = await pickApp(ok);
  expect(picked).toMatchObject({ version: '0.2.0', base: cdnBase('0.2.0') });
  expect(picked.url).toMatch(/^blob:/);
  expect(offline.mock.calls.some(([u]) => u.startsWith('https://cdn.'))).toBe(false);
  picked.revoke?.();

  const noise = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const bad = deps(offline, memCache({ ...c, code: new TextEncoder().encode('alert(1)').buffer as ArrayBuffer }));
  expect(await pickApp(bad)).toMatchObject({ version: '0.1.0', url: 'https://plugins/ReimaginedLC/app/index.js', base: 'https://plugins/ReimaginedLC/app/' });
  expect(await pickApp(deps(offline))).toMatchObject({ version: '0.1.0' });
  noise.mockRestore();
});

test('checagem: versão nova é baixada, verificada e guardada; a mesma não repete', async () => {
  writeSigned(dir, '0.2.0', keys.pem);
  const d = deps(serve(cdnBase('0.2.0'), { [LATEST_API]: { tag_name: 'v0.2.0' } }));
  const state = { version: '0.1.0', base: '', ready: null };
  expect(await checkLatest(state, d)).toBe('0.2.0');
  expect(d.cache.box.c?.version).toBe('0.2.0');
  expect(await checkLatest(state, d)).toBeNull();
  expect(await checkLatest({ version: '0.2.0', base: '', ready: null }, d)).toBeNull();
});

test('boot: publica o estado antes do import, importa só blob: ou local, e anuncia a versão pronta', async () => {
  vi.useFakeTimers({ toFake: ['setInterval'] });
  writeSigned(dir, '0.2.0', keys.pem);
  const win = new EventTarget() as Window & { __rlcLoader?: unknown };
  const seen = vi.fn();
  win.addEventListener(UPDATE_EVENT, (e) => seen((e as CustomEvent).detail));
  const d = deps(serve(cdnBase('0.2.0'), { ...LOCAL, [LATEST_API]: { tag_name: 'v0.2.0' } }));
  d.importer.mockImplementation(async (url: string) => {
    expect(win.__rlcLoader).toMatchObject({ version: '0.1.0', base: 'https://plugins/ReimaginedLC/app/' });
    return { url, init: vi.fn(), load: vi.fn() };
  });
  const mod = await boot(undefined, d, win);
  expect((mod as { init: ReturnType<typeof vi.fn> }).init).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(seen).toHaveBeenCalledWith({ version: '0.2.0' }));
  neverRemote(d.importer);

  // Próximo início: a versão guardada entra por blob:.
  const next = deps(serve('https://nada/', LOCAL), d.cache);
  await boot(undefined, next, new EventTarget() as Window);
  expect(next.importer.mock.calls[0]![0]).toMatch(/^blob:/);
  neverRemote(next.importer);
  vi.useRealTimers();
});

test('versão baixada sobrevive ao reinício: fica no DataStore (o IndexedDB muda com a porta do client)', async () => {
  const m = new Map<string, unknown>();
  const store = { has: (k: string) => m.has(k), get: (k: string) => m.get(k), set: (k: string, v: unknown) => void m.set(k, v) };
  const lost = { get: async () => null, set: async () => {} };
  const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
  const c: Cached = { version: '0.3.0', manifest: bytes('{"version":"0.3.0"}'), sig: 'c2ln', code: bytes('export const x = 1;') };
  await persistentCache(store, lost).set(c);
  // "Reinício": cache novo, IndexedDB vazio.
  const back = await persistentCache(store, lost).get();
  expect(back?.version).toBe('0.3.0');
  expect(new TextDecoder().decode(back!.code)).toBe('export const x = 1;');
  expect(new TextDecoder().decode(back!.manifest)).toBe('{"version":"0.3.0"}');
  expect(await persistentCache(undefined, lost).get()).toBeNull();
});
