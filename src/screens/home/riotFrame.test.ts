import { afterEach, expect, test, vi } from 'vitest';
import { enabled } from '../../shell/layer';
import { mountRiotFrame, openClientAction, setNavigationApi } from './riotFrame';

afterEach(() => {
  setNavigationApi(null);
  vi.useRealTimers();
  document.body.innerHTML = '';
});

/** API falsa do `rcp-fe-lol-navigation`, com a instância Ember da central de atividades. */
function fakeNav() {
  const frame = { appendTo: vi.fn(), destroy: vi.fn() };
  const create = vi.fn(() => frame);
  const lookupFactory = vi.fn((name: string) => (name === 'component:managed-iframe' ? { create } : undefined));
  return { api: { activityCenter: { _activityCenterApi: { _appInstance: { __container__: { lookupFactory } } } } }, create, frame };
}

test('mountRiotFrame cria o managed-iframe como o openIframeModalHandler do client e destrói na limpeza', () => {
  const { api, create, frame } = fakeNav();
  setNavigationApi(api);
  const el = document.createElement('div');
  const cleanup = mountRiotFrame(el, { id: 'esports_pickems', url: 'https://palpites.exemplo/' });
  expect(create).toHaveBeenCalledWith({ id: 'esports_pickems', isHidden: false, url: 'https://palpites.exemplo/', isQuickLoadEnabled: true });
  expect(frame.appendTo).toHaveBeenCalledWith(el);
  expect(frame.destroy).not.toHaveBeenCalled();
  cleanup!();
  expect(frame.destroy).toHaveBeenCalledTimes(1);
});

test('mountRiotFrame devolve null sem a API, sem a instância Ember ou quando o client falha', () => {
  const el = document.createElement('div');
  expect(mountRiotFrame(el, { id: 'a', url: 'https://x/' })).toBeNull();
  setNavigationApi({ activityCenter: {} });
  expect(mountRiotFrame(el, { id: 'a', url: 'https://x/' })).toBeNull();
  const { api, create } = fakeNav();
  create.mockImplementation(() => {
    throw new Error('Zeca quebrou');
  });
  setNavigationApi(api);
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(mountRiotFrame(el, { id: 'a', url: 'https://x/' })).toBeNull();
  err.mockRestore();
});

/** Client falso: gerenciador de camadas da Riot com um modal antigo e a tela da central de atividades. */
function fakeClient(onRoute: () => void) {
  document.body.innerHTML = '<div id="lol-uikit-layer-manager"><div class="modal antigo"></div></div><div class="screen-root" data-screen-name="rcp-fe-lol-activity-center"></div>';
  const route = vi.fn(onRoute);
  setNavigationApi({ activityCenter: { route } });
  return route;
}

test('openClientAction passa a ação ao route do client e sobe o modal novo acima da camada', () => {
  vi.useFakeTimers();
  const route = fakeClient(() => {
    const m = document.createElement('div');
    m.className = 'modal novo';
    document.getElementById('lol-uikit-layer-manager')!.append(m);
  });
  expect(openClientAction('lc_algo', { itemId: '7' })).toBe(true);
  expect(route).toHaveBeenCalledWith('lc_algo', { itemId: '7' }, {});
  vi.advanceTimersByTime(300);
  expect(document.querySelector<HTMLElement>('.modal.novo')!.style.zIndex).toBe('2147483001');
  expect(document.querySelector<HTMLElement>('.modal.antigo')!.style.zIndex).toBe('');
});

test('openClientAction desliga a camada quando o client troca de tela', () => {
  vi.useFakeTimers();
  enabled.value = true;
  fakeClient(() => {
    document.querySelector<HTMLElement>('.screen-root')!.style.display = 'none';
  });
  openClientAction('lc_loot', {});
  vi.advanceTimersByTime(200);
  expect(enabled.value).toBe(false);
});

test('openClientAction devolve false sem o route do client', () => {
  expect(openClientAction('lc_algo', {})).toBe(false);
});
