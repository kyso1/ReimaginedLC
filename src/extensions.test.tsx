import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { clearExtensions, registerExtension, startServices } from './extensions';
import { setLocale } from './i18n';
import { Settings } from './screens/settings/Settings';
import { fakeLcu, fakeThemes } from './test/fixtures';

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

test('serviços registrados recebem a LCU ao iniciar', () => {
  const service = vi.fn();
  registerExtension({ services: [service] });
  const lcu = fakeLcu();
  startServices(lcu);
  expect(service).toHaveBeenCalledWith(lcu);
});
