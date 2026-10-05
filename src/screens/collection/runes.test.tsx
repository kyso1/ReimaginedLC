import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { changePrimary, changeSub, fromPage, pickSecondary, selectedIds, slotsOf, type Style } from './runeLogic';
import { Runes } from './Runes';

const style = (id: number, base: number, sub: number, allowed: number[]): Style => ({
  id,
  name: `Estilo ${id}`,
  iconPath: `/st/${id}.png`,
  allowedSubStyles: allowed,
  defaultSubStyle: sub,
  defaultPerks: [base + 1, base + 11, base + 21, base + 31, sub + 11, sub + 21, 5005, 5008, 5001],
  slots: [
    { type: 'kKeyStone', perks: [base + 1, base + 2] },
    { type: 'kMixedRegularSplashable', perks: [base + 11, base + 12] },
    { type: 'kMixedRegularSplashable', perks: [base + 21, base + 22] },
    { type: 'kMixedRegularSplashable', perks: [base + 31, base + 32] },
    { type: 'kStatMod', perks: [5005, 5008] },
    { type: 'kStatMod', perks: [5008, 5002] },
    { type: 'kStatMod', perks: [5001, 5011] },
  ],
});
const STYLES = [style(8000, 8000, 8200, [8200, 8300]), style(8200, 8200, 8000, [8000, 8300]), style(8300, 8300, 8000, [8000, 8200])];
const page = { id: 7, name: 'Meio', isEditable: true, isDeletable: true, current: true, primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [8001, 8011, 8021, 8031, 8211, 8221, 5005, 5008, 5001] };

test('separa pedra angular, linhas e fragmentos pelo tipo do slot', () => {
  const s = slotsOf(STYLES[0]!);
  expect(s.keystone).toEqual([8001, 8002]);
  expect(s.rows).toHaveLength(3);
  expect(s.shards).toHaveLength(3);
});

test('rascunho de uma página e de volta para os 9 ids', () => {
  const d = fromPage(page as never, STYLES);
  expect(d).toMatchObject({ primary: 8000, sub: 8200, keystone: 8001, primaryPerks: [8011, 8021, 8031], secondary: [8211, 8221], shards: [5005, 5008, 5001] });
  expect(selectedIds(d)).toEqual(page.selectedPerkIds);
});

test('secundária: no máximo duas, de linhas diferentes; mesma linha troca, terceira linha tira a mais antiga', () => {
  let d = fromPage(page as never, STYLES);
  d = pickSecondary(d, 8212, STYLES);
  expect(d.secondary).toEqual([8221, 8212]);
  d = pickSecondary(d, 8231, STYLES);
  expect(d.secondary).toEqual([8212, 8231]);
});

test('trocar o estilo principal usa os padrões dele e, se a secundária ficar igual, troca a secundária', () => {
  const d = changePrimary(fromPage(page as never, STYLES), 8200, STYLES);
  expect(d.primary).toBe(8200);
  expect(d.keystone).toBe(8201);
  expect(d.primaryPerks).toEqual([8211, 8221, 8231]);
  expect(d.sub).toBe(8000);
  expect(d.secondary).toEqual([]);
  const e = changeSub(d, 8300);
  expect(e.sub).toBe(8300);
  expect(e.secondary).toEqual([]);
});

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => {
    if (url === '/lol-perks/v1/styles') return new Response(JSON.stringify(STYLES), { status: 200 });
    if (url === '/lol-perks/v1/perks') return new Response(JSON.stringify([{ id: 8001, name: 'Ritmo Fatal', longDesc: '<b>Atacar</b> dá velocidade', iconPath: '/p/8001.png' }]), { status: 200 });
    return new Response('{}', { status: 200 });
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
  lcu.perkPages.value = ready([page, { ...page, id: 8, name: 'Selva', current: false }]) as Lcu['perkPages']['value'];
  act(() => render(<Runes lcu={lcu} />, root));
}

test('editor: abas de páginas, linhas com a atual marcada, descrição da runa em foco como texto', async () => {
  mount();
  await settle();
  await settle();
  expect([...root.querySelectorAll('.rlc-rn-page')].map((p) => p.textContent)).toEqual(['Meio', 'Selva', '+ nova']);
  // seletor principal, pedra angular, 3 linhas, seletor secundário, 3 linhas, 3 fragmentos
  expect(root.querySelectorAll('.rlc-rn-row')).toHaveLength(1 + 1 + 3 + 1 + 3 + 3);
  const ks = root.querySelector<HTMLButtonElement>('.rlc-rn-perk[data-id="8001"]')!;
  expect(ks.getAttribute('aria-pressed')).toBe('true');
  act(() => void ks.dispatchEvent(new MouseEvent('mouseenter')));
  expect(root.querySelector('.rlc-rn-desc')!.textContent).toContain('Atacar dá velocidade');
  expect(root.querySelector('.rlc-rn-desc b')).toBeNull();
});

test('editor: trocar uma runa e salvar envia a página com os 9 ids', async () => {
  mount();
  await settle();
  await settle();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rn-perk[data-id="8002"]')!.click());
  act(() => btn('Salvar')!.click());
  const call = fetchMock.mock.calls.find((c) => c[0] === '/lol-perks/v1/pages/7' && c[1]?.method === 'PUT')!;
  expect(JSON.parse(call[1].body)).toMatchObject({ id: 7, name: 'Meio', primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [8002, 8011, 8021, 8031, 8211, 8221, 5005, 5008, 5001] });
});

test('editor: nova página e apagar com confirmação', async () => {
  mount();
  await settle();
  await settle();
  act(() => btn('+ nova')!.click());
  const post = fetchMock.mock.calls.find((c) => c[0] === '/lol-perks/v1/pages' && c[1]?.method === 'POST')!;
  expect(JSON.parse(post[1].body)).toMatchObject({ primaryStyleId: 8000, subStyleId: 8200, current: true });
  await settle();
  act(() => btn('Apagar')!.click());
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-perks/v1/pages/7' && c[1]?.method === 'DELETE')).toBe(true);
});
