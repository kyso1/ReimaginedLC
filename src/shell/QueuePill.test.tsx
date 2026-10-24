import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { fakeLcu, leader, lobby, member, queue, ready, search } from '../test/fixtures';
import { QueuePill } from './QueuePill';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  root.id = 'rlc-root';
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const lcuWith = (over: { searching?: boolean; local?: ReturnType<typeof leader> } = {}) => {
  const lcu = fakeLcu();
  const me = over.local ?? leader();
  lcu.search.value = ready(search({ queueId: 420, timeInQueue: 72, estimatedQueueTime: 150, isCurrentlyInQueue: over.searching ?? true }));
  lcu.queues.value = ready([queue({ id: 420, name: 'Ranqueada Solo/Duo' })]);
  lcu.lobby.value = ready(lobby([leader(), me].slice(over.local ? 0 : 1), me));
  lcu.gameflowPhase.value = ready('Matchmaking');
  return lcu;
};
const pill = () => root.querySelector('.rlc-qpill');

test('em fila fora do lobby: tempo correndo, nome da fila e estimativa; clique volta ao lobby', () => {
  vi.useFakeTimers();
  const onOpen = vi.fn();
  act(() => render(<QueuePill lcu={lcuWith()} onLobby={false} onOpen={onOpen} />, root));
  expect(pill()!.querySelector('.rlc-qpill-clock')!.textContent).toBe('1:12');
  expect(pill()!.textContent).toContain('Ranqueada Solo/Duo');
  expect(pill()!.textContent).toContain('2:30');
  act(() => void vi.advanceTimersByTime(2000));
  expect(pill()!.querySelector('.rlc-qpill-clock')!.textContent).toBe('1:14');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-qpill-open')!.click());
  expect(onOpen).toHaveBeenCalledOnce();
});

test('cancelar chama DELETE da busca', () => {
  act(() => render(<QueuePill lcu={lcuWith()} onLobby={false} onOpen={() => {}} />, root));
  act(() => root.querySelector<HTMLButtonElement>('button[aria-label="Cancelar busca"]')!.click());
  expect(fetchMock.mock.calls.find((c) => c[0] === '/lol-lobby/v2/lobby/matchmaking/search')![1]).toEqual({ method: 'DELETE' });
});

test('quem não é líder não tem cancelar', () => {
  act(() => render(<QueuePill lcu={lcuWith({ local: member() })} onLobby={false} onOpen={() => {}} />, root));
  expect(pill()).not.toBeNull();
  expect(root.querySelector('.rlc-qpill-cancel')).toBeNull();
});

test('some no lobby e sem busca', () => {
  act(() => render(<QueuePill lcu={lcuWith()} onLobby onOpen={() => {}} />, root));
  expect(pill()).toBeNull();
  act(() => render(<QueuePill lcu={lcuWith({ searching: false })} onLobby={false} onOpen={() => {}} />, root));
  expect(pill()).toBeNull();
});

test('some no aceite, na seleção de campeões e na partida, mesmo com a busca ainda marcada', () => {
  for (const phase of ['ReadyCheck', 'ChampSelect', 'InProgress', 'None']) {
    const lcu = lcuWith();
    lcu.gameflowPhase.value = ready(phase as never);
    act(() => render(<QueuePill lcu={lcu} onLobby={false} onOpen={() => {}} />, root));
    expect(pill(), phase).toBeNull();
  }
});

test('voltando ao lobby sem animação (jsdom), a pílula some na hora', () => {
  const lcu = lcuWith();
  act(() => render(<QueuePill lcu={lcu} onLobby={false} onOpen={() => {}} />, root));
  act(() => render(<QueuePill lcu={lcu} onLobby onOpen={() => {}} />, root));
  expect(pill()).toBeNull();
});

test('voltando ao lobby: estica até a barra de busca e só então some', () => {
  const finish: Array<() => void> = [];
  const animate = vi.fn(function (this: HTMLElement) {
    const a = { onfinish: null as null | (() => void) };
    finish.push(() => a.onfinish?.());
    return a as unknown as Animation;
  });
  (HTMLElement.prototype as { animate?: unknown }).animate = animate;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 300, top: 600, width: 800, height: 64, right: 1100, bottom: 664, x: 300, y: 600, toJSON: () => ({}) });
  const lcu = lcuWith();
  const app = (onLobby: boolean) => (
    <>
      {onLobby ? <section class="rlc-lobby"><div class="rlc-bar-wrap"><div class="rlc-bar" /></div></section> : null}
      <QueuePill lcu={lcu} onLobby={onLobby} onOpen={() => {}} />
    </>
  );
  try {
    // O lobby mede a barra antes de sair dele.
    act(() => render(app(true), root));
    act(() => render(app(false), root));
    expect(pill()).not.toBeNull();
    act(() => render(app(true), root));
    expect(pill()).not.toBeNull();
    const last = animate.mock.calls.find((c) => ((c as unknown[])[0] as Keyframe[])[1]?.width === '800px');
    expect(last).toBeDefined();
    act(() => finish.forEach((f) => f()));
    expect(pill()).toBeNull();
  } finally {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  }
});
