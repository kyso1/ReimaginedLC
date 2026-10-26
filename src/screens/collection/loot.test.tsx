import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { actionLabel, Loot, lootGroup, lootName, lootStrings, rarityLabel, revealItems } from './Loot';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const rail = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-rail button')].find((b) => b.querySelector('span')!.textContent === text)!;
const names = () => [...root.querySelectorAll('.rlc-lt-tile')].map((c) => c.getAttribute('aria-label'));
const sections = () => [...root.querySelectorAll('.rlc-lt-section h3')].map((h) => h.textContent);
const tile = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-tile')].find((b) => b.getAttribute('aria-label') === name)!;

const item = (lootId: string, displayCategories: string, over: Record<string, unknown> = {}) => ({ lootId, lootName: lootId, displayCategories, type: displayCategories, localizedName: '', itemDesc: '', count: 1, rarity: 'DEFAULT', value: 0, tilePath: `/t/${lootId}.png`, splashPath: '', ...over });
const LOOT = [
  item('CHEST_generic', 'CHEST', { type: 'CHEST', localizedName: 'Baú Hextec', count: 2 }),
  item('MATERIAL_key', '', { type: 'MATERIAL', count: 3 }),
  item('CHAMPION_RENTAL_266', 'CHAMPION', { type: 'CHAMPION_RENTAL', itemDesc: 'Aatrox', isRental: true, value: 4800 }),
  item('CHAMPION_RENTAL_103', 'CHAMPION', { type: 'CHAMPION_RENTAL', itemDesc: 'Ahri', isRental: true, value: 9000 }),
  item('CHAMPION_SKIN_RENTAL_234010', 'SKIN', { type: 'SKIN_RENTAL', itemDesc: 'Viego Dissonância', rarity: 'EPIC', value: 1350 }),
  item('WARD_SKIN_RENTAL_1', 'WARDSKIN', { itemDesc: 'Sentinela Poro' }),
  item('CURRENCY_cosmetic', '', { type: 'CURRENCY', count: 754 }),
  item('CURRENCY_mythic', 'CHEST', { type: 'CURRENCY', localizedName: 'Essência Mítica', count: 102 }),
];

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-loot/v1/player-loot/CHEST_generic/context-menu') return new Response(JSON.stringify([{ name: 'CHEST_generic_OPEN', actionType: 'OPEN', recipeContextMenuAction: 'Abrir', enabled: true, requiredOthers: 'MATERIAL_key' }, { name: 'CHEST_DISENCHANT', actionType: 'DISENCHANT', recipeContextMenuAction: 'Desencantar', enabled: false }]), { status: 200 });
    if (url.startsWith('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft') && init?.method === 'POST') return new Response(JSON.stringify({ added: [{ playerLoot: { lootId: 'CHAMPION_SKIN_RENTAL_1', localizedName: '', itemDesc: 'Skin de Ahri', tilePath: '/t/x.png' }, deltaCount: 1 }], removed: [], redeemed: [] }), { status: 200 });
    return new Response('[]', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

function mount(loot = LOOT) {
  const lcu = fakeLcu();
  lcu.loot.value = ready(loot) as Lcu['loot']['value'];
  act(() => render(<Loot lcu={lcu} />, root));
  return lcu;
}

test('grupos e nomes: nunca o id técnico; moedas fora da grade', () => {
  expect(lootGroup(LOOT[0] as never)).toBe('chests');
  expect(lootGroup(LOOT[1] as never)).toBe('materials');
  expect(lootGroup(LOOT[2] as never)).toBe('champions');
  expect(lootGroup(LOOT[5] as never)).toBe('wards');
  expect(lootGroup({ displayCategories: 'ETERNALS' })).toBe('eternals');
  expect(lootGroup({ displayCategories: 'SUMMONERICON' })).toBe('icons');
  expect(lootName(LOOT[1] as never)).toBe('Chave Hextec');
  expect(lootName(item('MATERIAL_new', '') as never)).toBe('Item de espólio');
  mount();
  expect(sections()).toEqual(['Baús 1', 'Materiais 1', 'Campeões 2', 'Skins 1', 'Sentinelas 1']);
  expect(names()).toEqual(['Baú Hextec', 'Chave Hextec', 'Aatrox', 'Ahri', 'Viego Dissonância', 'Sentinela Poro']);
  expect(root.textContent).not.toMatch(/CHAMPION_RENTAL|MATERIAL_key/);
});

test('trilho filtra com contagem; busca e ordenação', () => {
  mount();
  expect(rail('Campeões').querySelector('small')!.textContent).toBe('2');
  expect(rail('Todos').querySelector('small')!.textContent).toBe('6');
  act(() => rail('Campeões').click());
  expect(names()).toEqual(['Aatrox', 'Ahri']);
  act(() => rail('Todos').click());
  const search = root.querySelector<HTMLInputElement>('.rlc-lt-search')!;
  act(() => {
    search.value = 'ah';
    search.dispatchEvent(new Event('input'));
  });
  expect(names()).toEqual(['Ahri']);
  act(() => {
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
  });
  expect(root.querySelector('.rlc-lt-empty')!.textContent).toBe('Nenhum item encontrado');
  act(() => {
    search.value = '';
    search.dispatchEvent(new Event('input'));
  });
  const sort = root.querySelector<HTMLSelectElement>('.rlc-lt-sort select')!;
  const pick = (v: string) =>
    act(() => {
      sort.value = v;
      sort.dispatchEvent(new Event('change'));
    });
  act(() => rail('Campeões').click());
  pick('value');
  expect(names()).toEqual(['Ahri', 'Aatrox']);
  act(() => rail('Todos').click());
  pick('rarity');
  expect(sections()).toEqual(['Baús 1', 'Materiais 1', 'Campeões 2', 'Skins 1', 'Sentinelas 1']);
  pick('name');
  expect(names().slice(2, 4)).toEqual(['Aatrox', 'Ahri']);
});

test('raridade traduzida (EPIC e kMythic); padrão sem rótulo', () => {
  expect(rarityLabel('EPIC')).toBe('Épico');
  expect(rarityLabel('kMythic')).toBe('Mítico');
  expect(rarityLabel('LEGENDARY')).toBe('Lendário');
  expect(rarityLabel('DEFAULT')).toBeNull();
  mount();
  act(() => tile('Viego Dissonância').click());
  expect(root.querySelector('.rlc-lt-stage .rlc-lt-rarity')!.textContent).toBe('Épico');
});

test('palco mostra quantidade e as ações do menu da LCU; desabilitadas ficam desabilitadas', async () => {
  mount();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-lt-stage h2')!.textContent).toBe('Baú Hextec');
  expect(root.querySelector('.rlc-lt-stage p')!.textContent).toContain('×2');
  const actions = [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-actions button')];
  expect(actions.map((b) => b.textContent)).toEqual(['Abrir', 'Todos ×2', 'Desencantar']);
  expect(actions[2]!.disabled).toBe(true);
});

test('ação pede confirmação, cria pela receita com os itens envolvidos e revela o que saiu', async () => {
  mount();
  await settle();
  await settle();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-lt-actions button')!.click());
  expect(root.querySelector('[role="dialog"]')!.textContent).toContain('Abrir: Baú Hextec?');
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/craft'))).toBe(false);
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  await settle();
  await settle();
  const call = fetchMock.mock.calls.find((c) => String(c[0]).startsWith('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft'))!;
  expect(call[0]).toBe('/lol-loot/v1/recipes/CHEST_generic_OPEN/craft?repeat=1');
  expect(JSON.parse(call[1].body)).toEqual(['CHEST_generic', 'MATERIAL_key']);
  // Primeiro o baú tremendo; o clique pula para os cartões.
  expect(root.querySelector('.rlc-reveal-chest img')!.getAttribute('src')).toBe('/t/CHEST_generic.png');
  act(() => root.querySelector<HTMLElement>('.rlc-reveal')!.click());
  expect(root.querySelector('.rlc-lt-reveal')!.textContent).toContain('Skin de Ahri');
});

test('cancelar a confirmação não cria nada', async () => {
  mount();
  await settle();
  await settle();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-lt-actions button')!.click());
  act(() => [...root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === 'Cancelar')!.click());
  await settle();
  expect(root.querySelector('[role="dialog"]')).toBeNull();
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/craft'))).toBe(false);
});

test('bandeja: Essência Laranja, chaves e baús', () => {
  mount();
  const tray = [...root.querySelectorAll('.rlc-lt-tray .rlc-lt-balance')].map((b) => b.textContent);
  expect(tray).toEqual(['754Essência Laranja', '3Chaves', '102Essência Mítica', '2Baús']);
  expect(root.querySelector<HTMLImageElement>('.rlc-lt-tray img')!.getAttribute('src')).toBe('/fe/lol-loot/assets/tray_icons/currency_cosmetic.png');
});

test('espólio vazio: item sem lootId fica de fora e aparece o aviso', () => {
  mount([item('', '', { count: 5 })]);
  expect(names()).toEqual([]);
  expect(root.querySelector('.rlc-lt-empty')!.textContent).toBe('Nada aqui');
});

test('rótulo da ação: texto da LCU quando vier; senão o nosso, com a essência ganha ou gasta', () => {
  const m = (o: Record<string, unknown>) => ({ actionType: 'DISENCHANT', recipeContextMenuAction: '', essenceQuantity: 0, essenceType: '', ...o }) as never;
  expect(actionLabel(m({ recipeContextMenuAction: 'Abrir' }))).toBe('Abrir');
  expect(actionLabel(m({ essenceQuantity: 104, essenceType: 'CURRENCY_cosmetic' }))).toBe('Desencantar (+104 EL)');
  expect(actionLabel(m({ actionType: 'UPGRADE', essenceQuantity: -220, essenceType: 'CURRENCY_cosmetic' }))).toBe('Liberar (−220 EL)');
  expect(actionLabel(m({ actionType: 'REROLL' }))).toBe('Reformular');
});

test('menu de ações: uma consulta por item (voltar ao item usa o cache) e de novo quando o espólio muda', async () => {
  const lcu = mount();
  await settle();
  const menus = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('/context-menu')).map((c) => c[0]);
  act(() => tile('Chave Hextec').click());
  await settle();
  act(() => tile('Baú Hextec').click());
  await settle();
  expect(menus()).toEqual(['/lol-loot/v1/player-loot/CHEST_generic/context-menu', '/lol-loot/v1/player-loot/MATERIAL_key/context-menu']);
  act(() => void (lcu.loot.value = ready([...LOOT, item('MATERIAL_key_fragment', '', { type: 'MATERIAL' })]) as Lcu['loot']['value']));
  await settle();
  expect(menus()).toHaveLength(3);
});

test('abas de Espólios: Criação, Santuário e Loja Mítica', async () => {
  mount();
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-tabs button')];
  expect(tabs.map((b) => b.textContent)).toEqual(['Criação', 'Santuário', 'Loja Mítica']);
  act(() => tabs[1]!.click());
  await settle();
  expect(root.querySelector('.rlc-lt-craft')).toBeNull();
  expect(root.querySelector('.rlc-lt-sanctum')).not.toBeNull();
});

// Reformular: receita real (`SKIN_reroll`, 3 vagas com os lootIds aceitos) lida de `/recipes/initial-item`.
const VIEGO = 'CHAMPION_SKIN_RENTAL_234010';
const SHEN = 'CHAMPION_SKIN_RENTAL_98001';
function rerollFetch(craft: () => Promise<Response> = async () => new Response(JSON.stringify({ added: [{ playerLoot: { lootId: 'CHAMPION_SKIN_7', localizedName: '', itemDesc: 'Skin nova', tilePath: '/t/n.png' }, deltaCount: 1 }], removed: [], redeemed: [] }), { status: 200 })) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === `/lol-loot/v1/player-loot/${VIEGO}/context-menu`) return new Response(JSON.stringify([{ name: 'SKIN_reroll', actionType: 'REROLL', recipeContextMenuAction: '', enabled: true, essenceQuantity: 0, essenceType: '', requiredOthers: '' }]), { status: 200 });
    if (url === `/lol-loot/v1/recipes/initial-item/${VIEGO}`) return new Response(JSON.stringify([{ recipeName: 'SKIN_reroll', type: 'REROLL', slots: [0, 1, 2].map((slotNumber) => ({ slotNumber, quantity: 1, lootIds: [VIEGO, SHEN] })) }]), { status: 200 });
    if (url.startsWith('/lol-loot/v1/recipes/SKIN_reroll/craft') && init?.method === 'POST') return craft();
    return new Response('[]', { status: 200 });
  });
}
const withShen = (count: number) => [...LOOT, item(SHEN, 'SKIN', { type: 'SKIN_RENTAL', itemDesc: 'Shen Yellow Jacket', rarity: 'DEFAULT', value: 520, count })];
const crafts = () => fetchMock.mock.calls.filter((c) => String(c[0]).includes('/craft'));
const dialogs = () => [...root.querySelectorAll<HTMLElement>('[role="dialog"]')];
const button = (scope: ParentNode, text: string) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === text)!;
async function openViego() {
  act(() => tile('Viego Dissonância').click());
  await settle();
  await settle();
  await settle();
}

