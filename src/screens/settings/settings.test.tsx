import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { effectiveLocale, prefs, sanitizePrefs } from '../../shell/prefs';
import { fakeLcu, fakeThemes } from '../../test/fixtures';
import type { ResolvedTheme } from '../../theme/resolve';
import * as bg from '../../theme/background';
import { update } from '../../shell/update';
import { Settings } from './Settings';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text)!;
const btn = (text: string, scope: ParentNode = root) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
const store = new Map<string, unknown>();

const vidro: ResolvedTheme = { name: 'vidro', label: 'Vidro', tokens: { 'color.bg': '#0b1020', 'color.accent': '#ffffff' }, transition: 'wipe', backgrounds: {} };

beforeEach(() => {
  setLocale('pt_BR');
  store.clear();
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: (k) => void store.delete(k) };
  window.Toast = { success: vi.fn(), error: vi.fn() };
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => {
    if (url === '/lol-game-settings/v1/game-settings-schema') return new Response(JSON.stringify({ General: { EnableAudio: { default: true }, CursorScale: { default: 0.5 }, GameMouseSpeed: { default: 10 } } }), { status: 200 });
    if (url === '/lol-game-settings/v1/game-settings') return new Response(JSON.stringify({ General: { EnableAudio: false, CursorScale: 0.7 } }), { status: 200 });
    return new Response('true', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  delete window.DataStore;
  delete window.Toast;
});

function mount(overrides: Partial<ReturnType<typeof fakeThemes>> = {}) {
  const set = vi.fn();
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'editorial', label: 'Editorial' }], set), ...overrides };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  return { set, themes };
}

test('preferências: só valores conhecidos', () => {
  expect(sanitizePrefs({ motion: 'turbo', video: 'sim', champSelectLayout: 'classic', locale: 'en', openOnStart: true })).toEqual({ motion: 'full', video: true, champSelectLayout: 'classic', locale: 'en', openOnStart: true });
  expect(sanitizePrefs(null)).toMatchObject({ motion: 'full', champSelectLayout: 'cinematic', locale: 'auto', openOnStart: null });
});

test('aparência: clicar num tema aplica para o jogo do grupo', () => {
  const { set } = mount();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-st-group')[0]!.querySelector<HTMLButtonElement>('.rlc-st-theme[data-name="editorial"]')!.click());
  expect(set).toHaveBeenCalledWith('editorial', 'lol');
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-st-group')[1]!.querySelector<HTMLButtonElement>('.rlc-st-theme[data-name="vidro"]')!.click());
  expect(set).toHaveBeenCalledWith('vidro', 'tft');
});

test('aparência: importar JSON inválido mostra o erro e não salva', async () => {
  const saveUser = vi.fn(() => ({ ok: false as const, error: 'tokens.color.bg: cor inválida' }));
  mount({ saveUser });
  const input = root.querySelector<HTMLInputElement>('input[type="file"][accept=".json,application/json"]')!;
  Object.defineProperty(input, 'files', { value: [new File(['{"name":"x"}'], 'x.json', { type: 'application/json' })] });
  act(() => void input.dispatchEvent(new Event('change', { bubbles: true })));
  await settle();
  await settle();
  expect(saveUser).toHaveBeenCalled();
  expect(window.Toast!.error).toHaveBeenCalledWith(expect.stringContaining('cor inválida'));
});

