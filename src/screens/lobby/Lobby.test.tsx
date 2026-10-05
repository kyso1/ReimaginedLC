import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, friend, leader, lobby, member, queue, ready, search } from '../../test/fixtures';
import { formatClock } from './format';
import { Lobby } from './Lobby';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const buttons = () => [...root.querySelectorAll('button')];
const btn = (text: string) => buttons().find((b) => b.textContent?.includes(text) || b.getAttribute('aria-label') === text);
const inDialog = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent?.endsWith(text))!;
const call = (url: string) => fetchMock.mock.calls.find((c) => c[0] === url);
const mount = (lcu: Lcu, onModes = vi.fn()) => {
  act(() => render(<Lobby lcu={lcu} onModes={onModes} />, root));
  return onModes;
};

const me = leader({ summonerName: 'Fulano', firstPositionPreference: 'MIDDLE', secondPositionPreference: 'TOP' });
const zeca = member({ summonerName: 'Zeca' });
const withSignals = (over: Partial<Record<keyof Lcu, unknown>>) => {
  const lcu = fakeLcu();
  const values: Partial<Record<keyof Lcu, unknown>> = {
    gameflowPhase: ready('Lobby'),
    lobby: ready(lobby([me, zeca])),
    queues: ready([queue({ id: 400, name: 'Normal (escolha)' })]),
    ...over,
  };
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  return lcu;
};

test('formatClock', () => {
  expect(formatClock(72)).toBe('1:12');
  expect(formatClock(-3)).toBe('0:00');
  expect(formatClock(605.7)).toBe('10:05');
});

test('uma coluna por vaga: membros com nome e posições, vagas vazias com convidar', () => {
  mount(withSignals({}));
  const cols = root.querySelectorAll('.rlc-col');
  expect(cols).toHaveLength(5);
  expect(cols[0]!.textContent).toContain('Fulano');
  expect(cols[0]!.textContent).toContain('Meio');
  expect(cols[1]!.textContent).toContain('Zeca');
  expect([...cols].slice(2).every((c) => c.textContent?.includes('Convidar'))).toBe(true);
});

test('nome com markup aparece como texto', () => {
  mount(withSignals({ lobby: ready(lobby([leader({ summonerName: '<img src=x>' })])) }));
  expect(root.querySelector('img')).toBeNull();
  expect(root.textContent).toContain('<img src=x>');
});

test('não líder: sem Encontrar partida, sem fila clicável, sem menu, sem convidar; com Sair', () => {
  const other = member({ summonerName: 'Zeca' });
  mount(withSignals({ lobby: ready(lobby([leader(), other], other)) }));
  expect(btn('Encontrar partida')).toBeUndefined();
  expect(btn('Normal (escolha)')).toBeUndefined();
  expect(root.textContent).toContain('Normal (escolha)');
  expect(root.querySelector('.rlc-col-menu')).toBeNull();
  expect(root.textContent).not.toContain('Convidar');
  expect(btn('Sair')).toBeDefined();
});

test('líder: Encontrar partida, fila abre a tela de modos, Sair', async () => {
  const onModes = mount(withSignals({}));
  act(() => btn('Encontrar partida')!.click());
  expect(call('/lol-lobby/v2/lobby/matchmaking/search')![1]).toEqual({ method: 'POST' });
  act(() => btn('Normal (escolha)')!.click());
  expect(onModes).toHaveBeenCalledOnce();
  await settle();
  act(() => btn('Sair')!.click());
  expect(call('/lol-lobby/v2/lobby')![1]).toEqual({ method: 'DELETE' });
});

test('Encontrar partida desabilitado quando a LCU diz que não pode começar', () => {
  mount(withSignals({ lobby: ready({ ...lobby([me]), canStartActivity: false }) }));
  expect(btn('Encontrar partida')!.disabled).toBe(true);
});

test('menu do líder: promover, permitir convite e expulsar com confirmação', async () => {
  mount(withSignals({}));
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-col-menu')[0]!.click());
  act(() => btn('Promover a líder')!.click());
  expect(call(`/lol-lobby/v2/lobby/members/${zeca.summonerId}/promote`)![1]).toEqual({ method: 'POST' });
  await settle();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-col-menu')[0]!.click());
  act(() => btn('Permitir convites')!.click());
  expect(call(`/lol-lobby/v2/lobby/members/${zeca.summonerId}/grant-invite`)).toBeDefined();
  await settle();
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-col-menu')[0]!.click());
  act(() => btn('Expulsar')!.click());
  expect(call(`/lol-lobby/v2/lobby/members/${zeca.summonerId}/kick`)).toBeUndefined();
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  expect(call(`/lol-lobby/v2/lobby/members/${zeca.summonerId}/kick`)![1]).toEqual({ method: 'POST' });
});

test('líder alterna lobby aberto', () => {
  mount(withSignals({}));
  act(() => btn('Lobby fechado')!.click());
  expect(call('/lol-lobby/v2/lobby/partyType')![1]).toEqual({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '"open"' });
});