test('reformular: escolhe 3 peças (preencher automaticamente), confirma e envia os 3 lootIds para SKIN_reroll', async () => {
  rerollFetch();
  mount(withShen(2));
  await openViego();
  const rr = button(root.querySelector('.rlc-lt-actions')!, 'Reformular');
  expect(rr.disabled).toBe(false);
  act(() => rr.click());
  const picker = root.querySelector('.rlc-lt-reroll')!;
  // O item em foco já ocupa a primeira vaga; a confirmação só libera com 3.
  expect(picker.querySelector('.rlc-lt-slot-count')!.textContent).toBe('1 de 3');
  expect(button(picker, 'Reformular').disabled).toBe(true);
  act(() => button(picker, 'Preencher automaticamente').click());
  expect(picker.querySelector('.rlc-lt-slot-count')!.textContent).toBe('3 de 3');
  act(() => button(picker, 'Reformular').click());
  expect(dialogs().at(-1)!.textContent).toContain('Reformular Viego Dissonância, Shen Yellow Jacket, Shen Yellow Jacket?');
  expect(crafts()).toHaveLength(0);
  act(() => dialogs().at(-1)!.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  await settle();
  await settle();
  expect(crafts()).toHaveLength(1);
  expect(crafts()[0]![0]).toBe('/lol-loot/v1/recipes/SKIN_reroll/craft?repeat=1');
  expect(JSON.parse(crafts()[0]![1].body)).toEqual([VIEGO, SHEN, SHEN]);
  expect(root.querySelector('.rlc-lt-reroll')).toBeNull();
  expect(root.querySelector('.rlc-lt-reveal')!.textContent).toContain('Skin nova');
});

test('reformular: escolha manual respeita a quantidade; tirar da vaga devolve a peça', async () => {
  rerollFetch();
  mount(withShen(2));
  await openViego();
  act(() => button(root.querySelector('.rlc-lt-actions')!, 'Reformular').click());
  const picker = root.querySelector('.rlc-lt-reroll')!;
  const pool = (name: string) => [...picker.querySelectorAll<HTMLButtonElement>('.rlc-lt-reroll-pool .rlc-lt-tile')].find((b) => b.getAttribute('aria-label') === name)!;
  // Só as peças aceitas pela receita aparecem.
  expect([...picker.querySelectorAll('.rlc-lt-reroll-pool .rlc-lt-tile')].map((b) => b.getAttribute('aria-label'))).toEqual(['Viego Dissonância', 'Shen Yellow Jacket']);
  expect(pool('Viego Dissonância').disabled).toBe(true);
  act(() => pool('Shen Yellow Jacket').click());
  act(() => pool('Shen Yellow Jacket').click());
  expect(pool('Shen Yellow Jacket').disabled).toBe(true);
  act(() => picker.querySelector<HTMLButtonElement>('.rlc-lt-slots button')!.click());
  expect(picker.querySelector('.rlc-lt-slot-count')!.textContent).toBe('2 de 3');
  expect(pool('Viego Dissonância').disabled).toBe(false);
  act(() => button(picker, 'Cancelar').click());
  expect(root.querySelector('.rlc-lt-reroll')).toBeNull();
  expect(crafts()).toHaveLength(0);
});

test('reformular: com menos de 3 peças aceitas o botão fica desligado (o menu da LCU diz que pode)', async () => {
  rerollFetch();
  mount(withShen(1));
  await openViego();
  const rr = button(root.querySelector('.rlc-lt-actions')!, 'Reformular');
  expect(rr.disabled).toBe(true);
  expect(root.querySelector('.rlc-lt-actions small')!.textContent).toBe('Reformular pede 3 fragmentos de skin.');
});

test('reformular: sem duplo envio enquanto a criação está em andamento', async () => {
  let release!: (r: Response) => void;
  rerollFetch(() => new Promise<Response>((r) => (release = r)));
  mount(withShen(2));
  await openViego();
  act(() => button(root.querySelector('.rlc-lt-actions')!, 'Reformular').click());
  act(() => button(root.querySelector('.rlc-lt-reroll')!, 'Preencher automaticamente').click());
  act(() => button(root.querySelector('.rlc-lt-reroll')!, 'Reformular').click());
  act(() => dialogs().at(-1)!.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  await settle();
  expect(button(root.querySelector('.rlc-lt-actions')!, 'Reformular').disabled).toBe(true);
  expect(crafts()).toHaveLength(1);
  release(new Response('{"added":[],"removed":[],"redeemed":[]}', { status: 200 }));
  await settle();
});

test('baú sem nome da LCU usa o texto do próprio client; revelação soma o que entrou e o resgatado na hora', () => {
  lootStrings.value = { loot_name_chest_128: 'Cápsula de Campeão' };
  expect(lootName(item('CHEST_128', 'CHEST') as never)).toBe('Cápsula de Campeão');
  lootStrings.value = {};
  const pl = (lootId: string, itemDesc: string, rarity = 'DEFAULT') => ({ lootId, itemDesc, localizedName: '', tilePath: `/t/${lootId}.png`, rarity });
  const r = { added: [{ deltaCount: 1, playerLoot: pl('CHAMPION_RENTAL_1', 'Annie') }, { deltaCount: 1, playerLoot: pl('CHAMPION_RENTAL_1', 'Annie') }], removed: [], redeemed: [{ deltaCount: 1, playerLoot: pl('EMOTE_9', 'Poro', 'MYTHIC') }] };
  expect(revealItems(r as never)).toEqual([
    { name: 'Annie', art: '/t/CHAMPION_RENTAL_1.png', count: 2, chase: false },
    { name: 'Poro', art: '/t/EMOTE_9.png', count: 1, chase: true },
  ]);
});

test('abrir vários de uma vez usa o repeat da receita', async () => {
  mount();
  await settle();
  await settle();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-lt-actions button')].find((b) => b.textContent === 'Todos ×2')!.click());
  expect(root.querySelector('[role="dialog"]')!.textContent).toContain('Abrir: Baú Hextec ×2?');
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  await settle();
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-loot/v1/recipes/CHEST_generic_OPEN/craft?repeat=2')).toBe(true);
});
