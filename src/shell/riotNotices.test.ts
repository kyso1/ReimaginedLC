import { afterEach, expect, test } from 'vitest';
import { watchRiotNotices } from './riotNotices';

afterEach(() => void (document.body.innerHTML = ''));
const tick = () => new Promise((r) => setTimeout(r, 0));

test('aviso nativo (modal, cerimônia, toast de elo) sobe o gerenciador da Riot; sem aviso, volta para baixo', async () => {
  const stop = watchRiotNotices();
  // O gerenciador nasce depois de nós, como no boot do client.
  document.body.insertAdjacentHTML('beforeend', '<div id="lol-uikit-layer-manager"><div id="lol-uikit-layer-manager-wrapper"><lol-social-chat-window></lol-social-chat-window></div></div>');
  await tick();
  const manager = document.getElementById('lol-uikit-layer-manager')!;
  const wrapper = document.getElementById('lol-uikit-layer-manager-wrapper')!;
  expect(manager.hasAttribute('data-rlc-notice')).toBe(false);
  wrapper.insertAdjacentHTML('beforeend', '<div class="modal"><div class="dialog-alert">Banido</div></div>');
  await tick();
  expect(manager.hasAttribute('data-rlc-notice')).toBe(true);
  wrapper.querySelector('.modal')!.remove();
  await tick();
  expect(manager.hasAttribute('data-rlc-notice')).toBe(false);
  // Camada de cerimônia vazia não conta; com a cerimônia dentro, sobe.
  wrapper.insertAdjacentHTML('beforeend', '<div class="lol-uikit-vignette-celebration-layer"></div>');
  await tick();
  expect(manager.hasAttribute('data-rlc-notice')).toBe(false);
  wrapper.querySelector('.lol-uikit-vignette-celebration-layer')!.append(document.createElement('div'));
  await tick();
  expect(manager.hasAttribute('data-rlc-notice')).toBe(true);
  stop();
  expect(manager.hasAttribute('data-rlc-notice')).toBe(false);
});