test('aparência: transições e vídeo de fundo vão para as preferências', () => {
  mount();
  const motion = root.querySelector<HTMLSelectElement>('select[aria-label="Transições"]')!;
  act(() => {
    motion.value = 'off';
    motion.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(prefs.value.motion).toBe('off');
  expect((store.get('rlc.prefs') as { motion: string }).motion).toBe('off');
});

test('layouts: seleção clássica', () => {
  mount();
  act(() => tab('Layouts').click());
  act(() => btn('Clássica')!.click());
  expect(prefs.value.champSelectLayout).toBe('classic');
});

test('jogo: formulário gerado do esquema, com os valores atuais; mudar salva', async () => {
  mount();
  act(() => tab('Jogo').click());
  await settle();
  await settle();
  const audio = root.querySelector<HTMLInputElement>('input[type="checkbox"][data-key="General.EnableAudio"]')!;
  expect(audio.checked).toBe(false);
  act(() => audio.click());
  await settle();
  const patch = fetchMock.mock.calls.find((c) => c[0] === '/lol-game-settings/v1/game-settings' && c[1]?.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body)).toEqual({ General: { EnableAudio: true } });
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-game-settings/v1/save')).toBe(true);
});

test('editor: mudar uma cor atualiza a prévia e salvar envia o tema', async () => {
  const saveUser = vi.fn(() => ({ ok: true as const }));
  const resolveDraft = vi.fn((m: unknown) => ({ ok: true as const, theme: { ...vidro, tokens: { ...(m as { tokens: Record<string, string> }).tokens } } }));
  mount({ saveUser, resolveDraft, manifest: () => ({ name: 'vidro', label: 'Vidro', version: 1, extends: null, tokens: { 'color.bg': '#0b1020' }, backgrounds: {}, layouts: {} }) });
  act(() => btn('Novo tema')!.click());
  const color = root.querySelector<HTMLInputElement>('input[data-token="color.bg"]')!;
  act(() => {
    color.value = '#ff0000';
    color.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(root.querySelector<HTMLElement>('.rlc-ed-preview')!.style.getPropertyValue('--rlc-color-bg')).toBe('#ff0000');
  act(() => btn('Salvar')!.click());
  expect(saveUser).toHaveBeenCalledWith(expect.objectContaining({ tokens: expect.objectContaining({ 'color.bg': '#ff0000' }), extends: 'vidro' }));
});

test('idioma: preferência fixa vence o do client', () => {
  expect(effectiveLocale('auto', 'en_US')).toBe('en_US');
  expect(effectiveLocale('pt', 'en_US')).toBe('pt_BR');
  expect(effectiveLocale('en', 'pt_BR')).toBe('en_US');
  expect(effectiveLocale('auto', undefined)).toBeNull();
});

test('jogo: número vazio não grava; campo inteiro grava inteiro', async () => {
  mount();
  act(() => tab('Jogo').click());
  await settle();
  await settle();
  const speed = root.querySelector<HTMLInputElement>('input[data-key="General.GameMouseSpeed"]')!;
  const change = (v: string) =>
    act(() => {
      speed.value = v;
      speed.dispatchEvent(new Event('change', { bubbles: true }));
    });
  change('');
  await settle();
  expect(fetchMock.mock.calls.some((c) => c[1]?.method === 'PATCH')).toBe(false);
  change('7.6');
  await settle();
  const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body)).toEqual({ General: { GameMouseSpeed: 8 } });
});

test('apagar tema do usuário pede confirmação', () => {
  const deleteUser = vi.fn(() => ({ ok: true as const }));
  const set = vi.fn();
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'meu', label: 'Meu', user: true }], set), deleteUser };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  const wrap = root.querySelector('.rlc-st-group')!.querySelector('.rlc-st-theme[data-name="meu"]')!.parentElement!;
  act(() => wrap.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  act(() => btn('Apagar', wrap)!.click());
  expect(deleteUser).not.toHaveBeenCalled();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === 'Apagar')!.click());
  expect(deleteUser).toHaveBeenCalledWith('meu');
});

test('fundo: arquivo novo apaga o anterior; arquivo grande demais ou de tipo errado é recusado', async () => {
  const put = vi.spyOn(bg, 'putMedia').mockResolvedValue(true);
  const del = vi.spyOn(bg, 'deleteMedia').mockResolvedValue();
  bg.background.value = { ...bg.DEFAULT_BG, global: { kind: 'file', key: 'bg-old', mime: 'image/png' } };
  mount();
  const input = root.querySelector<HTMLInputElement>('.rlc-st-bg input[type="file"]')!;
  const pick = async (file: File) => {
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    act(() => void input.dispatchEvent(new Event('change', { bubbles: true })));
    await settle();
    await settle();
  };
  await pick(new File(['x'], 'a.svg', { type: 'image/svg+xml' }));
  expect(put).not.toHaveBeenCalled();
  const big = new File(['x'], 'big.webm', { type: 'video/webm' });
  Object.defineProperty(big, 'size', { value: bg.MAX_MEDIA_BYTES + 1 });
  await pick(big);
  expect(put).not.toHaveBeenCalled();
  expect(window.Toast!.error).toHaveBeenCalledTimes(2);
  await pick(new File(['x'], 'b.png', { type: 'image/png' }));
  expect(put).toHaveBeenCalledTimes(1);
  expect(del).toHaveBeenCalledWith('bg-old');
  expect(bg.background.value.global).toMatchObject({ kind: 'file', mime: 'image/png' });
  put.mockRestore();
  del.mockRestore();
  bg.background.value = bg.DEFAULT_BG;
});

