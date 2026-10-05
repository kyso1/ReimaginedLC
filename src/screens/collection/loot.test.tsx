import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { Loot, lootGroup } from './Loot';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const chip = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-cn-chips button')].find((b) => b.textContent === text)!;
const names = () => [...root.querySelectorAll('.rlc-cn-card')].map((c) => c.getAttribute('aria-label'));

const item = (lootId: string, displayCategories: string, over: Record<string, unknown> = {}) => ({ lootId, lootName: lootId, displayCategories, type: displayCategories, localizedName: lootId, count: 1, rarity: 'DEFAULT', tilePath: `/t/${lootId}.png`, splashPath: '', ...over });
const LOOT = [
  item('CHEST_generic', 'CHEST', { localizedName: 'Baú Hextec', count: 2 }),
  item('MATERIAL_key', 'CHEST', { localizedName: 'Chave', count: 3 }),
  item('CHAMPION_RENTAL_103', 'CHAMPION', { localizedName: 'Ahri', splashPath: '/s/103.jpg' }),
  item('CURRENCY_champion', 'CURRENCY', { type: 'CURRENCY' }),
];

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-loot/v1/player-loot/CHEST_generic/context-menu') return new Response(JSON.stringify([{ name: 'CHEST_generic_OPEN', actionType: 'OPEN', recipeContextMenuAction: 'Abrir', enabled: true, requiredOthers: 'MATERIAL_key' }, { name: 'CHEST_DISENCHANT', actionType: 'DISENCHANT', recipeContextMenuAction: 'Desencantar', enabled: false }]), { status: 200 });
    if (url.startsWith('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft') && init?.method === 'POST') return new Response(JSON.stringify({ added: [{ playerLoot: { localizedName: 'Skin de Ahri', tilePath: '/t/x.png' }, deltaCount: 1 }], removed: [], redeemed: [] }), { status: 200 });
    return new Response('[]', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

function mount() {
  const lcu = fakeLcu();
  lcu.loot.value = ready(LOOT) as Lcu['loot']['value'];
  act(() => render(<Loot lcu={lcu} />, root));
}

test('grupos por categoria; moedas fora do trilho', () => {
  expect(lootGroup(LOOT[0] as never)).toBe('chests');
  expect(lootGroup(LOOT[2] as never)).toBe('champions');
  expect(lootGroup(item('X', 'SOMETHING') as never)).toBe('materials');
  mount();
  expect(names()).toEqual(['Baú Hextec', 'Chave']);
  act(() => chip('Campeões').click());
  expect(names()).toEqual(['Ahri']);
});

test('foco mostra quantidade e as ações do menu da LCU; desabilitadas ficam desabilitadas', async () => {
  mount();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-cn-detail')!.textContent).toContain('×2');
  const actions = [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-actions button')];
  expect(actions.map((b) => b.textContent)).toEqual(['Abrir', 'Desencantar']);
  expect(actions[1]!.disabled).toBe(true);
});

test('ação pede confirmação, cria pela receita com os itens envolvidos e revela o que saiu', async () => {
  mount();
  await settle();
  await settle();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-actions button')][0]!.click());
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/craft'))).toBe(false);
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  await settle();
  await settle();
  const call = fetchMock.mock.calls.find((c) => String(c[0]).startsWith('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft'))!;
  expect(call[0]).toBe('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft?repeat=1');
  expect(JSON.parse(call[1].body)).toEqual(['CHEST_generic', 'MATERIAL_key']);
  expect(root.querySelector('.rlc-lt-reveal')!.textContent).toContain('Skin de Ahri');
});
