import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, leader, lobby, member, queue, ready } from '../../test/fixtures';
import { Lobby } from './Lobby';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
// A LCU manda o id no campo name; o nome vem dos dados do jogo.
const BOTS = [{ active: true, id: 1, name: '1', botDifficulties: ['RSINTRO', 'RSINTERMEDIATE'] }, { active: true, id: 2, name: '2', botDifficulties: ['RSINTRO'] }];
const withChampions = (lcu: Lcu): Lcu => ({ ...lcu, game: { ...lcu.game, champions: async () => new Map([[1, { id: 1, name: 'Annie', icon: '/annie.png', roles: [] }], [2, { id: 2, name: 'Zed', icon: '/zed.png', roles: [] }]]) } });
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) =>
    url === '/lol-lobby/v2/lobby/custom/available-bots' ? new Response(JSON.stringify(BOTS), { status: 200 })
      : new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string, scope: ParentNode = root) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(text) || b.getAttribute('aria-label') === text);
const call = (url: string, method?: string) => fetchMock.mock.calls.find((c) => c[0] === url && (!method || c[1]?.method === method));

const me = leader({ summonerName: 'Fulano', teamId: 100 });
const bot = member({ summonerName: 'Bot', isBot: true, botChampionId: 1, botUuid: 'bot-uuid', summonerInternalName: 'bot_annie', teamId: 100 });
const zeca = member({ summonerName: 'Zeca', teamId: 200 });
const room = (local = me) =>
  lobby([me, bot, zeca], local, {
    isCustom: true, queueId: 3100, numPlayersPerTeam: 5, customLobbyName: '<i>Sala</i>',
    customTeam100: [me, bot], customTeam200: [zeca], customSpectators: [member({ isSpectator: true })],
  });
const mount = (local = me) => {
  const lcu = withChampions(fakeLcu());
  lcu.gameflowPhase.value = ready('Lobby') as Lcu['gameflowPhase']['value'];
  lcu.lobby.value = ready(room(local));
  lcu.queues.value = ready([queue({ id: 3100, name: 'SR Blind Pick Custom', gameSelectCategory: 'CreateCustom' })]);
  act(() => render(<Lobby lcu={lcu} onModes={() => {}} />, root));
};

test('duas faixas com uma coluna por vaga; bot com o nome do campeão; nome da sala como texto', async () => {
  mount();
  await settle();
  const bands = root.querySelectorAll('.rlc-stage');
  expect(bands).toHaveLength(2);
  expect(bands[0]!.querySelectorAll('.rlc-col')).toHaveLength(5);
  expect(bands[1]!.querySelectorAll('.rlc-col')).toHaveLength(5);
  expect(bands[0]!.textContent).toContain('Annie');
  expect(bands[1]!.textContent).toContain('Zeca');
  expect(root.textContent).toContain('<i>Sala</i>');
  expect(root.querySelector('i')).toBeNull();
  expect(root.textContent).toContain('SR Blind Pick Custom');
  expect(root.textContent).toContain('1 espectador');
});

test('vaga do outro time troca de time; no próprio time não oferece troca', () => {
  mount();
  const [blue, red] = root.querySelectorAll('.rlc-stage');
  expect(btn('Trocar de time', blue!)).toBeUndefined();
  act(() => btn('Trocar de time', red!)!.click());
  expect(call('/lol-lobby/v2/lobby/team/TEAM2', 'POST')).toBeDefined();
});

test('líder adiciona bot escolhendo campeão e dificuldade', async () => {
  mount();
  await settle();
  const red = root.querySelectorAll('.rlc-stage')[1]!;
  act(() => btn('+ bot', red)!.click());
  await settle();
  const dialog = root.querySelector('[role="dialog"]')!;
  act(() => btn('Annie', dialog)!.click());
  act(() => btn('Intermediário', dialog)!.click());
  act(() => btn('Adicionar', dialog)!.click());
  expect(JSON.parse(call('/lol-lobby/v1/lobby/custom/bots', 'POST')![1].body)).toEqual({ championId: 1, botDifficulty: 'RSINTERMEDIATE', teamId: '200', position: 'MIDDLE', botUuid: '' });
});

