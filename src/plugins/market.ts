import { signal } from '@preact/signals';
import { readSetting, writeSetting } from '../shell/storage';

// Loja de plugins do Pengu. O client não grava na pasta de plugins, então "instalar" guarda o repositório
// fixado num commit e o `index.ts` importa o arquivo de entrada pelo jsDelivr a cada carregamento.

export const REGISTRY_URL = 'https://raw.githubusercontent.com/PenguLoader/plugin-hub/main/registry/plugins.yml';
const API = 'https://api.github.com';
// A busca do GitHub não aceita OR entre tópicos: uma busca por tópico.
const SEARCHES = ['topic:pengu-plugin', 'topic:pengu-loader'].map((q) => `${API}/search/repositories?q=${q}&sort=stars&per_page=100`);

/** Repositórios com o tópico que não são plugins. Nome completo ou só o nome do repositório. */
const NOT_PLUGINS = new Set(['penguloader/penguloader', 'penguloader/docs', 'pengu-mac', 'pengu-rust', 'plugin-hub', 'awesome-pengu', 'league-client-mcp', 'reimaginedlc']);

export interface Listing {
  /** `dono/repositório`. */
  repo: string;
  /** Pasta do plugin dentro do repositório ('' = raiz) e branch, quando o registro indica. */
  path: string;
  branch: string | null;
  name: string;
  author: string;
  description: string;
  stars: number | null;
  url: string;
  tags: string[];
}

export interface Installed {
  repo: string;
  path: string;
  branch: string | null;
  sha: string;
  entry: string;
  name: string;
}

type Fetcher = (url: string) => Promise<Response>;
const defaultFetch: Fetcher = (u) => fetch(u);

/** `https://github.com/o/r/tree/main/Pasta`, `github.com/o/r` ou `o/r/` → partes. Inválido: null. */
export function parseRepo(raw: string): { repo: string; branch: string | null; path: string } | null {
  const m = /^(?:https?:\/\/)?(?:github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:\/tree\/([\w.-]+)((?:\/[\w. -]+)*))?\/?$/.exec(raw.trim());
  if (!m) return null;
  return { repo: `${m[1]}/${m[2]}`, branch: m[3] ?? null, path: (m[4] ?? '').replace(/^\/|\/$/g, '') };
}

