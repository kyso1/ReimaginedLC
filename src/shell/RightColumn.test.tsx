import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { Lcu } from '../lcu';
import { fakeLcu, friend, ready } from '../test/fixtures';
import { CurrencyChip, RightColumn } from './RightColumn';

let root: HTMLElement;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  render(null, root);
  root.remove();
});

const withValues = (values: Partial<Record<keyof Lcu, unknown>>) => {
  const lcu = fakeLcu();
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  return lcu;
};
const me = { gameName: 'Fulano', gameTag: 'TAG', icon: 29, availability: 'chat', statusMessage: 'oi', lol: { level: '312' } };

test('recolhida: meu ícone e só os amigos que não estão offline, jogando primeiro', () => {
  const lcu = withValues({
    chatMe: ready(me),
    friends: ready([
      friend({ gameName: 'Ausente', availability: 'away' }),
      friend({ gameName: 'Off', availability: 'offline' }),
      friend({ gameName: 'Jogando', availability: 'dnd', lol: { gameStatus: 'inGame' } as never }),
      friend({ gameName: 'Online', availability: 'chat' }),
    ]),
  });
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={() => {}} onClose={() => {}} />, root));
  expect(root.querySelector('.rlc-rc-me img')!.getAttribute('src')).toBe('/lol-game-data/assets/v1/profile-icons/29.jpg');
  expect([...root.querySelectorAll('.rlc-rc-avatar')].map((a) => a.getAttribute('aria-label'))).toEqual(['Jogando', 'Online', 'Ausente']);
  expect(root.querySelector('.rlc-rc-panel')).toBeNull();
});

test('expandida: perfil e grupos Jogando, Online, Ausente, Offline recolhido', () => {
  const lcu = withValues({
    chatMe: ready(me),
    friends: ready([friend({ gameName: 'Jogando', availability: 'dnd', lol: { gameStatus: 'inGame', gameQueueType: 'RANKED_SOLO_5x5' } as never }), friend({ gameName: 'Off', availability: 'offline' })]),
  });
  act(() => render(<RightColumn lcu={lcu} open onOpen={() => {}} onClose={() => {}} />, root));
  const panel = root.querySelector('.rlc-rc-panel')!;
  expect(panel.textContent).toContain('Fulano');
  expect(panel.textContent).toContain('nível 312');
  const groups = [...panel.querySelectorAll('.rlc-rc-group-title')].map((g) => g.textContent);
  expect(groups).toEqual(['Jogando (1)', 'Offline (1)']);
  expect(panel.textContent).not.toContain('Off\n');
  expect(panel.querySelectorAll('.rlc-rc-friend')).toHaveLength(1);
});

test('passar o mouse abre e sair fecha', () => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  act(() => render(<RightColumn lcu={withValues({ chatMe: ready(me) })} open={false} onOpen={onOpen} onClose={onClose} />, root));
  act(() => void root.querySelector('.rlc-rc')!.dispatchEvent(new MouseEvent('mouseenter')));
  expect(onOpen).toHaveBeenCalledOnce();
  act(() => void root.querySelector('.rlc-rc')!.dispatchEvent(new MouseEvent('mouseleave')));
  expect(onClose).toHaveBeenCalledOnce();
});

test('chip de moedas: Essência Azul, RP e Essência Laranja formatadas; ausentes não aparecem', () => {
  act(() => render(<CurrencyChip lcu={withValues({ wallet: ready({ lol_blue_essence: 12450, RP: 1380 }), orangeEssence: ready({ count: 320 }) })} />, root));
  expect([...root.querySelectorAll('.rlc-cur')].map((c) => c.textContent)).toEqual(['12.450', '1.380', '320']);
  render(null, root);
  act(() => render(<CurrencyChip lcu={withValues({ wallet: ready(null), orangeEssence: ready(null) })} />, root));
  expect(root.querySelector('.rlc-cur')).toBeNull();
});