test('jogo: gravação recusada pela LCU devolve a caixa ao valor anterior', async () => {
  mount();
  act(() => tab('Jogo').click());
  await settle();
  await settle();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ message: 'não' }), { status: 500 }));
  const audio = root.querySelector<HTMLInputElement>('input[type="checkbox"][data-key="General.EnableAudio"]')!;
  act(() => audio.click());
  expect(audio.checked).toBe(true);
  await settle();
  await settle();
  expect(audio.checked).toBe(false);
});

test('importar tema com o nome de um tema seu cria uma cópia com outro nome', async () => {
  const saveUser = vi.fn(() => ({ ok: true as const }));
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'meu', label: 'Meu', user: true }], vi.fn()), saveUser };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  const input = root.querySelector<HTMLInputElement>('input[type="file"][accept=".json,application/json"]')!;
  Object.defineProperty(input, 'files', { value: [new File(['{"name":"meu","label":"Meu"}'], 'meu.json', { type: 'application/json' })] });
  act(() => void input.dispatchEvent(new Event('change', { bubbles: true })));
  await settle();
  await settle();
  expect(saveUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'meu-1' }));
});

test('apagar tema recusado pelo motor mostra o motivo', () => {
  const deleteUser = vi.fn(() => ({ ok: false as const, error: 'usado por Filho' }));
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'meu', label: 'Meu', user: true }], vi.fn()), deleteUser };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  const wrap = root.querySelector('.rlc-st-group')!.querySelector('.rlc-st-theme[data-name="meu"]')!.parentElement!;
  act(() => wrap.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  act(() => btn('Apagar', wrap)!.click());
  act(() => [...root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === 'Apagar')!.click());
  expect(window.Toast!.error).toHaveBeenCalledWith(expect.stringContaining('usado por Filho'));
});

test('fundo: skins do campeão anterior que chegam atrasadas não aparecem', async () => {
  let release!: () => void;
  const slow = new Promise<void>((r) => (release = r));
  fetchMock.mockImplementation(async (url: string) => {
    if (url === '/lol-game-data/assets/v1/champions/1.json') {
      await slow;
      return new Response(JSON.stringify({ skins: [{ id: 1000, name: 'Annie' }] }), { status: 200 });
    }
    if (url === '/lol-game-data/assets/v1/champions/103.json') return new Response(JSON.stringify({ skins: [{ id: 103000, name: 'Ahri' }] }), { status: 200 });
    return new Response('[]', { status: 200 });
  });
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => new Map([[1, { id: 1, name: 'Annie', icon: '', roles: [] }], [103, { id: 103, name: 'Ahri', icon: '', roles: [] }]]) };
  act(() => render(<Settings lcu={lcu} themes={fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }], vi.fn())} />, root));
  act(() => btn('Splash')!.click());
  await settle();
  const search = root.querySelector<HTMLInputElement>('.rlc-st-picker input')!;
  act(() => {
    search.value = 'a';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => btn('Annie', root.querySelector('.rlc-st-picker')!)!.click());
  await settle();
  act(() => btn('Ahri', root.querySelector('.rlc-st-picker .rlc-chip-row')!)!.click());
  await settle();
  release();
  await settle();
  await settle();
  expect([...root.querySelectorAll('.rlc-st-picker .rlc-cn-card')].map((c) => c.getAttribute('aria-label'))).toEqual(['Ahri']);
});

test('geral: versão nova aparece com botão que abre a página da release no navegador', () => {
  update.value = { version: '0.2.0', url: 'https://github.com/kyso1/ReimaginedLC/releases/tag/v0.2.0' };
  mount();
  act(() => tab('Geral').click());
  expect(root.querySelector('.rlc-st-update')!.textContent).toContain('0.2.0');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-st-update button')!.click());
  const open = fetchMock.mock.calls.find((c) => c[0] === '/riotclient/open-url-in-browser')!;
  expect(JSON.parse(open[1].body)).toBe('https://github.com/kyso1/ReimaginedLC/releases/tag/v0.2.0');
  update.value = null;
});
