import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { Home, patchNotesUrl, shortPatch } from './Home';

let host: HTMLElement;

beforeEach(() => {
  setLocale('pt_BR');
  host = document.body.appendChild(document.createElement('div'));
  window.Toast = { success: vi.fn(), error: vi.fn() };
});

afterEach(() => {
  render(null, host);
  host.remove();
  delete window.Toast;
});

const button = (text: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(text));

test('shortPatch extrai os dois primeiros números da versão do client', () => {
  expect(shortPatch('16.19.823.0722')).toBe('16.19');
  expect(shortPatch('9.1.1')).toBe('9.1');
  for (const v of [null, undefined, '', 'abc', '16']) expect(shortPatch(v)).toBeNull();
});

test('patchNotesUrl monta o endereço pelo locale e cai em en-us', () => {
  expect(patchNotesUrl('pt_BR')).toBe('https://www.leagueoflegends.com/pt-br/news/tags/patch-notes/');
  expect(patchNotesUrl('en_US')).toBe('https://www.leagueoflegends.com/en-us/news/tags/patch-notes/');
  for (const l of [null, undefined, '', '../x', 'pt_BR/evil', 'javascript:alert(1)']) {
    expect(patchNotesUrl(l)).toBe('https://www.leagueoflegends.com/en-us/news/tags/patch-notes/');
  }
});

test('Jogar chama onPlay', () => {
  const onPlay = vi.fn();
  render(<Home version="16.19.823.0722" locale="pt_BR" onPlay={onPlay} />, host);
  button('Jogar')!.click();
  expect(onPlay).toHaveBeenCalledTimes(1);
});

test('mostra a versão curta e abre as notas do patch', () => {
  const open = vi.fn().mockReturnValue({});
  render(<Home version="16.19.823.0722" locale="pt_BR" onPlay={() => {}} open={open} />, host);
  const pill = button('16.19')!;
  expect(pill.textContent).toContain('Notas do patch');
  pill.click();
  expect(open).toHaveBeenCalledWith('https://www.leagueoflegends.com/pt-br/news/tags/patch-notes/');
});

test('sem versão conhecida, o atalho mostra só o rótulo', () => {
  render(<Home version={null} locale="pt_BR" onPlay={() => {}} />, host);
  expect(button('Notas do patch')!.textContent!.trim()).toBe('Notas do patch');
});

test('se abrir falhar, avisa com Toast', () => {
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} open={() => null} />, host);
  button('Notas do patch')!.click();
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} open={() => { throw new Error('bloqueado'); }} />, host);
  button('Notas do patch')!.click();
  expect(window.Toast!.error).toHaveBeenCalledTimes(2);
});

test('a tela inicial não mostra nome de invocador', () => {
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} />, host);
  expect(host.textContent).not.toMatch(/Fulano|anon-/);
  // Jogar, notas do patch e o olho de só fundo.
  expect(host.querySelectorAll('button')).toHaveLength(3);
});

test('destaques: abas da Riot, slides da aba, miniatura troca o slide e Ver na loja abre a loja', async () => {
  const pages: Record<string, unknown> = {
    '/lol-activity-center/v1/content/client-nav': { data: [{ title: 'True Damage', action: { type: 'lc_home_tab', payload: { tabId: 'td' } } }] },
    '/lol-activity-center/v1/content/td': {
      blades: [{ type: 'mediaGallery', items: [
        { mediaGalleryItemID: 'y', header: { title: '*Yasuo', links: [{ media: { type: 'image', url: '/y.png' }, action: { type: 'lc_store_paw' } }] } },
        { mediaGalleryItemID: 's', header: { title: 'Senna', links: [{ media: { type: 'image', url: '/s.png' } }] } },
      ] }],
    },
  };
  const onStore = vi.fn();
  render(<Home version={null} locale="pt_BR" onPlay={() => {}} onStore={onStore} load={async (u) => pages[u] ?? null} />, host);
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 30));
  expect(host.querySelector('.rlc-feat-tabs')!.textContent).toBe('True Damage');
  expect(host.querySelector('.rlc-feat-title')!.textContent).toBe('Yasuo');
  button('Ver na loja')!.click();
  expect(onStore).toHaveBeenCalledTimes(1);
  (host.querySelector('[aria-label="Senna"]') as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 30));
  expect(host.querySelector('.rlc-feat-title')!.textContent).toBe('Senna');
  expect(button('Ver na loja')).toBeUndefined();
});

test('destaques: o fundo troca de slide com fusão (Crossfade), não com corte seco', async () => {
  // jsdom não carrega imagem: a falsa avisa "carregou" logo depois de receber o endereço.
  vi.stubGlobal('Image', class { onload: (() => void) | null = null; set src(_: string) { setTimeout(() => this.onload?.()); } });
  const pages: Record<string, unknown> = {
    '/lol-activity-center/v1/content/client-nav': { data: [{ title: 'True Damage', action: { type: 'lc_home_tab', payload: { tabId: 'td' } } }] },
    '/lol-activity-center/v1/content/td': {
      blades: [{ type: 'mediaGallery', items: [
        { mediaGalleryItemID: 'y', header: { title: 'Yasuo', links: [{ media: { type: 'image', url: '/y.png' } }] } },
        { mediaGalleryItemID: 's', header: { title: 'Senna', links: [{ media: { type: 'image', url: '/s.png' } }] } },
      ] }],
    },
  };
  const wait = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 20)); };
  const layers = () => [...host.querySelectorAll<HTMLElement>('.rlc-feat-bg.rlc-xfade .rlc-xfade-layer')].map((l) => l.style.backgroundImage);
  render(<Home version={null} locale="pt_BR" onPlay={() => {}} load={async (u) => pages[u] ?? null} />, host);
  await wait();
  expect(layers()).toEqual(['url("/y.png")']);
  (host.querySelector('[aria-label="Senna"]') as HTMLButtonElement).click();
  await wait();
  // As duas camadas convivem durante a fusão; a nova entra por cima.
  expect(layers()).toEqual(['url("/y.png")', 'url("/s.png")']);
  vi.unstubAllGlobals();
});

test('só o fundo: o olho esconde destaques, Jogar e patch; o olho riscado traz de volta', async () => {
  const { prefs, DEFAULT_PREFS } = await import('../../shell/prefs');
  prefs.value = { ...DEFAULT_PREFS };
  const { act } = await import('preact/test-utils');
  act(() => render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} />, host));
  act(() => host.querySelector<HTMLButtonElement>('button[aria-label="Mostrar só o fundo"]')!.click());
  expect(prefs.value.homeBare).toBe(true);
  expect(host.querySelectorAll('button')).toHaveLength(1);
  expect(host.textContent).not.toContain('Jogar');
  act(() => host.querySelector<HTMLButtonElement>('button[aria-label="Mostrar o Início"]')!.click());
  expect(prefs.value.homeBare).toBe(false);
  expect(host.textContent).toContain('Jogar');
  prefs.value = { ...DEFAULT_PREFS };
});
