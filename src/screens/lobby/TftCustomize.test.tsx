import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { TftCustomize } from './TftCustomize';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let selected = 2;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const item = (itemId: number, name: string, over: Record<string, unknown> = {}) => ({ itemId, name, owned: true, loadoutsIcon: `/i/${itemId}.png`, selected: itemId === selected, ...over });

beforeEach(() => {
  setLocale('pt_BR');
  selected = 2;
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-cosmetics/v1/inventories/tft/companions')
      return new Response(JSON.stringify({ groups: [
        { groupName: 'River Sprite', items: [item(1, 'Chemtank Sprite'), item(2, 'Sprite Azul'), item(9, 'Sprite Bloqueado', { owned: false })] },
        { groupName: 'Hauntling', items: [item(3, 'Hauntling Rosa')] },
      ] }), { status: 200 });
    if (url === '/lol-cosmetics/v1/favorites/tft/companions') return new Response(JSON.stringify({ favoriteItems: [item(3, 'Hauntling Rosa')] }), { status: 200 });
    if (url === '/lol-cosmetics/v1/inventories/tft/map-skins') return new Response(JSON.stringify({ groups: [{ groupName: '', items: [item(4, 'Arena Base')] }] }), { status: 200 });
    if (url === '/lol-cosmetics/v1/selection/companion' && init?.method === 'PUT') {
      selected = Number(init.body);
      return new Response(null, { status: 201 });
    }
    return new Response(JSON.stringify({ favoriteItems: [] }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

const sections = () => [...root.querySelectorAll('.rlc-tft-section')].map((s) => [s.querySelector('h4')!.textContent, [...s.querySelectorAll('.rlc-tft-item')].map((b) => b.getAttribute('aria-label'))]);

test('seções: Favoritos primeiro, depois os grupos; só itens possuídos; o equipado marcado', async () => {
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
  expect(sections()).toEqual([
    ['Favoritos', ['Hauntling Rosa']],
    ['River Sprite', ['Chemtank Sprite', 'Sprite Azul']],
    ['Hauntling', ['Hauntling Rosa']],
  ]);
  expect(root.querySelector('.rlc-tft-item[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Sprite Azul');
});

test('busca filtra por nome e esconde seções vazias', async () => {
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
  const search = root.querySelector<HTMLInputElement>('.rlc-tft-drawer input')!;
  act(() => {
    search.value = 'chem';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(sections()).toEqual([['River Sprite', ['Chemtank Sprite']]]);
});

test('clicar equipa com PUT do itemId e relê o inventário', async () => {
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-tft-item[aria-label="Chemtank Sprite"]')!.click());
  await settle();
  await settle();
  const put = fetchMock.mock.calls.find((c) => c[0] === '/lol-cosmetics/v1/selection/companion')!;
  expect(put[1].method).toBe('PUT');
  expect(JSON.parse(put[1].body)).toBe(1);
  expect(root.querySelector('.rlc-tft-item[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Chemtank Sprite');
});

test('abas trocam o inventário; grupo sem nome usa o nome da aba', async () => {
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent === 'Arena')!.click());
  await settle();
  expect(sections()).toEqual([['Arena', ['Arena Base']]]);
});

test('resposta atrasada da aba anterior não substitui a aba atual', async () => {
  let release!: () => void;
  const slow = new Promise<void>((r) => (release = r));
  const base = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<Response>;
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === '/lol-cosmetics/v1/inventories/tft/companions') await slow;
    return base(url, init);
  });
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  act(() => [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent === 'Arena')!.click());
  await settle();
  release();
  await settle();
  await settle();
  expect(sections()).toEqual([['Arena', ['Arena Base']]]);
});
