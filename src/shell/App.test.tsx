import { signal } from '@preact/signals';
import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { Lcu, StoreState } from '../lcu';
import type { ResolvedTheme } from '../theme/resolve';
import type { ThemeEngine } from '../theme/engine';
import { fakeLcu, fakeThemes, friend as friendFixture, invitation, leader as leaderFixture, lobby as lobbyFixture, queue, readyCheck, search as searchFixture, session as sessionFixture } from '../test/fixtures';
import { background } from '../theme/background';
import { DEFAULT_BG } from '../theme/background';
import { App, RIOT_ROOT_ID } from './App';
import { enabled, hideRiot, syncLayer } from './layer';
import { DEFAULT_PREFS, prefs } from './prefs';
import { liteAuto } from './perf';

const vidro: ResolvedTheme = { name: 'vidro', label: 'Vidro', tokens: { 'color.bg': '#0b1020' }, transition: 'wipe', backgrounds: { default: { theme: 'vidro', path: '/fe/x/a.jpg' } } };
const editorial: ResolvedTheme = { name: 'editorial', label: 'Editorial', tokens: { 'color.bg': '#0e0e10' }, transition: 'fade', backgrounds: { default: { theme: 'editorial', path: '' } } };

let root: HTMLElement;
let riot: HTMLElement;
let phase: Lcu['gameflowPhase'];
let lcu: Lcu;
let themes: ThemeEngine;
const focused = signal(true);

const ready = <T,>(data: T): StoreState<T> => ({ status: 'ready', data });
const flush = async () => {
  await new Promise((r) => setTimeout(r, 0));
  // os efeitos do Preact rodam depois do próximo frame (ou 100 ms)
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
};
// telas sob demanda: espera o chunk (import() dinâmico, lento com a suíte toda rodando) e o render seguinte
const shows = (sel: string, msg?: string) => vi.waitFor(() => expect(root.querySelector(sel), msg).not.toBeNull(), { timeout: 10_000 });
const short = () => new Promise((r) => setTimeout(r, 0));
const dom = signal(0);
const mount = (extra: Partial<Parameters<typeof App>[0]> = {}) => render(<App root={root} lcu={lcu} themes={themes} base="https://plugins/ReimaginedLC/" focused={focused} dom={dom} {...extra} />, root);

beforeEach(() => {
  setLocale('pt_BR');
  delete window.DataStore;
  window.Toast = { success: vi.fn(), error: vi.fn() };
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as unknown as HTMLMediaElement['play'];
  HTMLMediaElement.prototype.pause = vi.fn() as unknown as HTMLMediaElement['pause'];
  syncLayer();
  // Sem DataStore a camada abriria ligada (primeira vez); estes testes partem dela desligada.
  enabled.value = false;
  focused.value = true;
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  root = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'rlc-root' }));
  phase = signal(ready('None')) as Lcu['gameflowPhase'];
  lcu = fakeLcu({ gameflowPhase: phase });
  const active = signal(vidro);
  themes = fakeThemes(active, [vidro, editorial].map(({ name, label }) => ({ name, label })), (name) => void (active.value = name === 'editorial' ? editorial : vidro));
});

afterEach(() => {
  render(null, root);
  root.remove();
  riot.remove();
  delete window.Toast;
  prefs.value = DEFAULT_PREFS;
});

test('com a camada desligada nada aparece e a interface da Riot fica visível', async () => {
  mount();
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(root.querySelector('.rlc-app')).toBeNull();
  expect(riot.style.visibility).toBe('');
});

test('ligada na fase None mostra a tela inicial, aplica o tema e esconde a interface da Riot', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(root.dataset.visible).toBe('true');
  expect(root.textContent).toContain('Jogar');
  expect(root.textContent).toContain('16.19');
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0b1020');
  expect(root.dataset.transition).toBe('wipe');
  expect(root.querySelector('img.rlc-bg')!.getAttribute('src')).toBe('/fe/x/a.jpg');
  expect(riot.style.visibility).toBe('hidden');
});

