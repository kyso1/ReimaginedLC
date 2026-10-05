import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { effectiveLocale, prefs, sanitizePrefs } from '../../shell/prefs';
import { fakeLcu, fakeThemes } from '../../test/fixtures';
import type { ResolvedTheme } from '../../theme/resolve';
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
    if (url === '/lol-game-settings/v1/game-settings-schema') return new Response(JSON.stringify({ General: { EnableAudio: { default: true }, CursorScale: { default: 0.5 } } }), { status: 200 });
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