test('em busca: cronômetro avança, estimativa e Cancelar', () => {
  vi.useFakeTimers();
  mount(withSignals({ gameflowPhase: ready('Matchmaking'), search: ready(search({ timeInQueue: 72, estimatedQueueTime: 150 })) }));
  expect(root.querySelector('.rlc-bar-clock')!.textContent).toBe('1:12');
  expect(root.textContent).toContain('2:30');
  act(() => void vi.advanceTimersByTime(3000));
  expect(root.querySelector('.rlc-bar-clock')!.textContent).toBe('1:15');
  act(() => btn('Cancelar')!.click());
  expect(call('/lol-lobby/v2/lobby/matchmaking/search')![1]).toEqual({ method: 'DELETE' });
  expect(btn('Encontrar partida')).toBeUndefined();
});

test('erro de busca mostra a mensagem e o tempo de penalidade', () => {
  mount(withSignals({ search: ready(search({ isCurrentlyInQueue: false, searchState: 'Error', errors: [{ id: 1, errorType: 'QUEUE_DODGER', penalizedSummonerId: 1, penaltyTimeRemaining: 300, message: 'Penalidade de fila' }] })) }));
  const band = root.querySelector('.rlc-bar-error')!;
  expect(band.textContent).toContain('Penalidade de fila');
  expect(band.textContent).toContain('5:00');
});

test('posições: clicar na própria coluna abre a escolha e confirma com PUT', () => {
  mount(withSignals({}));
  act(() => root.querySelector<HTMLButtonElement>('.rlc-col[data-local="true"] .rlc-col-main')!.click());
  act(() => inDialog('Meio').click());
  act(() => inDialog('Topo').click());
  act(() => inDialog('Confirmar').click());
  expect(call('/lol-lobby/v2/lobby/members/localMember/position-preferences')![1]).toEqual({
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"firstPreference":"MIDDLE","secondPreference":"TOP"}',
  });
});

test('posições: Preencher como primeira dispensa a segunda', () => {
  mount(withSignals({}));
  act(() => root.querySelector<HTMLButtonElement>('.rlc-col[data-local="true"] .rlc-col-main')!.click());
  act(() => inDialog('Preencher').click());
  act(() => inDialog('Confirmar').click());
  expect(JSON.parse(call('/lol-lobby/v2/lobby/members/localMember/position-preferences')![1].body)).toEqual({ firstPreference: 'FILL', secondPreference: 'UNSELECTED' });
});

test('sem seletor de posições, clicar na própria coluna não abre nada', () => {
  mount(withSignals({ lobby: ready(lobby([me], me, { showPositionSelector: false })) }));
  expect(root.querySelector('.rlc-col[data-local="true"] .rlc-col-main')).toBeNull();
  expect(root.textContent).not.toContain('Meio');
});

test('convidar lista amigos online fora do lobby e envia o convite', () => {
  const online = friend({ gameName: 'Beltrano', availability: 'chat', summonerId: 77 });
  mount(withSignals({ friends: ready([online, friend({ gameName: 'Ausente', availability: 'offline' }), friend({ gameName: 'Celular', availability: 'mobile' }), friend({ gameName: 'Zeca', puuid: zeca.puuid })]) }));
  act(() => btn('Convidar')!.click());
  const names = [...root.querySelectorAll('.rlc-friend')].map((f) => f.textContent);
  expect(names).toEqual(['Beltrano']);
  act(() => btn('Beltrano')!.click());
  expect(call('/lol-lobby/v2/lobby/invitations')![1].body).toBe('[{"toSummonerId":77}]');
});

test('lobby nulo em fase de lobby não quebra', () => {
  mount(withSignals({ lobby: ready(null) }));
  expect(root.querySelector('.rlc-lobby')).not.toBeNull();
  expect(root.querySelectorAll('.rlc-col')).toHaveLength(0);
});

test('splash do perfil vira camada de fundo da coluna', async () => {
  const lcu = withSignals({});
  lcu.profile = async (puuid) => (puuid === me.puuid ? { backgroundSkinId: 1001 } : null);
  lcu.splash = async (skinId) => (skinId === 1001 ? '/lol-game-data/assets/ASSETS/annie_1.jpg' : null);
  mount(lcu);
  await settle();
  const cols = root.querySelectorAll<HTMLElement>('.rlc-col');
  expect(cols[0]!.style.backgroundImage).toContain('/lol-game-data/assets/ASSETS/annie_1.jpg');
  expect(cols[1]!.style.backgroundImage).toBe('');
});

test('sem summonerName (Riot ID), a coluna mostra o nome buscado pelo puuid', async () => {
  const anon = leader({ summonerName: '' });
  const lcu = withSignals({ lobby: ready(lobby([anon])) });
  lcu.name = async (puuid) => (puuid === anon.puuid ? 'Fulano' : null);
  mount(lcu);
  await settle();
  expect(root.querySelector('.rlc-col')!.textContent).toContain('Fulano');
});
