import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { artOf, changePrimary, changeSub, fromIds, fromPage, pickSecondary, plain, selectedIds, slotsOf, type Style } from './runeLogic';
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
    // como na LCU: o mesmo fragmento pode estar em mais de uma linha
    { type: 'kStatMod', perks: [5008, 5005, 5007] },
    { type: 'kStatMod', perks: [5008, 5010, 5001] },
    { type: 'kStatMod', perks: [5011, 5013, 5001] },
  ],
});
const STYLES = [style(8000, 8000, 8200, [8200, 8300]), style(8200, 8200, 8000, [8000, 8300]), style(8300, 8300, 8000, [8000, 8200])];
const page = { id: 7, name: 'Meio', isEditable: true, isDeletable: true, current: true, primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [8001, 8011, 8021, 8031, 8211, 8221, 5005, 5008, 5001] };

test('separa pedra angular, linhas e fragmentos pelo tipo do slot', () => {
  const s = slotsOf(STYLES[0]!);
  expect(s.keystone).toEqual([8001, 8002]);
  expect(s.rows).toHaveLength(3);
  expect(s.shards).toEqual([[5008, 5005, 5007], [5008, 5010, 5001], [5011, 5013, 5001]]);
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

test('rascunho de uma recomendação e arte da combinação, do mais específico ao genérico', () => {
  const d = fromIds(8000, 8200, page.selectedPerkIds);
  expect(selectedIds(d)).toEqual(page.selectedPerkIds);
  const st = { ...STYLES[0]!, assetMap: { p8000_s0_k0: '/a/base.jpg', p8000_s8200_k8001: '/a/exata.jpg' } };
  expect(artOf(st, d)).toBe('/a/exata.jpg');
  expect(artOf(st, { ...d, keystone: 8002 })).toBe('/a/base.jpg');
  expect(plain('<b>Atacar</b><br>dá  velocidade')).toBe('Atacar dá velocidade');
});

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
let canAdd = true;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
const rune = (id: number) => root.querySelector<HTMLButtonElement>(`.rlc-re-rune[data-id="${id}"]`)!;
const call = (url: string, method: string) => fetchMock.mock.calls.find((c) => c[0] === url && c[1]?.method === method);
const PERKS = [
  { id: 8001, name: 'Ritmo Fatal', shortDesc: 'Velocidade de ataque', longDesc: '<b>Atacar</b> dá velocidade', iconPath: '/p/8001.png' },
  { id: 8011, name: 'Triunfo', shortDesc: 'Cura ao abater', longDesc: 'Abates restauram vida', iconPath: '/p/8011.png' },
];
beforeEach(() => {
  setLocale('pt_BR');
  canAdd = true;
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/lol-perks/v1/styles') return new Response(JSON.stringify(STYLES), { status: 200 });
    if (url === '/lol-perks/v1/perks') return new Response(JSON.stringify(PERKS), { status: 200 });
    if (url === '/lol-perks/v1/inventory') return new Response(JSON.stringify({ canAddCustomPage: canAdd, ownedPageCount: 2 }), { status: 200 });
    if (url === '/lol-perks/v1/pages' && init?.method === 'POST') return new Response(JSON.stringify({ id: 9 }), { status: 200 });
    return new Response('{}', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

async function mount() {
  const lcu = fakeLcu();
  lcu.perkPages.value = ready([
    { ...page, pageKeystone: { iconPath: '/p/8001.png' }, secondaryStyleIconPath: '/st/8200.png' },
    { ...page, id: 8, name: 'Selva', current: false },
  ]) as Lcu['perkPages']['value'];
  act(() => render(<Runes lcu={lcu} />, root));
  await settle();
  return lcu;
}
async function openEditor() {
  await mount();
  act(() => btn('Meio')!.click());
  await settle();
  await settle();
}

test('coleção: páginas em cartões com pedra angular e secundária, mais Criar nova; clicar abre o editor', async () => {
  await mount();
  expect([...root.querySelectorAll('.rlc-rp-name')].map((p) => p.textContent)).toEqual(['Meio', 'Selva', 'Criar nova']);
  expect(root.querySelector('.rlc-rp-card img.rlc-rp-key')!.getAttribute('src')).toBe('/p/8001.png');
  expect(root.querySelector('.rlc-re')).toBeNull();
  act(() => btn('Meio')!.click());
  await settle();
  expect(root.querySelector('.rlc-re[data-mode="full"]')).not.toBeNull();
  act(() => btn('Fechar')!.click());
  expect(root.querySelector('.rlc-re')).toBeNull();
});

test('coleção: Criar nova manda a página com os padrões da primeira árvore e abre o editor nela', async () => {
  await mount();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rp-card[data-kind="new"]')!.click());
  await settle();
  await settle();
  expect(JSON.parse(call('/lol-perks/v1/pages', 'POST')![1].body)).toEqual({ name: 'Nova página', primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: STYLES[0]!.defaultPerks, current: true });
  expect(root.querySelector('.rlc-re')).not.toBeNull();
});

test('editor: pedras-chave e 3 linhas na principal, 3 linhas e 3 fragmentos na secundária, com a atual marcada', async () => {
  await openEditor();
  const [pri, sec] = root.querySelectorAll('.rlc-re-col');
  expect(pri!.querySelectorAll('.rlc-re-slot')).toHaveLength(4);
  expect(sec!.querySelectorAll('.rlc-re-slot')).toHaveLength(6);
  expect(pri!.textContent).toContain('Pedras-chave');
  expect(rune(8001).getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelector<HTMLInputElement>('.rlc-re-name-input')!.value).toBe('Meio');
  // a principal oferece as outras árvores; a secundária, só as permitidas sem a atual
  expect([...pri!.querySelectorAll('.rlc-re-tree-pick')].map((b) => b.getAttribute('aria-label'))).toEqual(['Estilo 8200', 'Estilo 8300']);
  expect([...sec!.querySelectorAll('.rlc-re-tree-pick')].map((b) => b.getAttribute('aria-label'))).toEqual(['Estilo 8300']);
});

test('editor: secundária troca na mesma linha e mantém só as 2 mais recentes; fragmento troca só na sua linha', async () => {
  await openEditor();
  act(() => rune(8222).click());
  expect(rune(8221).getAttribute('aria-pressed')).toBe('false');
  expect(rune(8222).getAttribute('aria-pressed')).toBe('true');
  expect(rune(8211).getAttribute('aria-pressed')).toBe('true');
  act(() => rune(8231).click());
  expect(rune(8211).getAttribute('aria-pressed')).toBe('false');
  // 5008 existe nas linhas 1 e 2 dos fragmentos: cada linha é independente
  const shards = root.querySelectorAll('.rlc-re-slot[data-kind="shard"]');
  act(() => shards[1]!.querySelector<HTMLButtonElement>('[data-id="5010"]')!.click());
  expect(shards[0]!.querySelector('[data-id="5005"]')!.getAttribute('aria-pressed')).toBe('true');
  expect(shards[1]!.querySelector('[data-id="5008"]')!.getAttribute('aria-pressed')).toBe('false');
  expect(shards[1]!.querySelector('[data-id="5010"]')!.getAttribute('aria-pressed')).toBe('true');
  act(() => btn('Salvar')!.click());
  expect(JSON.parse(call('/lol-perks/v1/pages/7', 'PUT')![1].body).selectedPerkIds).toEqual([8001, 8011, 8021, 8031, 8222, 8231, 5005, 5010, 5001]);
});

test('editor: descrição curta ao lado da escolha; caixa troca para a completa; balão com o texto completo sem marcação', async () => {
  await openEditor();
  const keySlot = root.querySelector('.rlc-re-slot')!;
  expect(keySlot.querySelector('.rlc-re-desc')!.textContent).toBe('Ritmo FatalVelocidade de ataque');
  act(() => {
    const box = root.querySelector<HTMLInputElement>('.rlc-re-foot input')!;
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(keySlot.querySelector('.rlc-re-desc')!.textContent).toBe('Ritmo FatalAtacar dá velocidade');
  act(() => void rune(8011).dispatchEvent(new MouseEvent('mouseenter')));
  expect(root.querySelector('.rlc-re-tip')!.textContent).toBe('TriunfoAbates restauram vida');
  act(() => void rune(8011).dispatchEvent(new MouseEvent('mouseleave')));
  expect(root.querySelector('.rlc-re-tip')).toBeNull();
});

test('editor: Salvar, Nova e Excluir mandam os corpos certos', async () => {
  await openEditor();
  act(() => rune(8002).click());
  act(() => btn('Salvar')!.click());
  expect(JSON.parse(call('/lol-perks/v1/pages/7', 'PUT')![1].body)).toMatchObject({ id: 7, name: 'Meio', primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [8002, 8011, 8021, 8031, 8211, 8221, 5005, 5008, 5001] });
  await settle();
  act(() => btn('＋ Nova')!.click());
  expect(JSON.parse(call('/lol-perks/v1/pages', 'POST')![1].body)).toEqual({ name: 'Nova página', primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [8002, 8011, 8021, 8031, 8211, 8221, 5005, 5008, 5001], current: true });
  await settle();
  act(() => btn('Excluir')!.click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-dialog button[data-variant="primary"]')!.click());
  expect(call('/lol-perks/v1/pages/7', 'DELETE')).toBeTruthy();
});

test('editor: Nova desabilita no limite de páginas', async () => {
  canAdd = false;
  await openEditor();
  expect(btn('＋ Nova')!.disabled).toBe(true);
});

test('editor: lista ▾ troca de página e a torna a atual', async () => {
  await openEditor();
  act(() => btn('Páginas de runas')!.click());
  const items = [...root.querySelectorAll<HTMLButtonElement>('.rlc-re-list-item')];
  expect(items.map((i) => i.textContent)).toEqual(['Meio', 'Selva']);
  act(() => items[1]!.click());
  expect(call('/lol-perks/v1/currentpage', 'PUT')![1].body).toBe('8');
  await settle();
  expect(root.querySelector<HTMLInputElement>('.rlc-re-name-input')!.value).toBe('Selva');
});