const unquote = (v: string) => v.trim().replace(/^(['"])(.*)\1$/, '$2');

/**
 * Parse mínimo do `plugins.yml` do plugin-hub: uma lista em `plugins:` com `- name:` abrindo cada item,
 * chaves de uma linha e `author:` com `name`/`github`. Valores de várias linhas (a imagem) são ignorados.
 */
export function parseRegistry(text: string): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = [];
  let item: Record<string, string> | null = null;
  let parent = '';
  for (const line of text.split(/\r?\n/)) {
    const start = /^\s*-\s+name:\s*(.*)$/.exec(line);
    if (start) {
      item = { name: unquote(start[1]!) };
      items.push(item);
      parent = '';
      continue;
    }
    if (!item) continue;
    const top = /^ {4}(\w+):\s*(.*)$/.exec(line);
    if (top) {
      parent = top[1]!;
      if (top[2]) item[parent] = unquote(top[2]);
      continue;
    }
    const sub = /^ {6}(name|github):\s*(.+)$/.exec(line);
    if (sub && parent === 'author') item[`author.${sub[1]}`] = unquote(sub[2]!);
  }
  return items;
}

const tagList = (v: string | undefined) => (v ? v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean) : []);

/** Temas não entram: marcação do registro, tópico, nome ou descrição com "theme". */
export const isTheme = (l: Pick<Listing, 'name' | 'description' | 'tags' | 'repo'>) => [l.name, l.description, l.repo, ...l.tags].some((s) => /theme/i.test(s));
const isNotPlugin = (repo: string) => NOT_PLUGINS.has(repo.toLowerCase()) || NOT_PLUGINS.has(repo.split('/')[1]!.toLowerCase());

export function fromRegistry(text: string): Listing[] {
  return parseRegistry(text).flatMap((r) => {
    const parsed = r.repo ? parseRepo(r.repo) : null;
    if (!parsed || r.theme === 'true') return [];
    return [{ ...parsed, name: r.name || readable(parsed.repo), author: r['author.name'] || parsed.repo.split('/')[0]!, description: r.description ?? '', stars: null, url: `https://github.com/${parsed.repo}`, tags: tagList(r.tags) }];
  });
}

interface SearchItem { full_name?: string; name?: string; description?: string | null; stargazers_count?: number; html_url?: string; default_branch?: string; owner?: { login?: string }; topics?: string[]; archived?: boolean; fork?: boolean }

export function fromSearch(body: unknown): Listing[] {
  const items = (body as { items?: SearchItem[] } | null)?.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((i) => {
    const parsed = typeof i.full_name === 'string' ? parseRepo(i.full_name) : null;
    if (!parsed || i.archived || i.fork) return [];
    return [{ ...parsed, branch: i.default_branch ?? null, name: readable(parsed.repo), author: i.owner?.login ?? parsed.repo.split('/')[0]!, description: i.description ?? '', stars: i.stargazers_count ?? 0, url: `https://github.com/${parsed.repo}`, tags: i.topics ?? [] }];
  });
}

/** `pengu-skin-randomizer` → `Skin randomizer`. */
export function readable(repo: string): string {
  const words = repo.split('/')[1]!.replace(/[-_.]+/g, ' ').replace(/\b(pengu|loader|plugin|league|lol)\b/gi, '').trim().replace(/\s+/g, ' ');
  const name = words || repo.split('/')[1]!;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const key = (l: Pick<Listing, 'repo' | 'path'>) => `${l.repo.toLowerCase()}/${l.path.toLowerCase()}`;

/** Junta registro (nomes curados) e busca (estrelas), sem temas nem repositórios que não são plugins. */
export function mergeListings(registry: Listing[], searches: Listing[][]): Listing[] {
  const out = new Map<string, Listing>();
  for (const l of registry) out.set(key(l), l);
  // Repositório-coleção (o registro aponta subpastas): a raiz não é um plugin.
  const collections = new Set(registry.filter((l) => l.path).map((l) => l.repo.toLowerCase()));
  for (const l of searches.flat()) {
    if (!l.path && collections.has(l.repo.toLowerCase())) {
      for (const [k, sub] of out) if (sub.repo.toLowerCase() === l.repo.toLowerCase() && sub.stars === null) out.set(k, { ...sub, stars: l.stars });
      continue;
    }
    const known = out.get(key(l));
    if (known) out.set(key(l), { ...known, stars: l.stars, branch: known.branch ?? l.branch });
    else out.set(key(l), l);
  }
  return [...out.values()]
    .filter((l) => !isTheme(l) && !isNotPlugin(l.repo))
    .sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1) || a.name.localeCompare(b.name));
}

/** Catálogo completo. Rejeita só se todas as fontes falharem (estado vazio com mensagem na tela). */
export async function loadCatalog(fetcher: Fetcher = defaultFetch): Promise<Listing[]> {
  const get = async (url: string) => {
    const r = await fetcher(url);
    if (!r.ok) throw new Error(String(r.status));
    return r;
  };
  const [reg, ...found] = await Promise.allSettled([get(REGISTRY_URL).then((r) => r.text()), ...SEARCHES.map((u) => get(u).then((r) => r.json()))]);
  if (reg!.status === 'rejected' && found.every((f) => f.status === 'rejected')) throw new Error('catalog');
  return mergeListings(reg!.status === 'fulfilled' ? fromRegistry(reg!.value as string) : [], found.map((f) => (f.status === 'fulfilled' ? fromSearch(f.value) : [])));
}

const ENTRIES = ['index.js', 'dist/index.js', 'src/index.js'];

/** Arquivo de entrada na pasta do plugin: `index.js`, `dist/`, `src/`, ou o único `<pasta>/index.js`. */
export function pickEntry(paths: string[], base: string): string | null {
  const prefix = base ? `${base}/` : '';
  const files = new Set(paths);
  const direct = ENTRIES.map((e) => prefix + e).find((p) => files.has(p));
  if (direct) return direct;
  const nested = paths.filter((p) => p.startsWith(prefix) && /^[^/]+\/index\.js$/.test(p.slice(prefix.length)) && !p.includes('node_modules/'));
  return nested.length === 1 ? nested[0]! : null;
}

export class EntryNotFound extends Error {}

