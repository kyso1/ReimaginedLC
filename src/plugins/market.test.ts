import { afterEach, expect, test, vi } from 'vitest';
import { cdnUrl, fromRegistry, fromSearch, loadCatalog, loadInstalled, mergeListings, parseRepo, pickEntry, resolveInstall, sanitizeInstalled } from './market';

// Trecho no formato do plugins.yml do plugin-hub (imagem em várias linhas, autor aninhado, tema marcado).
const YML = `---
name: Pengu Plugin Store registry
version: 0.0.1
plugins:
  - name: Balance buff viewer
    slug: balance-buff-viewer
    description: Game modes' balance buffs/nerfs viewer.
    image:
      data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24'
      name: isto-nao-e-autor
    repo: https://github.com/nomi-san/balance-buff-viewer
    author:
      name: Nomi
      github: nomi-san
    tags: [utility, ui]

  - name: Name spoofer
    description: "Spoof your name"
    repo: https://github.com/iIlusion/league-loader-plugins/tree/main/NameSpoofer
    author:
      name: Lx
    tags: [fun]

  - name: Bench killer
    repo: BakaFT/BenchKiller/
    tags: [utility]

  - name: Ahri theme
    theme: true
    description: Spirit Blossom Ahri.
    repo: https://github.com/nomi-san/ahri-
    tags: [ahri]
`;

const SHA = 'a'.repeat(40);

test('registro: nome, autor, descrição, pasta; temas fora', () => {
  const list = fromRegistry(YML);
  expect(list.map((l) => [l.name, l.author, l.repo, l.path, l.branch])).toEqual([
    ['Balance buff viewer', 'Nomi', 'nomi-san/balance-buff-viewer', '', null],
    ['Name spoofer', 'Lx', 'iIlusion/league-loader-plugins', 'NameSpoofer', 'main'],
    ['Bench killer', 'BakaFT', 'BakaFT/BenchKiller', '', null],
  ]);
  expect(list[0]!.description).toBe("Game modes' balance buffs/nerfs viewer.");
  expect(list[1]!.description).toBe('Spoof your name');
  expect(list[0]!.tags).toEqual(['utility', 'ui']);
});

test('parseRepo aceita os formatos do registro e recusa lixo', () => {
  expect(parseRepo('github.com/a/b.git')).toEqual({ repo: 'a/b', branch: null, path: '' });
  expect(parseRepo('https://github.com/a/b/tree/dev/x/y/')).toEqual({ repo: 'a/b', branch: 'dev', path: 'x/y' });
  expect(parseRepo('https://evil.com/a/b')).toBeNull();
  expect(parseRepo('a/b/../c')).toBeNull();
});

test('mescla registro e busca; tira temas e não-plugins; estrelas na ordem', () => {
  const search = fromSearch({
    items: [
      { full_name: 'nomi-san/balance-buff-viewer', stargazers_count: 44, default_branch: 'main', owner: { login: 'nomi-san' }, topics: ['pengu-plugin'] },
      { full_name: 'nomi-san/indie-theme', stargazers_count: 8, topics: ['pengu-loader-theme'] },
      { full_name: 'x/spring-petals', stargazers_count: 1, topics: ['pengu-theme'], description: 'animated' },
      { full_name: 'x/pretty', stargazers_count: 3, topics: ['lol-theme'] },
      { full_name: 'PenguLoader/PenguLoader', stargazers_count: 900 },
      { full_name: 'someone/league-client-mcp', stargazers_count: 50 },
      { full_name: 'iIlusion/league-loader-plugins', stargazers_count: 20 },
      { full_name: 'z/pengu-auto-honor', stargazers_count: 2, owner: { login: 'z' }, description: null },
    ],
  });
  const list = mergeListings(fromRegistry(YML), [search]);
  expect(list.map((l) => [l.name, l.stars])).toEqual([
    ['Balance buff viewer', 44],
    ['Name spoofer', 20],
    ['Auto honor', 2],
    ['Bench killer', null],
  ]);
});

test('catálogo: falha total rejeita; falha parcial ainda lista', async () => {
  await expect(loadCatalog(async () => new Response('', { status: 503 }))).rejects.toThrow();
  const list = await loadCatalog(async (u) => (u.endsWith('.yml') ? new Response(YML) : new Response('', { status: 403 })));
  expect(list).toHaveLength(3);
});

test('entrada: raiz, dist, src, subpasta única, pasta indicada', () => {
  expect(pickEntry(['README.md', 'index.js', 'src/index.js'], '')).toBe('index.js');
  expect(pickEntry(['dist/index.js', 'src/index.js'], '')).toBe('dist/index.js');
  expect(pickEntry(['src/index.js'], '')).toBe('src/index.js');
  expect(pickEntry(['MeuPlugin/index.js', 'MeuPlugin/style.css'], '')).toBe('MeuPlugin/index.js');
  expect(pickEntry(['A/index.js', 'B/index.js'], '')).toBeNull();
  expect(pickEntry(['node_modules/index.js'], '')).toBeNull();
  expect(pickEntry(['Other/index.js', 'NameSpoofer/index.js'], 'NameSpoofer')).toBe('NameSpoofer/index.js');
});

test('instalar fixa o commit atual do branch e acha a entrada', async () => {
  const urls: string[] = [];
  const got = await resolveInstall({ repo: 'a/b', path: '', branch: null, name: 'B' }, async (u) => {
    urls.push(u);
    if (u.includes('/commits/')) return new Response(JSON.stringify({ sha: SHA }));
    return new Response(JSON.stringify({ tree: [{ path: 'src', type: 'tree' }, { path: 'src/index.js', type: 'blob' }] }));
  });
  expect(urls).toEqual(['https://api.github.com/repos/a/b/commits/HEAD', `https://api.github.com/repos/a/b/git/trees/${SHA}?recursive=1`]);
  expect(got).toEqual({ repo: 'a/b', path: '', branch: null, sha: SHA, entry: 'src/index.js', name: 'B' });
  expect(cdnUrl(got)).toBe(`https://cdn.jsdelivr.net/gh/a/b@${SHA}/src/index.js`);
});

test('lista guardada torta não é carregada', () => {
  expect(sanitizeInstalled([{ repo: 'a/b', sha: SHA, entry: '../x.js' }, { repo: 'a/b', sha: 'main', entry: 'index.js' }, { repo: 'a b', sha: SHA, entry: 'index.js' }, null])).toEqual([]);
  expect(sanitizeInstalled([{ repo: 'a/b', sha: SHA, entry: 'index.js' }])[0]!.name).toBe('B');
});

afterEach(() => window.DataStore = undefined);

test('carregar: init com o contexto, load depois; um que falha não derruba os outros', async () => {
  const store = new Map<string, unknown>([['rlc.plugins', [{ repo: 'a/quebra', sha: SHA, entry: 'index.js' }, { repo: 'a/b', sha: SHA, entry: 'index.js' }]]]);
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: () => {}, remove: () => {} };
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  const order: string[] = [];
  const ctx = { rcp: {} };
  await loadInstalled(ctx, async (u) => {
    if (u.includes('quebra')) throw new Error('404');
    return { init: (c: unknown) => order.push(c === ctx ? 'init' : 'init?'), load: () => order.push('load') };
  });
  await Promise.resolve();
  expect(order).toEqual(['init', 'load']);
  expect(noise).toHaveBeenCalledTimes(1);
  noise.mockRestore();
});