test('com hideRiot desligado a interface da Riot não é escondida', async () => {
  enabled.value = true;
  hideRiot.value = false;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('');
});

test('fase ainda desconhecida (store carregando) oculta a camada e devolve a interface da Riot; voltar a None mostra de novo', async () => {
  enabled.value = true;
  mount();
  await flush();
  phase.value = { status: 'loading', data: null };
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(root.querySelector('.rlc-app')).toBeNull();
  expect(riot.style.visibility).toBe('');
  phase.value = ready('None');
  await flush();
  expect(root.dataset.visible).toBe('true');
  expect(riot.style.visibility).toBe('hidden');
});

test('store de fase indisponível nunca deixa um root vazio cobrindo o client', async () => {
  enabled.value = true;
  phase.value = { status: 'unavailable', data: null };
  mount();
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('trocar de tema muda variáveis, transição e fundo sem remontar', async () => {
  enabled.value = true;
  mount();
  await flush();
  themes.set('editorial');
  await short();
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0e0e10');
  await flush();
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#0e0e10');
  expect(root.dataset.transition).toBe('fade');
  expect(root.querySelector('img.rlc-bg')).toBeNull();
});

test('"Client original" desliga a camada', async () => {
  for (const label of ['Client original']) {
    enabled.value = true;
    mount();
    await flush();
    const button = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes(label) || b.getAttribute('aria-label') === label)!;
    button.click();
    await flush();
    expect(enabled.value, label).toBe(false);
    expect(root.dataset.visible).toBe('false');
  }
});

test('tela que lança ao renderizar desliga a camada e avisa', async () => {
  enabled.value = true;
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  mount({ screens: { home: () => { throw new Error('quebrou'); } } });
  await flush();
  expect(enabled.value).toBe(false);
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  noise.mockRestore();
});

test('sem o elemento raiz da Riot a camada funciona do mesmo jeito', async () => {
  riot.remove();
  enabled.value = true;
  expect(() => mount()).not.toThrow();
  await flush();
  expect(root.dataset.visible).toBe('true');
});

test('sai da fase None para um estado sem tela: a camada some e a Riot volta na hora, sem esperar o frame', async () => {
  enabled.value = true;
  mount();
  await flush();
  phase.value = { status: 'loading', data: null };
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('desligar a camada enquanto aparece devolve a Riot na hora', async () => {
  enabled.value = true;
  mount();
  await flush();
  enabled.value = false;
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('tela que lança devolve a Riot na hora e remove também a barra e o fundo', async () => {
  enabled.value = true;
  const noise = vi.spyOn(console, 'error').mockImplementation(() => {});
  mount({ screens: { home: () => { throw new Error('quebrou'); } } });
  await short();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
  expect(root.querySelector('.rlc-rail')).toBeNull();
  expect(root.querySelector('.rlc-bg')).toBeNull();
  noise.mockRestore();
});

test('desmontar o App devolve a Riot e esconde o root', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  render(null, root);
  expect(riot.style.visibility).toBe('');
  expect(root.dataset.visible).toBe('false');
});

test('camada desligada não mexe no visibility que a Riot definiu', async () => {
  riot.style.visibility = 'collapse';
  mount();
  await flush();
  expect(riot.style.visibility).toBe('collapse');
});

test('ao desligar a camada a Riot volta ao valor que tinha antes de a escondermos', async () => {
  riot.style.visibility = 'collapse';
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  enabled.value = false;
  await flush();
  expect(riot.style.visibility).toBe('collapse');
});

test('a raiz da Riot aparece depois do mount: passa a ser escondida', async () => {
  riot.remove();
  enabled.value = true;
  mount();
  await flush();
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  dom.value++;
  await short();
  expect(riot.style.visibility).toBe('hidden');
});

test('a raiz da Riot é trocada enquanto escondida: o novo elemento guarda o próprio valor', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(riot.style.visibility).toBe('hidden');
  riot.remove();
  riot = document.body.appendChild(Object.assign(document.createElement('div'), { id: RIOT_ROOT_ID }));
  riot.style.visibility = 'collapse';
  dom.value++;
  await short();
  expect(riot.style.visibility).toBe('hidden');
  enabled.value = false;
  await short();
  expect(riot.style.visibility).toBe('collapse');
});

test('a faixa da janela aparece; fechar pede confirmação antes de encerrar o client', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  enabled.value = true;
  mount();
  await flush();
  root.querySelector<HTMLButtonElement>('button[aria-label="Fechar"]')!.click();
  await flush();
  expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('process-control'))).toHaveLength(0);
  const dialog = root.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain('Fechar o League of Legends?');
  dialog.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click();
  await flush();
  expect(fetchMock).toHaveBeenCalledWith('/process-control/v1/process/quit', { method: 'POST' });
  vi.unstubAllGlobals();
});