test('escolher bot: título, busca, grade de retratos; dificuldade já escolhida ao pegar o campeão, junto dos botões', async () => {
  mount();
  await settle();
  act(() => btn('+ bot', root.querySelectorAll('.rlc-stage')[1]!)!.click());
  await settle();
  const dialog = root.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(dialog.querySelector('h2')!.textContent).toBe('Adicionar bot');
  const portraits = () => [...dialog.querySelectorAll<HTMLButtonElement>('.rlc-bot-champ')];
  expect(portraits().map((b) => b.textContent)).toEqual(['Annie', 'Zed']);
  expect(portraits()[0]!.querySelector('img')!.getAttribute('src')).toBe('/annie.png');
  const search = dialog.querySelector<HTMLInputElement>('[aria-label="Buscar campeão"]')!;
  act(() => {
    search.value = 'ze';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(portraits().map((b) => b.textContent)).toEqual(['Zed']);
  act(() => portraits()[0]!.click());
  const diff = dialog.querySelector('.rlc-dialog-actions .rlc-bot-diff')!;
  expect(diff.querySelector('[aria-pressed="true"]')!.textContent).toBe('Introdução');
  expect(btn('Adicionar', dialog)!.disabled).toBe(false);
});

test('líder remove bot pelo menu', async () => {
  mount();
  await settle();
  const botCol = [...root.querySelectorAll('.rlc-col')].find((c) => c.textContent?.includes('Annie'))!;
  act(() => botCol.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  act(() => btn('Remover')!.click());
  expect(call('/lol-lobby/v1/lobby/custom/bots/bot_annie/bot-uuid/100', 'DELETE')).toBeDefined();
});

test('time vem da lista da sala, não do teamId (que a LCU manda 0)', async () => {
  const me0 = leader({ summonerName: 'Fulano', teamId: 0 });
  const bot0 = member({ isBot: true, botChampionId: 1, botUuid: 'b0', summonerInternalName: 'bot0', teamId: 0 });
  const lcu = withChampions(fakeLcu());
  lcu.gameflowPhase.value = ready('Lobby') as Lcu['gameflowPhase']['value'];
  lcu.lobby.value = ready(lobby([me0, bot0], me0, { isCustom: true, numPlayersPerTeam: 5, customTeam100: [me0], customTeam200: [bot0] }));
  act(() => render(<Lobby lcu={lcu} onModes={() => {}} />, root));
  await settle();
  const [blue, red] = root.querySelectorAll('.rlc-stage');
  expect(btn('Trocar de time', blue!)).toBeUndefined();
  expect(btn('Trocar de time', red!)).toBeDefined();
  const botCol = red!.querySelector('.rlc-col')!;
  act(() => botCol.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  act(() => btn('Remover')!.click());
  expect(call('/lol-lobby/v1/lobby/custom/bots/bot0/b0/200', 'DELETE')).toBeDefined();
});

test('líder inicia; não líder não vê Iniciar nem + bot', () => {
  mount();
  act(() => btn('Iniciar')!.click());
  expect(call('/lol-lobby/v1/lobby/custom/start-champ-select', 'POST')).toBeDefined();
  render(null, root);
  const guest = member({ summonerName: 'Zeca', teamId: 200 });
  mount(guest);
  expect(btn('Iniciar')).toBeUndefined();
  expect(btn('+ bot')).toBeUndefined();
});

test('bot sem nome interno (como a LCU manda) é removido com um nome qualquer no caminho', async () => {
  const anon = member({ isBot: true, botChampionId: 1, botUuid: 'u9', summonerInternalName: '', teamId: 0 });
  const lcu = withChampions(fakeLcu());
  lcu.gameflowPhase.value = ready('Lobby') as Lcu['gameflowPhase']['value'];
  lcu.lobby.value = ready(lobby([me, anon], me, { isCustom: true, numPlayersPerTeam: 5, customTeam100: [me, anon], customTeam200: [] }));
  act(() => render(<Lobby lcu={lcu} onModes={() => {}} />, root));
  await settle();
  const botCol = [...root.querySelectorAll('.rlc-col')].find((c) => c.textContent?.includes('Annie'))!;
  act(() => botCol.querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  act(() => btn('Remover')!.click());
  expect(call('/lol-lobby/v1/lobby/custom/bots/bot/u9/100', 'DELETE')).toBeDefined();
});

test('trocar de time com dois cliques envia uma vez', () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  mount();
  const red = root.querySelectorAll('.rlc-stage')[1]!;
  const b = btn('Trocar de time', red)!;
  act(() => {
    b.click();
    b.click();
  });
  expect(fetchMock.mock.calls.filter((c) => c[0] === '/lol-lobby/v2/lobby/team/TEAM2')).toHaveLength(1);
});
