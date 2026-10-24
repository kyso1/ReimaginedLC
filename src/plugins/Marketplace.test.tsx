import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { changed, installed } from './market';
import { Marketplace } from './Marketplace';

const SHA = 'b'.repeat(40);
const YML = `plugins:
  - name: Skin randomizer
    description: Random skin.
    repo: https://github.com/a/skin
    author:
      name: Axi
  - name: Ahri theme
    theme: true
    repo: https://github.com/a/ahri
`;
let root: HTMLElement;
let fail = false;
const store = new Map<string, unknown>();
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);

beforeEach(() => {
  setLocale('pt_BR');
  fail = false;
  store.clear();
  installed.value = [];
  changed.value = false;
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: () => {} };
  window.Toast = { success: vi.fn(), error: vi.fn() };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (fail) throw new TypeError('offline');
    if (url.endsWith('.yml')) return new Response(YML);
    if (url.includes('/search/')) return new Response(JSON.stringify({ items: [{ full_name: 'b/pengu-auto-honor', stargazers_count: 7, owner: { login: 'b' }, description: 'Honra sozinho' }] }));
    if (url.includes('/commits/')) return new Response(JSON.stringify({ sha: SHA }));
    if (url.includes('/git/trees/')) return new Response(JSON.stringify({ tree: [{ path: 'index.js', type: 'blob' }] }));
    return new Response('', { status: 404 });
  }));
  root = document.body.appendChild(document.createElement('div'));
});

afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  delete window.DataStore;
  delete window.Toast;
});

test('lista plugins sem temas, busca e instala fixando o commit', async () => {
  act(() => render(<Marketplace />, root));
  await settle();
  const names = () => [...root.querySelectorAll('.rlc-mk-item b')].map((b) => b.textContent);
  expect(names()).toEqual(['Auto honor', 'Skin randomizer']);
  expect(root.textContent).toContain('★ 7');
  expect(root.textContent).toContain('código de outras pessoas');
  const search = root.querySelector<HTMLInputElement>('.rlc-mk-search')!;
  act(() => {
    search.value = 'skin';
    search.dispatchEvent(new Event('input'));
  });
  expect(names()).toEqual(['Skin randomizer']);
  act(() => btn('Instalar')!.click());
  await settle();
  expect(store.get('rlc.plugins')).toEqual([{ repo: 'a/skin', path: '', branch: null, sha: SHA, entry: 'index.js', name: 'Skin randomizer' }]);
  expect(btn('Recarregar o client')).toBeTruthy();
  expect(btn('Remover')).toBeTruthy();
  act(() => btn('Remover')!.click());
  expect(store.get('rlc.plugins')).toEqual([]);
});

test('sem rede: mensagem e tentar de novo, sem quebrar', async () => {
  fail = true;
  act(() => render(<Marketplace />, root));
  await settle();
  expect(root.textContent).toContain('Não deu para buscar a lista de plugins');
  fail = false;
  act(() => btn('Tentar de novo')!.click());
  await settle();
  expect(root.querySelectorAll('.rlc-mk-item')).toHaveLength(2);
});

test('instalados: mostra atualização quando o branch tem commit novo, e a pasta do Pengu', async () => {
  installed.value = [{ repo: 'a/skin', path: '', branch: null, sha: 'c'.repeat(40), entry: 'index.js', name: 'Skin randomizer' }];
  (window as { Pengu?: unknown }).Pengu = { plugins: ['Old Ranks\index.js'] };
  act(() => render(<Marketplace />, root));
  await settle();
  act(() => btn('Instalados (1)')!.click());
  await settle();
  expect(root.textContent).toContain('Old Ranks');
  act(() => btn('Atualizar')!.click());
  await settle();
  expect(installed.value[0]!.sha).toBe(SHA);
  delete (window as { Pengu?: unknown }).Pengu;
});