const LobbyStub = () => <div class="lobby-stub">lobby</div>;

test('em ReadyCheck mostra o aceite sobre a tela; com suppressUx não mostra', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  enabled.value = true;
  phase.value = ready('ReadyCheck');
  lcu.readyCheck.value = ready(readyCheck());
  mount({ screens: { home: () => <div />, lobby: LobbyStub } });
  await flush();
  expect(root.querySelector('.lobby-stub')).not.toBeNull();
  expect(root.querySelector('.rlc-readycheck')).not.toBeNull();
  lcu.readyCheck.value = ready(readyCheck({ suppressUx: true }));
  await flush();
  expect(root.querySelector('.rlc-readycheck')).toBeNull();
  vi.unstubAllGlobals();
});

test('aceite com a janela sem foco traz a janela para frente uma vez', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  enabled.value = true;
  focused.value = false;
  phase.value = ready('ReadyCheck');
  lcu.readyCheck.value = ready(readyCheck());
  mount({ screens: { home: () => <div />, lobby: LobbyStub } });
  await flush();
  lcu.readyCheck.value = ready(readyCheck({ timer: 3 }));
  await flush();
  const calls = fetchMock.mock.calls.map((c) => c[0]);
  expect(calls.filter((u) => u === '/riotclient/ux-show')).toHaveLength(1);
  expect(calls.filter((u) => u === '/riotclient/ux-flash')).toHaveLength(1);
  vi.unstubAllGlobals();
});

test('exceção na sobreposição de aceite desliga a camada e devolve a Riot', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  enabled.value = true;
  phase.value = ready('ReadyCheck');
  lcu.readyCheck.value = ready(readyCheck());
  const Broken = (): never => {
    throw new Error('quebrou');
  };
  mount({ screens: { home: () => <div />, lobby: LobbyStub }, readyCheckOverlay: Broken });
  await flush();
  expect(enabled.value).toBe(false);
  expect(riot.style.visibility).toBe('');
  vi.mocked(console.error).mockRestore();
});

test('convite pendente aparece na tela inicial', async () => {
  enabled.value = true;
  lcu.invitations.value = ready([invitation()]);
  mount();
  await flush();
  expect(root.querySelector('.rlc-invite')!.textContent).toContain('Zeca');
});

test('Jogar abre a tela de modos e Voltar fecha', async () => {
  enabled.value = true;
  lcu.queues.value = ready([queue({ id: 400, name: 'Normal (escolha)' })]);
  mount();
  await flush();
  [...root.querySelectorAll('button')].find((b) => b.textContent === 'Jogar')!.click();
  await flush();
  expect(root.querySelector('.rlc-modes')).not.toBeNull();
  [...root.querySelectorAll('button')].find((b) => b.textContent === 'Voltar')!.click();
  await flush();
  expect(root.querySelector('.rlc-modes')).toBeNull();
});