/** Commit atual do branch (ou do padrão) e o arquivo de entrada nesse commit. */
export async function resolveInstall(l: Pick<Listing, 'repo' | 'path' | 'branch' | 'name'>, fetcher: Fetcher = defaultFetch): Promise<Installed> {
  const sha = await latestSha(l, fetcher);
  const r = await fetcher(`${API}/repos/${l.repo}/git/trees/${sha}?recursive=1`);
  if (!r.ok) throw new Error(String(r.status));
  const tree = ((await r.json()) as { tree?: Array<{ path?: string; type?: string }> }).tree ?? [];
  const entry = pickEntry(tree.filter((x) => x.type === 'blob' && typeof x.path === 'string').map((x) => x.path!), l.path);
  if (!entry) throw new EntryNotFound(l.repo);
  return { repo: l.repo, path: l.path, branch: l.branch, sha, entry, name: l.name };
}

export async function latestSha(l: Pick<Listing, 'repo' | 'branch'>, fetcher: Fetcher = defaultFetch): Promise<string> {
  const r = await fetcher(`${API}/repos/${l.repo}/commits/${l.branch ?? 'HEAD'}`);
  if (!r.ok) throw new Error(String(r.status));
  const sha = ((await r.json()) as { sha?: unknown }).sha;
  if (typeof sha !== 'string' || !SHA.test(sha)) throw new Error('sha');
  return sha;
}

const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
// Caminho relativo simples, sem `..`: vai direto na URL do jsDelivr.
const ENTRY = /^(?!.*(?:^|\/)\.\.?(?:\/|$))[\w. -]+(?:\/[\w. -]+)*\.js$/;

/** Lista guardada no DataStore, filtrada: o que vier torto não é carregado. */
export function sanitizeInstalled(v: unknown): Installed[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x) => {
    const o = (typeof x === 'object' && x !== null ? x : {}) as Record<string, unknown>;
    const ok = typeof o.repo === 'string' && REPO.test(o.repo) && typeof o.sha === 'string' && SHA.test(o.sha) && typeof o.entry === 'string' && ENTRY.test(o.entry);
    if (!ok) return [];
    return [{ repo: o.repo as string, sha: o.sha as string, entry: o.entry as string, path: typeof o.path === 'string' ? o.path : '', branch: typeof o.branch === 'string' ? o.branch : null, name: typeof o.name === 'string' && o.name ? o.name : readable(o.repo as string) }];
  });
}

const KEY = 'rlc.plugins';
export const installed = signal<Installed[]>(sanitizeInstalled(readSetting<unknown>(KEY, [])));
/** Mudou algo nesta sessão: o client precisa recarregar para valer. */
export const changed = signal(false);

export function saveInstalled(list: Installed[]): void {
  installed.value = list;
  changed.value = true;
  writeSetting(KEY, list);
}

export const cdnUrl = (p: Pick<Installed, 'repo' | 'sha' | 'entry'>) => `https://cdn.jsdelivr.net/gh/${p.repo}@${p.sha}/${p.entry.split('/').map(encodeURIComponent).join('/')}`;

interface PluginModule { init?: (context: unknown) => unknown; load?: () => unknown }

/**
 * Carrega os plugins instalados pela loja, chamado no `init` do ReimaginedLC. Cada um roda `init(context)` assim
 * que chega e `load()` quando a janela termina de carregar, como o Pengu faria. Falha de um não afeta os outros.
 */
export function loadInstalled(context: unknown, importer: (url: string) => Promise<unknown> = (u) => import(/* @vite-ignore */ u)): Promise<void> {
  const list = sanitizeInstalled(readSetting<unknown>(KEY, []));
  return Promise.all(
    list.map(async (p) => {
      try {
        const mod = (await importer(cdnUrl(p))) as PluginModule;
        await mod.init?.(context);
        if (typeof mod.load === 'function') {
          const run = () => void Promise.resolve().then(() => mod.load!()).catch((e) => console.error('[rlc] plugin', p.repo, e));
          if (document.readyState === 'complete') run();
          else window.addEventListener('load', run, { once: true });
        }
      } catch (e) {
        console.error('[rlc] plugin', p.repo, e);
      }
    }),
  ).then(() => {});
}

/** Plugins da pasta do Pengu (`Pasta\\index.js`), só para mostrar. */
export function folderPlugins(): string[] {
  const list = (window as { Pengu?: { plugins?: unknown } }).Pengu?.plugins;
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').map((x) => x.split(/[\\/]/)[0]!) : [];
}
