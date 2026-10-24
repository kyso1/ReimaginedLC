import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { DEFAULT_PREFS, effectiveLocale, prefs, sanitizePrefs } from '../../shell/prefs';
import { fakeLcu, fakeThemes } from '../../test/fixtures';
import type { ResolvedTheme } from '../../theme/resolve';
import * as bg from '../../theme/background';
import { update } from '../../shell/update';
import { Settings } from './Settings';
import { formatBind, humanize } from './game';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string, scope: ParentNode = root) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
const area = (id: string) => act(() => root.querySelector<HTMLButtonElement>(`.rlc-st-tile[data-area="${id}"]`)!.click());
const sw = (label: string) => root.querySelector<HTMLInputElement>(`input[role="switch"][aria-label="${label}"]`)!;
const store = new Map<string, unknown>();
const chatSettings = { friendRequestToastsDisabled: false, messageNotificationsEnabled: false, chatGroupOffline: true, chatFilterDisabled: true, chatWindow: { width: 530 } };

const vidro: ResolvedTheme = { name: 'vidro', label: 'Vidro', tokens: { 'color.bg': '#0b1020', 'color.accent': '#ffffff' }, transition: 'wipe', backgrounds: {} };

beforeEach(() => {
  setLocale('pt_BR');
  store.clear();
  prefs.value = DEFAULT_PREFS;
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: (k) => void store.delete(k) };
  window.Toast = { success: vi.fn(), error: vi.fn() };
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => {
    if (url === '/lol-game-settings/v1/game-settings-schema')
      return new Response(JSON.stringify({ General: { EnableAudio: { default: true }, CursorScale: { default: 0.5 }, GameMouseSpeed: { default: 10 }, WindowMode: { default: 0 }, ShowCoolThing: { default: true } }, Volume: { MusicVolume: { default: 0.75 } }, FloatingText: { Gold_Enabled: { default: true } } }), { status: 200 });
    if (url === '/lol-game-settings/v1/game-settings') return new Response(JSON.stringify({ General: { EnableAudio: false, CursorScale: 0.7, WindowMode: 2 } }), { status: 200 });
    if (url === '/lol-chat/v1/settings') return new Response(JSON.stringify(chatSettings), { status: 200 });
    if (url === '/lol-game-settings/v1/input-settings') return new Response(JSON.stringify({ GameEvents: { evtCastSpell1: '[q]', evtOpenShop: '[Ctrl][p],[<Unbound>]' }, Quickbinds: { evtCastSpell1smart: true } }), { status: 200 });
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
  bg.background.value = bg.DEFAULT_BG;
});

function mount(overrides: Partial<ReturnType<typeof fakeThemes>> = {}) {
  const set = vi.fn();
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'editorial', label: 'Editorial' }], set), ...overrides };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  return { set, themes };
}

test('preferências: só valores conhecidos', () => {
  expect(sanitizePrefs({ motion: 'turbo', video: 'sim', champSelectLayout: 'classic', locale: 'en', openOnStart: true })).toMatchObject({ motion: 'full', video: true, locale: 'en', openOnStart: true });
  expect(sanitizePrefs(null)).toMatchObject({ motion: 'full', locale: 'auto', openOnStart: null });
});

test('início: um painel por área com nome, propósito e resumo do estado', async () => {
  bg.background.value = { ...bg.DEFAULT_BG, dim: 0.35 };
  mount();
  await settle();
  const tiles = [...root.querySelectorAll<HTMLElement>('.rlc-st-tile')];
  expect(tiles.map((x) => x.dataset.area)).toEqual(['look', 'anim', 'sound', 'plug', 'general', 'notif', 'chat', 'game', 'keys']);
  const tags = (id: string) => [...root.querySelectorAll(`.rlc-st-tile[data-area="${id}"] .rlc-st-tag`)].map((x) => x.textContent);
  expect(tags('look')).toEqual(['Vidro', 'Escurecer 35%']);
  expect(tags('sound')).toEqual(expect.arrayContaining(['Ambiente 35%', 'Cliques 60%']));
  expect(tags('plug')).toEqual(['Runas OP.GG', 'Matchup']);
  expect(tags('anim')).toEqual(['Completa', 'Vídeo ligado']);
  expect(tags('game')).toEqual(['Sem bordas', '1/2 ligados']);
  expect(tags('keys')).toEqual(['Conjuração rápida 1/1']);
});

test('abrir uma área e voltar ao início', () => {
  mount();
  area('anim');
  expect(root.querySelector('.rlc-st-tile')).toBeNull();
  expect(root.querySelector('.rlc-st-head h2')!.textContent).toBe('Animações');
  act(() => btn('Voltar')!.click());
  expect(root.querySelectorAll('.rlc-st-tile')).toHaveLength(9);
});