test('na fase Lobby mostra o Palco e o trilho ganha o item Lobby ativo', async () => {
  enabled.value = true;
  phase.value = ready('Lobby');
  lcu.lobby.value = ready(lobbyFixture([leaderFixture({ summonerName: 'Fulano' })]));
  mount();
  await flush();
  expect(root.querySelector('.rlc-lobby')!.textContent).toContain('Fulano');
  const lobbyItem = root.querySelector('.rlc-rail-item[aria-label="Lobby"]')!;
  expect(lobbyItem.getAttribute('aria-current')).toBe('page');
  expect(riot.style.visibility).toBe('hidden');
});

test('Personalizada na tela de modos abre a lista de salas', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })));
  enabled.value = true;
  mount();
  await flush();
  [...root.querySelectorAll('button')].find((b) => b.textContent === 'Jogar')!.click();
  await flush();
  [...root.querySelectorAll('button')].find((b) => b.textContent === 'Personalizada')!.click();
  await flush();
  expect(root.querySelector('.rlc-modes:not(.rlc-custom)')).toBeNull();
  expect(root.querySelector('.rlc-custom')!.textContent).toContain('Criar sala');
  vi.unstubAllGlobals();
});

test('tela de modos aberta na tela inicial fecha quando a rota vai para o lobby (convite aceito)', async () => {
  enabled.value = true;
  mount();
  await flush();
  [...root.querySelectorAll('button')].find((b) => b.textContent === 'Jogar')!.click();
  await flush();
  expect(root.querySelector('.rlc-modes')).not.toBeNull();
  lcu.lobby.value = ready(lobbyFixture([leaderFixture()]));
  phase.value = ready('Lobby');
  await flush();
  expect(root.querySelector('.rlc-lobby')).not.toBeNull();
  expect(root.querySelector('.rlc-modes')).toBeNull();
});

test('fase desconhecida mostra o nome legível da fase e o botão Client original', async () => {
  enabled.value = true;
  phase.value = ready('FaseNova' as never);
  mount();
  await flush();
  const screen = root.querySelector('.rlc-unknown')!;
  expect(screen.textContent).toContain('Fase nova');
  [...screen.querySelectorAll('button')].find((b) => b.textContent === 'Client original')!.click();
  await flush();
  expect(enabled.value).toBe(false);
});

test('TerminatedInError mostra a tela inicial e avisa uma vez', async () => {
  enabled.value = true;
  phase.value = ready('TerminatedInError');
  mount();
  await flush();
  expect(root.textContent).toContain('Jogar');
  dom.value++;
  await flush();
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  expect(window.Toast!.error).toHaveBeenCalledWith('A partida terminou com erro');
});

test('ChampSelect mostra a seleção; com a sessão indisponível, o client original', async () => {
  enabled.value = true;
  phase.value = ready('ChampSelect');
  lcu.champSelect.value = ready(sessionFixture());
  mount();
  await flush();
  expect(root.querySelector('.rlc-champselect')).not.toBeNull();
  expect(riot.style.visibility).toBe('hidden');
  lcu.champSelect.value = { status: 'unavailable', data: null };
  await flush();
  expect(root.dataset.visible).toBe('false');
  expect(riot.style.visibility).toBe('');
});

test('exceção na seleção desliga a camada e devolve a seleção da Riot', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  enabled.value = true;
  phase.value = ready('ChampSelect');
  const Broken = (): never => {
    throw new Error('quebrou');
  };
  mount({ screens: { home: () => <div />, champselect: Broken } });
  await flush();
  expect(enabled.value).toBe(false);
  expect(riot.style.visibility).toBe('');
  vi.mocked(console.error).mockRestore();
});

