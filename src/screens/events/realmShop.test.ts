import { afterEach, expect, test, vi } from 'vitest';
import { buyRealmItem, REALM_CRYSTAL_ID, realmSections, type MarketStore } from './realmShop';

afterEach(() => vi.unstubAllGlobals());

const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const entry = (id: string, cost: number, currencyId = REALM_CRYSTAL_ID, owned = 0) => ({
  id, name: ` Item ${id} `, description: 'Desc', displayMetadata: { tft: { pc: `ASSETS/Loot/${id}.png`, itemType: 'chibi' } },
  purchaseUnits: [{ fulfillment: { ownedQuantity: owned, maxQuantity: 1 }, paymentOptions: [{ key: `0-${currencyId}`, payments: [{ currencyId, finalDelta: cost }] }] }],
});
const store = (id: string, name: string, entries: ReturnType<typeof entry>[], over: Partial<MarketStore> = {}): MarketStore => ({ id, name, startTime: iso(-DAY), endTime: iso(5 * DAY), catalogEntries: entries, ...over });

test('seções: só lojas vigentes pagas em Cristais; item repetido entre lojas aparece uma vez; mesmo nome junta', () => {
  const s = realmSections([
    store('s1', 'Sazonal', [entry('a', 3000), entry('b', 500, REALM_CRYSTAL_ID, 1)]),
    store('s2', 'Halloween', [entry('c', 2500)]),
    store('s3', 'Halloween', [entry('c', 2500), entry('d', 500)]),
    store('s4', 'Arcana', [entry('e', 750, 'outra-moeda')]),
    store('s5', 'Velha', [entry('f', 100)], { endTime: iso(-1) }),
  ]);
  expect(s.map((x) => [x.name, x.items.map((i) => i.entryId)])).toEqual([['Sazonal', ['a', 'b']], ['Halloween', ['c', 'd']]]);
  expect(s[0]!.items[0]).toMatchObject({ name: 'Item a', price: 3000, paymentKey: `0-${REALM_CRYSTAL_ID}`, image: '/lol-game-data/assets/ASSETS/Loot/a.png', owned: false });
  expect(s[0]!.items[1]!.owned).toBe(true);
});

test('compra: cria o pedido com a opção em Cristais e espera a transação sair de CREATED', async () => {
  const states = ['CREATED', 'COMPLETE'];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-marketplace/v1/products/tft/purchases') return new Response(JSON.stringify({ data: { id: 'p1' } }), { status: 200 });
    if (url === '/lol-marketplace/v1/purchases/p1') return new Response(JSON.stringify({ purchaseState: states.shift() }), { status: 200 });
    return new Response(null, { status: 404, statusText: String(init?.method) });
  });
  vi.stubGlobal('fetch', f);
  const item = realmSections([store('s1', 'Sazonal', [entry('a', 3000)])])[0]!.items[0]!;
  expect(await buyRealmItem(item, async () => {})).toBe(true);
  expect(JSON.parse(f.mock.calls[0]![1]!.body as string)).toEqual({ storeId: 's1', catalogEntryId: 'a', paymentOptionsKeys: [`0-${REALM_CRYSTAL_ID}`], quantity: 1 });
  states.push('FAILED');
  expect(await buyRealmItem(item, async () => {})).toBe(false);
});
