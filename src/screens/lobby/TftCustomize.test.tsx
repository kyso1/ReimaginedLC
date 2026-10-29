import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { TftCustomize } from './TftCustomize';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let selected = 2;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const item = (itemId: number, name: string, over: Record<string, unknown> = {}) => ({ itemId, name, owned: true, loadoutsIcon: `/i/${itemId}.png`, selected: itemId === selected, TFTRarity: 'kStandard', ...over });

beforeEach(() => {
  setLocale('pt_BR');
  selected = 2;
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-cosmetics/v1/inventories/tft/companions')
      return new Response(
        JSON.stringify({
          groups: [
            { groupName: 'River Sprite', items: [item(1, 'Chemtank Sprite'), item(2, 'Sprite Azul', { TFTRarity: 'kLegendary', species: 'River Sprite', description: 'Brilha no escuro.' }), item(9, 'Sprite Bloqueado', { owned: false })] },
            { groupName: 'Hauntling', items: [item(3, 'Hauntling Rosa', { TFTRarity: 'kMythic' })] },
          ],
        }),
        { status: 200 },
      );
    if (url === '/lol-cosmetics/v1/favorites/tft/companions') return new Response(JSON.stringify({ favoriteItems: [item(3, 'Hauntling Rosa')] }), { status: 200 });
    if (url === '/lol-cosmetics/v1/inventories/tft/map-skins') return new Response(JSON.stringify({ groups: [{ groupName: '', items: [item(4, 'Arena Base')] }] }), { status: 200 });
    if (url === '/lol-cosmetics/v1/inventories/tft/damage-skins') return new Response(JSON.stringify({ groups: [{ groupName: 'Test group name', items: [item(5, 'Boom Cósmico')] }] }), { status: 200 });
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

const open = async () => {
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
};
const sections = () => [...root.querySelectorAll('.rlc-tft-section')].map((s) => [s.querySelector('h4')?.firstChild?.textContent?.trim() ?? '', [...s.querySelectorAll('.rlc-tft-item')].map((b) => b.getAttribute('aria-label'))]);
const tab = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent === name)!;
const filter = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent === name)!;
const tile = (name: string) => root.querySelector<HTMLButtonElement>(`.rlc-tft-item[aria-label="${name}"]`)!;

test('abas por tipo e grade agrupada por espécie; só possuídos por padrão; equipado marcado', async () => {
  await open();
  expect([...root.querySelectorAll('[role="tab"]')].map((b) => b.textContent)).toEqual(['Pequena Lenda', 'Arena', 'Explosão', 'Zoom']);
  expect(sections()).toEqual([
    ['River Sprite', ['Chemtank Sprite', 'Sprite Azul']],
    ['Hauntling', ['Hauntling Rosa']],
  ]);
  expect(root.querySelector('.rlc-tft-item[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Sprite Azul');
  expect(tile('Hauntling Rosa').dataset.rarity).toBe('mythic');
  expect(tile('Hauntling Rosa').querySelector('.rlc-tft-fav')).not.toBeNull();
});

test('prévia grande mostra o equipado com raridade, espécie e descrição', async () => {
  await open();
  const preview = root.querySelector('.rlc-tft-preview')!;
  expect(preview.querySelector('h3')!.textContent).toBe('Sprite Azul');
  expect(preview.querySelector('img')!.getAttribute('src')).toBe('/i/2.png');
  expect(preview.querySelector('[data-rarity="legendary"]')!.textContent).toBe('Lendária');
  expect(preview.textContent).toContain('River Sprite');
  expect(preview.textContent).toContain('Brilha no escuro.');
  expect(preview.querySelector('.rlc-tft-state')!.textContent).toBe('Equipado');
});

test('filtros: Favoritos e Todos (não possuído aparece bloqueado, só pré-visualiza)', async () => {
  await open();
  act(() => filter('Favoritos').click());
  expect(sections()).toEqual([['Hauntling', ['Hauntling Rosa']]]);
  act(() => filter('Todos').click());
  expect(tile('Sprite Bloqueado').dataset.locked).toBe('true');
  act(() => tile('Sprite Bloqueado').click());
  await settle();
  expect(root.querySelector('.rlc-tft-preview h3')!.textContent).toBe('Sprite Bloqueado');
  expect(root.querySelector('.rlc-tft-state')!.textContent).toBe('Você ainda não tem este item');
  expect(fetchMock.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(false);
});

test('busca filtra por nome e esconde seções vazias', async () => {
  await open();
  const search = root.querySelector<HTMLInputElement>('.rlc-tft-drawer input')!;
  act(() => {
    search.value = 'chem';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(sections()).toEqual([['River Sprite', ['Chemtank Sprite']]]);
});

test('clicar equipa com PUT do itemId e relê o inventário', async () => {
  await open();
  act(() => tile('Chemtank Sprite').click());
  await settle();
  await settle();
  const put = fetchMock.mock.calls.find((c) => c[0] === '/lol-cosmetics/v1/selection/companion')!;
  expect(put[1].method).toBe('PUT');
  expect(JSON.parse(put[1].body)).toBe(1);
  expect(root.querySelector('.rlc-tft-item[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('Chemtank Sprite');
  expect(root.querySelector('.rlc-tft-preview h3')!.textContent).toBe('Chemtank Sprite');
});

test('abas trocam o inventário; grupo sem nome usa o da aba; tipos sem grupos reais viram uma grade só', async () => {
  await open();
  act(() => tab('Arena').click());
  await settle();
  expect(sections()).toEqual([['Arena', ['Arena Base']]]);
  act(() => tab('Explosão').click());
  await settle();
  expect(sections()).toEqual([['', ['Boom Cósmico']]]);
  expect(root.textContent).not.toContain('Test group name');
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
  act(() => tab('Arena').click());
  await settle();
  release();
  await settle();
  await settle();
  expect(sections()).toEqual([['Arena', ['Arena Base']]]);
});

test('Favoritar: PUT/DELETE pelo contentId do item em foco; o coração só muda com os favoritos relidos', async () => {
  let favs = [3];
  const base = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<Response>;
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === '/lol-cosmetics/v1/favorites/tft/companions') return new Response(JSON.stringify({ favoriteItems: favs.map((id) => item(id, `I${id}`)) }), { status: 200 });
    if (url.startsWith('/lol-cosmetics/v1/favorites/tft/companions/')) {
      favs = init?.method === 'PUT' ? [...favs, 2] : favs.filter((id) => id !== 2);
      return new Response(null, { status: 204 });
    }
    if (url === '/lol-cosmetics/v1/inventories/tft/companions') {
      const r = await base(url, init);
      const inv = await r.json();
      for (const g of inv.groups) for (const it of g.items) it.contentId = `c-${it.itemId}`;
      return new Response(JSON.stringify(inv), { status: 200 });
    }
    return base(url, init);
  });
  act(() => render(<TftCustomize onClose={() => {}} />, root));
  await settle();
  const favBtn = () => root.querySelector<HTMLButtonElement>('.rlc-tft-favorite')!;
  expect(favBtn().getAttribute('aria-pressed')).toBe('false');
  act(() => favBtn().click());
  await settle();
  await settle();
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-cosmetics/v1/favorites/tft/companions/c-2' && (c[1] as RequestInit)?.method === 'PUT')).toBe(true);
  expect(favBtn().getAttribute('aria-pressed')).toBe('true');
  act(() => favBtn().click());
  await settle();
  await settle();
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-cosmetics/v1/favorites/tft/companions/c-2' && (c[1] as RequestInit)?.method === 'DELETE')).toBe(true);
  expect(favBtn().getAttribute('aria-pressed')).toBe('false');
});