test('partida, honra e pós-jogo têm telas nossas e o trilho marca a tela atual', async () => {
  enabled.value = true;
  mount();
  for (const [p, cls, label] of [['InProgress', '.rlc-ingame', 'Partida'], ['PreEndOfGame', '.rlc-honor', 'Honra'], ['EndOfGame', '.rlc-postgame', 'Resultado'], ['ChampSelect', '.rlc-champselect', 'Seleção']] as const) {
    phase.value = ready(p);
    await shows(cls, p);
    expect(root.querySelector(`.rlc-rail-item[aria-label="${label}"]`)!.getAttribute('aria-current')).toBe('page');
    expect(riot.style.visibility).toBe('hidden');
  }
});

test('em fila, Início leva à tela inicial com a pílula de fila; Lobby (ou a pílula) volta e a pílula some', async () => {
  enabled.value = true;
  phase.value = ready('Matchmaking');
  lcu.lobby.value = ready(lobbyFixture([leaderFixture({ summonerName: 'Fulano' })]));
  lcu.search.value = ready(searchFixture({ queueId: 420, isCurrentlyInQueue: true }));
  mount({ screens: { home: () => <div class="home-stub" />, lobby: LobbyStub } });
  await flush();
  expect(root.querySelector('.lobby-stub')).not.toBeNull();
  expect(root.querySelector('.rlc-qpill')).toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Início"]')!.click();
  await flush();
  expect(root.querySelector('.home-stub')).not.toBeNull();
  expect(root.querySelector('.lobby-stub')).toBeNull();
  expect(root.querySelector('.rlc-rail-item[aria-label="Início"]')!.getAttribute('aria-current')).toBe('page');
  expect(root.querySelector('.rlc-qpill')).not.toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-qpill-open')!.click();
  await flush();
  expect(root.querySelector('.lobby-stub')).not.toBeNull();
  expect(root.querySelector('.rlc-qpill')).toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Início"]')!.click();
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Lobby"]')!.click();
  await flush();
  expect(root.querySelector('.lobby-stub')).not.toBeNull();
});

test('trilho navega para Perfil, Coleção e Configurações fora do fluxo de partida; Início volta', async () => {
  enabled.value = true;
  const Profile = () => <div class="stub-profile" />;
  mount({ views: { profile: Profile } });
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Perfil"]')!.click();
  await flush();
  expect(root.querySelector('.stub-profile')).not.toBeNull();
  expect(root.querySelector('.rlc-rail-item[aria-label="Perfil"]')!.getAttribute('aria-current')).toBe('page');
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Início"]')!.click();
  await flush();
  expect(root.querySelector('.stub-profile')).toBeNull();
  expect(root.textContent).toContain('Jogar');
});

test('entrar na seleção de campeões troca a tela livre pela fase', async () => {
  enabled.value = true;
  const Profile = () => <div class="stub-profile" />;
  mount({ views: { profile: Profile } });
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Perfil"]')!.click();
  await flush();
  phase.value = ready('ChampSelect');
  lcu.champSelect.value = ready(sessionFixture());
  await flush();
  expect(root.querySelector('.stub-profile')).toBeNull();
  expect(root.querySelector('.rlc-champselect')).not.toBeNull();
  expect(root.querySelector('.rlc-rail-item[aria-label="Perfil"]')).toBeNull();
});

test('coluna da direita e chip de moedas aparecem com a camada', async () => {
  enabled.value = true;
  mount();
  await flush();
  expect(root.querySelector('.rlc-rc')).not.toBeNull();
});

