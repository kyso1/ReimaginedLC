import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import type { Lcu } from '../../lcu';
import { fakeLcu } from '../../test/fixtures';
import { Honor, NO_BALLOT_MS, STUCK_MS } from './Honor';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const ballot = (allies: number) =>
  signal({ loading: false, error: null, data: { eligibleAllies: Array.from({ length: allies }, (_, i) => ({ puuid: `p${i}`, summonerId: i })), eligibleOpponents: [], gameId: 1 } }) as unknown as Lcu['honorBallot'];

function mount(lcu: Lcu, step = 'honor-vote') {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') calls.push(url);
    return new Response(JSON.stringify({ name: step }), { status: 200 });
  }));
  const host = document.createElement('div');
  act(() => render(<Honor lcu={lcu} />, host));
  return { host, calls };
}

test('fim de jogo sem ninguém para honrar (TFT) conclui a etapa de honra sozinho', async () => {
  const { calls } = mount(fakeLcu({ honorBallot: ballot(0) }));
  await act(async () => {});
  expect(calls).toEqual(['/lol-pre-end-of-game/v1/complete/honor-vote']);
});

test('Pular conclui a etapa de honra', async () => {
  const { host, calls } = mount(fakeLcu({ honorBallot: ballot(2) }));
  expect(calls).toEqual([]);
  await act(async () => host.querySelector<HTMLButtonElement>('.rlc-honor > .rlc-button')!.click());
  await vi.waitFor(() => expect(calls).toEqual(['/lol-honor/v1/ballot', '/lol-pre-end-of-game/v1/complete/honor-vote']));
});

test('etapa da Riot sem tela nossa parada é concluída; a de honra com votos pendentes não', async () => {
  vi.useFakeTimers();
  const { calls } = mount(fakeLcu({ honorBallot: ballot(2) }), 'tft-ceremony');
  for (let t = 0; t <= STUCK_MS + 4000; t += 1000) { await act(async () => void vi.advanceTimersByTime(1000)); await act(async () => {}); }
  expect(calls).toContain('/lol-pre-end-of-game/v1/complete/tft-ceremony');
  expect(calls).not.toContain('/lol-pre-end-of-game/v1/complete/honor-vote');
});

test('TFT conclui a honra na hora, sem esperar a cédula', async () => {
  const lcu = fakeLcu();
  (lcu.gameflowSession as { value: unknown }).value = { loading: false, error: null, status: 'ready', data: { map: { gameMode: 'TFT' } } };
  const { calls } = mount(lcu);
  await act(async () => {});
  expect(calls).toContain('/lol-pre-end-of-game/v1/complete/honor-vote');
});

test('sem cédula depois de NO_BALLOT_MS, a honra é concluída', async () => {
  vi.useFakeTimers();
  const { calls } = mount(fakeLcu());
  await act(async () => {});
  expect(calls).not.toContain('/lol-pre-end-of-game/v1/complete/honor-vote');
  await act(async () => void vi.advanceTimersByTime(NO_BALLOT_MS + 10));
  expect(calls).toContain('/lol-pre-end-of-game/v1/complete/honor-vote');
});
