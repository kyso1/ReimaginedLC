import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, ready } from '../../test/fixtures';
import { backdropChampion, RuneEditor } from './RuneEditor';

const CHAMPS = new Map([
  [157, { id: 157, name: 'Yasuo', icon: '', roles: [] }],
  [254, { id: 254, name: 'Vi', icon: '', roles: [] }],
  [234, { id: 234, name: 'Viego', icon: '', roles: [] }],
  [64, { id: 64, name: 'Lee Sin', icon: '', roles: [] }],
  [145, { id: 145, name: "Kai'Sa", icon: '', roles: [] }],
  [203, { id: 203, name: 'Kindred', icon: '', roles: [] }],
]);

test('campeão do fundo: nome na página (palavra inteira, sem acento, o mais longo), senão maior maestria, senão nenhum', () => {
  const mastery = [
    { championId: 203, championPoints: 900 },
    { championId: 64, championPoints: 5000 },
  ];
  expect(backdropChampion('Yasuo Topo', CHAMPS, mastery)).toBe(157);
  expect(backdropChampion('viego selva', CHAMPS, mastery)).toBe(234);
  expect(backdropChampion('Vi selva', CHAMPS, mastery)).toBe(254);
  expect(backdropChampion('LEE SIN - jungle', CHAMPS, mastery)).toBe(64);
  expect(backdropChampion("Kai'Sa atiradora", CHAMPS, mastery)).toBe(145);
  // "Vi" dentro de outra palavra não conta
  expect(backdropChampion('Vitória', CHAMPS, mastery)).toBe(64);
  expect(backdropChampion('Meio', CHAMPS, [])).toBe(0);
});

let root: HTMLElement;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const STYLES = [8000, 8200].map((id) => ({ id, name: `Estilo ${id}`, iconPath: '', allowedSubStyles: [8000, 8200], defaultSubStyle: id === 8000 ? 8200 : 8000, defaultPerks: [], slots: [] }));
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
      if (url === '/lol-perks/v1/styles') return json(STYLES);
      if (url === '/lol-champion-mastery/v1/me-1/champion-mastery') return json([{ championId: 64, championPoints: 5000 }]);
      return json([]);
    }),
  );
  // O jsdom não carrega imagens: esta "carrega" logo, para o Crossfade trocar a camada.
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null;
      decode = () => Promise.resolve();
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

async function mount(name: string, artSkin: number | null = null) {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => CHAMPS, splash: async (id) => (id ? `/splash/${id}.jpg` : null) };
  lcu.chatMe.value = ready({ puuid: 'me-1' }) as Lcu['chatMe']['value'];
  lcu.perkPages.value = ready([{ id: 7, name, isEditable: true, current: true, primaryStyleId: 8000, subStyleId: 8200, selectedPerkIds: [] }]) as unknown as Lcu['perkPages']['value'];
  act(() => render(<RuneEditor lcu={lcu} mode="full" artSkin={artSkin} onClose={() => {}} />, root));
  for (let i = 0; i < 4; i++) await settle();
}
const splash = () => root.querySelector<HTMLElement>('.rlc-re-art-splash .rlc-xfade-layer:last-child')?.style.backgroundImage ?? null;

test('fundo da Coleção: splash do campeão do nome da página, tingida pelas duas árvores', async () => {
  await mount('Yasuo Topo');
  expect(splash()).toBe('url("/splash/157000.jpg")');
  const art = root.querySelector<HTMLElement>('.rlc-re-art')!;
  expect([art.dataset.primary, art.dataset.sub]).toEqual(['8000', '8200']);
});

test('fundo da Coleção sem campeão no nome: o de maior maestria', async () => {
  await mount('Meio');
  expect(splash()).toBe('url("/splash/64000.jpg")');
});

test('na seleção vale a skin que ela passa', async () => {
  await mount('Yasuo Topo', 103005);
  expect(splash()).toBe('url("/splash/103005.jpg")');
});