test('clicar num amigo abre a conversa na doca (criando-a se preciso); o botão de chat minimiza', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  enabled.value = true;
  lcu.friends.value = ready([friendFixture({ id: 'zeca@pvp.net', gameName: 'Zeca', availability: 'chat' })]);
  mount();
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rc-avatar[aria-label="Zeca"]')!.click();
  await flush();
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-chat/v1/conversations' && JSON.parse(c[1].body).id === 'zeca@pvp.net')).toBe(true);
  expect(root.querySelector('.rlc-chat-dock')!.getAttribute('data-open')).toBe('true');
  expect(root.querySelector('.rlc-chat-window')!.getAttribute('aria-label')).toBe('Zeca');
  root.querySelector<HTMLButtonElement>('.rlc-chat-window button[aria-label="Fechar conversa"]')!.click();
  await flush();
  // Fechar a conversa fecha o chat todo; o botão de chat reabre e minimiza.
  expect(root.querySelector('.rlc-chat-window')).toBeNull();
  expect(root.querySelector('.rlc-chat-dock')!.getAttribute('data-open')).toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-rc-chatbtn')!.click();
  await flush();
  expect(root.querySelector('.rlc-chat-dock')!.getAttribute('data-open')).toBe('true');
  root.querySelector<HTMLButtonElement>('.rlc-rc-chatbtn')!.click();
  await flush();
  expect(root.querySelector('.rlc-chat-dock')!.getAttribute('data-open')).toBeNull();
  vi.unstubAllGlobals();
});

test('chat da sala aparece no lobby a partir do id da sala', async () => {
  enabled.value = true;
  phase.value = ready('Lobby');
  lcu.lobby.value = ready({ ...lobbyFixture([leaderFixture()]), multiUserChatId: 'sala-1' });
  lcu.conversations.value = ready([{ id: 'sala-1@lol-lobby.pvp.net', unreadMessageCount: 0, type: 'customGame' }] as never);
  mount();
  await flush();
  expect(root.querySelector('.rlc-ctx')).not.toBeNull();
});

test('lobby de TFT usa o tema do TFT', async () => {
  enabled.value = true;
  const tft: typeof vidro = { ...vidro, name: 'vidro-ludico', tokens: { 'color.bg': '#3a2a12' } };
  themes.forGame.tft = signal(tft);
  phase.value = ready('Lobby');
  lcu.lobby.value = ready(lobbyFixture([leaderFixture()], undefined, { gameMode: 'TFT', queueId: 1090 }));
  mount();
  await flush();
  expect(root.style.getPropertyValue('--rlc-color-bg')).toBe('#3a2a12');
});

test('fundo personalizado: splash escolhida substitui o fundo do tema na tela inicial, com escurecer', async () => {
  enabled.value = true;
  lcu.game = { ...lcu.game, splash: async (id) => (id === 103001 ? '/s/103001.jpg' : null) };
  mount();
  await flush();
  background.value = { ...DEFAULT_BG, global: { kind: 'splash', skinId: 103001 }, dim: 0.4 };
  await flush();
  expect(root.querySelector('img.rlc-bg')!.getAttribute('src')).toBe('/s/103001.jpg');
  expect(root.querySelector<HTMLElement>('.rlc-app')!.style.getPropertyValue('--rlc-bg-dim')).toBe('0.4');
  background.value = DEFAULT_BG;
});

test('Configurações abre a tela de configurações', async () => {
  enabled.value = true;
  mount();
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Configurações"]')!.click();
  await shows('.rlc-settings');
});

test('preferências: transições vão para data-motion e vídeo desligado não toca', async () => {
  enabled.value = true;
  themes.active.value = { ...themes.active.value, backgrounds: { default: { theme: 'vidro', path: '/fe/x/a.webm' } } };
  prefs.value = { ...DEFAULT_PREFS, motion: 'off', video: false, ambient: false };
  mount();
  await flush();
  expect(root.dataset.motion).toBe('off');
  const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
  play.mockClear();
  focused.value = false;
  await flush();
  focused.value = true;
  await flush();
  expect(play).not.toHaveBeenCalled();
});

test('som ambiente: toca na tela inicial com foco e para sem foco', async () => {
  enabled.value = true;
  prefs.value = { ...DEFAULT_PREFS, video: false, ambient: true };
  const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  focused.value = true;
  play.mockClear();
  mount();
  await flush();
  expect(play).toHaveBeenCalled();
  focused.value = false;
  await flush();
  expect(pause).toHaveBeenCalled();
  pause.mockRestore();
});

