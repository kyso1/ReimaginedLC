import { signal } from '@preact/signals';
import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { Lcu, StoreState } from '../lcu';
import type { ResolvedTheme } from '../theme/resolve';
import type { ThemeEngine } from '../theme/engine';
import { fakeLcu, fakeThemes, friend as friendFixture, invitation, leader as leaderFixture, lobby as lobbyFixture, queue, readyCheck, session as sessionFixture } from '../test/fixtures';
import { background } from '../theme/background';
import { DEFAULT_BG } from '../theme/background';
import { App, RIOT_ROOT_ID } from './App';
import { enabled, hideRiot, syncLayer } from './layer';

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
  expect(fetchMock).not.toHaveBeenCalled();
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

test('fase desconhecida mostra o nome da fase e o botão Client original', async () => {
  enabled.value = true;
  phase.value = ready('FaseNova' as never);
  mount();
  await flush();
  const screen = root.querySelector('.rlc-unknown')!;
  expect(screen.textContent).toContain('FaseNova');
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
    await flush();
    expect(root.querySelector(cls), p).not.toBeNull();
    expect(root.querySelector(`.rlc-rail-item[aria-label="${label}"]`)!.getAttribute('aria-current')).toBe('page');
    expect(riot.style.visibility).toBe('hidden');
  }
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

test('clicar num amigo abre a conversa (criando-a se preciso) e mantém a coluna da direita aberta', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  enabled.value = true;
  lcu.friends.value = ready([friendFixture({ id: 'zeca@pvp.net', gameName: 'Zeca', availability: 'chat' })]);
  mount();
  await flush();
  root.querySelector<HTMLButtonElement>('.rlc-rc-avatar[aria-label="Zeca"]')!.click();
  await flush();
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-chat/v1/conversations' && JSON.parse(c[1].body).id === 'zeca@pvp.net')).toBe(true);
  expect(root.querySelector('.rlc-chat-window')!.getAttribute('aria-label')).toBe('Zeca');
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-open')).toBe('true');
  root.querySelector<HTMLButtonElement>('.rlc-chat-window button[aria-label="Fechar conversa"]')!.click();
  await flush();
  expect(root.querySelector('.rlc-chat-window')).toBeNull();
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