test('busca filtra painéis e acha a configuração pelo nome, abrindo a área nela', async () => {
  mount();
  await settle();
  const search = root.querySelector<HTMLInputElement>('.rlc-st-search')!;
  const type = (v: string) =>
    act(() => {
      search.value = v;
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
  type('cliques');
  expect([...root.querySelectorAll<HTMLElement>('.rlc-st-tile')].map((x) => x.dataset.area)).toEqual(['sound']);
  type('xyz-nada');
  expect(root.querySelector('.rlc-st-tile')).toBeNull();
  type('velocidade do mouse');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-st-hit')!.click());
  expect(root.querySelector('.rlc-st-head h2')!.textContent).toBe('Jogo');
  await settle();
  expect(root.querySelector<HTMLElement>('.rlc-st-line[data-hit="true"]')!.dataset.name).toBe('Velocidade do mouse');
});

test('animações: transições, vídeo e animações gravam nas preferências', () => {
  mount();
  area('anim');
  act(() => btn('Desligada', root.querySelector('[role="group"][aria-label="Transições"]')!)!.click());
  expect(prefs.value.motion).toBe('off');
  expect((store.get('rlc.prefs') as { motion: string }).motion).toBe('off');
  act(() => sw('Vídeo de fundo').click());
  act(() => sw('Partida encontrada').click());
  act(() => sw('Entrada no lobby').click());
  expect(prefs.value).toMatchObject({ video: false, readyCheckAnim: false, lobbyAnim: false });
});

test('som: interruptores e volumes gravam nas preferências', () => {
  mount();
  area('sound');
  act(() => sw('Som ambiente').click());
  act(() => sw('Som de cliques').click());
  const vol = root.querySelector<HTMLInputElement>('input[type="range"][aria-label="Volume ambiente"]')!;
  act(() => {
    vol.value = '0.8';
    vol.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const clickVol = root.querySelector<HTMLInputElement>('input[type="range"][aria-label="Volume dos cliques"]')!;
  act(() => {
    clickVol.value = '0.2';
    clickVol.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(prefs.value).toMatchObject({ ambient: false, clicks: false, ambientVolume: 0.8, clickVolume: 0.2 });
  expect((store.get('rlc.prefs') as { ambientVolume: number }).ambientVolume).toBe(0.8);
});

test('plugins: cada interruptor grava a sua preferência; splashes avisa que os outros veem', () => {
  mount();
  area('plug');
  expect(root.textContent).toContain('Os outros veem esse fundo');
  for (const label of ['Runas recomendadas (OP.GG)', 'Usar a matchup', 'Aplicar ao confirmar', 'Todas as splashes no fundo do perfil']) act(() => sw(label).click());
  expect(prefs.value).toMatchObject({ runesAuto: false, runesMatchup: false, runesApplyOnLock: true, allSplashes: true });
});

test('geral: idioma e abertura em botões', () => {
  mount();
  area('general');
  act(() => btn('English')!.click());
  act(() => btn('Client original')!.click());
  expect(prefs.value).toMatchObject({ locale: 'en', openOnStart: false });
});

test('fundo: escurecer para em 85%', () => {
  mount();
  area('look');
  const dim = root.querySelector<HTMLInputElement>('.rlc-st-bg input[type="range"][data-key="dim"]')!;
  expect(dim.max).toBe('0.85');
  act(() => {
    dim.value = '0.95';
    dim.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(bg.background.value.dim).toBeLessThanOrEqual(0.85);
});

test('jogo: nomes legíveis, nunca a chave do esquema', async () => {
  mount();
  area('game');
  await settle();
  const text = root.querySelector('.rlc-st-detail')!.textContent!;
  expect(text).toContain('Som do jogo');
  expect(text).toContain('Geral');
  expect(text).toContain('Cool thing');
  for (const raw of ['EnableAudio', 'General', 'GameMouseSpeed', 'ShowCoolThing']) expect(text).not.toContain(raw);
  // Volume vai para Som e textos flutuantes para Notificações, não para Jogo.
  expect(text).not.toContain('Música');
  expect(humanize('EnableHUDAnimations')).toBe('Hud animations');
  expect(humanize('Damage_Enabled')).toBe('Damage');
  expect(humanize('evtCastSpell1')).toBe('Cast spell1');
});

test('jogo: modo de janela em botões com nome', async () => {
  mount();
  area('game');
  await settle();
  const group = root.querySelector('[role="group"][data-key="General.WindowMode"]')!;
  expect(btn('Sem bordas', group)!.getAttribute('aria-pressed')).toBe('true');
  act(() => btn('Janela', group)!.click());
  await settle();
  const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body)).toEqual({ General: { WindowMode: 1 } });
});

test('jogo: formulário gerado do esquema, com os valores atuais; mudar salva', async () => {
  mount();
  area('game');
  await settle();
  const audio = root.querySelector<HTMLInputElement>('input[type="checkbox"][data-key="General.EnableAudio"]')!;
  expect(audio.checked).toBe(false);
  act(() => audio.click());
  await settle();
  const patch = fetchMock.mock.calls.find((c) => c[0] === '/lol-game-settings/v1/game-settings' && c[1]?.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body)).toEqual({ General: { EnableAudio: true } });
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-game-settings/v1/save')).toBe(true);
});

test('jogo: número vazio não grava; campo inteiro grava inteiro', async () => {
  mount();
  area('game');
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

test('jogo: gravação recusada pela LCU devolve a caixa ao valor anterior', async () => {
  mount();
  area('game');
  await settle();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ message: 'não' }), { status: 500 }));
  const audio = root.querySelector<HTMLInputElement>('input[type="checkbox"][data-key="General.EnableAudio"]')!;
  act(() => audio.click());
  expect(audio.checked).toBe(true);
  await settle();
  await settle();
  expect(audio.checked).toBe(false);
});

test('notificações: aviso de pedido de amizade grava o contrário no chat, com o resto das configurações', async () => {
  mount();
  area('notif');
  await settle();
  const toasts = sw('Avisos de pedido de amizade');
  expect(toasts.checked).toBe(true);
  expect(root.textContent).toContain('Ouro');
  act(() => toasts.click());
  await settle();
  const put = fetchMock.mock.calls.find((c) => c[0] === '/lol-chat/v1/settings' && c[1]?.method === 'PUT')!;
  expect(JSON.parse(put[1].body)).toMatchObject({ friendRequestToastsDisabled: true, chatWindow: { width: 530 } });
});

test('som: volume da partida entra na área de som', async () => {
  mount();
  area('sound');
  await settle();
  expect(root.querySelector('input[type="range"][data-key="Volume.MusicVolume"]')).not.toBeNull();
});

test('atalhos: teclas legíveis e conjuração rápida grava', async () => {
  expect(formatBind('[Ctrl][p],[<Unbound>]')).toBe('Ctrl + P');
  expect(formatBind('[<Unbound>]')).toBe('Sem tecla');
  expect(formatBind('[Alt] [Button 2], [Ctrl] [Button 2]')).toBe('Alt + Mouse 2 / Ctrl + Mouse 2');
  mount();
  area('keys');
  await settle();
  expect(root.textContent).toContain('Loja');
  act(() => sw('Conjuração rápida: Habilidade 1').click());
  await settle();
  const patch = fetchMock.mock.calls.find((c) => c[0] === '/lol-game-settings/v1/input-settings' && c[1]?.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body)).toEqual({ Quickbinds: { evtCastSpell1smart: false } });
});

test('aparência: clicar num tema aplica para o jogo do grupo', () => {
  const { set } = mount();
  area('look');
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-st-group')[0]!.querySelector<HTMLButtonElement>('.rlc-st-theme[data-name="editorial"]')!.click());
  expect(set).toHaveBeenCalledWith('editorial', 'lol');
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-st-group')[1]!.querySelector<HTMLButtonElement>('.rlc-st-theme[data-name="vidro"]')!.click());
  expect(set).toHaveBeenCalledWith('vidro', 'tft');
});

test('aparência: importar JSON inválido mostra o erro e não salva', async () => {
  const saveUser = vi.fn(() => ({ ok: false as const, error: 'tokens.color.bg: cor inválida' }));
  mount({ saveUser });
  area('look');
  const input = root.querySelector<HTMLInputElement>('input[type="file"][accept=".json,application/json"]')!;
  Object.defineProperty(input, 'files', { value: [new File(['{"name":"x"}'], 'x.json', { type: 'application/json' })] });
  act(() => void input.dispatchEvent(new Event('change', { bubbles: true })));
  await settle();
  await settle();
  expect(saveUser).toHaveBeenCalled();
  expect(window.Toast!.error).toHaveBeenCalledWith(expect.stringContaining('cor inválida'));
});

test('editor: mudar uma cor atualiza a prévia e salvar envia o tema; nomes legíveis', async () => {
  const saveUser = vi.fn(() => ({ ok: true as const }));
  const resolveDraft = vi.fn((m: unknown) => ({ ok: true as const, theme: { ...vidro, tokens: { ...(m as { tokens: Record<string, string> }).tokens } } }));
  mount({ saveUser, resolveDraft, manifest: () => ({ name: 'vidro', label: 'Vidro', version: 1, extends: null, tokens: { 'color.bg': '#0b1020' }, backgrounds: {}, layouts: {} }) });
  area('look');
  act(() => btn('Novo tema')!.click());
  const panel = root.querySelector('.rlc-ed-panel')!.textContent!;
  expect(panel).toContain('Cor de fundo');
  expect(panel).not.toContain('color.bg');
  expect(panel).not.toContain('wipe');
  const color = root.querySelector<HTMLInputElement>('input[data-token="color.bg"]')!;
  act(() => {
    color.value = '#ff0000';
    color.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(root.querySelector<HTMLElement>('.rlc-ed-preview')!.style.getPropertyValue('--rlc-color-bg')).toBe('#ff0000');
  act(() => btn('Salvar')!.click());
  expect(saveUser).toHaveBeenCalledWith(expect.objectContaining({ tokens: expect.objectContaining({ 'color.bg': '#ff0000' }), extends: 'vidro' }));
});

test('editor: copia o prompt para IA e aplica a resposta colada; erro vira prompt de correção', async () => {
  const writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const resolveDraft = vi.fn((m: unknown) => ({ ok: true as const, theme: { ...vidro, tokens: { ...(m as { tokens: Record<string, string> }).tokens } } }));
  mount({ resolveDraft, manifest: () => ({ name: 'vidro', label: 'Vidro', version: 1, extends: null, tokens: { 'color.bg': '#0b1020' }, backgrounds: {}, layouts: {} }) });
  area('look');
  act(() => btn('Novo tema')!.click());
  const ask = root.querySelector<HTMLTextAreaElement>('.rlc-ed-ai textarea')!;
  act(() => {
    ask.value = 'roxo neon';
    ask.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => root.querySelector<HTMLButtonElement>('[data-ai="copy"]')!.click());
  await settle();
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Request: roxo neon'));

  const paste = (text: string) => {
    const reply = root.querySelector<HTMLTextAreaElement>('.rlc-ed-reply')!;
    act(() => {
      reply.value = text;
      reply.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => root.querySelector<HTMLButtonElement>('[data-ai="apply"]')!.click());
  };
  act(() => root.querySelector<HTMLButtonElement>('[data-ai="paste"]')!.click());
  paste('```json\n{"name":"neon","label":"Neon","version":1,"extends":"vidro","tokens":{"color.bg":"nope"}}\n```');
  expect(root.querySelector('.rlc-ed-error')!.textContent).toContain('tokens.color.bg');
  act(() => root.querySelector<HTMLButtonElement>('[data-ai="fix"]')!.click());
  await settle();
  expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('tokens.color.bg'));

  paste('Pronto:\n```json\n{"name":"neon","label":"Neon","version":1,"extends":"vidro","tokens":{"color.bg":"#120022"}}\n```');
  expect(root.querySelector('.rlc-ed-error')).toBeNull();
  expect(root.querySelector<HTMLInputElement>('.rlc-ed-name')!.value).toBe('Neon');
  expect(root.querySelector<HTMLElement>('.rlc-ed-preview')!.style.getPropertyValue('--rlc-color-bg')).toBe('#120022');
});

test('idioma: preferência fixa vence o do client', () => {
  expect(effectiveLocale('auto', 'en_US')).toBe('en_US');
  expect(effectiveLocale('pt', 'en_US')).toBe('pt_BR');
  expect(effectiveLocale('en', 'pt_BR')).toBe('en_US');
  expect(effectiveLocale('auto', undefined)).toBeNull();
});

test('apagar tema do usuário pede confirmação', () => {
  const deleteUser = vi.fn(() => ({ ok: true as const }));
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'meu', label: 'Meu', user: true }], vi.fn()), deleteUser };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  area('look');
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
  area('look');
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
});

test('importar tema com o nome de um tema seu cria uma cópia com outro nome', async () => {
  const saveUser = vi.fn(() => ({ ok: true as const }));
  const themes = { ...fakeThemes(signal(vidro), [{ name: 'vidro', label: 'Vidro' }, { name: 'meu', label: 'Meu', user: true }], vi.fn()), saveUser };
  act(() => render(<Settings lcu={fakeLcu()} themes={themes} />, root));
  area('look');
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
  area('look');
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
  area('look');
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

test('geral: atualização pronta aparece com Recarregar (desativado fora das fases seguras)', () => {
  update.value = { version: '0.2.0' };
  mount();
  area('general');
  expect(root.querySelector('.rlc-st-update')!.textContent).toContain('0.2.0');
  // Sem fase conhecida o botão fica desativado: recarregar nunca acontece em fila, seleção ou partida.
  expect(root.querySelector<HTMLButtonElement>('.rlc-st-update button')!.disabled).toBe(true);
  update.value = null;
});