test('trilho tem Espólios entre Coleção e Eventos e abre a vista própria; ponto marca item novo', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
  enabled.value = true;
  mount();
  await flush();
  const labels = [...root.querySelectorAll('.rlc-rail-item')].map((b) => b.getAttribute('aria-label'));
  expect(labels.slice(labels.indexOf('Coleção'), labels.indexOf('Coleção') + 3)).toEqual(['Coleção', 'Espólios', 'Eventos']);
  const loot = () => root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Espólios"]')!;
  expect(loot().querySelector('svg')).not.toBeNull();
  expect(loot().querySelector('.rlc-rail-dot')).toBeNull();
  loot().click();
  await shows('.rlc-loot-view .rlc-loot');
  expect(root.querySelector('.rlc-app')!.getAttribute('data-screen')).toBe('loot');
  expect(loot().getAttribute('aria-current')).toBe('page');
  lcu.loot.value = ready([{ lootId: 'CHEST_generic', type: 'CHEST', count: 1, isNew: true }] as never);
  await flush();
  expect(loot().querySelector('.rlc-rail-dot')).not.toBeNull();
  vi.unstubAllGlobals();
});

test('fundo global vale em todas as telas e vistas fora da partida', async () => {
  enabled.value = true;
  lcu.game = { ...lcu.game, splash: async (id) => (id === 7 ? '/s/meu.jpg' : null) };
  const stub = () => <div class="stub" />;
  const views = { profile: stub, collection: stub, loot: stub, events: stub, store: stub, settings: stub };
  mount({ views, screens: { home: stub, lobby: stub, champselect: stub, postgame: stub, honor: stub, ingame: stub } });
  await flush();
  background.value = { ...DEFAULT_BG, global: { kind: 'splash', skinId: 7 }, dim: 0.9, blur: 3 };
  await flush();
  const bg = () => root.querySelector('img.rlc-bg')!.getAttribute('src');
  expect(bg()).toBe('/s/meu.jpg');
  expect(root.querySelector('.rlc-app')!.getAttribute('data-custom-bg')).toBe('true');
  // Escurecer do usuário (0,9) fica no teto do App.
  expect(root.querySelector<HTMLElement>('.rlc-app')!.style.getPropertyValue('--rlc-bg-dim')).toBe('0.85');
  for (const label of ['Perfil', 'Coleção', 'Espólios', 'Eventos', 'Loja', 'Configurações']) {
    root.querySelector<HTMLButtonElement>(`.rlc-rail-item[aria-label="${label}"]`)!.click();
    await flush();
    expect(bg(), label).toBe('/s/meu.jpg');
  }
  lcu.lobby.value = ready(lobbyFixture([leaderFixture()]));
  for (const p of ['Lobby', 'ChampSelect', 'EndOfGame', 'PreEndOfGame'] as const) {
    if (p === 'ChampSelect') lcu.champSelect.value = ready(sessionFixture());
    phase.value = ready(p);
    await flush();
    expect(bg(), p).toBe('/s/meu.jpg');
  }
  phase.value = ready('InProgress');
  await flush();
  expect(bg()).toBe('/fe/x/a.jpg');
  expect(root.querySelector('.rlc-app')!.getAttribute('data-custom-bg')).toBeNull();
  background.value = DEFAULT_BG;
});

test('gaveta de amigos fixa: o App marca data-social para as telas encolherem; na seleção de campeões tira a marca', async () => {
  enabled.value = true;
  mount({ screens: { champselect: () => <div class="cs-stub" /> } });
  await flush();
  const app = () => root.querySelector('.rlc-app')!;
  expect(app().getAttribute('data-social')).toBeNull();
  prefs.value = { ...DEFAULT_PREFS, socialPinned: true };
  await flush();
  expect(app().getAttribute('data-social')).toBe('pinned');
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-open')).toBe('true');
  phase.value = ready('ChampSelect');
  lcu.champSelect.value = ready({}) as never;
  await flush();
  expect(app().getAttribute('data-social')).toBeNull();
  phase.value = ready('None');
  await flush();
  expect(app().getAttribute('data-social')).toBe('pinned');
});

