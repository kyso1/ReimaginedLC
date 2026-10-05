import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { clearExtensions, registerExtension, startServices } from './extensions';
import { setLocale } from './i18n';
import type { Lcu } from './lcu';
import { Collection } from './screens/collection/Collection';
import { ChampSelect } from './screens/champselect/ChampSelect';
import { Settings } from './screens/settings/Settings';
import { action, cell, fakeLcu, fakeThemes, ready, session } from './test/fixtures';

let root: HTMLElement;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })));
});
afterEach(() => {
  render(null, root);
  root.remove();
  clearExtensions();
  vi.unstubAllGlobals();
});

const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text);
const themes = () => fakeThemes(signal({ name: 'vidro', label: 'Vidro', tokens: {}, transition: 'wipe', backgrounds: {} }), [{ name: 'vidro', label: 'Vidro' }], vi.fn());

test('sem extensão nada muda: sem aba Extras', () => {
  act(() => render(<Settings lcu={fakeLcu()} themes={themes()} />, root));
  expect(tab('Extras')).toBeUndefined();
});

test('aba de configurações registrada aparece e renderiza o conteúdo da extensão', () => {
  registerExtension({ settingsTabs: [{ id: 'extras', label: () => 'Extras', render: () => <p class="stub-extras">ok</p> }] });
  act(() => render(<Settings lcu={fakeLcu()} themes={themes()} />, root));
  act(() => tab('Extras')!.click());
  expect(root.querySelector('.stub-extras')).not.toBeNull();
});

test('aba da coleção registrada aparece', () => {
  registerExtension({ collectionTabs: [{ id: 'custom', label: () => 'Skins custom', render: () => <p class="stub-custom">ok</p> }] });
  const lcu = fakeLcu();
  lcu.chatMe.value = ready({ puuid: 'me', summonerId: 42 }) as Lcu['chatMe']['value'];
  act(() => render(<Collection lcu={lcu} />, root));
  act(() => tab('Skins custom')!.click());
  expect(root.querySelector('.stub-custom')).not.toBeNull();
});

function champSelect() {
  const lcu = fakeLcu();
  const me = cell({ cellId: 0, gameName: 'Fulano', championId: 103, selectedSkinId: 103000 });
  const hidden = cell({ cellId: 1, gameName: '', puuid: 'p-hidden' });
  const s = session({ myTeam: [me, hidden], theirTeam: [], actions: [[action({ id: 6, type: 'pick', isInProgress: false, completed: true, championId: 103, actorCellId: 0 })]] });
  for (const [k, v] of Object.entries({ champSelect: ready(s), pickable: ready([103]), bannable: ready([]), skins: ready([]) })) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  act(() => render(<ChampSelect lcu={lcu} />, root));
}

test('seleção: nomes da extensão preenchem jogadores ocultos; botões e cartões de skin da extensão aparecem', () => {
  registerExtension({
    useCellNames: () => new Map([['p-hidden', 'Zeca#BR1']]),
    champSelectActions: [() => <button type="button" class="stub-dodge">Dodge</button>],
    skinCards: [() => <button type="button" class="stub-skin">Custom</button>],
  });
  champSelect();
  expect([...root.querySelectorAll('.rlc-cs-name')].map((n) => n.textContent)).toEqual(['Fulano', 'Zeca#BR1']);
  expect(root.querySelector('.rlc-cs-action .stub-dodge')).not.toBeNull();
  expect(root.querySelector('.stub-skin')).not.toBeNull();
});

test('serviços registrados recebem a LCU ao iniciar', () => {
  const service = vi.fn();
  registerExtension({ services: [service] });
  const lcu = fakeLcu();
  startServices(lcu);
  expect(service).toHaveBeenCalledWith(lcu);
});