test('modo leve: atributo data-lite conforme auto/on/off e transições completas viram reduzidas', async () => {
  enabled.value = true;
  liteAuto.value = false;
  prefs.value = { ...DEFAULT_PREFS, lite: 'on', ambient: false };
  mount();
  await flush();
  expect(root.dataset.lite).toBe('');
  expect(root.dataset.motion).toBe('reduced');
  prefs.value = { ...DEFAULT_PREFS, lite: 'auto', ambient: false };
  await flush();
  expect(root.dataset.lite).toBeUndefined();
  expect(root.dataset.motion).toBe('full');
  liteAuto.value = true;
  await flush();
  expect(root.dataset.lite).toBe('');
  prefs.value = { ...DEFAULT_PREFS, lite: 'off', ambient: false };
  await flush();
  expect(root.dataset.lite).toBeUndefined();
  liteAuto.value = false;
});

test('interface da Riot congelada só com a camada visível', async () => {
  enabled.value = true;
  prefs.value = { ...DEFAULT_PREFS, ambient: false };
  mount();
  await flush();
  expect(riot.dataset.rlcFrozen).toBe('');
  enabled.value = false;
  await flush();
  expect(riot.dataset.rlcFrozen).toBeUndefined();
});

test('gaveta de amigos: passar o mouse rápido não abre; parado um instante abre e fecha logo ao sair', async () => {
  enabled.value = true;
  mount();
  await flush();
  const rc = () => root.querySelector('.rlc-rc')!;
  const wait = async (ms: number) => {
    await new Promise((r) => setTimeout(r, ms));
    await flush();
  };
  rc().dispatchEvent(new MouseEvent('mouseenter'));
  rc().dispatchEvent(new MouseEvent('mouseleave'));
  await wait(300);
  expect(rc().getAttribute('data-open')).toBeNull();
  rc().dispatchEvent(new MouseEvent('mouseenter'));
  await wait(300);
  expect(rc().getAttribute('data-open')).toBe('true');
  rc().dispatchEvent(new MouseEvent('mouseleave'));
  await wait(450);
  expect(rc().getAttribute('data-open')).toBeNull();
});

test('Início só com o fundo: imagem sem escurecer nem desfocar', async () => {
  enabled.value = true;
  prefs.value = { ...DEFAULT_PREFS, homeBare: true };
  mount();
  await flush();
  // Depois de montar: o App lê o fundo do DataStore ao subir.
  background.value = { ...DEFAULT_BG, dim: 0.9, blur: 3 };
  await flush();
  const app = () => root.querySelector<HTMLElement>('.rlc-app')!;
  expect(app().style.getPropertyValue('--rlc-bg-dim')).toBe('0');
  expect(app().style.getPropertyValue('--rlc-bg-blur')).toBe('0px');
  prefs.value = { ...DEFAULT_PREFS };
  await flush();
  expect(app().style.getPropertyValue('--rlc-bg-dim')).toBe('0.85');
  background.value = DEFAULT_BG;
});

test('durante a partida dá para ir ao Início ver o fundo e voltar à partida pelo trilho', async () => {
  enabled.value = true;
  mount({ screens: { home: () => <div class="home-stub" />, ingame: () => <div class="ingame-stub" /> } });
  phase.value = ready('InProgress');
  await flush();
  expect(root.querySelector('.ingame-stub')).not.toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Início"]')!.click();
  await flush();
  expect(root.querySelector('.home-stub')).not.toBeNull();
  expect(root.querySelector('.ingame-stub')).toBeNull();
  root.querySelector<HTMLButtonElement>('.rlc-rail-item[aria-label="Partida"]')!.click();
  await flush();
  expect(root.querySelector('.ingame-stub')).not.toBeNull();
});
